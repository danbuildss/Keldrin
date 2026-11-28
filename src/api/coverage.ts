import type { PGlite } from "@electric-sql/pglite";
import { CHAIN_ID } from "../config.ts";

// Coverage level per token (ROADMAP Phase 1.3, POSITIONING §15: tracked tokens vs full coverage). Derived only from
// records keldrin already holds; never a promise of data that is not there.
//   full      identity verified + the token's newest Chainlink NAV feed has a latest independent review CONFIRMED
//             (NAV history, risk, market context, corporate actions; DEX price where verified pools exist)
//   market    identity verified + DEX pools whose latest independent review is CONFIRMED, no verified NAV
//   identity  identity verified only (corporate actions and multiplier)
//   unverified identity check failed or incomplete: nothing beyond the registry entry is served as verified

export const UNKNOWN_COVERAGE = { coverage_level: "unknown" as const, capabilities: { identity: false, corporate_actions: false, nav_history: false, risk: false, market_context: false, dex_price: false } };
export type Coverage = { coverage_level: "full" | "market" | "identity" | "unverified" | "unknown"; capabilities: Record<string, boolean> };

export const COVERAGE_SQL = `
  SELECT lower(a.contract_address) AS k, a.identity_state = 'verified' AS id_ok,
    COALESCE((SELECT COALESCE(r.verdict = 'CONFIRMED' AND jsonb_typeof(r.detail->'covered') = 'array', false) FROM nav_feeds f LEFT JOIN LATERAL (SELECT verdict, detail FROM nav_reviews n WHERE n.chain_id = f.chain_id AND n.feed_address = f.feed_address ORDER BY checked_at DESC LIMIT 1) r ON true
              WHERE f.chain_id = $1 AND lower(f.token_address) = lower(a.contract_address) ORDER BY f.discovered_at DESC LIMIT 1), false) AS nav_ok,
    COALESCE((SELECT d.verdict = 'CONFIRMED' AND jsonb_array_length(COALESCE(d.detail->'covered', '[]'::jsonb)) > 0 FROM dex_reviews d
              WHERE d.chain_id = $1 AND lower(d.token_address) = lower(a.contract_address) ORDER BY d.checked_at DESC LIMIT 1), false) AS dex_ok
  FROM assets a`;

export function coverageOf(r: { id_ok: boolean; nav_ok: boolean; dex_ok: boolean }): Coverage {
  const id = Boolean(r.id_ok), nav = id && Boolean(r.nav_ok), dex = id && Boolean(r.dex_ok);
  return {
    coverage_level: !id ? "unverified" : nav ? "full" : dex ? "market" : "identity",
    capabilities: { identity: id, corporate_actions: id, nav_history: nav, risk: nav, market_context: nav, dex_price: dex },
  };
}

/** Coverage for every tracked token, keyed by lowercase contract address. */
export async function coverageMap(db: PGlite): Promise<Map<string, Coverage> | null> {
  try {
    return await coverageRows(db);
  } catch {
    return null; // callers answer "unknown" with a reason; a coverage failure never takes down /v1/assets
  }
}
async function coverageRows(db: PGlite): Promise<Map<string, Coverage>> {
  const rows = (await db.query<{ k: string; id_ok: boolean; nav_ok: boolean; dex_ok: boolean }>(COVERAGE_SQL, [CHAIN_ID])).rows;
  return new Map(rows.map((r) => [r.k, coverageOf(r)]));
}
