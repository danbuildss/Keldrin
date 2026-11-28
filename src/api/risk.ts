import type { PGlite } from "@electric-sql/pglite";
import { navHistory } from "./nav.ts";
import { dateRange, isTradingDay } from "../lib/sessions.ts";

// GET /v1/assets/{contract}/risk (ROADMAP Phase 1.2; method: docs/research/RISK_METHODOLOGY.md).
// Deterministic, NAV-based risk from the same official daily closes /nav/history serves (verified feeds only).
// Provisional (unfinished) sessions and closes without a decimal value are left out. Nothing is estimated:
// a metric without enough history is null with the reason.

export const RISK_METHOD = "risk-1";

type Out = { status: number; body: unknown };
export type Close = { session_day: string; nav: number; round_id: string };

const sd = (r: number[]) => {
  const m = r.reduce((a, b) => a + b, 0) / r.length;
  return Math.sqrt(r.reduce((a, b) => a + (b - m) ** 2, 0) / (r.length - 1));
};
const round = (v: number, d = 4) => Math.round(v * 10 ** d) / 10 ** d;

function vol(closes: Close[], window: number) {
  const last = closes.slice(-(window + 1));
  const r: number[] = [];
  for (let i = 1; i < last.length; i++) r.push(Math.log(last[i].nav / last[i - 1].nav));
  // a window's figure only from that full window: a 60-day number is never computed from 30 days
  if (r.length < window) return { value_pct: null, returns_used: r.length, reason: `needs ${window} daily returns (${r.length} available)` };
  return { value_pct: round(sd(r) * Math.sqrt(252) * 100, 2), returns_used: r.length, from: last[0].session_day, to: last[last.length - 1].session_day };
}

function drawdown(closes: Close[]) {
  if (closes.length < 2) return { value_pct: null, reason: "needs at least 2 closes" };
  let peak = closes[0], worst = 0, at = { peak: closes[0], trough: closes[0] };
  for (const c of closes) {
    if (c.nav > peak.nav) peak = c;
    const dd = c.nav / peak.nav - 1;
    if (dd < worst) { worst = dd; at = { peak, trough: c }; }
  }
  if (worst === 0) return { value_pct: 0, peak: null, trough: null, note: "no close below an earlier high in this window", from: closes[0].session_day, to: closes[closes.length - 1].session_day };
  return { value_pct: round(worst * 100, 2), peak: { session_day: at.peak.session_day, nav: at.peak.nav, round_id: at.peak.round_id }, trough: { session_day: at.trough.session_day, nav: at.trough.nav, round_id: at.trough.round_id }, from: closes[0].session_day, to: closes[closes.length - 1].session_day };
}

function ret(closes: Close[], n: number) {
  if (closes.length <= n) return null;
  const a = closes[closes.length - 1 - n], b = closes[closes.length - 1];
  return { value_pct: round((b.nav / a.nav - 1) * 100, 2), from: a.session_day, to: b.session_day };
}

/** Pure: risk metrics from official, non-provisional daily closes in date order. */
export function riskFrom(closes: Close[]) {
  return {
    volatility_30d_annualized: vol(closes, 30),
    volatility_60d_annualized: vol(closes, 60),
    max_drawdown_since_start: drawdown(closes),
    max_drawdown_last_90_closes: drawdown(closes.slice(-90)),
    return_1d: ret(closes, 1),
    return_5d: ret(closes, 5),
    return_20d: ret(closes, 20),
    return_since_start: closes.length >= 2 ? { value_pct: round((closes[closes.length - 1].nav / closes[0].nav - 1) * 100, 2), from: closes[0].session_day, to: closes[closes.length - 1].session_day } : null,
  };
}

export async function assetRisk(db: PGlite, contract: string, now = new Date()): Promise<Out> {
  const from = new Date(now.getTime() - 400 * 86_400_000).toISOString().slice(0, 10);
  const h = await navHistory(db, contract, new URLSearchParams({ interval: "daily", from, to: now.toISOString().slice(0, 10) }), now);
  if (h.status !== 200) return h;
  const b = h.body as { data: { session_day: string; provisional: boolean; nav: string | null; round_id: string }[]; meta: Record<string, any> };
  const used = b.data.filter((d) => !d.provisional && d.nav !== null).map((d) => ({ session_day: d.session_day, nav: Number(d.nav), round_id: d.round_id }));
  // closes with no decimal value (aggregator decimals differ from the proxy) are left out and listed, like missing days
  const excluded = b.data.filter((d) => !d.provisional && d.nav === null).map((d) => d.session_day);
  const q = b.meta.quality ?? {};
  const first = typeof q.first_official_round_at === "string" ? q.first_official_round_at.slice(0, 10) : null;
  const capped = first !== null && first < from; // history longer than the 400-day window: "since start" means since `from`
  // fail-visible staleness: trading days that closed after the newest close used
  const asOf = used.length ? used[used.length - 1].session_day : null;
  const today = now.toISOString().slice(0, 10);
  const behind = asOf ? dateRange(asOf, today).slice(1).filter((d) => isTradingDay(d) === true && d < today).length : null;
  return {
    status: 200,
    body: {
      data: { token: b.meta.token, symbol: b.meta.symbol, as_of_close: asOf, closes_used: used.length, trading_days_since_last_close: behind, stale: behind !== null && behind > 2, history_window: { from: used.length ? used[0].session_day : null, to: asOf, capped_at_400_days: capped }, ...riskFrom(used) },
      meta: {
        method: RISK_METHOD,
        method_note: "Daily log returns of official Chainlink total-return NAV closes (last official in-session round per NYSE trading day). Volatility = sample standard deviation x sqrt(252), in percent, over the last 30 or 60 returns. Drawdown = worst close vs the highest earlier close. Provisional (unfinished) sessions are excluded. A trading day without a usable official close joins the two neighbouring closes into one multi-day return (listed in missing_trading_days or excluded_days_no_decimal_value). \"since start\" = since the first official close in the window (history_window); the window is at most 400 days.",
        semantics: "Total-return NAV: dividends and splits are already included. NAV-based risk, not DEX-price risk. Facts from history, not a forecast or advice.",
        feed: b.meta.feed, missing_trading_days: q.missing_trading_days ?? [], excluded_days_no_decimal_value: excluded, verification: q.verification ?? null,
        stale_rule: "stale = more than 2 completed NYSE trading days since the newest official close used (the indexer may be behind); the metrics are then still the true history up to as_of_close",
        source: "Computed from GET /v1/assets/{contract}/nav/history?interval=daily; every close used carries its Chainlink round id there.",
      },
    },
  };
}
