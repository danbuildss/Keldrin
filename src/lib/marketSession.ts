// Phase 6: market session and NAV staleness, deterministic (no network, no LLM).
// Built on the NYSE calendar in sessions.ts; outside its coverage everything answers "calendar_not_covered".
import { CALENDAR_VERSION, isTradingDay, nyParts, nyTime, sessionClose, sessionOpen, EARLY_CLOSES } from "./sessions.ts";

export type SessionState = "open" | "pre" | "after" | "closed" | "weekend" | "holiday" | "calendar_not_covered";
export type MarketNow = {
  session: SessionState;
  ny_date: string;
  ny_time: string;
  is_trading_day: boolean | null;
  early_close: boolean;
  next_open: string | null;
  next_close: string | null;
  last_close: string | null;
  calendar_version: string;
};

const isoS = (s: number | null) => (s === null ? null : new Date(s * 1000).toISOString());
const dayShift = (date: string, n: number) => new Date(Date.parse(date + "T12:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);

/** The most recent regular-session close at or before `nowSec` (searches back 10 days; null if the calendar does not cover it). */
export function lastSessionClose(nowSec: number): number | null {
  const today = nyParts(nowSec).date;
  for (let i = 0; i <= 10; i++) {
    const d = dayShift(today, -i);
    const td = isTradingDay(d);
    if (td === null) return null;
    if (td && sessionClose(d) <= nowSec) return sessionClose(d);
  }
  return null;
}

/** The next regular-session open strictly after `nowSec`, and that session's close (searches 10 days ahead). */
export function nextSession(nowSec: number): { open: number; close: number } | null {
  const today = nyParts(nowSec).date;
  for (let i = 0; i <= 10; i++) {
    const d = dayShift(today, i);
    const td = isTradingDay(d);
    if (td === null) return null;
    if (td && sessionOpen(d) > nowSec) return { open: sessionOpen(d), close: sessionClose(d) };
  }
  return null;
}

export function marketNow(nowSec: number): MarketNow {
  const p = nyParts(nowSec);
  const td = isTradingDay(p.date);
  const early = EARLY_CLOSES.has(p.date);
  const hhmm = `${String(Math.floor(p.minutes / 60)).padStart(2, "0")}:${String(p.minutes % 60).padStart(2, "0")}`;
  const base = { ny_date: p.date, ny_time: hhmm, is_trading_day: td, early_close: early, calendar_version: CALENDAR_VERSION };
  if (td === null) return { ...base, session: "calendar_not_covered", next_open: null, next_close: null, last_close: null };
  let session: SessionState;
  if (!td) session = p.weekday === "Sat" || p.weekday === "Sun" ? "weekend" : "holiday";
  else if (nowSec >= sessionOpen(p.date) && nowSec < sessionClose(p.date)) session = "open";
  else if (nowSec >= nyTime(p.date, 4, 0) && nowSec < sessionOpen(p.date)) session = "pre";
  else if (nowSec >= sessionClose(p.date) && nowSec < (early ? nyTime(p.date, 17, 0) : nyTime(p.date, 20, 0))) session = "after";
  else session = "closed";
  const nxt = nextSession(nowSec);
  return {
    ...base,
    session,
    next_open: isoS(nxt?.open ?? null),
    next_close: session === "open" ? isoS(sessionClose(p.date)) : isoS(nxt?.close ?? null),
    last_close: isoS(lastSessionClose(nowSec)),
  };
}

export type Staleness = "fresh" | "expected_closed" | "unexpectedly_stale" | "unknown" | "calendar_not_covered";
export const STALENESS_METHOD = "v1: threshold = max(2 × the feed's p99 in-session gap between official rounds, 30 min). Open session: stale if no round for longer than the threshold since the later of the last round and today's open. Otherwise: expected_closed if the last round is no older than the threshold before the last session close, else unexpectedly_stale.";

/** Classify the age of the latest NAV round against the session and the feed's own normal update rhythm. */
export function classifyStaleness(nowSec: number, updatedSec: number, p99GapS: number | null): { state: Staleness; threshold_s: number | null } {
  const m = marketNow(nowSec);
  if (m.session === "calendar_not_covered") return { state: "calendar_not_covered", threshold_s: null };
  if (p99GapS === null || p99GapS <= 0) return { state: "unknown", threshold_s: null };
  const threshold = Math.max(2 * p99GapS, 1800);
  if (m.session === "open") {
    const since = Math.max(updatedSec, sessionOpen(m.ny_date));
    return { state: nowSec - since <= threshold ? "fresh" : "unexpectedly_stale", threshold_s: threshold };
  }
  const last = lastSessionClose(nowSec);
  if (last === null) return { state: "calendar_not_covered", threshold_s: threshold };
  return { state: updatedSec >= last - threshold ? "expected_closed" : "unexpectedly_stale", threshold_s: threshold };
}
