// @ts-nocheck
// Keldrin x402 feasibility probe (Phase 11, 2026-11-27). Deployed once on Bankr x402 Cloud by the founder to answer two
// questions before the real paid endpoint is built:
//   1. Can a Bankr x402 handler call another HTTPS API (Keldrin's own API)?
//   2. Can it read an environment variable / secret set on Bankr?
// It fetches Keldrin's public /health (no secret involved) and reports what it saw. Self-contained, no imports.
// Price is the minimum ($0.001). Remove the service after the test: `bankr x402 pause keldrin-probe`.

const TARGET = "https://keldrin.vercel.app/health";

function envProbe() {
  const out = { process_env: false, bun_env: false, deno_env: false, keldrin_probe_var_set: false };
  try {
    if (typeof process !== "undefined" && process.env) {
      out.process_env = true;
      if (process.env.KELDRIN_PROBE) out.keldrin_probe_var_set = true;
    }
  } catch {}
  try {
    if (typeof Bun !== "undefined" && Bun.env) {
      out.bun_env = true;
      if (Bun.env.KELDRIN_PROBE) out.keldrin_probe_var_set = true;
    }
  } catch {}
  try {
    if (typeof Deno !== "undefined" && Deno.env) {
      out.deno_env = true;
      if (Deno.env.get("KELDRIN_PROBE")) out.keldrin_probe_var_set = true;
    }
  } catch {}
  return out;
}

async function probe() {
  const started = Date.now();
  const result = { probe: "keldrin", version: "0.1.0", target: TARGET, fetch_ok: false, http_status: null, ms: null, assets: null, last_run_outcome: null, error: null, env: envProbe(), checked_at: new Date().toISOString() };
  try {
    const r = await fetch(TARGET, { headers: { accept: "application/json", "user-agent": "keldrin-bankr-probe/0.1" }, signal: AbortSignal.timeout(8000) });
    result.http_status = r.status;
    const j = await r.json();
    result.fetch_ok = r.ok;
    result.assets = j?.data?.assets ?? null;
    result.last_run_outcome = j?.data?.last_run?.outcome ?? null;
  } catch (e) {
    result.error = String(e?.name ?? "error") + ": " + String(e?.message ?? e).slice(0, 200);
  }
  result.ms = Date.now() - started;
  return result;
}

export default async function handler(req: Request): Promise<Response> {
  // Always a 200 with the findings: the point of the probe is to see what happened, including a failed fetch.
  return new Response(JSON.stringify(await probe()), { status: 200, headers: { "content-type": "application/json" } });
}
