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
