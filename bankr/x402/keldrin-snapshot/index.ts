// Keldrin snapshot 1.0.1 (x402 on Bankr). Every Coinbase tokenized stock on Base with a verified Chainlink NAV feed,
// in one answer, built from Keldrin's free public API. Bankr charges only on a 2xx, so anything incomplete is a 503.
const API = "https://keldrin.vercel.app";
const TRANSIENT = ["rpc_unavailable", "rpc_result_invalid"];

async function get(path: string, init?: RequestInit): Promise<any> {
  const r = await fetch(API + path, { ...init, signal: AbortSignal.timeout(11000) });
  if (r.status !== 200) throw new Error(`${path} ${r.status}`);
  return r.json();
}

export default async function handler(req: Request): Promise<Response> {
  try {
    const list = await get("/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "list_assets", arguments: { with_nav_only: true } } }) });
    const assets: { symbol: string; contract_address: string }[] = list?.result?.structuredContent?.data ?? [];
    if (!assets.length) throw new Error("no assets");
    const stocks = await Promise.all(assets.map(async (a) => {
      const [mc, ca] = await Promise.all([get(`/v1/assets/${a.contract_address}/market-context`), get(`/v1/assets/${a.contract_address}/corporate-actions`)]);
      const d = mc.data;
      if (TRANSIENT.includes(d.nav_unavailable_reason) || TRANSIENT.includes(d.dex?.unavailable_reason)) throw new Error(`${a.symbol} live read failed`);
      const next = (ca.data ?? []).filter((e: any) => e.status === "predicted").sort((x: any, y: any) => String(x.expected_adjustment_date).localeCompare(String(y.expected_adjustment_date)))[0];
      return { symbol: d.symbol, token: d.token, nav: d.nav, nav_unavailable_reason: d.nav_unavailable_reason ?? null, staleness: d.staleness, dex: d.dex, next_corporate_action: next ? { event_type: next.event_type, expected_adjustment_date: next.expected_adjustment_date ?? null, per_share: next.per_share ?? null } : null };
    }));
    // only stocks whose feed passed Keldrin's independent verification
    const verified = stocks.filter((s) => !["feed_not_verified", "phase_not_reviewed", "aggregator_decimals_differ_from_proxy"].includes(s.nav_unavailable_reason));
    const market = (await get("/v1/market/session")).data;
    return Response.json({ data: { market, count: verified.length, stocks: verified }, meta: { as_of: new Date().toISOString(), source: API, note: "Verified data with provenance, not advice. The NAV is Chainlink's last published total-return reference, not a live equity price." } });
  } catch (e) {
    return Response.json({ error: { code: "INCOMPLETE", message: "could not build a complete snapshot right now; you were not charged", detail: String(e).slice(0, 120) } }, { status: 503 });
  }
}
