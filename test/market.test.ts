// Phase 6 tests: market session, staleness classes, market context (with an injected NAV reader) and per-asset corporate actions.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { insertRecord, insertReview, openDb, upsertAsset } from "../src/db/db.ts";
import { serve } from "../src/api/server.ts";
import { classifyStaleness, marketNow, tradingSecondsBetween } from "../src/lib/marketSession.ts";
import { marketContext } from "../src/api/marketContext.ts";
import { assetCorporateActions } from "../src/api/assetActions.ts";
import { listEvents } from "../src/api/events.ts";
import { insertNavReview } from "../src/pipeline/navStore.ts";

const t = (iso: string) => Date.parse(iso) / 1000;

test("market session: open, pre, after (incl. early close), closed, weekend, holiday, beyond the calendar", () => {
  assert.equal(marketNow(t("2026-11-25T15:00:00Z")).session, "open", "Wed 10:00 ET");
  assert.equal(marketNow(t("2026-11-25T13:00:00Z")).session, "pre", "Wed 08:00 ET");
  assert.equal(marketNow(t("2026-11-25T22:00:00Z")).session, "after", "Wed 17:00 ET");
  assert.equal(marketNow(t("2026-11-26T03:00:00Z")).session, "closed", "Wed 22:00 ET");
  assert.equal(marketNow(t("2026-11-26T15:00:00Z")).session, "holiday", "Thanksgiving");
  assert.equal(marketNow(t("2026-11-27T18:30:00Z")).session, "after", "Fri 13:30 ET after the early close");
  assert.equal(marketNow(t("2026-11-27T22:30:00Z")).session, "closed", "Fri 17:30 ET: extended hours end at 17:00 on an early close");
  assert.equal(marketNow(t("2026-11-28T15:00:00Z")).session, "weekend");
  assert.equal(marketNow(t("2028-02-01T15:00:00Z")).session, "calendar_not_covered");
  const wed = marketNow(t("2026-11-25T22:00:00Z"));
  assert.equal(wed.next_open, "2026-11-27T14:30:00.000Z", "skips Thanksgiving");
  assert.equal(wed.next_close, "2026-11-27T18:00:00.000Z", "the early close");
  assert.equal(wed.last_close, "2026-11-25T21:00:00.000Z");
  assert.equal(marketNow(t("2026-11-25T15:00:00Z")).next_close, "2026-11-25T21:00:00.000Z", "today's close while open");
});

test("staleness: fresh vs unexpectedly stale in session; expected closed vs stuck over a closure; unknown without history", () => {
  const p99 = 1200; // → threshold max(2400, 1800) = 2400 s
  assert.equal(classifyStaleness(t("2026-11-25T16:00:00Z"), t("2026-11-25T15:30:00Z"), p99).state, "fresh");
  assert.equal(classifyStaleness(t("2026-11-25T17:00:00Z"), t("2026-11-25T15:30:00Z"), p99).state, "unexpectedly_stale", "90 min without a round in session");
  assert.equal(classifyStaleness(t("2026-11-25T14:45:00Z"), t("2026-11-24T20:58:00Z"), p99).state, "fresh", "15 min after the open: the clock starts at the open");
  assert.equal(classifyStaleness(t("2026-11-28T15:00:00Z"), t("2026-11-27T17:55:00Z"), p99).state, "expected_closed", "Saturday, last round just before Friday's early close");
  assert.equal(classifyStaleness(t("2026-11-28T15:00:00Z"), t("2026-11-25T20:55:00Z"), p99).state, "unexpectedly_stale", "nothing during Friday's session: stuck");
  assert.equal(classifyStaleness(t("2026-11-28T15:00:00Z"), t("2026-11-27T17:55:00Z"), null).state, "unknown");
  assert.equal(classifyStaleness(t("2028-02-01T15:00:00Z"), t("2028-02-01T14:55:00Z"), p99).state, "calendar_not_covered");
  // independent review: a NAV stuck for days must not read "fresh" just because a new session opened
  assert.equal(classifyStaleness(t("2026-11-25T20:59:00Z"), t("2026-11-23T20:00:00Z"), 13448).state, "unexpectedly_stale", "stuck 2 days, NVDAc-like p99");
  assert.equal(classifyStaleness(t("2026-11-25T14:31:00Z"), t("2026-11-20T20:00:00Z"), 1200).state, "unexpectedly_stale", "5-day-old round at 09:31");
  assert.equal(tradingSecondsBetween(t("2026-11-25T20:00:00Z"), t("2026-11-27T15:00:00Z")), 3600 + 1800, "Wed 15:00-16:00 ET + Fri 09:30-10:00 ET; Thanksgiving counts nothing");
});

test("market session across the DST switches and at the calendar's edges", () => {
  assert.equal(marketNow(t("2026-03-09T13:35:00Z")).session, "open", "Mon after the Mar 8 2026 switch: 09:35 EDT");
  assert.equal(marketNow(t("2026-03-06T14:35:00Z")).session, "open", "Fri before the switch: 09:35 EST");
  assert.equal(marketNow(t("2026-03-06T14:25:00Z")).session, "pre");
  assert.equal(marketNow(t("2026-11-02T14:35:00Z")).session, "open", "Mon after the Nov 1 switch: 09:35 EST");
  const edge = marketNow(t("2027-12-31T22:00:00Z"));
  assert.equal(edge.next_open, null);
  assert.ok(edge.note && /outside the maintained NYSE calendar/.test(edge.note), "null next_open is explained, not silent");
});

const TOKEN = "0xb20000000000000000000078ee7ce2fE4908108C";
const FEED = "0x04689a41629776563E6822F76f2e57D148d28513";
const asset = (contract: string, symbol: string) => ({ chain_id: 8453, contract_address: contract, symbol_registry: symbol, symbol_onchain: symbol, name: "x", decimals_registry: 8, decimals_onchain: 8, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" as const });

test("market context: live round with age and staleness; graceful degradation; no DEX price; unknown asset", async () => {
  const db = await openDb();
  await upsertAsset(db, asset(TOKEN, "NVDAc"));
  await upsertAsset(db, asset("0xb2000000000000000000002d0ba3164cc74f58b7", "GOOGLc"));
  await db.query("INSERT INTO nav_feeds (chain_id, token_address, feed_address, symbol, description, decimals, source) VALUES (8453,$1,$2,'NVDAc','Coinbase NVDA',8,'test')", [TOKEN, FEED]);
  const now = new Date("2026-11-28T15:00:00Z");
  const reader = async () => ({ round_id: "36893488147419105182", answer_raw: "15284717833", updated_unix: t("2026-11-27T17:55:00Z"), read_at: now.toISOString() });
  const noDex = async () => ({ status: 200, body: { data: { main: null, unavailable_reason: "no_verified_pools" } } });
  try {
    assert.equal((await marketContext(db, "0x1111111111111111111111111111111111111111", now, reader, noDex)).status, 404);
    const noFeed: any = await marketContext(db, "0xb2000000000000000000002d0ba3164cc74f58b7", now, reader, noDex);
    assert.equal(noFeed.body.data.nav_unavailable_reason, "no_nav_feed");
    assert.equal(noFeed.body.data.market.session, "weekend", "the session is still answered");
    const unverified: any = await marketContext(db, TOKEN, now, reader, noDex);
    assert.equal(unverified.body.data.nav, null);
    assert.equal(unverified.body.data.nav_unavailable_reason, "feed_not_verified", "fails closed without a CONFIRMED review");
    await db.query("INSERT INTO nav_phases (chain_id, feed_address, phase_id, aggregator_address, aggregator_decimals, proxy_decimals, live_from_block, live_from_time, live_to_block, live_to_time, observed_block) VALUES (8453,$1,2,'0xF72B1eB5932800F3d2a5EeC5f99e6cD586479675',8,8,49669080,'2026-08-07T18:31:47Z',NULL,NULL,1)", [FEED]);
    await insertNavReview(db, FEED, { verdict: "CONFIRMED", sampled: 1, mismatches: 0, claims: [], checked_at: "2026-11-27T19:00:00.000Z", covered: [{ phase: 2, max_round_id: "36893488147419105182", phase_observed_block: "1" }], verifier_rpc_host: "v" }, 1, { official_rounds: 1, missing_round_ids: [], max_in_session_gap_s: 3000, p99_in_session_gap_s: 1200, overlap_rounds_excluded: 0, decimals_conflict_phases: [] });
    const ok: any = await marketContext(db, TOKEN, now, reader, noDex);
    assert.equal(ok.status, 200);
    const d = ok.body.data;
    assert.equal(d.nav.nav, "152.84717833");
    assert.equal(d.nav.phase_id, 2);
    assert.equal(d.nav.age_s, t("2026-11-28T15:00:00Z") - t("2026-11-27T17:55:00Z"));
    assert.equal(d.staleness.state, "expected_closed");
    assert.equal(d.staleness.threshold_s, 2400);
    assert.equal(d.dex.price_usd, null);
    assert.equal(d.dex.unavailable_reason, "no_verified_pools");
    const down: any = await marketContext(db, TOKEN, now, async () => {
      throw new Error("timeout");
    }, noDex);
    assert.equal(down.status, 200, "a provider failure degrades, it does not 500");
    assert.equal(down.body.data.nav_unavailable_reason, "rpc_unavailable");
    const zero: any = await marketContext(db, TOKEN, now, async () => ({ round_id: "36893488147419105182", answer_raw: "0", updated_unix: t("2026-11-27T17:55:00Z"), read_at: now.toISOString() }));
    assert.equal(zero.body.data.nav_unavailable_reason, "rpc_result_invalid", "a zero answer is never served");
    const future: any = await marketContext(db, TOKEN, now, async () => ({ round_id: "36893488147419105182", answer_raw: "1", updated_unix: t("2026-11-29T00:00:00Z"), read_at: now.toISOString() }));
    assert.equal(future.body.data.nav_unavailable_reason, "rpc_result_invalid", "a future timestamp is never served");
    const newPhase: any = await marketContext(db, TOKEN, now, async () => ({ round_id: ((3n << 64n) | 1n).toString(), answer_raw: "15000000000", updated_unix: t("2026-11-27T17:55:00Z"), read_at: now.toISOString() }));
    assert.equal(newPhase.body.data.nav_unavailable_reason, "phase_not_reviewed", "a new aggregator is not served until reviewed");
  } finally {
    await db.close();
  }
});

test("corporate actions per asset: same events as /v1/events, with multiplier/uiMultiplier detail and evidence links", async () => {
  const fx = JSON.parse(readFileSync(new URL("../fixtures/recorded/googlc-e82812a6.json", import.meta.url), "utf8"));
  const db = await openDb();
  const G = fx.record.asset.contract_address;
  await upsertAsset(db, asset(G, "GOOGLc"));
  const ins = await insertRecord(db, structuredClone(fx.record));
  await insertReview(db, { review_id: "r1", record_id: fx.record.record_id, revision: 1, payload_sha256: ins.hash, reviewer: "test", checked_at: new Date().toISOString(), verdict: "CONFIRMED", claims: [], limitations: [] });
  try {
    const out: any = await assetCorporateActions(db, G);
    assert.equal(out.status, 200);
    const events = await listEvents(db, { contract: G });
    assert.equal(out.body.data.length, events.length, "consistent with /v1/events");
    const a = out.body.data[0];
    assert.equal(a.multiplier_after_wad, "1000377118676784179");
    assert.equal(a.verification.state, "confirmed");
    assert.equal(a.evidence.issuer_record_url, "https://api.coinbase.com/v1/tokenized-stocks/corporate-actions/e82812a6-0b24-41c4-8ed1-322d1b466d33");
    assert.ok(Array.isArray(a.announcements) && a.announcements.length > 0);
    assert.equal(a.ui_multiplier_after_wad, null);
    assert.equal(a.ui_multiplier_unavailable_reason, "legacy_event_only", "GOOGLc's action emitted only the legacy MultiplierUpdated");
    assert.match(a.issuer_context.operator_description_source, /not verified/);
    assert.match(out.body.meta.accounting_note, /never apply the multiplier to the NAV again/);
    assert.equal((await assetCorporateActions(db, "0x1111111111111111111111111111111111111111")).status, 404);
  } finally {
    await db.close();
  }
});

test("routes: /v1/market/session is open; market-context is behind the NAV switch; bad address is 400", async () => {
  const db = await openDb();
  const srv = await serve(db, 0);
  const prev = process.env.NAV_HISTORY_PUBLIC;
  const base = "http://127.0.0.1:" + (srv.address() as AddressInfo).port;
  try {
    delete process.env.NAV_HISTORY_PUBLIC;
    const s = await (await fetch(base + "/v1/market/session")).json();
    assert.ok(["open", "pre", "after", "closed", "weekend", "holiday", "calendar_not_covered"].includes(s.data.session));
    const mc = await fetch(base + `/v1/assets/${TOKEN}/market-context`);
    assert.equal(mc.status, 503);
    assert.equal((await mc.json()).error.code, "NAV_NOT_ENABLED");
    assert.equal((await fetch(base + "/v1/assets/nope/corporate-actions")).status, 400);
    assert.equal((await fetch(base + `/v1/assets/${TOKEN}/corporate-actions`)).status, 404, "unknown asset");
  } finally {
    if (prev === undefined) delete process.env.NAV_HISTORY_PUBLIC;
    else process.env.NAV_HISTORY_PUBLIC = prev;
    srv.close();
    await db.close();
  }
});
