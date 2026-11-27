import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { openDb, insertRecord, insertReview } from "../src/db/db.ts";
import { classifyApplied, eventType } from "../src/api/events.ts";
import { dbFailureReason, rateLimited } from "../src/api/server.ts";
// The DEPLOYED artifact: the esbuild bundle Vercel runs.
import { createHandler, normalisePath } from "../api/index.mjs";

const fx = JSON.parse(readFileSync(new URL("../fixtures/recorded/googlc-e82812a6.json", import.meta.url), "utf8"));
const NV = "0xb20000000000000000000078ee7ce2fE4908108C";
const AEO = "0xb200000000000000000000000000000000000aE0";

test("event type and status classification", () => {
  assert.equal(eventType("Cash Dividend"), "dividend");
  assert.equal(eventType("Stock Split | 8-for-1 Stock Split"), "split");
  assert.equal(eventType("Reverse Stock Split"), "reverse_split");
  assert.equal(eventType(null), "other");
  assert.equal(classifyApplied("2026-09-14T18:29:45Z", { payable_date: "2026-09-14" }).status, "verified_matched");
  assert.equal(classifyApplied("2026-11-06T00:00:00Z", { payable_date: "2026-10-29" }).status, "late");
  assert.equal(classifyApplied("2026-11-06T00:00:00Z", null).status, "confirmed_onchain");
  assert.equal(classifyApplied("2026-11-06T00:00:00Z", null).confidence, "medium");
  const pm = classifyApplied("2026-10-26T13:30:15Z", { payable_date: "2026-10-26" }, { type: "dividend", ratio: "1.558821201905386994" });
  assert.deepEqual([pm.status, pm.confidence, pm.warnings], ["verified_matched", "medium", ["multiplier_change_unusually_large_for_cash_dividend"]], "PMc: timing matches but magnitude is flagged");
  assert.equal(classifyApplied("2026-10-26T00:00:00Z", { payable_date: "2026-10-26" }, { type: "split", ratio: "8" }).warnings.length, 0, "splits are not dividends");
  assert.equal(normalisePath("/api/index?__path=/v1/events&status=predicted"), "/v1/events?status=predicted", "Vercel rewrite form");
  assert.equal(normalisePath("/api/index?__path=v1/changes&since=2026-11-27T00%3A00%3A00Z"), "/v1/changes?since=2026-11-27T00%3A00%3A00Z");
  assert.equal(normalisePath("/api/index?__path="), "/");
  assert.equal(normalisePath("/api/index?__path=/"), "/");
  assert.equal(normalisePath("/api/v1/events?x=1"), "/v1/events?x=1");
  assert.equal(normalisePath("/v1/events"), "/v1/events");
  assert.equal(normalisePath("/api"), "/");
  assert.equal(dbFailureReason({ code: "28P01", message: "password authentication failed for user x" }), "auth_failed");
  assert.equal(dbFailureReason({ message: "self-signed certificate in certificate chain" }), "tls_verify_failed");
  assert.equal(dbFailureReason({ code: "ENOTFOUND", message: "getaddrinfo ENOTFOUND host" }), "dns_failed");
  assert.equal(dbFailureReason(new Error("DATABASE_URL is not set")), "not_configured");
  assert.equal(normalisePath("/apiary"), "/apiary");
});

async function setup() {
  const db = await openDb();
  const ins = await insertRecord(db, structuredClone(fx.record));
  await insertReview(db, { review_id: "r1", record_id: fx.record.record_id, revision: 1, payload_sha256: ins.hash, reviewer: "t", checked_at: "2026-11-27T10:00:00Z", verdict: "CONFIRMED", claims: [], limitations: [] });
  const decl = { per_share: "0.22", payable_date: "2026-09-14", record_date: "2026-09-07", quote: "q-googl", document_url: "https://www.sec.gov/googl" };
  await db.query("INSERT INTO reconciliations (reconciliation_id, record_id, record_payload_sha256, status, payload, payload_sha256, review_verdict, review, created_at) VALUES ('rc1',$1,$2,'partially_reconciled',$3,$4,'CONFIRMED','{}','2026-11-27T10:05:00Z')", [fx.record.record_id, ins.hash, JSON.stringify({ declaration: decl }), "a".repeat(64)]);
  const cal = (id: string, contract: string, sym: string, state: string, asOf: string, extra: object) =>
    db.query("INSERT INTO calendar_entries (snapshot_id, entry_id, as_of, contract_address, state, payable_date, payload, review_verdict, review) VALUES ($1,$2,$3,$4,$5,NULL,$6,'CONFIRMED','{}')", [asOf.slice(0, 13), id, asOf, contract, state, JSON.stringify({ entry_id: id, state, token: { symbol: sym, contract_address: contract }, basis: "b", expected_adjustment_date: null, ...extra })]);
  const nvDecl = { per_share: "0.25", payable_date: "2026-12-23", record_date: "2026-12-02", quote: "q-nv", document_url: "https://www.sec.gov/nv" };
  const nvIa = { corporate_action_uuid: "4f332b80-3d7e-4f13-ad0d-0cb4cdc1a442", description: "Cash Dividend", announcements: [{ tx_hash: "0xnv" }] };
  // Two snapshots: the NVDAc entry first appeared in the earlier one.
  await cal("nv", NV, "NVDAc", "upcoming", "2026-11-27T08:00:00Z", { declaration: nvDecl, issuer_announcement: nvIa, expected_adjustment_date: "2026-12-23" });
  await cal("nv", NV, "NVDAc", "upcoming", "2026-11-27T11:00:00Z", { declaration: nvDecl, issuer_announcement: nvIa, expected_adjustment_date: "2026-12-23" });
  await cal("aeo", AEO, "AEOc", "announced", "2026-11-27T11:00:00Z", { declaration: null, issuer_announcement: { corporate_action_uuid: "4bc64a71-ac15-4253-b9c2-f7296257f3aa", description: "Cash Dividend", announcements: [{ tx_hash: "0xaeo" }] } });
  // An announced entry for an action that is already applied must be superseded by the applied event.
  await cal("g-old", fx.record.asset.contract_address, "GOOGLc", "announced", "2026-11-27T11:00:00Z", { declaration: null, issuer_announcement: { corporate_action_uuid: fx.record.action.corporate_action_uuid, description: "Cash Dividend", announcements: [] } });
  const handler = createHandler(db);
  const srv = createServer((req, res) => void handler(req, res));
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", () => r()));
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  const get = async (p: string) => {
    const r = await fetch(base + p);
    return { status: r.status, headers: r.headers, body: await r.json() };
  };
  return { db, srv, get };
}

test("bundled handler: /v1/events in the integrator's field shape, with honest status and confidence", async () => {
  const { db, srv, get } = await setup();
  try {
    const r = await get("/api/v1/events");
    assert.equal(r.status, 200);
    const byTicker = Object.fromEntries(r.body.data.map((e: any) => [e.ticker, e]));
    assert.deepEqual(Object.keys(byTicker).sort(), ["AEOc", "GOOGLc", "NVDAc"], "superseded announced GOOGLc entry removed");
    const g = byTicker.GOOGLc;
    assert.deepEqual([g.event_type, g.status, g.confidence, g.multiplier_delta, g.payable_date, g.sec_filing_url], ["dividend", "verified_matched", "high", "1.000377118676784179", "2026-09-14", "https://www.sec.gov/googl"]);
    assert.equal(g.onchain_tx, "0xcd45e69e5b84d3f1808fe832d73c1ff7f332c7447bdf9c87925f196240ffeb00", "the tx that applied the multiplier");
    const n = byTicker.NVDAc;
    assert.deepEqual([n.status, n.confidence, n.expected_adjustment_date, n.per_share], ["predicted", "high", "2026-12-23", "0.25"]);
    const a = byTicker.AEOc;
    assert.deepEqual([a.status, a.confidence, a.expected_adjustment_date], ["predicted", "medium", null], "issuer-only: no invented date");
    assert.match(r.headers.get("cache-control") ?? "", /s-maxage=60/);
    assert.equal((await get("/v1/events?status=verified_matched")).body.data.length, 1, "rewrite-style path also works");
    assert.equal((await get("/v1/events?status=soon")).body.error.code, "BAD_STATUS");
  } finally {
    srv.close();
    await db.close();
  }
});

test("bundled handler: /v1/changes returns only what changed since a timestamp (first-seen, not every snapshot)", async () => {
  const { db, srv, get } = await setup();
  try {
    const later = await get("/v1/changes?since=2026-11-27T09:00:00Z");
    const tickers = later.body.data.map((e: any) => e.ticker).sort();
    assert.deepEqual(tickers, ["AEOc", "GOOGLc"], "NVDAc unchanged since it first appeared at 08:00");
    const all = await get("/v1/changes?since=2026-11-27T00:00:00Z");
    assert.equal(all.body.data.length, 3);
    assert.equal((await get("/v1/changes")).body.error.code, "BAD_SINCE");
    assert.equal((await get("/v1/changes?since=yesterday")).body.error.code, "BAD_SINCE");
  } finally {
    srv.close();
    await db.close();
  }
});

test("rate limit: 120 requests per client per minute, then 429 with retry-after seconds", () => {
  const now = 1_000_000;
  for (let i = 0; i < 120; i++) assert.equal(rateLimited("client-a", now), null);
  const retry = rateLimited("client-a", now + 1000);
  assert.ok(retry !== null && retry > 0 && retry <= 60);
  assert.equal(rateLimited("client-b", now + 1000), null, "other clients unaffected");
  assert.equal(rateLimited("client-a", now + 61_000), null, "window resets");
});

test("a database failure returns a generic 500 without internal details", async () => {
  const broken = { query: async () => { throw new Error("connection to db.internal-host:5432 failed: password authentication failed for user secret_user"); }, exec: async () => {}, close: async () => {} };
  const handler = createHandler(broken as any);
  const srv = createServer((req, res) => void handler(req, res));
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", () => r()));
  const orig = console.error;
  console.error = () => {};
  try {
    const r = await fetch(`http://127.0.0.1:${(srv.address() as AddressInfo).port}/v1/events`);
    const text = await r.text();
    assert.equal(r.status, 500);
    assert.ok(!/internal-host|secret_user|password/.test(text), text);
    assert.equal(r.headers.get("cache-control"), "no-store");
  } finally {
    console.error = orig;
    srv.close();
  }
});
