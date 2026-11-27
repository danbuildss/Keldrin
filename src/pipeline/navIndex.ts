import { getAddress } from "viem";
import { getBlock, getCode, read, readMany, type BlockRef } from "../adapters/chain.ts";
import { navFeeds } from "../adapters/coinbase.ts";
import { CHAIN_ID } from "../config.ts";
import { recordSource } from "../db/db.ts";
import type { PGlite } from "@electric-sql/pglite";

// Phase 5: Chainlink NAV history for Coinbase tokenized stocks on Base.
// Proxy roundId = phaseId << 64 | aggregatorRoundId (Chainlink docs, "Historical data"). Every phase's
// aggregator is walked from round 1 to its true last round; rounds are stored verbatim (raw answer, decimals,
// timestamps and the block they were read at). Missing ids are reported and retried on later runs, never filled.
//
// Phase 5b: aggregators overlap in time (a new aggregator publishes before the proxy switches to it, and the old
// one keeps publishing after). Each phase's LIVE WINDOW (the blocks during which the proxy pointed at it) is found
// by binary search on the proxy's historical phaseId() and stored in nav_phases with the aggregator's own decimals.
// Only rounds inside their phase's live window, from an aggregator whose decimals match the proxy, are "official".

export const PHASE_SHIFT = 64n;
export const proxyRoundId = (phase: bigint, aggRound: bigint) => (phase << PHASE_SHIFT) | aggRound;
export const splitRoundId = (id: bigint) => ({ phase: id >> PHASE_SHIFT, aggRound: id & ((1n << PHASE_SHIFT) - 1n) });

export type NavFeed = { token: string; symbol: string; feed: string; description: string; decimals: number; phase: number };
export type NavRoundRow = {
  feed: string;
  round_id: bigint;
  phase_id: number;
  aggregator_round_id: bigint;
  aggregator: string;
  answer: bigint;
  decimals: number;
  started_at: number;
  updated_at: number;
  answered_in_round: bigint;
};
export type PhaseReport = { phase: number; aggregator: string; last: string; missing: string[]; live_from_block: string | null; live_to_block: string | null; aggregator_decimals: number | null };

/** Coinbase's feed for a token must be a Chainlink proxy whose description names the same ticker.
 *  Two exact forms are observed onchain: "Coinbase NVDA" and "Coinbase ANT / USD". Nothing looser is accepted. */
export const acceptedDescriptions = (symbol: string) => {
  const t = symbol.replace(/c$/, "");
  return ["Coinbase " + t, "Coinbase " + t + " / USD"];
};

export async function discoverFeeds(db: PGlite, head: BlockRef, only?: string[]): Promise<{ feeds: NavFeed[]; rejected: { token: string; feed: string; reason: string }[] }> {
  const { data, meta } = await navFeeds();
  await recordSource(db, { sha256: meta.sha256, url: meta.url, kind: "coinbase_nav_feeds", status: meta.status, bytes: meta.bytes, retrievedAt: meta.retrievedAt, rights: "unknown" });
  const assets = (await db.query<{ contract_address: string; symbol: string }>("SELECT contract_address, symbol FROM assets")).rows;
  const feeds: NavFeed[] = [];
  const rejected: { token: string; feed: string; reason: string }[] = [];
  for (const nf of data.nav_feeds) {
    const token = getAddress(nf.contract_address);
    const feed = getAddress(nf.nav_feed_address);
    const symbol = assets.find((a) => getAddress(a.contract_address) === token)?.symbol;
    if (!symbol) {
      rejected.push({ token, feed, reason: "token not in the verified registry" });
      continue;
    }
    if (only && !only.includes(symbol)) continue;
    const [description, decimals, phase] = (await readMany(
      [
        { address: feed, fn: "description" },
        { address: feed, fn: "decimals" },
        { address: feed, fn: "phaseId" },
      ],
      head.number,
    )) as [string | null, number | null, number | null];
    if (description === null || decimals === null || phase === null) {
      rejected.push({ token, feed, reason: "not a readable Chainlink proxy at the head block" });
      continue;
    }
    if (!acceptedDescriptions(symbol).includes(description)) {
      rejected.push({ token, feed, reason: `description "${description}" does not name ${symbol}` });
      continue;
    }
    feeds.push({ token, symbol, feed, description, decimals: Number(decimals), phase: Number(phase) });
    await db.query(
      "INSERT INTO nav_feeds (chain_id, token_address, feed_address, symbol, description, decimals, source) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING",
      [CHAIN_ID, token, feed, symbol, description, Number(decimals), "coinbase:/v1/tokenized-stocks/nav-feeds sha256:" + meta.sha256],
    );
  }
  return { feeds, rejected };
}

type RoundTuple = readonly [bigint, bigint, bigint, bigint, bigint];
const BATCH = 150;

async function readRounds(feed: string, ids: bigint[], block: bigint): Promise<(RoundTuple | null)[]> {
  const res = await readMany(ids.map((id) => ({ address: feed, fn: "getRoundData" as const, args: [id] })), block, BATCH);
  return res.map((r) => (r && (r as RoundTuple)[3] > 0n ? (r as RoundTuple) : null));
}

/** Ids in 1..max that are not in `have` (sorted ascending input not required). Pure; exported for tests. */
export function gaps(have: bigint[], max: bigint): bigint[] {
  const s = new Set(have.map(String));
  const out: bigint[] = [];
  for (let a = 1n; a <= max; a++) if (!s.has(a.toString())) out.push(a);
  return out;
}

/** Ids reported missing within a read window (kept for tests and for callers reading a contiguous range). */
export function classifyWindow(found: boolean[], isCurrent: boolean): { missingIdx: number[]; ended: boolean } {
  let lastFound = -1;
  found.forEach((f, i) => {
    if (f) lastFound = i;
  });
  const end = isCurrent ? found.length - 1 : lastFound;
  const missingIdx: number[] = [];
  for (let i = 0; i <= end; i++) if (!found[i]) missingIdx.push(i);
  return { missingIdx, ended: isCurrent || lastFound < found.length - 1 };
}

/** First block at which the proxy's phaseId() is >= `phase` (binary search over historical state). */
export async function phaseStartBlock(phaseAt: (block: bigint) => Promise<number>, phase: number, head: bigint): Promise<bigint> {
  let lo = 0n;
  let hi = head; // invariant: phaseAt(hi) >= phase
  while (lo < hi) {
    const mid = (lo + hi) / 2n;
    if ((await phaseAt(mid)) >= phase) hi = mid;
    else lo = mid + 1n;
  }
  return lo;
}

type StoredPhase = { phase_id: number; live_from_block: string | null; live_to_block: string | null; aggregator_decimals: number | null; aggregator_address: string };

/** Live window of every phase plus the aggregator's own decimals; stored append-only when anything new is learned. */
async function syncPhases(db: PGlite, f: NavFeed, head: BlockRef, aggregators: string[]): Promise<StoredPhase[]> {
  const stored = (await db.query<StoredPhase>(
    "SELECT DISTINCT ON (phase_id) phase_id, live_from_block::text AS live_from_block, live_to_block::text AS live_to_block, aggregator_decimals, aggregator_address FROM nav_phases WHERE chain_id=$1 AND feed_address=$2 ORDER BY phase_id, observed_block DESC",
    [CHAIN_ID, f.feed],
  )).rows;
  // A null read is phase 0 only where the proxy had no code yet; any other failure (timeout, RPC error) throws,
  // so a transient error can never move a boundary.
  const phaseAt = async (b: bigint) => {
    const v = (await read(f.feed, "phaseId", [], b)) as number | null;
    if (v !== null) return Number(v);
    const code = await getCode(f.feed, b);
    if (!code || code === "0x") return 0;
    throw new Error(`${f.symbol}: phaseId() unreadable at block ${b} although the proxy has code`);
  };
  const isBoundary = async (b: bigint, p: number) => b > 0n && (await phaseAt(b - 1n)) < p && (await phaseAt(b)) >= p;
  // boundary[p] = first block where phaseId >= p (p >= 2). Stored boundaries are re-checked each run and re-searched if wrong.
  const boundary = new Map<number, bigint>();
  for (let p = 2; p <= f.phase; p++) {
    const known = stored.find((s) => s.phase_id === p)?.live_from_block;
    let b = known && (await isBoundary(BigInt(known), p)) ? BigInt(known) : await phaseStartBlock(phaseAt, p, head.number);
    if (!(await isBoundary(b, p))) throw new Error(`${f.symbol}: phase ${p} boundary ${b} failed its own check`);
    boundary.set(p, b);
  }
  const out: StoredPhase[] = [];
  for (let p = 1; p <= f.phase; p++) {
    const from = p === 1 ? null : boundary.get(p)!;
    const to = p === f.phase ? null : boundary.get(p + 1)!;
    const aggregator = aggregators[p - 1];
    const aggDec = (await read(aggregator, "decimals", [], head.number)) as number | null;
    const row: StoredPhase = { phase_id: p, live_from_block: from?.toString() ?? null, live_to_block: to?.toString() ?? null, aggregator_decimals: aggDec === null ? null : Number(aggDec), aggregator_address: aggregator };
    out.push(row);
    const prev = stored.find((s) => s.phase_id === p);
    if (prev && prev.live_from_block === row.live_from_block && prev.live_to_block === row.live_to_block && prev.aggregator_decimals === row.aggregator_decimals && prev.aggregator_address === aggregator) continue;
    const fromTime = from === null ? null : new Date(Number((await getBlock(from)).timestamp) * 1000).toISOString();
    const toTime = to === null ? null : new Date(Number((await getBlock(to)).timestamp) * 1000).toISOString();
    await db.query(
      "INSERT INTO nav_phases (chain_id, feed_address, phase_id, aggregator_address, aggregator_decimals, proxy_decimals, live_from_block, live_from_time, live_to_block, live_to_time, observed_block) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT DO NOTHING",
      [CHAIN_ID, f.feed, p, aggregator, row.aggregator_decimals, f.decimals, row.live_from_block, fromTime, row.live_to_block, toTime, head.number.toString()],
    );
  }
  return out;
}

/** Index every round of every phase not stored yet, retrying earlier gaps. Returns per-phase reports. */
export async function indexFeed(db: PGlite, f: NavFeed, head: BlockRef): Promise<{ inserted: number; phases: PhaseReport[] }> {
  const latest = (await read(f.feed, "latestRoundData", [], head.number)) as RoundTuple | null;
  if (!latest) throw new Error(f.symbol + ": latestRoundData unreadable");
  const cur = splitRoundId(latest[0]);
  if (Number(cur.phase) !== f.phase) throw new Error(`${f.symbol}: phaseId ${f.phase} disagrees with latest round phase ${cur.phase}`);
  const retrievedAt = new Date().toISOString();
  const aggregators: string[] = [];
  for (let p = 1; p <= f.phase; p++) {
    const agg = (await read(f.feed, "phaseAggregators", [p], head.number)) as string | null;
    if (!agg) throw new Error(`${f.symbol}: phaseAggregators(${p}) unreadable`);
    aggregators.push(getAddress(agg));
  }
  const windows = await syncPhases(db, f, head, aggregators);
  let inserted = 0;
  const phases: PhaseReport[] = [];
  for (let p = 1; p <= f.phase; p++) {
    const aggregator = aggregators[p - 1];
    // the true last round: the current phase's latest id, or a closed phase's aggregator latestRound() (never inferred from gaps)
    let upto = cur.aggRound;
    if (p !== f.phase) {
      const lr = (await read(aggregator, "latestRound", [], head.number)) as bigint | null;
      if (lr === null) throw new Error(`${f.symbol}: latestRound() of phase ${p} aggregator unreadable`);
      upto = lr;
    }
    const have = (await db.query<{ a: string }>("SELECT aggregator_round_id::text AS a FROM nav_rounds WHERE chain_id=$1 AND feed_address=$2 AND phase_id=$3", [CHAIN_ID, f.feed, p])).rows.map((r) => BigInt(r.a));
    const storedMax = have.reduce((m, a) => (a > m ? a : m), 0n);
    // earlier gaps are retried every run (a transient RPC failure must not become a permanent hole), then new ids
    const ids = [...gaps(have, storedMax < upto ? storedMax : upto)];
    for (let a = storedMax + 1n; a <= upto; a++) ids.push(a);
    const rows: NavRoundRow[] = [];
    const missing: string[] = [];
    if (ids.length) {
      const got = await readRounds(f.feed, ids.map((a) => proxyRoundId(BigInt(p), a)), head.number);
      got.forEach((r, i) => {
        // nav_rounds.decimals records the PROXY's decimals at indexing time; the aggregator's own decimals live in
        // nav_phases and are what the API serves per row (independent review 2026-11-27)
        if (r) rows.push({ feed: f.feed, round_id: proxyRoundId(BigInt(p), ids[i]), phase_id: p, aggregator_round_id: ids[i], aggregator, answer: r[1], decimals: f.decimals, started_at: Number(r[2]), updated_at: Number(r[3]), answered_in_round: r[4] });
        else missing.push(proxyRoundId(BigInt(p), ids[i]).toString());
      });
    }
    inserted += await insertRounds(db, rows, retrievedAt, head.number);
    const last = (await db.query<{ last: string | null }>("SELECT max(round_id)::text AS last FROM nav_rounds WHERE chain_id=$1 AND feed_address=$2 AND phase_id=$3", [CHAIN_ID, f.feed, p])).rows[0].last;
    const w = windows[p - 1];
    phases.push({ phase: p, aggregator, last: last ?? "none", missing, live_from_block: w.live_from_block, live_to_block: w.live_to_block, aggregator_decimals: w.aggregator_decimals });
  }
  return { inserted, phases };
}

/** Append-only multi-row insert; an existing (feed, round_id) is left untouched. Returns the rows actually added. */
export async function insertRounds(db: PGlite, rows: NavRoundRow[], retrievedAt: string, block: bigint, chunk = 200): Promise<number> {
  let added = 0;
  for (let i = 0; i < rows.length; i += chunk) {
    const part = rows.slice(i, i + chunk);
    const params: unknown[] = [];
    const values = part.map((r) => {
      const b = params.length;
      params.push(
        CHAIN_ID, r.feed, r.round_id.toString(), r.phase_id, r.aggregator_round_id.toString(), r.aggregator, r.answer.toString(), r.decimals,
        new Date(r.started_at * 1000).toISOString(), new Date(r.updated_at * 1000).toISOString(), r.answered_in_round.toString(), retrievedAt, block.toString(),
      );
      return "(" + Array.from({ length: 13 }, (_, k) => "$" + (b + k + 1)).join(",") + ")";
    });
    const res = await db.query<{ round_id: string }>(
      "INSERT INTO nav_rounds (chain_id, feed_address, round_id, phase_id, aggregator_round_id, aggregator_address, answer, decimals, started_at, updated_at, answered_in_round, retrieved_at, retrieved_block) VALUES " +
        values.join(",") +
        " ON CONFLICT DO NOTHING RETURNING round_id::text",
      params,
    );
    added += res.rows.length;
  }
  return added;
}

export async function indexAll(db: PGlite, only?: string[]) {
  const head = await getBlock("latest");
  const { feeds, rejected } = await discoverFeeds(db, head, only);
  const out: { symbol: string; feed: string; inserted: number; phases: PhaseReport[] }[] = [];
  for (const f of feeds) out.push({ symbol: f.symbol, feed: f.feed, ...(await indexFeed(db, f, head)) });
  return { head: head.number.toString(), feeds: out, rejected };
}
