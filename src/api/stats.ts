import type { PGlite } from "@electric-sql/pglite";
import { CHAIN_ID } from "../config.ts";
import { snapshot } from "./trial.ts";

// Public product experience (approved 2026-11-28).
//  - GET /v1/stats     Transparency: counts read from real tables, plus keldrin's x402 payments counted onchain.
//  - GET /v1/overview  Explorer list: the snapshot's fields for every verified stock, free, CDN-cached and refreshed in the background (at most about 30 min old).
//                      The paid snapshot (x402) is the live, at-request version.
// Nothing here is typed by hand except the list of confirmed external integrations (currently none).

type Out = { status: number; body: unknown };
export const CONFIRMED_INTEGRATIONS: { name: string; since: string; evidence: string }[] = [];
import { PAYOUT } from "../pipeline/payments.ts";

export async function stats(db: PGlite): Promise<Out> {
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
  // payments: counted onchain by the research robot (pipeline/payments.ts) and stored; never scanned at request time
  let payments: unknown = null;
  let payments_unavailable_reason: string | undefined;
  try {
    const scan = (await db.query<{ to_block: string | null; at: string | null }>(`SELECT max(to_block)::text AS to_block, to_char(max(scanned_at) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS at FROM x402_payment_scans WHERE chain_id = $1`, [CHAIN_ID])).rows[0];
    if (!scan?.to_block) payments_unavailable_reason = "not counted yet: the research robot has not completed its first payment scan";
    else {
      const rows = (await db.query<{ tx_hash: string; payer: string }>("SELECT tx_hash, payer FROM x402_payments WHERE chain_id = $1 ORDER BY block_number", [CHAIN_ID])).rows;
      const wallets = new Set(rows.map((r) => r.payer.toLowerCase()));
      payments = { payments: rows.length, paying_wallets: wallets.size, external_paying_wallets: [...wallets].filter((w) => w !== PAYOUT).length, transactions: rows.slice(-50).map((r) => r.tx_hash), transactions_shown: Math.min(rows.length, 50), to_block: scan.to_block, counted_at: scan.at };
    }
  } catch {
    payments_unavailable_reason = "payment records unavailable right now";
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
      meta: { note: "Counts read from keldrin's database at request time (cached up to about 20 min); x402 payments are counted onchain from USDC transfers by keldrin's research robot every 8 h and stored (to_block and counted_at say how far). `external_paying_wallets` excludes only keldrin's payout wallet (which made the first test payment); a payment from any other wallet counts as external. `dex_pools_verified.count` is the pools served (latest CONFIRMED review); `discovered` is every pool found." },
    },
  };
}

/** Free Explorer list: the snapshot without the free-try counter, cached at the CDN, at most about 30 minutes old. */
export async function overview(db: PGlite): Promise<Out> {
  const s = await snapshot(db);
  if (s.status !== 200) return s;
  const b = s.body as { data: unknown; meta?: Record<string, unknown> };
  return { status: 200, body: { data: b.data, meta: { ...(b.meta ?? {}), freshness: "cached at the CDN and refreshed in the background: normally a few minutes old, at most about 30 minutes (market session included); the paid snapshot (x402) and the per-stock routes are read live" } } };
}
