// Phase 9 tests: remote MCP endpoint (JSON-RPC over POST), tool listing, tool calls, errors, the NAV switch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { insertRecord, insertReview, openDb, upsertAsset } from "../src/db/db.ts";
import { serve } from "../src/api/server.ts";
import { TOOLS } from "../src/api/mcp.ts";
import { PACKAGE_VERSION } from "../src/version.ts";

const fx = JSON.parse(readFileSync(new URL("../fixtures/recorded/googlc-e82812a6.json", import.meta.url), "utf8"));
const G = fx.record.asset.contract_address;

async function setup() {
  const db = await openDb();
  await upsertAsset(db, { chain_id: 8453, contract_address: G, symbol_registry: "GOOGLc", symbol_onchain: "GOOGLc", name: "Alphabet", decimals_registry: 8, decimals_onchain: 8, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000377118676784179", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" });
  const ins = await insertRecord(db, structuredClone(fx.record));
  await insertReview(db, { review_id: "r1", record_id: fx.record.record_id, revision: 1, payload_sha256: ins.hash, reviewer: "test", checked_at: new Date().toISOString(), verdict: "CONFIRMED", claims: [], limitations: [] });
  const srv = await serve(db, 0);
  const base = "http://127.0.0.1:" + (srv.address() as AddressInfo).port;
  const rpc = async (body: unknown, raw?: string) => {
    const r = await fetch(base + "/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: raw ?? JSON.stringify(body) });
    const text = await r.text();
    return { status: r.status, body: text ? JSON.parse(text) : null, cache: r.headers.get("cache-control") };
  };
  return { db, srv, base, rpc };
}

test("version is in step with package.json", () => {
  assert.equal(PACKAGE_VERSION, JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
});

test("MCP: initialize, tools/list, notifications, errors, and only POST /mcp is allowed", async () => {
  const { db, srv, base, rpc } = await setup();
  try {
    const init = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } });
    assert.equal(init.body.result.protocolVersion, "2025-06-18");
    assert.equal(init.body.result.serverInfo.name, "keldrin");
    assert.equal(init.cache, "no-store");
    const old = await rpc({ jsonrpc: "2.0", id: 2, method: "initialize", params: { protocolVersion: "1999-01-01" } });
    assert.equal(old.body.result.protocolVersion, "2025-11-25", "unknown version → latest supported");
    const list = await rpc({ jsonrpc: "2.0", id: 3, method: "tools/list" });
    assert.deepEqual(list.body.result.tools.map((t: any) => t.name), TOOLS.map((t) => t.name));
    assert.ok(list.body.result.tools.every((t: any) => t.annotations.readOnlyHint === true && t.inputSchema.type === "object"));
    assert.equal((await rpc({ jsonrpc: "2.0", method: "notifications/initialized" })).status, 202);
    assert.equal((await rpc({ jsonrpc: "2.0", id: 4, method: "nope" })).body.error.code, -32601);
    assert.equal((await rpc({ jsonrpc: "2.0", id: 5, method: "tools/call", params: { name: "nope", arguments: {} } })).body.error.code, -32602);
    assert.equal((await rpc(null, "{not json")).body.error.code, -32700);
    assert.equal((await rpc([{ jsonrpc: "2.0", id: 6, method: "ping" }])).body.error.code, -32600, "batches refused");
    assert.equal((await rpc(null, "x".repeat(70 * 1024))).status, 413);
    assert.equal((await fetch(base + "/mcp")).status, 405, "GET /mcp is not an SSE endpoint");
    assert.equal((await fetch(base + "/v1/events", { method: "POST" })).status, 405, "the rest of the API stays GET-only");
  } finally {
    srv.close();
    await db.close();
  }
});

test("MCP tools: list_assets, corporate actions by symbol or address, clear tool errors, NAV tools behind the switch", async () => {
  const { db, srv, rpc } = await setup();
  const prev = process.env.NAV_HISTORY_PUBLIC;
  try {
    const call = (name: string, args: Record<string, unknown>) => rpc({ jsonrpc: "2.0", id: 9, method: "tools/call", params: { name, arguments: args } });
    const la = await call("list_assets", { query: "goog" });
    assert.equal(la.body.result.isError, false);
    assert.equal(la.body.result.structuredContent.data[0].symbol, "GOOGLc");
    assert.match(la.body.result.content[0].text, /1 tracked token/);
    const bySym = await call("get_corporate_actions", { token: "GOOGLc" });
    assert.equal(bySym.body.result.isError, false);
    assert.equal(bySym.body.result.structuredContent.data[0].multiplier_after_wad, "1000377118676784179");
    const byAddr = await call("get_corporate_actions", { token: G });
    assert.deepEqual(byAddr.body.result.structuredContent.data.map((e: any) => e.event_id), bySym.body.result.structuredContent.data.map((e: any) => e.event_id));
    const unknown = await call("get_corporate_actions", { token: "NOPEc" });
    assert.equal(unknown.body.result.isError, true);
    assert.match(unknown.body.result.content[0].text, /no token with exact symbol/);
    delete process.env.NAV_HISTORY_PUBLIC;
    const off = await call("get_nav_history", { token: "GOOGLc" });
    assert.equal(off.body.result.isError, true);
    assert.match(off.body.result.content[0].text, /NAV_NOT_ENABLED/);
    process.env.NAV_HISTORY_PUBLIC = "true";
    const noFeed = await call("get_nav_history", { token: "GOOGLc" });
    assert.match(noFeed.body.result.content[0].text, /NO_NAV_FEED/, "same fail-closed answers as the REST API");
    const dex = await call("get_dex_price", { token: "GOOGLc" });
    assert.match(dex.body.result.content[0].text, /no usable DEX price \(no_verified_pools\)/);
    const s = await call("get_market_session", {});
    assert.match(s.body.result.content[0].text, /US market: /);
  } finally {
    if (prev === undefined) delete process.env.NAV_HISTORY_PUBLIC;
    else process.env.NAV_HISTORY_PUBLIC = prev;
    srv.close();
    await db.close();
  }
});
