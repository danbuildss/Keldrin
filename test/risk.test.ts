// NAV-based risk (ROADMAP Phase 1.2): deterministic maths on official daily closes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { riskFrom, type Close } from "../src/api/risk.ts";

const series = (navs: number[]): Close[] => navs.map((nav, i) => ({ session_day: `2026-09-${String(i + 1).padStart(2, "0")}`, nav, round_id: String(1000 + i) }));

test("risk: volatility is the sample sd of log returns x sqrt(252), in percent", () => {
  // alternating +1% / -1% moves: log returns ±ln(1.01)-ish, sd known in closed form
  const navs = [100]; for (let i = 0; i < 30; i++) navs.push(navs[navs.length - 1] * (i % 2 ? 0.99 : 1.01));
  const r = riskFrom(series(navs));
  const lr: number[] = []; for (let i = 1; i < navs.length; i++) lr.push(Math.log(navs[i] / navs[i - 1]));
  const m = lr.reduce((a, b) => a + b, 0) / lr.length; const sd = Math.sqrt(lr.reduce((a, b) => a + (b - m) ** 2, 0) / (lr.length - 1));
  assert.equal(r.volatility_30d_annualized.returns_used, 30);
  assert.equal(r.volatility_30d_annualized.value_pct, Math.round(sd * Math.sqrt(252) * 100 * 100) / 100);
  assert.equal(r.volatility_60d_annualized.value_pct, null, "60-day needs more history: null, not a guess");
});

test("risk: too little history gives null with a reason", () => {
  const r = riskFrom(series([100, 101, 102]));
  assert.equal(r.volatility_30d_annualized.value_pct, null);
  assert.match(String((r.volatility_30d_annualized as { reason?: string }).reason), /needs 30 daily returns/);
  assert.equal(r.return_5d, null);
});

test("risk: drawdown names the peak and trough closes with their round ids", () => {
  const r = riskFrom(series([100, 120, 90, 110, 130, 117]));
  const dd = r.max_drawdown_since_start as { value_pct: number; peak: Close; trough: Close };
  assert.equal(dd.value_pct, -25);
  assert.equal(dd.peak.nav, 120); assert.equal(dd.peak.round_id, "1001");
  assert.equal(dd.trough.nav, 90); assert.equal(dd.trough.round_id, "1002");
  assert.equal(r.return_1d?.value_pct, -10);
  assert.equal(r.return_since_start?.value_pct, 17);
});
