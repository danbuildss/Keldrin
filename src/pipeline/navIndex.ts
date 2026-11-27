import { getAddress } from "viem";
import { getBlock, read, readMany, type BlockRef } from "../adapters/chain.ts";
import { navFeeds } from "../adapters/coinbase.ts";
import { CHAIN_ID } from "../config.ts";
import { recordSource } from "../db/db.ts";
import type { PGlite } from "@electric-sql/pglite";

// Phase 5: Chainlink NAV history for Coinbase tokenized stocks on Base.
// Proxy roundId = phaseId << 64 | aggregatorRoundId (Chainlink docs, "Historical data"). Every phase's
// aggregator is walked from round 1; rounds are stored verbatim (raw answer, decimals, timestamps and the
// block they were read at). Missing ids are reported, never filled.

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
export type PhaseReport = { phase: number; aggregator: string; last: string; missing: string[] };

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

/**
 * Pure planning step, exported for tests: given the ids read in one window and which came back, decide
 * which ids are missing and whether a closed (non-current) phase has ended inside the window.
 */
export function classifyWindow(found: boolean[], isCurrent: boolean): { missingIdx: number[]; ended: boolean } {
  let lastFound = -1;
  found.forEach((f, i) => {
    if (f) lastFound = i;
  });
  // current phase: every id up to the latest round must exist; closed phase: the tail after the last found round is its end
  const end = isCurrent ? found.length - 1 : lastFound;
  const missingIdx: number[] = [];
  for (let i = 0; i <= end; i++) if (!found[i]) missingIdx.push(i);
  return { missingIdx, ended: isCurrent || lastFound < found.length - 1 };
}

/** Index every round of every phase not stored yet. Returns per-phase reports including ids found missing. */
export async function indexFeed(db: PGlite, f: NavFeed, head: BlockRef): Promise<{ inserted: number; phases: PhaseReport[] }> {
  const latest = (await read(f.feed, "latestRoundData", [], head.number)) as RoundTuple | null;
  if (!latest) throw new Error(f.symbol + ": latestRoundData unreadable");
  const cur = splitRoundId(latest[0]);
  if (Number(cur.phase) !== f.phase) throw new Error(`${f.symbol}: phaseId ${f.phase} disagrees with latest round phase ${cur.phase}`);
  const retrievedAt = new Date().toISOString();
  let inserted = 0;
  const phases: PhaseReport[] = [];
  for (let p = 1; p <= f.phase; p++) {
    const agg = (await read(f.feed, "phaseAggregators", [p], head.number)) as string | null;
    if (!agg) throw new Error(`${f.symbol}: phaseAggregators(${p}) unreadable`);
    const aggregator = getAddress(agg);
    const stored = (await db.query<{ last: string | null }>("SELECT max(aggregator_round_id)::text AS last FROM nav_rounds WHERE chain_id=$1 AND feed_address=$2 AND phase_id=$3", [CHAIN_ID, f.feed, p])).rows[0].last;
    const next = BigInt(stored ?? "0") + 1n;
    const isCurrent = p === f.phase;
    // the true last round: the current phase's latest id, or a closed phase's aggregator latestRound() (never inferred from gaps)
    let upto = cur.aggRound;
    if (!isCurrent) {
      const lr = (await read(aggregator, "latestRound", [], head.number)) as bigint | null;
      if (lr === null) throw new Error(`${f.symbol}: latestRound() of phase ${p} aggregator unreadable`);
      upto = lr;
    }
    const missing: string[] = [];
    const rows: NavRoundRow[] = [];
    if (next <= upto) {
      const ids: bigint[] = [];
      for (let a = next; a <= upto; a++) ids.push(a);
      const got = await readRounds(f.feed, ids.map((a) => proxyRoundId(BigInt(p), a)), head.number);
      got.forEach((r, i) => {
        if (r) rows.push({ feed: f.feed, round_id: proxyRoundId(BigInt(p), ids[i]), phase_id: p, aggregator_round_id: ids[i], aggregator, answer: r[1], decimals: f.decimals, started_at: Number(r[2]), updated_at: Number(r[3]), answered_in_round: r[4] });
      });
      // every id up to the known last round must exist; absent ones are reported, never filled
      for (const i of classifyWindow(got.map((r) => r !== null), true).missingIdx) missing.push(proxyRoundId(BigInt(p), ids[i]).toString());
    }
    inserted += await insertRounds(db, rows, retrievedAt, head.number);
    const last = (await db.query<{ last: string | null }>("SELECT max(round_id)::text AS last FROM nav_rounds WHERE chain_id=$1 AND feed_address=$2 AND phase_id=$3", [CHAIN_ID, f.feed, p])).rows[0].last;
    phases.push({ phase: p, aggregator, last: last ?? "none", missing });
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
