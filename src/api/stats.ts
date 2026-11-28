import type { PGlite } from "@electric-sql/pglite";
import { CHAIN_ID } from "../config.ts";
import { publicRpc, type Rpc } from "./dex.ts";
import { snapshot } from "./trial.ts";

// Public product experience (approved 2026-11-28).
//  - GET /v1/stats     Transparency: counts read from real tables, plus keldrin's x402 payments counted onchain.
//  - GET /v1/overview  Explorer list: the snapshot's fields for every verified stock, free, CDN-cached up to 5 min.
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
export async function countPayments(rpc: Rpc = publicRpc): Promise<{ payments: number; paying_wallets: number; external_paying_wallets: number; transactions: string[]; to_block: string }> {
  const head = BigInt(await rpc("eth_blockNumber", []));
  type Log = { transactionHash: string; topics: string[]; data: string; address?: string };
  // 1) forwards from Bankr's router to the payout wallet (few), 2) each forward's receipt: the buyer's 50000 transfer
  const forwards: Log[] = [];
  for (let a = PAYMENTS_FROM_BLOCK; a <= head; a += 10_000n) {
    const b = a + 9_999n < head ? a + 9_999n : head;
    forwards.push(...((await rpc("eth_getLogs", [{ address: USDC, topics: [TRANSFER, pad(ROUTER), pad(PAYOUT)], fromBlock: "0x" + a.toString(16), toBlock: "0x" + b.toString(16) }])) as Log[]));
  }
  const txs = [...new Set(forwards.map((l) => l.transactionHash))];
  const payers: string[] = [];
  const paidTxs: string[] = [];
  for (const tx of txs) {
    const rc = (await rpc("eth_getTransactionReceipt", [tx])) as { logs: Log[] };
    const inbound = rc.logs.find((l) => l.address?.toLowerCase() === USDC.toLowerCase() && l.topics[0] === TRANSFER && l.topics[2]?.toLowerCase() === pad(ROUTER) && BigInt(l.data) === 50_000n);
    if (inbound) {
      payers.push("0x" + inbound.topics[1].slice(26).toLowerCase());
      paidTxs.push(tx);
    }
  }
  const wallets = new Set(payers);
  return { payments: paidTxs.length, paying_wallets: wallets.size, external_paying_wallets: [...wallets].filter((w) => w !== PAYOUT).length, transactions: paidTxs, to_block: head.toString() };
}

export async function stats(db: PGlite, rpc: Rpc = publicRpc): Promise<Out> {
  const one = async <T>(sql: string, params: unknown[] = []) => (await db.query<T>(sql, params)).rows[0];
  const [assets, feeds, rounds, records, calendar, pools, runs] = await Promise.all([
    one<{ n: number }>("SELECT count(*)::int AS n FROM assets"),
    one<{ n: number; confirmed: number }>("SELECT count(*)::int AS n, count(*) FILTER (WHERE v.verdict = 'CONFIRMED')::int AS confirmed FROM nav_feeds f LEFT JOIN LATERAL (SELECT verdict FROM nav_reviews r WHERE r.feed_address = f.feed_address ORDER BY checked_at DESC LIMIT 1) v ON true WHERE f.chain_id = $1", [CHAIN_ID]),
    one<{ n: number; first: string | null; last: string | null }>("SELECT count(*)::int AS n, min(updated_at)::text AS first, max(updated_at)::text AS last FROM nav_rounds"),
    one<{ n: number }>("SELECT count(*)::int AS n FROM confirmed_records"),
    one<{ n: number }>("SELECT count(DISTINCT entry_id)::int AS n FROM calendar_entries"),
    one<{ n: number; tokens: number }>("SELECT count(*)::int AS n, count(DISTINCT lower(token_address))::int AS tokens FROM dex_pools WHERE chain_id = $1", [CHAIN_ID]),
    one<{ n: number; ok: number; last_at: string | null; last_outcome: string | null }>("SELECT count(*)::int AS n, count(*) FILTER (WHERE outcome = 'ok')::int AS ok, max(finished_at)::text AS last_at, (SELECT outcome FROM runs ORDER BY started_at DESC LIMIT 1) AS last_outcome FROM runs"),
  ]);
  let payments: unknown = null;
  let payments_unavailable_reason: string | undefined;
  try {
    payments = await countPayments(rpc);
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
        dex_pools_verified: { count: pools.n, tokens: pools.tokens },
        research_runs: { total: runs.n, ok: runs.ok, last_finished_at: runs.last_at, last_outcome: runs.last_outcome },
        x402_payments: payments,
        ...(payments_unavailable_reason ? { x402_payments_unavailable_reason: payments_unavailable_reason } : {}),
        confirmed_external_integrations: CONFIRMED_INTEGRATIONS,
      },
      meta: { note: "Counts read from keldrin's database at request time (cached up to 10 min); payments counted onchain from USDC transfers. The founder's own test payments are included in `payments` and excluded from `external_paying_wallets`." },
    },
  };
}

/** Free Explorer list: the snapshot without the free-try counter, cached up to 5 minutes at the CDN. */
export async function overview(db: PGlite): Promise<Out> {
  const s = await snapshot(db);
  if (s.status !== 200) return s;
  const b = s.body as { data: unknown; meta?: Record<string, unknown> };
  return { status: 200, body: { data: b.data, meta: { ...(b.meta ?? {}), freshness: "cached up to 5 minutes; the paid snapshot (x402) and the per-stock routes are read live" } } };
}
