import type { PGlite } from "@electric-sql/pglite";
import { CHAIN_ID } from "../config.ts";
import type { NavReview, NavReviewInput, StoredPhase, StoredRound } from "../verify/navVerify.ts";

/** Build the verifier's input from storage: phase summaries plus a random sample and every phase's first/last round. */
export async function loadReviewInput(db: PGlite, feed: string, sampleN = 50): Promise<NavReviewInput & { rounds_indexed: number }> {
  const f = (await db.query<{ token_address: string; symbol: string; decimals: number }>("SELECT token_address, symbol, decimals FROM nav_feeds WHERE chain_id=$1 AND feed_address=$2 LIMIT 1", [CHAIN_ID, feed])).rows[0];
  if (!f) throw new Error("unknown feed " + feed);
  const phases = (await db.query<StoredPhase>(
    "SELECT phase_id AS phase, min(aggregator_address) AS aggregator, min(round_id)::text AS min, max(round_id)::text AS max, count(*)::int AS count FROM nav_rounds WHERE chain_id=$1 AND feed_address=$2 GROUP BY phase_id ORDER BY phase_id",
    [CHAIN_ID, feed],
  )).rows;
  const cols = "round_id::text AS round_id, phase_id, answer::text AS answer, extract(epoch from started_at)::bigint::text AS started_unix, extract(epoch from updated_at)::bigint::text AS updated_unix, answered_in_round::text AS answered_in_round";
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

export async function insertNavReview(db: PGlite, feed: string, review: NavReview, roundsIndexed: number): Promise<string> {
  const id = `navrev:${feed.toLowerCase()}:${review.checked_at}`;
  await db.query(
    "INSERT INTO nav_reviews (review_id, chain_id, feed_address, verdict, sampled, mismatches, rounds_indexed, detail, checked_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
    [id, CHAIN_ID, feed, review.verdict, review.sampled, review.mismatches, roundsIndexed, JSON.stringify({ claims: review.claims }), review.checked_at],
  );
  return id;
}
