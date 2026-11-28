// keldrin status check (Phase 13). Read-only, no secrets, no payments. Run by .github/workflows/status.yml and by
// hand: `node scripts/status-check.mjs`. Exits 1 if anything a user or agent relies on is broken, so GitHub notifies
// the owner. Checks the live site, API freshness, MCP, the agent guide, and that both paid x402 endpoints still ask
// for exactly the documented terms (an unpaid request only reads the 402; nothing is signed).
const SITE = process.env.KELDRIN_SITE || "https://keldrin.vercel.app";
const BANKR = "https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91";
const TERMS = { x402Version: 2, scheme: "exact", network: "eip155:8453", amount: "50000", asset: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", payTo: "0x8aee621035d93deb3c0c1177fac252dc2dd501a0" };
const MAX_RUN_AGE_H = 12; // the research run is every 8 h (GitHub can delay it)
const results = [];
const check = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
  } catch (e) {
    results.push({ name, ok: false, detail: String(e.message ?? e).slice(0, 200) });
  }
};
const get = async (url, init) => {
  const r = await fetch(url, { ...init, signal: AbortSignal.timeout(20000) });
  return { status: r.status, headers: r.headers, text: await r.text() };
};
const must = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

await check("website", async () => {
  const r = await get(SITE + "/");
  must(r.status === 200 && r.text.includes("keldrin, built by SOMEHOW"), `HTTP ${r.status}`);
  return "200";
});
await check("api freshness", async () => {
  const r = await get(SITE + "/health");
  must(r.status === 200, `HTTP ${r.status}`);
  const d = JSON.parse(r.text).data;
  const age = (Date.now() - Date.parse(d.last_run.finished_at)) / 3.6e6;
  must(d.last_run.outcome === "ok", `last run outcome ${d.last_run.outcome}`);
  must(age < MAX_RUN_AGE_H, `last research run ${age.toFixed(1)} h ago`);
  return `last run ${age.toFixed(1)} h ago, ${d.records_confirmed} confirmed records`;
});
await check("mcp", async () => {
  const r = await get(SITE + "/mcp", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) });
  const tools = JSON.parse(r.text).result.tools.map((t) => t.name);
  must(tools.includes("get_snapshot") && tools.includes("get_market_context"), `tools: ${tools.join(",")}`);
  return `${tools.length} tools`;
});
await check("agent guide", async () => {
  const r = await get(SITE + "/skill.md");
  must(r.status === 200 && r.text.includes("50000") && r.text.toLowerCase().includes(TERMS.payTo), `HTTP ${r.status}`);
  return "200";
});
await check("market context (live chain read)", async () => {
  const r = await get(SITE + "/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/market-context");
  must(r.status === 200, `HTTP ${r.status}`);
  const d = JSON.parse(r.text).data;
  must(d.nav !== null, `NAV unavailable: ${d.nav_unavailable_reason}`);
  return `NVDAc NAV ${d.nav.nav}, ${d.staleness.state}`;
});
for (const [name, url] of [["paid snapshot terms", `${BANKR}/keldrin-snapshot`], ["paid report terms", `${BANKR}/keldrin-report`], ["paid snapshot via keldrin.vercel.app", `${SITE}/api/snapshot`]]) {
  await check(name, async () => {
    const r = await get(url);
    must(r.status === 402, `expected 402, got HTTP ${r.status}`);
    const raw = r.headers.get("payment-required");
    const req = raw ? JSON.parse(Buffer.from(raw, "base64").toString("utf8")) : JSON.parse(r.text);
    const a = req.accepts?.[0] ?? {};
    must(req.x402Version === TERMS.x402Version, `x402Version ${req.x402Version}`);
    for (const k of ["scheme", "network", "amount"]) must(String(a[k]) === TERMS[k], `${k} ${a[k]}`);
    for (const k of ["asset", "payTo"]) must(String(a[k]).toLowerCase() === TERMS[k], `${k} ${a[k]}`);
    must(Number(a.maxTimeoutSeconds) > 0 && Number(a.maxTimeoutSeconds) <= 60, `maxTimeoutSeconds ${a.maxTimeoutSeconds}`);
    return `402 · $0.05 USDC · payTo Bankr router`;
  });
}
const bad = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? "ok  " : "FAIL"} ${r.name}: ${r.detail}`);
console.log(bad.length ? `\n${bad.length} check(s) failed` : `\nall ${results.length} checks passed`);
process.exit(bad.length ? 1 : 0);
