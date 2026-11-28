import type { PGlite } from "@electric-sql/pglite";
import { CHAIN_ID } from "../config.ts";
import { publicRpc, type Rpc } from "./dex.ts";
import { snapshot } from "./trial.ts";

// Public product experience (approved 2026-11-28).
//  - GET /v1/stats     Transparency: counts read from real tables, plus keldrin's x402 payments counted onchain.
//  - GET /v1/overview  Explorer list: the snapshot's fields for every verified stock, free, CDN-cached, up to about 10 min old.
//                      The paid snapshot (x402) is the live, at-request version.
// Nothing here is typed by hand except the list of confirmed external integrations (currently none).

type Out = { status: number; body: unknown };
export const CONFIRMED_INTEGRATIONS: { name: string; since: string; evidence: string }[] = [];
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ROUTER = "0x8aee621035d93deb3c0c1177fac252dc2dd501a0";
const PAYOUT = "0xb98f0de777eea8c481b64e33d3e0066cea38fa91";
const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const PAYMENTS_FROM_BLOCK = 63_080_000n; // keldrin's Bankr endpoints went live after this block (2026-11-27)
const pad = (a: string) => "0x" + a.toLowerCase().replace(/^0x/, "").padStart(64, "0");

/** keldrin x402 payments: 50000 USDC units to Bankr's router, forwarded to the payout wallet in the same transaction. */
type Payments = { payments: number; paying_wallets: number; external_paying_wallets: number; transactions: string[]; to_block: string };
// Per-instance cursor: after one full scan, later requests only scan the new blocks. It holds nothing typed by hand,
// only what an earlier onchain scan found, and is lost (then rebuilt from PAYMENTS_FROM_BLOCK) when the instance stops.
let cursor: { to: bigint; txs: string[]; payers: string[] } | null = null;
export function resetPaymentCursor() {
  cursor = null;
}

export async function countPayments(rpc: Rpc = publicRpc): Promise<Payments> {
  const head = BigInt(await rpc("eth_blockNumber", []));
  const start = cursor && cursor.to < head ? cursor.to + 1n : cursor ? head + 1n : PAYMENTS_FROM_BLOCK;
  type Log = { transactionHash: string; topics: string[]; data: string; address?: string };
  // 1) forwards from Bankr's router to the payout wallet (few), 2) each forward's receipt: the buyer's 50000 transfer
  const forwards: Log[] = [];
  for (let a = start; a <= head; a += 10_000n) {
    const b = a + 9_999n < head ? a + 9_999n : head;
    forwards.push(...((await rpc("eth_getLogs", [{ address: USDC, topics: [TRANSFER, pad(ROUTER), pad(PAYOUT)], fromBlock: "0x" + a.toString(16), toBlock: "0x" + b.toString(16) }])) as Log[]));
  }
  const txs = [...new Set(forwards.map((l) => l.transactionHash))].filter((t) => !cursor?.txs.includes(t));
  const payers: string[] = [...(cursor?.payers ?? [])];
  const paidTxs: string[] = [...(cursor?.txs ?? [])];
  for (const tx of txs) {
    const rc = (await rpc("eth_getTransactionReceipt", [tx])) as { logs: Log[] };
    const inbound = rc.logs.find((l) => l.address?.toLowerCase() === USDC.toLowerCase() && l.topics[0] === TRANSFER && l.topics[2]?.toLowerCase() === pad(ROUTER) && BigInt(l.data) === 50_000n);
    if (inbound) {
      payers.push("0x" + inbound.topics[1].slice(26).toLowerCase());
      paidTxs.push(tx);
    }
  }
  cursor = { to: head > (cursor?.to ?? 0n) ? head : cursor!.to, txs: paidTxs, payers };
  const wallets = new Set(payers);
  return { payments: paidTxs.length, paying_wallets: wallets.size, external_paying_wallets: [...wallets].filter((w) => w !== PAYOUT).length, transactions: paidTxs, to_block: head.toString() };
}

async function withDeadline<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([p, new Promise<T>((_, rej) => (t = setTimeout(() => rej(new Error("deadline")), ms)))]);
  } finally {
    clearTimeout(t);
  }
}

export async function stats(db: PGlite, rpc: Rpc = publicRpc): Promise<Out> {
  const one = async <T>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0];
  const [assets, feeds, rounds, records, calendar, pools, runs] = await Promise.all([
    one<{ n: number }>("SELECT count(*)::int AS n FROM assets"),
    one<{ n: number; confirmed: number }>("SELECT count(*)::int AS n, count(*) FILTER (WHERE v.verdict = 'CONFIRMED')::int AS confirmed FROM nav_feeds f LEFT JOIN LATERAL (SELECT verdict FROM nav_reviews r WHERE r.feed_address = f.feed_address ORDER BY checked_at DESC LIMIT 1) v ON true WHERE f.chain_id = $1", [CHAIN_ID]),
    one<{ n: number; first: string | null; last: string | null }>("SELECT count(*)::int AS n, to_char(min(updated_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS first, to_char(max(updated_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS last FROM nav_rounds"),
    one<{ n: number }>("SELECT count(*)::int AS n FROM confirmed_records"),
    one<{ n: number }>("SELECT count(DISTINCT entry_id)::int AS n FROM calendar_entries"),
    // served pools only: those in each token's latest CONFIRMED review (the same rule as /v1/assets/{c}/dex)
    one<{ n: number; tokens: number; discovered: number }>("SELECT count(*) FILTER (WHERE v.verdict = 'CONFIRMED' AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v.detail->'covered') c WHERE lower(c) = lower(p.venue || ':' || p.pool_ref)))::int AS n, count(DISTINCT lower(p.token_address)) FILTER (WHERE v.verdict = 'CONFIRMED' AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(v.detail->'covered') c WHERE lower(c) = lower(p.venue || ':' || p.pool_ref)))::int AS tokens, count(*)::int AS discovered FROM dex_pools p LEFT JOIN LATERAL (SELECT verdict, detail FROM dex_reviews r WHERE r.chain_id = p.chain_id AND lower(r.token_address) = lower(p.token_address) ORDER BY checked_at DESC LIMIT 1) v ON true WHERE p.chain_id = $1", [CHAIN_ID]),
    one<{ n: number; ok: number; last_at: string | null; last_outcome: string | null }>("SELECT count(*)::int AS n, count(*) FILTER (WHERE outcome = 'ok')::int AS ok, to_char(max(finished_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"') AS last_at, (SELECT outcome FROM runs ORDER BY started_at DESC LIMIT 1) AS last_outcome FROM runs"),
  ]);
  let payments: unknown = null;
  let payments_unavailable_reason: string | undefined;
  try {
    payments = await withDeadline(countPayments(rpc), 8_000);
  } catch {
    payments_unavailable_reason = "onchain read failed; try again later";
  }
  return {
    status: 200,
    body: {
      data: {
        assets_tracked: assets.n,
        nav_feeds: { total: feeds.n, independently_confirmed: feeds.confirmed },
        nav_rounds_indexed: { count: rounds.n, first: rounds.first, last: rounds.last },
        corporate_action_records_confirmed: records.n,
        calendar_entries: calendar.n,
        dex_pools_verified: { count: pools.n, tokens: pools.tokens, discovered: pools.discovered },
        research_runs: { total: runs.n, ok: runs.ok, last_finished_at: runs.last_at, last_outcome: runs.last_outcome },
        x402_payments: payments,
        ...(payments_unavailable_reason ? { x402_payments_unavailable_reason: payments_unavailable_reason } : {}),
        confirmed_external_integrations: CONFIRMED_INTEGRATIONS,
      },
      meta: { note: "Counts read from keldrin's database at request time (cached up to about 20 min; about 1 min when the onchain payment count is unavailable); payments counted onchain from USDC transfers. `external_paying_wallets` excludes only keldrin's payout wallet (which made the first test payment); a payment from any other wallet counts as external. `dex_pools_verified.count` is the pools served (latest CONFIRMED review); `discovered` is every pool found." },
    },
  };
}

/** Free Explorer list: the snapshot without the free-try counter, cached at the CDN, up to about 10 minutes old. */
export async function overview(db: PGlite): Promise<Out> {
  const s = await snapshot(db);
  if (s.status !== 200) return s;
  const b = s.body as { data: unknown; meta?: Record<string, unknown> };
  return { status: 200, body: { data: b.data, meta: { ...(b.meta ?? {}), freshness: "cached at the CDN, up to about 10 minutes old (market session included); the paid snapshot (x402) and the per-stock routes are read live" } } };
}
