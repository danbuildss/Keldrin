import type { PGlite } from "@electric-sql/pglite";
import { CHAIN_ID } from "../config.ts";
import { CALENDAR_VERSION, dateRange, isTradingDay, nyParts, sessionClose, sessionOpen } from "../lib/sessions.ts";

// GET /v1/assets/{contract}/nav/history (Phase 5, hardened in 5b). Serves verbatim Chainlink rounds stored by the
// indexer, only for feeds whose latest independent review is CONFIRMED, and only rounds that review covered.
// "Official" rounds = inside their phase's live window (when the proxy served that aggregator) AND from an
// aggregator whose decimals match the proxy. Daily closes use official rounds only; interval=round shows official
// rounds by default and every stored round with include=all (flags explain why a round is not official).
// Nothing is interpolated: a trading day without an official in-session round is listed, never filled.

export type NavRow = {
  round_id: string; phase_id: number; aggregator_round_id: string; aggregator_address: string; answer: string; decimals: number;
  started_at: string; updated_at: string; answered_in_round: string; retrieved_at: string; retrieved_block: string; updated_unix: string;
  proxy_live?: boolean; decimals_ok?: boolean; aggregator_decimals?: number | null;
};

/** Exact decimal string for an integer answer with `decimals` places (no floating point). */
export function formatNav(answer: string, decimals: number): string {
  const neg = answer.startsWith("-");
  const digits = (neg ? answer.slice(1) : answer).padStart(decimals + 1, "0");
  const int = digits.slice(0, digits.length - decimals);
  const frac = digits.slice(digits.length - decimals).replace(/0+$/, "");
  return (neg ? "-" : "") + int + (frac ? "." + frac : "");
}

/** Daily NAV close: the last round inside each NY trading day's regular session (09:30 to 16:00, or 13:00 on early closes). */
export function dailyCloses(rows: NavRow[], from: string, to: string, nowSec = Math.floor(Date.now() / 1000), indexedUntilSec: number | null = null): { closes: { session_day: string; session_close: string; provisional: boolean; row: NavRow }[]; missing_trading_days: string[]; not_covered_days: string[]; not_yet_indexed_days: string[] } {
  const byDay = new Map<string, NavRow>();
  for (const r of rows) {
    const t = Number(r.updated_unix);
    const day = nyParts(t).date;
    // in-session rounds only: a pre-market or overnight value is never presented as a close
    if (isTradingDay(day) !== true || t < sessionOpen(day) || t > sessionClose(day)) continue;
    const prev = byDay.get(day);
    if (!prev || Number(r.updated_unix) > Number(prev.updated_unix) || (r.updated_unix === prev.updated_unix && BigInt(r.round_id) > BigInt(prev.round_id))) byDay.set(day, r);
  }
  const closes: { session_day: string; session_close: string; provisional: boolean; row: NavRow }[] = [];
  const missing_trading_days: string[] = [];
  const not_covered_days: string[] = [];
  const not_yet_indexed_days: string[] = [];
  for (const d of dateRange(from, to)) {
    const td = isTradingDay(d);
    if (td === null) not_covered_days.push(d);
    if (td !== true) continue;
    const r = byDay.get(d);
    // a session that has not closed yet gives a provisional value; a day still in the future is not missing
    if (r) closes.push({ session_day: d, session_close: new Date(sessionClose(d) * 1000).toISOString(), provisional: sessionClose(d) > nowSec, row: r });
    // a day whose session opened after the newest round Keldrin has reviewed is not "missing": it is not indexed yet
    else if (indexedUntilSec !== null && sessionOpen(d) > indexedUntilSec) not_yet_indexed_days.push(d);
    else if (sessionClose(d) <= nowSec) missing_trading_days.push(d);
  }
  return { closes, missing_trading_days, not_covered_days, not_yet_indexed_days };
}

type Out = { status: number; body: unknown };
const e = (status: number, code: string, message: string, hint?: string): Out => ({ status, body: { error: { code, message, ...(hint ? { hint } : {}) } } });
const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A real calendar date: rejects roll-overs such as 2026-02-31. */
const validDay = (d: string) => DAY.test(d) && !Number.isNaN(Date.parse(d + "T00:00:00Z")) && new Date(d + "T00:00:00Z").toISOString().slice(0, 10) === d;
const iso = "'YYYY-MM-DD\"T\"HH24:MI:SS\"Z\"'";
const isoMs = "'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"'";

export async function navHistory(db: PGlite, contract: string, q: URLSearchParams, now = new Date()): Promise<Out> {
  const interval = q.get("interval") ?? "daily";
  if (interval !== "daily" && interval !== "round") return e(400, "BAD_INTERVAL", "interval must be daily or round");
  const include = q.get("include") ?? "official";
  if (include !== "official" && include !== "all") return e(400, "BAD_INCLUDE", "include must be official or all");
  if (include === "all" && interval !== "round") return e(400, "BAD_INCLUDE", "include=all is only available with interval=round");
  const today = now.toISOString().slice(0, 10);
  const to = q.get("to") ?? today;
  const from = q.get("from") ?? (interval === "daily" ? new Date(Date.parse(to + "T00:00:00Z") - 90 * 86_400_000).toISOString().slice(0, 10) : "2026-01-01");
  if (!validDay(from) || !validDay(to)) return e(400, "BAD_DATE", "from and to must be real dates (YYYY-MM-DD)");
  if (from > to) return e(400, "BAD_RANGE", "from must be on or before to");
  if (interval === "daily" && Date.parse(to) - Date.parse(from) > 400 * 86_400_000) return e(400, "RANGE_TOO_LONG", "daily ranges are limited to 400 days", "page by date range");
  const limit = Number(q.get("limit") ?? 500);
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) return e(400, "BAD_LIMIT", "limit must be an integer 1-1000");
  const cursor = q.get("cursor");
  if (cursor !== null && !/^\d{1,12}-\d{1,30}$/.test(cursor)) return e(400, "BAD_CURSOR", "cursor is opaque; pass meta.next_cursor back unchanged");

  const known = (await db.query<{ n: number }>("SELECT count(*)::int AS n FROM assets WHERE lower(contract_address)=lower($1)", [contract])).rows[0].n;
  if (!known) return e(404, "UNKNOWN_ASSET", `no tracked asset ${contract}`, "GET /v1/assets lists tracked tokens");
  const feed = (await db.query<{ feed_address: string; token_address: string; symbol: string; decimals: number; description: string }>(
    "SELECT feed_address, token_address, symbol, decimals, description FROM nav_feeds WHERE chain_id=$1 AND lower(token_address)=lower($2) ORDER BY discovered_at DESC LIMIT 1",
    [CHAIN_ID, contract],
  )).rows[0];
  if (!feed) return e(404, "NO_NAV_FEED", `no Chainlink NAV feed is indexed for ${contract}`, "about 14 tokenized stocks have a NAV feed; corporate actions cover all tokens");

  const rev = (await db.query<{ review_id: string; verdict: string; sampled: number; mismatches: number; checked_at: string; detail: { covered?: { phase: number; max_round_id: string }[]; stats?: Record<string, unknown> | null } }>(
    `SELECT review_id, verdict, sampled, mismatches, to_char(checked_at AT TIME ZONE 'UTC', ${isoMs}) AS checked_at, detail FROM nav_reviews WHERE chain_id=$1 AND feed_address=$2 ORDER BY checked_at DESC LIMIT 1`,
    [CHAIN_ID, feed.feed_address],
  )).rows[0];
  const detail = typeof rev?.detail === "string" ? JSON.parse(rev.detail as unknown as string) : rev?.detail;
  if (!rev || rev.verdict !== "CONFIRMED" || !Array.isArray(detail?.covered)) return e(503, "NAV_NOT_VERIFIED", `NAV history for ${feed.symbol} is not independently verified (${rev ? rev.verdict : "no review yet"})`, "Keldrin fails closed; read the feed onchain meanwhile: " + feed.feed_address);
  const covered = JSON.stringify(detail.covered);

  // the phase rows the CONFIRMED review checked (pinned by observed_block), never a newer unreviewed one
  const phCte = (cov: string) => `ph AS (SELECT DISTINCT ON (phase_id) phase_id, live_from_time, live_to_time, aggregator_decimals,
                     (aggregator_decimals IS NOT NULL AND aggregator_decimals = proxy_decimals) AS dec_ok
                     FROM nav_phases WHERE chain_id=$1 AND feed_address=$2
                       AND observed_block <= COALESCE((SELECT (c->>'phase_observed_block')::bigint FROM jsonb_array_elements(${cov}::jsonb) c WHERE (c->>'phase')::int = nav_phases.phase_id), -1)
                     ORDER BY phase_id, observed_block DESC)`;
  const ph = phCte("$5");
  const liveExpr = "(ph.live_from_time IS NULL OR r.updated_at >= ph.live_from_time) AND (ph.live_to_time IS NULL OR r.updated_at < ph.live_to_time)";
  const cols = `r.round_id::text AS round_id, r.phase_id, r.aggregator_round_id::text AS aggregator_round_id, r.aggregator_address, r.answer::text AS answer, r.decimals,
    to_char(r.started_at AT TIME ZONE 'UTC', ${iso}) AS started_at, to_char(r.updated_at AT TIME ZONE 'UTC', ${iso}) AS updated_at, r.answered_in_round::text AS answered_in_round,
    to_char(r.retrieved_at AT TIME ZONE 'UTC', ${iso}) AS retrieved_at, r.retrieved_block::text AS retrieved_block, extract(epoch from r.updated_at)::bigint::text AS updated_unix,
    (${liveExpr}) AS proxy_live, ph.dec_ok AS decimals_ok, ph.aggregator_decimals AS aggregator_decimals`;
  // only rounds the latest CONFIRMED review covered (per-phase max round id it saw)
  const coveredExpr = "r.round_id <= (SELECT (c->>'max_round_id')::numeric FROM jsonb_array_elements($5::jsonb) c WHERE (c->>'phase')::int = r.phase_id)";
  const officialExpr = `(${liveExpr}) AND ph.dec_ok`;
  const lo = interval === "daily" ? new Date(Date.parse(from + "T00:00:00Z") - 86_400_000).toISOString() : from + "T00:00:00Z";
  const hi = new Date(Date.parse(to + "T00:00:00Z") + (interval === "daily" ? 2 : 1) * 86_400_000).toISOString();
  const ny = "(r.updated_at AT TIME ZONE 'America/New_York')";
  let rows: NavRow[];
  if (interval === "round") {
    const [cu, cr] = cursor ? cursor.split("-") : [null, null];
    rows = (await db.query<NavRow>(
      `WITH ${ph} SELECT ${cols} FROM nav_rounds r JOIN ph ON ph.phase_id = r.phase_id
       WHERE r.chain_id=$1 AND r.feed_address=$2 AND r.updated_at >= $3::timestamptz AND r.updated_at < $4::timestamptz AND ${coveredExpr}
         ${include === "official" ? "AND " + officialExpr : ""}
         AND ($6::bigint IS NULL OR (extract(epoch from r.updated_at)::bigint, r.round_id) > ($6::bigint, $7::numeric))
       ORDER BY r.updated_at, r.round_id LIMIT ${limit + 1}`,
      [CHAIN_ID, feed.feed_address, lo, hi, covered, cu, cr],
    )).rows;
  } else {
    // at most two official candidates per New York day (last in-session round up to 13:00 and up to 16:00);
    // dailyCloses() then applies the exact calendar (holidays, early closes, provisional sessions)
    rows = (await db.query<NavRow>(
      `WITH ${ph} SELECT DISTINCT ON (${ny}::date, ${ny}::time <= '13:00') ${cols} FROM nav_rounds r JOIN ph ON ph.phase_id = r.phase_id
       WHERE r.chain_id=$1 AND r.feed_address=$2 AND r.updated_at >= $3::timestamptz AND r.updated_at < $4::timestamptz AND ${coveredExpr} AND ${officialExpr}
         AND ${ny}::time >= '09:30' AND ${ny}::time <= '16:00'
       ORDER BY ${ny}::date, ${ny}::time <= '13:00', r.updated_at DESC, r.round_id DESC`,
      [CHAIN_ID, feed.feed_address, lo, hi, covered],
    )).rows;
  }

  // decimals per row = that round's aggregator's own decimals (verified); a round whose aggregator disagrees with
  // the proxy gets no nav value: the raw answer is shown, a decimal value would be an inference
  const item = (r: NavRow, flags: boolean) => {
    const dec = r.aggregator_decimals ?? r.decimals;
    return {
    chain_id: CHAIN_ID, token: feed.token_address, feed: feed.feed_address, round_id: r.round_id, phase_id: r.phase_id, aggregator_round_id: r.aggregator_round_id,
    aggregator: r.aggregator_address, answer_raw: r.answer, decimals: dec, nav: r.decimals_ok === false ? null : formatNav(r.answer, dec),
    ...(r.decimals_ok === false ? { nav_unavailable_reason: "aggregator_decimals_differ_from_proxy" } : {}),
    started_at: r.started_at, updated_at: r.updated_at, answered_in_round: r.answered_in_round, retrieved_at: r.retrieved_at, retrieved_block: r.retrieved_block,
    ...(flags ? { official: Boolean(r.proxy_live && r.decimals_ok), proxy_live: Boolean(r.proxy_live), decimals_ok: Boolean(r.decimals_ok) } : {}),
    };
  };
  const span = (await db.query<{ first: string | null; last: string | null; n: number }>(
    `WITH ${phCte("$3")} SELECT to_char(min(r.updated_at) AT TIME ZONE 'UTC', ${iso}) AS first, to_char(max(r.updated_at) AT TIME ZONE 'UTC', ${iso}) AS last, count(*)::int AS n
     FROM nav_rounds r JOIN ph ON ph.phase_id = r.phase_id WHERE r.chain_id=$1 AND r.feed_address=$2 AND ${coveredExpr.replace("$5", "$3")} AND ${officialExpr}`,
    [CHAIN_ID, feed.feed_address, covered],
  )).rows[0];
  const phases = (await db.query(
    `SELECT DISTINCT ON (phase_id) phase_id, aggregator_address AS aggregator, aggregator_decimals, proxy_decimals, live_from_block::text AS live_from_block,
            to_char(live_from_time AT TIME ZONE 'UTC', ${iso}) AS live_from, live_to_block::text AS live_to_block, to_char(live_to_time AT TIME ZONE 'UTC', ${iso}) AS live_to
     FROM nav_phases WHERE chain_id=$1 AND feed_address=$2 ORDER BY phase_id, observed_block DESC`,
    [CHAIN_ID, feed.feed_address],
  )).rows;
  const stats = (detail.stats ?? {}) as { missing_round_ids?: string[]; max_in_session_gap_s?: number | null; p99_in_session_gap_s?: number | null; overlap_rounds_excluded?: number; decimals_conflict_phases?: number[] };
  const quality: Record<string, unknown> = {
    official_rounds: span.n, first_official_round_at: span.first, last_official_round_at: span.last,
    missing_round_ids: (stats.missing_round_ids ?? []).slice(0, 50), missing_round_ids_count: (stats.missing_round_ids ?? []).length,
    max_in_session_gap_s: stats.max_in_session_gap_s ?? null, p99_in_session_gap_s: stats.p99_in_session_gap_s ?? null,
    overlap_rounds_excluded: stats.overlap_rounds_excluded ?? null, decimals_conflict_phases: stats.decimals_conflict_phases ?? [],
    phases,
    coverage_note: "History starts at the feed's first official round. Rounds an aggregator published outside the window in which the proxy served it, or from an aggregator whose decimals differ from the proxy's, are not official: they are excluded from daily closes and shown only with interval=round&include=all.",
    verification: { verdict: rev.verdict, review_id: rev.review_id, checked_at: rev.checked_at, sampled: rev.sampled, mismatches: rev.mismatches },
  };
  const meta: Record<string, unknown> = {
    token: feed.token_address, symbol: feed.symbol, feed: feed.feed_address, feed_description: feed.description, decimals: feed.decimals, interval, include, from, to,
    semantics: "Chainlink total-return NAV per token: it already includes dividends and splits, so do not apply the multiplier again. A last published value outside market hours is a reference, not a live equity price.",
    source: "Derived from public onchain Chainlink data on Base (feed listed by Coinbase /v1/tokenized-stocks/nav-feeds, cross-checked onchain); every point carries its round id so it can be re-read with getRoundData.",
  };

  if (interval === "round") {
    const page = rows.slice(0, limit);
    const last = page[page.length - 1];
    meta.next_cursor = rows.length > limit && last ? `${last.updated_unix}-${last.round_id}` : null;
    meta.order = "updated_at, then round_id";
    return { status: 200, body: { data: page.map((r) => item(r, include === "all")), meta: { ...meta, count: page.length, quality } } };
  }
  const d = dailyCloses(rows, from, to, Math.floor(now.getTime() / 1000), span.last ? Date.parse(span.last) / 1000 : null);
  quality.missing_trading_days = d.missing_trading_days;
  quality.not_yet_indexed_days = d.not_yet_indexed_days;
  quality.not_covered_days = d.not_covered_days;
  meta.calendar_version = CALENDAR_VERSION;
  meta.daily_rule = "last official round inside each New York trading day's regular session (09:30 to 16:00, or 13:00 on early closes); weekends and NYSE holidays excluded; a day with no official in-session round is listed in quality.missing_trading_days; provisional=true while that session has not closed yet; limit and cursor do not apply";
  return { status: 200, body: { data: d.closes.map((c) => ({ session_day: c.session_day, session_close: c.session_close, provisional: c.provisional, ...item(c.row, false) })), meta: { ...meta, count: d.closes.length, quality } } };
}
