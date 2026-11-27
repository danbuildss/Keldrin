// Phase 11 tests: the two Bankr x402 endpoints (self-contained, built from Keldrin's free API). Bankr charges only on
// a 2xx, so every incomplete answer must be a 4xx/5xx. Offline: fetch is replaced by a fake Keldrin API.
import { test } from "node:test";
import assert from "node:assert/strict";
import snapshotHandler from "../bankr/x402/keldrin-snapshot/index.ts";
import reportHandler from "../bankr/x402/keldrin-report/index.ts";

const NV = "0xb20000000000000000000078ee7ce2fE4908108C";
const AE = "0xB2000000000000000000006064f8EC027f042294";
type Opt = { navReason?: string; dexReason?: string; down?: boolean; mcStatus?: number };

function fakeApi(o: Opt = {}) {
  return (async (url: string, init?: RequestInit) => {
    if (o.down) throw new Error("down");
    const u = new URL(url);
    const j = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
    if (u.pathname === "/mcp") return j(200, { result: { structuredContent: { data: [{ symbol: "NVDAc", contract_address: NV }] } } });
    if (u.pathname === "/v1/assets") return j(200, { data: [{ symbol: "NVDAc", contract_address: NV }, { symbol: "AEOc", contract_address: AE }] });
    if (u.pathname === "/v1/market/session") return j(200, { data: { session: "closed" } });
    const m = u.pathname.match(/^\/v1\/assets\/(0x[0-9a-fA-F]{40})\/(.+)$/);
    if (!m) return j(404, { error: { code: "NOT_FOUND" } });
    const isNv = m[1] === NV;
    if (m[2] === "market-context") return j(o.mcStatus ?? 200, { data: { symbol: isNv ? "NVDAc" : "AEOc", token: m[1], nav: isNv && !o.navReason ? { nav: "150", round_id: "1" } : null, nav_unavailable_reason: o.navReason ?? (isNv ? undefined : "no_nav_feed"), staleness: { state: "fresh" }, dex: o.dexReason ? { price_usd: null, unavailable_reason: o.dexReason } : { price_usd: "151", nav_premium_pct: 0.6667 } } });
    if (m[2] === "corporate-actions") return j(200, { data: [{ status: "predicted", event_type: "dividend", expected_adjustment_date: "2026-12-23", per_share: "0.01" }, { status: "verified_matched", event_type: "dividend" }] });
    if (m[2].startsWith("nav/history")) return isNv ? j(200, { data: [], meta: { count: 22 } }) : j(404, { error: { code: "NO_NAV_FEED" } });
    if (m[2] === "dex") return j(200, { data: { main: null, pools: [], pools_total: 0, unavailable_reason: o.dexReason } });
    return j(404, {});
  }) as typeof fetch;
}
async function withFetch<T>(f: typeof fetch, fn: () => Promise<T>): Promise<T> {
  const real = globalThis.fetch;
  globalThis.fetch = f;
  try {
    return await fn();
  } finally {
    globalThis.fetch = real;
  }
}

test("snapshot: a complete answer is 200 with NAV, DEX and the next corporate action", async () => {
  const r = await withFetch(fakeApi(), () => snapshotHandler(new Request("https://x402.example/keldrin-snapshot")));
  assert.equal(r.status, 200);
  const b: any = await r.json();
  assert.equal(b.data.count, 1);
  assert.equal(b.data.stocks[0].nav.nav, "150");
  assert.equal(b.data.stocks[0].next_corporate_action.expected_adjustment_date, "2026-12-23");
  assert.equal(b.data.market.session, "closed");
});

test("snapshot: never a 2xx (never charged) when a live read failed, the API is down or a route errors", async () => {
  for (const o of [{ navReason: "rpc_unavailable" }, { dexReason: "rpc_result_invalid" }, { down: true }, { mcStatus: 429 }] as Opt[]) {
    const r = await withFetch(fakeApi(o), () => snapshotHandler(new Request("https://x402.example/keldrin-snapshot")));
    assert.equal(r.status, 503, JSON.stringify(o));
    assert.equal(((await r.json()) as any).error.code, "INCOMPLETE");
  }
  // an unverified feed is left out rather than served
  const r = await withFetch(fakeApi({ navReason: "feed_not_verified" }), () => snapshotHandler(new Request("https://x402.example/keldrin-snapshot")));
  assert.equal(((await r.json()) as any).data.count, 0);
});

test("report: symbol, address or POST body; tokens without a NAV feed are labelled; errors are never 2xx", async () => {
  const ok = await withFetch(fakeApi(), () => reportHandler(new Request("https://x402.example/keldrin-report?token=NVDAc")));
  assert.equal(ok.status, 200);
  const b: any = await ok.json();
  assert.equal(b.data.symbol, "NVDAc");
  assert.equal(b.data.nav_daily_30d.meta.count, 22);
  assert.equal(b.data.corporate_actions.length, 2);
  const post = await withFetch(fakeApi(), () => reportHandler(new Request("https://x402.example/keldrin-report", { method: "POST", body: JSON.stringify({ token: AE }) })));
  const pb: any = await post.json();
  assert.equal(post.status, 200);
  assert.equal(pb.data.nav_daily_30d, null);
  assert.equal(pb.data.nav_unavailable_reason, "no_nav_feed");
  const cases: [string, number, Opt?][] = [["", 400], ["?token=ZZZc", 404], ["?token=NVDAc", 503, { dexReason: "rpc_unavailable" }], ["?token=NVDAc", 503, { down: true }], ["?token=NVDAc", 503, { mcStatus: 503 }]];
  for (const [q, status, o] of cases) {
    const r = await withFetch(fakeApi(o), () => reportHandler(new Request("https://x402.example/keldrin-report" + q)));
    assert.equal(r.status, status, q + JSON.stringify(o ?? {}));
  }
});

// ── 3 free tries on Keldrin's own API (/v1/snapshot, /v1/report) ──────────
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { openDb, upsertAsset } from "../src/db/db.ts";
import { handle } from "../src/api/server.ts";
import { report as trialReport, snapshot as trialSnapshot, resetTrials } from "../src/api/trial.ts";
import { insertNavReview } from "../src/pipeline/navStore.ts";

const FEED = "0x04689a41629776563E6822F76f2e57D148d28513";
async function seededDb(withFeed: boolean) {
  const db = await openDb();
  await upsertAsset(db, { chain_id: 8453, contract_address: NV, symbol_registry: "NVDAc", symbol_onchain: "NVDAc", name: "NVIDIA", decimals_registry: 18, decimals_onchain: 18, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" });
  if (withFeed) {
    await db.query("INSERT INTO nav_feeds (chain_id, token_address, feed_address, symbol, description, decimals, source) VALUES (8453,$1,$2,'NVDAc','Coinbase NVDA',8,'test')", [NV, FEED]);
    await db.query("INSERT INTO nav_phases (chain_id, feed_address, phase_id, aggregator_address, aggregator_decimals, proxy_decimals, live_from_block, live_from_time, live_to_block, live_to_time, observed_block) VALUES (8453,$1,2,'0xF72B1eB5932800F3d2a5EeC5f99e6cD586479675',8,8,49669080,'2026-08-07T18:31:47Z',NULL,NULL,1)", [FEED]);
    await insertNavReview(db, FEED, { verdict: "CONFIRMED", sampled: 1, mismatches: 0, claims: [], checked_at: "2026-11-27T19:00:00.000Z", covered: [{ phase: 2, max_round_id: "1", phase_observed_block: "1" }], verifier_rpc_host: "v" }, 1, { official_rounds: 1, missing_round_ids: [], max_in_session_gap_s: 3000, p99_in_session_gap_s: 1200, overlap_rounds_excluded: 0, decimals_conflict_phases: [] });
  }
  return db;
}
const tNow = new Date("2026-11-28T15:00:00Z");
const roundReader = async () => ({ round_id: ((2n << 64n) | 9n).toString(), answer_raw: "15000000000", updated_unix: Date.parse("2026-11-27T17:55:00Z") / 1000, read_at: tNow.toISOString() });
const dexOk = async () => ({ status: 200, body: { data: { block: "123", main: { venue: "uniswap_v3", pool: "0x60661b315553EB81872deEA9a66d567Cf0CCd33B", quote: "USDC", price_usd: "151.50000000", depth_2pct_usd: 2000, thin_market: false }, pools: [], pools_total: 1 } } });
const dexDown = async () => ({ status: 200, body: { data: { main: null, pools: [], unavailable_reason: "rpc_unavailable" } } });

test("in-house snapshot and report: same fields as the paid endpoints; incomplete answers are 503", async () => {
  const db = await seededDb(true);
  const old = process.env.NAV_HISTORY_PUBLIC;
  try {
    process.env.NAV_HISTORY_PUBLIC = "true";
    const s: any = await trialSnapshot(db, tNow, roundReader, dexOk);
    assert.equal(s.status, 200);
    assert.equal(s.body.data.stocks[0].dex.nav_premium_pct, 1);
    assert.equal((await trialSnapshot(db, tNow, roundReader, dexDown)).status, 503, "a failed live read is never a complete answer");
    const r: any = await trialReport(db, "NVDAc", tNow, roundReader, dexOk);
    assert.equal(r.status, 200);
    assert.equal(r.body.data.market_context.dex.block, r.body.data.dex_pools.block, "one DEX read for both sections");
    assert.ok(r.body.data.nav_daily_30d.meta);
    assert.equal((await trialReport(db, "NVDAc", tNow, roundReader, dexDown)).status, 503);
    assert.equal((await trialReport(db, "", tNow, roundReader, dexOk)).status, 400);
    assert.equal((await trialReport(db, "ZZZc", tNow, roundReader, dexOk)).status, 404);
    process.env.NAV_HISTORY_PUBLIC = "false";
    assert.equal((await trialReport(db, "NVDAc", tNow, roundReader, dexOk)).status, 503, "NAV switch respected");
  } finally {
    process.env.NAV_HISTORY_PUBLIC = old;
    await db.close();
  }
});

test("free tries over HTTP: 3 complete answers per client per day, then 402 with the paid links; errors don't use a try", async () => {
  const db = await seededDb(false); // no NAV feed and no DEX review: answers are complete without any live read
  const srv = createServer((req, res) => void handle(db, req, res));
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", () => r()));
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  const old = process.env.NAV_HISTORY_PUBLIC;
  process.env.NAV_HISTORY_PUBLIC = "true";
  resetTrials();
  const h = (ip: string) => ({ headers: { "x-forwarded-for": ip } });
  try {
    assert.equal((await fetch(base + "/v1/report?token=ZZZc", h("1.1.1.1"))).status, 404, "an error does not use a try");
    const first = await fetch(base + "/v1/report?token=NVDAc", h("1.1.1.1"));
    assert.equal(first.status, 200);
    assert.equal(first.headers.get("x-keldrin-free-tries-left"), "2");
    assert.equal(((await first.json()) as any).data.nav_unavailable_reason, "no_nav_feed");
    assert.equal((await fetch(base + "/v1/snapshot", h("1.1.1.1"))).status, 200);
    const third = await fetch(base + "/v1/report?token=NVDAc", h("1.1.1.1"));
    assert.equal(((await third.json()) as any).meta.free_tries_left_today, 0);
    const fourth = await fetch(base + "/v1/snapshot", h("1.1.1.1"));
    assert.equal(fourth.status, 402);
    const b: any = await fourth.json();
    assert.equal(b.error.code, "FREE_TRIES_USED");
    assert.match(b.pay.snapshot, /^https:\/\/x402\.bankr\.bot\/0xb98f0de777eea8c481b64e33d3e0066cea38fa91\/keldrin-snapshot$/);
    assert.equal(fourth.headers.get("cache-control"), "no-store");
    assert.equal((await fetch(base + "/v1/snapshot", h("2.2.2.2"))).status, 200, "another client has its own tries");
    assert.equal((await fetch(base + `/v1/assets/${NV}/corporate-actions`, h("1.1.1.1"))).status, 200, "one-stock routes stay free");
  } finally {
    process.env.NAV_HISTORY_PUBLIC = old;
    srv.close();
    await db.close();
  }
});

test("free tries are counted in the database (shared by every server instance), keyed on a salted hash, never the raw IP", async () => {
  const db = await seededDb(false);
  const servers = [createServer((req, res) => void handle(db, req, res)), createServer((req, res) => void handle(db, req, res))];
  for (const s of servers) await new Promise<void>((r) => s.listen(0, "127.0.0.1", () => r()));
  const url = (i: number) => `http://127.0.0.1:${(servers[i].address() as AddressInfo).port}/v1/report?token=NVDAc`;
  const old = process.env.NAV_HISTORY_PUBLIC;
  process.env.NAV_HISTORY_PUBLIC = "true";
  const h = { headers: { "x-forwarded-for": "9.9.9.9" } };
  try {
    for (const i of [0, 1, 0]) assert.equal((await fetch(url(i), h)).status, 200);
    resetTrials(); // no in-memory state left: the count must come from the database
    assert.equal((await fetch(url(1), h)).status, 402, "a different instance sees the same count");
    const rows = (await db.query<{ client_hash: string; n: number }>("SELECT client_hash, n FROM trial_usage")).rows;
    assert.equal(rows.length, 1);
    assert.equal(rows[0].n, 3);
    assert.match(rows[0].client_hash, /^[0-9a-f]{32}$/);
    assert.ok(!JSON.stringify(rows).includes("9.9.9.9"), "the IP is not stored");
  } finally {
    process.env.NAV_HISTORY_PUBLIC = old;
    for (const s of servers) s.close();
    await db.close();
  }
});

test("MCP get_snapshot / get_report use the same free tries, then return the paid link as an error (never pay)", async () => {
  const { handleMcp } = await import("../src/api/mcp.ts");
  const db = await seededDb(false);
  const old = process.env.NAV_HISTORY_PUBLIC;
  process.env.NAV_HISTORY_PUBLIC = "true";
  resetTrials();
  const call = (name: string, args: Record<string, unknown> = {}) => handleMcp(db as never, { jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }, "7.7.7.7");
  try {
    const list: any = await handleMcp(db as never, { jsonrpc: "2.0", id: 1, method: "tools/list" });
    assert.ok(list.body.result.tools.some((t: any) => t.name === "get_snapshot") && list.body.result.tools.some((t: any) => t.name === "get_report"));
    const a: any = await call("get_snapshot");
    assert.equal(a.body.result.isError, false);
    assert.equal(a.body.result.structuredContent.meta.free_tries_left_today, 2);
    const bad: any = await call("get_report", { token: "ZZZc" });
    assert.equal(bad.body.result.isError, true, "an unknown token is an error and uses no try");
    assert.equal(((await call("get_report", { token: "NVDAc" })) as any).body.result.isError, false);
    assert.equal(((await call("get_snapshot")) as any).body.result.isError, false);
    const used: any = await call("get_snapshot");
    assert.equal(used.body.result.isError, true);
    assert.match(used.body.result.content[0].text, /FREE_TRIES_USED[\s\S]*x402\.bankr\.bot[\s\S]*never pay automatically/);
  } finally {
    process.env.NAV_HISTORY_PUBLIC = old;
    await db.close();
  }
});
