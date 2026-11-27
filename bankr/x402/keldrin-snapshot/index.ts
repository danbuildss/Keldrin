// Keldrin snapshot 1.0.0 (x402 on Bankr). All tokenized stocks with a verified Chainlink NAV feed on Base in one call.
// Forwards to Keldrin's API with the key from the KELDRIN_API_KEY env var. Bankr charges only on a 2xx.
export default async function handler(req: Request): Promise<Response> {
  const key = process.env.KELDRIN_API_KEY;
  if (!key) return Response.json({ error: { code: "NOT_CONFIGURED", message: "endpoint key missing" } }, { status: 503 });
  try {
    const r = await fetch("https://keldrin.vercel.app/v1/paid/snapshot", { headers: { authorization: `Bearer ${key}`, accept: "application/json" }, signal: AbortSignal.timeout(14000) });
    return new Response(await r.text(), { status: r.status, headers: { "content-type": "application/json" } });
  } catch {
    return Response.json({ error: { code: "UPSTREAM_UNAVAILABLE", message: "Keldrin API unreachable; not charged" } }, { status: 502 });
  }
}
