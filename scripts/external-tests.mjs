// keldrin external tests (Phase 13). Calls every publicly advertised route on production from outside the
// development environment and records the HTTP status, time and a short result. No payments are made: paid x402
// endpoints are only asked for their 402 terms. Usage: node scripts/external-tests.mjs > report.md
const SITE = process.env.KELDRIN_SITE || "https://keldrin.vercel.app";
const NV = "0xb20000000000000000000078ee7ce2fE4908108C";
const AEO = "0xB2000000000000000000006064f8EC027f042294";
const rows = [];
async function t(name, path, check, init) {
  const t0 = performance.now();
  let status = 0, ok = false, note = "";
  try {
    const r = await fetch(path.startsWith("http") ? path : SITE + path, { ...init, signal: AbortSignal.timeout(30000) });
    status = r.status;
    const text = await r.text();
    let body; try { body = JSON.parse(text); } catch { body = text; }
    [ok, note] = check(r, body);
  } catch (e) {
    note = "error: " + String(e.message ?? e).slice(0, 120);
  }
  rows.push({ name, path, status, ms: Math.round(performance.now() - t0), ok, note });
}
const j = (o) => JSON.stringify(o);
const mcp = (body) => ({ method: "POST", headers: { "content-type": "application/json" }, body: j(body) });

await t("website", "/", (r, b) => [r.status === 200 && /keldrin, built by (<a [^>]*>)?SOMEHOW/.test(String(b)), r.headers.get("content-security-policy") ? "CSP set" : "no CSP"]);
await t("agent guide", "/skill.md", (r, b) => [r.status === 200 && String(b).includes("50000"), r.headers.get("content-type")]);
await t("agent guide (upper case)", "/SKILL.md", (r) => [r.status === 200, ""]);
await t("developer quick start", "/start.md", (r, b) => [r.status === 200 && String(b).includes("0x04689a41629776563E6822F76f2e57D148d28513"), ""]);
await t("llms.txt", "/llms.txt", (r, b) => [r.status === 200 && String(b).includes("/skill.md"), ""]);
await t("openapi.json", "/openapi.json", (r, b) => [r.status === 200 && b.info?.version === "0.7.1" && !!b.paths?.["/api/snapshot"], `v${b.info?.version}`]);
await t("API index", "/v1", (r, b) => [r.status === 200, ""]);
await t("health", "/health", (r, b) => [r.status === 200 && b.data?.last_run?.outcome === "ok", `assets ${b.data?.assets}, last run ${b.data?.last_run?.finished_at}`]);
await t("assets", "/v1/assets", (r, b) => [r.status === 200 && b.data?.length > 400, `${b.data?.length} tokens`]);
await t("events", "/v1/events", (r, b) => [r.status === 200 && Array.isArray(b.data), `${b.data?.length} events`]);
await t("calendar", "/v1/calendar", (r, b) => [r.status === 200, ""]);
await t("market session", "/v1/market/session", (r, b) => [r.status === 200 && !!b.data?.session, b.data?.session]);
await t("corporate actions NVDAc", `/v1/assets/${NV}/corporate-actions`, (r, b) => [r.status === 200 && b.data?.length >= 1, b.data?.map((e) => e.status).join(",")]);
await t("NAV history daily NVDAc", `/v1/assets/${NV}/nav/history?interval=daily&from=2026-01-01`, (r, b) => [r.status === 200 && (b.meta?.quality?.missing_trading_days ?? []).length === 0, `${b.meta?.count} closes, before_coverage ${b.meta?.quality?.before_coverage?.trading_days ?? 0}, verdict ${b.meta?.quality?.verification?.verdict}`]);
await t("NAV history rounds NVDAc", `/v1/assets/${NV}/nav/history?interval=round&limit=3`, (r, b) => [r.status === 200 && !!b.data?.[0]?.round_id, `round ${b.data?.[0]?.round_id}`]);
await t("NAV history, token without feed", `/v1/assets/${AEO}/nav/history`, (r, b) => [r.status === 404 && b.error?.code === "NO_NAV_FEED", b.error?.code]);
await t("market context NVDAc", `/v1/assets/${NV}/market-context`, (r, b) => [r.status === 200 && b.data?.nav !== undefined, `NAV ${b.data?.nav?.nav} ${b.data?.staleness?.state}; DEX ${b.data?.dex?.price_usd}`]);
await t("DEX NVDAc", `/v1/assets/${NV}/dex`, (r, b) => [r.status === 200 && !!b.data?.main, `$${b.data?.main?.price_usd} block ${b.data?.block}`]);
await t("bad address", "/v1/assets/0x123/dex", (r, b) => [r.status === 400 && b.error?.code === "BAD_ADDRESS", b.error?.code]);
await t("free report NVDAc (uses 1 free try)", "/v1/report?token=NVDAc", (r, b) => [r.status === 200 || r.status === 402, r.status === 200 ? `tries left ${b.meta?.free_tries_left_today}` : b.error?.code]);
await t("free report unknown token", "/v1/report?token=ZZZc", (r, b) => [r.status === 404 || r.status === 402, b.error?.code]);
await t("MCP tools/list", "/mcp", (r, b) => [r.status === 200 && b.result?.tools?.length === 10, `${b.result?.tools?.length} tools`], mcp({ jsonrpc: "2.0", id: 1, method: "tools/list" }));
await t("MCP get_market_context", "/mcp", (r, b) => [r.status === 200 && b.result?.isError === false, b.result?.content?.[0]?.text?.slice(0, 90)], mcp({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "get_market_context", arguments: { token: "NVDAc" } } }));
await t("MCP get_nav_history", "/mcp", (r, b) => [r.status === 200 && b.result?.isError === false, b.result?.content?.[0]?.text?.slice(0, 90)], mcp({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_nav_history", arguments: { token: "NVDAc", from: "2026-11-20" } } }));
await t("feedback rejects bad input", "/v1/feedback", (r, b) => [r.status === 400 && b.error?.code === "BAD_EMAIL", b.error?.code], { method: "POST", headers: { "content-type": "application/json" }, body: j({ email: "nope" }) });
await t("feedback cannot be read (GET)", "/v1/feedback", (r, b) => [r.status === 404 || r.status === 405, `${r.status} ${b.error?.code ?? ""}`]);
await t("other writes refused", "/v1/events", (r, b) => [r.status === 405, b.error?.code], { method: "POST" });
for (const [name, url] of [["paid snapshot (x402, unpaid)", "/api/snapshot"], ["paid report (x402, unpaid)", "/api/report?token=NVDAc"], ["paid snapshot on Bankr (unpaid)", "https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/keldrin-snapshot"]]) {
  await t(name, url, (r) => {
    const raw = r.headers.get("payment-required");
    const a = raw ? JSON.parse(Buffer.from(raw, "base64").toString("utf8")).accepts?.[0] : null;
    return [r.status === 402 && a?.amount === "50000" && a?.payTo?.toLowerCase() === "0x8aee621035d93deb3c0c1177fac252dc2dd501a0", a ? `402 ${a.amount} ${a.network} payTo ${a.payTo.slice(0, 8)}… timeout ${a.maxTimeoutSeconds}s` : "no terms"];
  });
}
const pass = rows.filter((r) => r.ok).length;
console.log(`# keldrin external tests\n\nRun ${new Date().toISOString()} against ${SITE}. No payments made.\n\n${pass}/${rows.length} passed.\n`);
console.log("| Test | Request | HTTP | ms | Result | Note |\n|---|---|---|---|---|---|");
for (const r of rows) console.log(`| ${r.name} | \`${r.path.replace(/\|/g, "%7C")}\` | ${r.status} | ${r.ms} | ${r.ok ? "pass" : "**FAIL**"} | ${String(r.note ?? "").replace(/\|/g, "/")} |`);
