// Keldrin report 1.0.0 (x402 on Bankr). Everything Keldrin verifies about one Coinbase tokenized stock on Base, in one
// answer, built from Keldrin's free public API. Input: ?token=NVDAc (or a 0x address) or JSON {"token": "..."}.
// Bankr charges only on a 2xx, so anything incomplete is a 4xx/5xx.
const API = "https://keldrin.vercel.app";
const TRANSIENT = ["rpc_unavailable", "rpc_result_invalid"];

async function get(path: string): Promise<{ status: number; body: any }> {
  const r = await fetch(API + path, { signal: AbortSignal.timeout(11000) });
  return { status: r.status, body: await r.json() };
}
const fail = (status: number, code: string, message: string) => Response.json({ error: { code, message: message + "; you were not charged" } }, { status });

export default async function handler(req: Request): Promise<Response> {
  let token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token && req.method === "POST") {
    try {
      token = String((await req.json())?.token ?? "");
    } catch {}
  }
  token = token.trim();
  if (!token || token.length > 64) return fail(400, "TOKEN_REQUIRED", "pass token: an exact symbol (e.g. NVDAc) or a 0x contract address");
  try {
    let addr = token;
    if (!/^0x[0-9a-fA-F]{40}$/.test(token)) {
      const all = await get("/v1/assets");
      if (all.status !== 200) return fail(503, "INCOMPLETE", "asset list unavailable");
      const m = (all.body.data as any[]).filter((a) => a.symbol === token);
      if (m.length === 0) return fail(404, "UNKNOWN_ASSET", `no tracked token with exact symbol ${token}`);
      if (m.length > 1) return fail(409, "AMBIGUOUS_SYMBOL", `${m.length} tokens use symbol ${token}; pass the address`);
      addr = m[0].contract_address;
    }
    const from = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
    const [ca, mc, nav, dex] = await Promise.all([get(`/v1/assets/${addr}/corporate-actions`), get(`/v1/assets/${addr}/market-context`), get(`/v1/assets/${addr}/nav/history?interval=daily&from=${from}`), get(`/v1/assets/${addr}/dex`)]);
    if (ca.status === 404) return fail(404, "UNKNOWN_ASSET", `no tracked token ${token}`);
    if (ca.status !== 200 || mc.status !== 200 || dex.status !== 200) return fail(503, "INCOMPLETE", "a section was unavailable");
    const noFeed = nav.status === 404 && nav.body?.error?.code === "NO_NAV_FEED";
    if (nav.status !== 200 && !noFeed) return fail(503, "INCOMPLETE", "NAV history unavailable");
    const c = mc.body.data;
    if (TRANSIENT.includes(c.nav_unavailable_reason) || TRANSIENT.includes(c.dex?.unavailable_reason) || TRANSIENT.includes(dex.body.data?.unavailable_reason)) return fail(503, "INCOMPLETE", "a live onchain read failed");
    return Response.json({
      data: { token: c.token, symbol: c.symbol, corporate_actions: ca.body.data, market_context: c, nav_daily_30d: noFeed ? null : nav.body, ...(noFeed ? { nav_unavailable_reason: "no_nav_feed" } : {}), dex_pools: dex.body.data },
      meta: { as_of: new Date().toISOString(), source: API, note: "Verified data with provenance, not advice. market_context.dex and dex_pools are separate live reads; each names its block." },
    });
  } catch (e) {
    return fail(503, "INCOMPLETE", "Keldrin API unreachable");
  }
}
