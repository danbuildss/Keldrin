// Keldrin report 1.0.0 (x402 on Bankr). Everything Keldrin verifies about one tokenized stock on Base in one call.
// Input: ?token=NVDAc (or a 0x contract address), or a JSON body {"token": "..."}. Bankr charges only on a 2xx.
export default async function handler(req: Request): Promise<Response> {
  const key = process.env.KELDRIN_API_KEY;
  if (!key) return Response.json({ error: { code: "NOT_CONFIGURED", message: "endpoint key missing" } }, { status: 503 });
  let token = new URL(req.url).searchParams.get("token") ?? "";
  if (!token && req.method === "POST") {
    try {
      token = String((await req.json())?.token ?? "");
    } catch {}
  }
  if (!/^(0x[0-9a-fA-F]{40}|[A-Za-z0-9.]{1,20})$/.test(token)) return Response.json({ error: { code: "TOKEN_REQUIRED", message: "pass token: a contract address or exact symbol, e.g. NVDAc" } }, { status: 400 });
  try {
    const r = await fetch(`https://keldrin.vercel.app/v1/paid/report?token=${encodeURIComponent(token)}`, { headers: { authorization: `Bearer ${key}`, accept: "application/json" }, signal: AbortSignal.timeout(14000) });
    return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
  } catch {
    return Response.json({ error: { code: "UPSTREAM_UNAVAILABLE", message: "Keldrin API unreachable; not charged" } }, { status: 502 });
  }
}
