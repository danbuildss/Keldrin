// Phase 11 tests: paid routes (bearer key, fail closed), snapshot and report content, and the Bankr x402 handlers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { openDb, upsertAsset } from "../src/db/db.ts";
import { handle } from "../src/api/server.ts";
import { paidAuth, paidReport, paidSnapshot } from "../src/api/paid.ts";
import { insertNavReview } from "../src/pipeline/navStore.ts";
import snapshotHandler from "../bankr/x402/keldrin-snapshot/index.ts";
import reportHandler from "../bankr/x402/keldrin-report/index.ts";

const NV = "0xb20000000000000000000078ee7ce2fE4908108C";
const FEED = "0x04689a41629776563E6822F76f2e57D148d28513";
const KEY = "k".repeat(40);

async function seeded() {
  const db = await openDb();
  await upsertAsset(db, { chain_id: 8453, contract_address: NV, symbol_registry: "NVDAc", symbol_onchain: "NVDAc", name: "NVIDIA", decimals_registry: 18, decimals_onchain: 18, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" });
  await db.query("INSERT INTO nav_feeds (chain_id, token_address, feed_address, symbol, description, decimals, source) VALUES (8453,$1,$2,'NVDAc','Coinbase NVDA',8,'test')", [NV, FEED]);
  await db.query("INSERT INTO nav_phases (chain_id, feed_address, phase_id, aggregator_address, aggregator_decimals, proxy_decimals, live_from_block, live_from_time, live_to_block, live_to_time, observed_block) VALUES (8453,$1,2,'0xF72B1eB5932800F3d2a5EeC5f99e6cD586479675',8,8,49669080,'2026-08-07T18:31:47Z',NULL,NULL,1)", [FEED]);
  await insertNavReview(db, FEED, { verdict: "CONFIRMED", sampled: 1, mismatches: 0, claims: [], checked_at: "2026-11-27T19:00:00.000Z", covered: [{ phase: 2, max_round_id: "1", phase_observed_block: "1" }], verifier_rpc_host: "v" }, 1, { official_rounds: 1, missing_round_ids: [], max_in_session_gap_s: 3000, p99_in_session_gap_s: 1200, overlap_rounds_excluded: 0, decimals_conflict_phases: [] });
  return db;
}
const now = new Date("2026-11-28T15:00:00Z");
const reader = async () => ({ round_id: ((2n << 64n) | 9n).toString(), answer_raw: "15000000000", updated_unix: Date.parse("2026-11-27T17:55:00Z") / 1000, read_at: now.toISOString() });
const dexReader = async () => ({ status: 200, body: { data: { block: "123", main: { venue: "uniswap_v3", pool: "0x60661b315553EB81872deEA9a66d567Cf0CCd33B", quote: "USDC", price_usd: "151.50000000", depth_2pct_usd: 2000, thin_market: false }, pools: [] } } });

test("paid key: fail closed when unset or short; exact bearer match only", () => {
  assert.equal(paidAuth(`Bearer ${KEY}`, undefined), "not_configured");
  assert.equal(paidAuth(`Bearer short`, "short"), "not_configured");
  assert.equal(paidAuth(undefined, KEY), "denied");
  assert.equal(paidAuth(KEY, KEY), "denied", "the Bearer prefix is required");
  assert.equal(paidAuth(`Bearer ${KEY}x`, KEY), "denied");
  assert.equal(paidAuth(`Bearer ${KEY}`, KEY), "ok");
});

test("paid routes over HTTP: 503 without a configured key, 401 without the right key, never rate limited", async () => {
  const db = await seeded();
  const srv = createServer((req, res) => void handle(db, req, res));
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", () => r()));
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  const old = process.env.KELDRIN_PAID_KEY;
  try {
    delete process.env.KELDRIN_PAID_KEY;
    assert.equal((await fetch(base + "/v1/paid/snapshot")).status, 503);
    process.env.KELDRIN_PAID_KEY = KEY;
    const denied = await fetch(base + "/v1/paid/snapshot", { headers: { authorization: "Bearer nope" } });
    assert.equal(denied.status, 401);
    assert.equal((await denied.json()).error.code, "PAID_ONLY");
    const nf = await fetch(base + "/v1/paid/other", { headers: { authorization: `Bearer ${KEY}` } });
    assert.equal(nf.status, 404);
    const bad = await fetch(base + "/v1/paid/report?token=ZZZZc", { headers: { authorization: `Bearer ${KEY}` } });
    assert.equal(bad.status, 404, "unknown token is a free error");
    assert.equal(bad.headers.get("cache-control"), "private, no-store");
  } finally {
    if (old === undefined) delete process.env.KELDRIN_PAID_KEY;
    else process.env.KELDRIN_PAID_KEY = old;
    srv.close();
    await db.close();
  }
});

test("paid snapshot and report: the same verified fields as the free routes, one call", async () => {
  const db = await seeded();
  const old = process.env.NAV_HISTORY_PUBLIC;
  try {
    process.env.NAV_HISTORY_PUBLIC = "false";
    assert.equal((await paidSnapshot(db, now, reader, dexReader)).status, 503, "NAV switch respected");
    process.env.NAV_HISTORY_PUBLIC = "true";
    const s: any = (await paidSnapshot(db, now, reader, dexReader)).body;
    assert.equal(s.data.count, 1);
    const nv = s.data.stocks[0];
    assert.equal(nv.symbol, "NVDAc");
    assert.equal(nv.nav.round_id, ((2n << 64n) | 9n).toString());
    assert.equal(nv.dex.price_usd, "151.50000000");
    assert.equal(nv.dex.nav_premium_pct, 1);
    assert.equal(s.data.market.session !== undefined, true);
    const r: any = await paidReport(db, "NVDAc", now, reader, dexReader);
    assert.equal(r.status, 200);
    assert.equal(r.body.data.symbol, "NVDAc");
    assert.ok(Array.isArray(r.body.data.corporate_actions));
    assert.equal(r.body.data.market_context.nav.round_id, nv.nav.round_id);
    assert.ok(r.body.data.nav_daily_30d.meta, "30-day daily NAV history included");
    assert.equal(r.body.data.dex.main.venue, "uniswap_v3");
    assert.equal((await paidReport(db, "", now, reader, dexReader)).status, 400);
    assert.equal((await paidReport(db, NV.toLowerCase(), now, reader, dexReader)).status, 200, "address works");
  } finally {
    process.env.NAV_HISTORY_PUBLIC = old;
    await db.close();
  }
});

test("Bankr handlers: forward with the key, pass the status through (only 2xx is charged), 502 when Keldrin is unreachable", async () => {
  const realFetch = globalThis.fetch;
  const oldKey = process.env.KELDRIN_API_KEY;
  const seen: { url: string; auth: string | null }[] = [];
  try {
    delete process.env.KELDRIN_API_KEY;
    assert.equal((await snapshotHandler(new Request("https://x402.example/keldrin-snapshot"))).status, 503);
    process.env.KELDRIN_API_KEY = KEY;
    globalThis.fetch = (async (url: string, init: any) => {
      seen.push({ url, auth: init?.headers?.authorization ?? null });
      return new Response(JSON.stringify({ data: { ok: true } }), { status: url.includes("ZZZZc") ? 404 : 200 });
    }) as typeof fetch;
    const s = await snapshotHandler(new Request("https://x402.example/keldrin-snapshot"));
    assert.equal(s.status, 200);
    assert.equal(seen[0].url, "https://keldrin.vercel.app/v1/paid/snapshot");
    assert.equal(seen[0].auth, `Bearer ${KEY}`);
    assert.equal((await reportHandler(new Request("https://x402.example/keldrin-report?token=NVDAc"))).status, 200);
    assert.equal(seen[1].url, "https://keldrin.vercel.app/v1/paid/report?token=NVDAc");
    const post = await reportHandler(new Request("https://x402.example/keldrin-report", { method: "POST", body: JSON.stringify({ token: "ZZZZc" }) }));
    assert.equal(post.status, 404, "upstream status passed through: not charged");
    assert.equal((await reportHandler(new Request("https://x402.example/keldrin-report?token=../../x"))).status, 400);
    assert.equal(seen.length, 3, "a bad token never reaches Keldrin");
    globalThis.fetch = (async () => {
      throw new Error("down");
    }) as typeof fetch;
    assert.equal((await snapshotHandler(new Request("https://x402.example/keldrin-snapshot"))).status, 502);
  } finally {
    globalThis.fetch = realFetch;
    if (oldKey === undefined) delete process.env.KELDRIN_API_KEY;
    else process.env.KELDRIN_API_KEY = oldKey;
  }
});
