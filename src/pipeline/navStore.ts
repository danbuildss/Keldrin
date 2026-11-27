import type { PGlite } from "@electric-sql/pglite";
import { CHAIN_ID } from "../config.ts";
import { isTradingDay, nyParts, sessionClose, sessionOpen } from "../lib/sessions.ts";
import type { NavReview, NavReviewInput, StoredPhase, StoredRound } from "../verify/navVerify.ts";

/** Build the verifier's input from storage: phase summaries (with live windows) plus a random sample and every phase's first/last round. */
export async function loadReviewInput(db: PGlite, feed: string, sampleN = 50): Promise<NavReviewInput & { rounds_indexed: number }> {
  const f = (await db.query<{ token_address: string; symbol: string; decimals: number }>("SELECT token_address, symbol, decimals FROM nav_feeds WHERE chain_id=$1 AND feed_address=$2 LIMIT 1", [CHAIN_ID, feed])).rows[0];
  if (!f) throw new Error("unknown feed " + feed);
  const phases = (await db.query<StoredPhase>(
    `WITH ph AS (SELECT DISTINCT ON (phase_id) phase_id, live_from_block::text AS live_from_block, live_to_block::text AS live_to_block, aggregator_decimals,
                        extract(epoch from live_from_time)::bigint::text AS live_from_unix, extract(epoch from live_to_time)::bigint::text AS live_to_unix, observed_block::text AS observed_block
                 FROM nav_phases WHERE chain_id=$1 AND feed_address=$2 ORDER BY phase_id, observed_block DESC)
     SELECT r.phase_id AS phase, min(r.aggregator_address) AS aggregator, count(DISTINCT r.aggregator_address)::int AS distinct_aggregators,
            min(r.round_id)::text AS min, max(r.round_id)::text AS max, count(*)::int AS count,
            min(ph.live_from_block) AS live_from_block, min(ph.live_to_block) AS live_to_block, min(ph.aggregator_decimals) AS aggregator_decimals,
            min(ph.live_from_unix) AS live_from_unix, min(ph.live_to_unix) AS live_to_unix, min(ph.observed_block) AS phase_observed_block
     FROM nav_rounds r LEFT JOIN ph ON ph.phase_id = r.phase_id WHERE r.chain_id=$1 AND r.feed_address=$2 GROUP BY r.phase_id ORDER BY r.phase_id`,
    [CHAIN_ID, feed],
  )).rows;
  const cols = "round_id::text AS round_id, phase_id, aggregator_round_id::text AS aggregator_round_id, aggregator_address, decimals, answer::text AS answer, extract(epoch from started_at)::bigint::text AS started_unix, extract(epoch from updated_at)::bigint::text AS updated_unix, answered_in_round::text AS answered_in_round";
  const random = (await db.query<StoredRound>(`SELECT ${cols} FROM nav_rounds WHERE chain_id=$1 AND feed_address=$2 ORDER BY random() LIMIT $3`, [CHAIN_ID, feed, sampleN])).rows;
  // separate placeholders, not an array parameter: the Supabase adapter inlines parameters as literals
  const endIds = phases.flatMap((p) => [p.min, p.max]);
  const ends = endIds.length
    ? (await db.query<StoredRound>(`SELECT ${cols} FROM nav_rounds WHERE chain_id=$1 AND feed_address=$2 AND round_id IN (${endIds.map((_, i) => `$${i + 3}::numeric`).join(",")})`, [CHAIN_ID, feed, ...endIds])).rows
    : [];
  const byId = new Map([...random, ...ends].map((r) => [r.round_id, r]));
  const rounds_indexed = phases.reduce((s, p) => s + p.count, 0);
  return { token: f.token_address, symbol: f.symbol, feed, decimals: f.decimals, phases, sample: [...byId.values()], rounds_indexed };
}

export type NavStats = { official_rounds: number; missing_round_ids: string[]; max_in_session_gap_s: number | null; p99_in_session_gap_s: number | null; overlap_rounds_excluded: number; decimals_conflict_phases: number[] };

/** Quality statistics computed by Keldrin from its stored rounds (not part of the independent verification). */
export async function computeNavStats(db: PGlite, feed: string): Promise<NavStats> {
  const rows = (await db.query<{ phase_id: number; agg: string; t: string; official: boolean; dec_ok: boolean }>(
    `WITH ph AS (SELECT DISTINCT ON (phase_id) phase_id, live_from_time, live_to_time, (aggregator_decimals IS NOT NULL AND aggregator_decimals = proxy_decimals) AS dec_ok
                 FROM nav_phases WHERE chain_id=$1 AND feed_address=$2 ORDER BY phase_id, observed_block DESC)
     SELECT r.phase_id, r.aggregator_round_id::text AS agg, extract(epoch from r.updated_at)::bigint::text AS t,
            (ph.phase_id IS NOT NULL AND (ph.live_from_time IS NULL OR r.updated_at >= ph.live_from_time) AND (ph.live_to_time IS NULL OR r.updated_at < ph.live_to_time) AND ph.dec_ok) AS official,
            COALESCE(ph.dec_ok, false) AS dec_ok
     FROM nav_rounds r LEFT JOIN ph ON ph.phase_id = r.phase_id WHERE r.chain_id=$1 AND r.feed_address=$2 ORDER BY r.updated_at, r.round_id`,
    [CHAIN_ID, feed],
  )).rows;
  const missing: string[] = [];
  for (const p of [...new Set(rows.map((r) => r.phase_id))]) {
    const ids = rows.filter((r) => r.phase_id === p).map((r) => BigInt(r.agg));
    const max = ids.reduce((m, a) => (a > m ? a : m), 0n);
    const have = new Set(ids.map(String));
    for (let a = 1n; a <= max; a++) if (!have.has(a.toString())) missing.push(((BigInt(p) << 64n) | a).toString());
  }
  const off = rows.filter((r) => r.official);
  const gapsS: number[] = [];
  for (let i = 1; i < off.length; i++) {
    const a = Number(off[i - 1].t);
    const b = Number(off[i].t);
    const day = nyParts(a).date;
    // only gaps fully inside one regular session count: closures are expected, not staleness
    if (nyParts(b).date === day && isTradingDay(day) === true && a >= sessionOpen(day) && b <= sessionClose(day)) gapsS.push(b - a);
  }
  gapsS.sort((x, y) => x - y);
  const decConflict = [...new Set(rows.filter((r) => !r.dec_ok).map((r) => r.phase_id))];
  return {
    official_rounds: off.length,
    missing_round_ids: missing,
    max_in_session_gap_s: gapsS.length ? gapsS[gapsS.length - 1] : null,
    p99_in_session_gap_s: gapsS.length ? gapsS[Math.min(gapsS.length - 1, Math.floor(gapsS.length * 0.99))] : null,
    overlap_rounds_excluded: rows.filter((r) => !r.official && r.dec_ok).length,
    decimals_conflict_phases: decConflict,
  };
}

export async function insertNavReview(db: PGlite, feed: string, review: NavReview, roundsIndexed: number, stats?: NavStats): Promise<string> {
  const id = `navrev:${feed.toLowerCase()}:${review.checked_at}`;
  await db.query(
    "INSERT INTO nav_reviews (review_id, chain_id, feed_address, verdict, sampled, mismatches, rounds_indexed, detail, checked_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [id, CHAIN_ID, feed, review.verdict, review.sampled, review.mismatches, roundsIndexed, JSON.stringify({ claims: review.claims, covered: review.covered, verifier_rpc_host: review.verifier_rpc_host, stats: stats ?? null }), review.checked_at],
  );
  return id;
}
