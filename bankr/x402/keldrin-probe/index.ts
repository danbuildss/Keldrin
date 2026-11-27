// Keldrin probe 0.1.0: tests that this Bankr endpoint can reach Keldrin's API and read an env var.
export default async function handler(req: Request): Promise<Response> {
  const t = Date.now();
  const out: Record<string, unknown> = { probe: "keldrin", version: "0.1.0", env_var_set: Boolean(process.env.KELDRIN_PROBE) };
  try {
    const r = await fetch("https://keldrin.vercel.app/health", { signal: AbortSignal.timeout(8000) });
    const j: any = await r.json();
    out.http_status = r.status;
    out.assets = j?.data?.assets ?? null;
    out.last_run_outcome = j?.data?.last_run?.outcome ?? null;
  } catch (e) {
    out.error = String(e).slice(0, 200);
  }
  out.ms = Date.now() - t;
  return Response.json(out);
}
