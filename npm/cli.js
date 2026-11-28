#!/usr/bin/env node

// src/npm/cli.ts
var VERSION = "0.7.1";
var argv = process.argv.slice(2);
var flags = new Map(argv.filter((a) => a.startsWith("--")).map((a) => {
  const [k, ...v] = a.slice(2).split("=");
  return [k, v.length ? v.join("=") : "true"];
}));
var pos = argv.filter((a) => !a.startsWith("--"));
var API = (flags.get("api") ?? process.env.KELDRIN_API ?? "https://keldrin.vercel.app").replace(/\/+$/, "");
var RPC = flags.get("rpc") ?? process.env.BASE_RPC_URL ?? "https://mainnet.base.org";
var JSON_OUT = flags.has("json");
var ADDR = /^0x[0-9a-fA-F]{40}$/;
var CliError = class extends Error {
};
async function api(path) {
  let r;
  try {
    r = await fetch(API + path, { headers: { accept: "application/json", "user-agent": "keldrin-cli/" + VERSION }, signal: AbortSignal.timeout(2e4) });
  } catch (e) {
    throw new CliError(`cannot reach ${API} (${e.message})`);
  }
  const body = await r.json().catch(() => null);
  if (!r.ok) throw new CliError((body?.error ? `${body.error.code}: ${body.error.message}${body.error.hint ? " \u2192 " + body.error.hint : ""}` : `HTTP ${r.status}`) + (body?.pay ? `
  pay per call (${body.pay.price}, x402): ${path.startsWith("/v1/report") ? body.pay.report : body.pay.snapshot}
  keldrin never pays by itself.` : ""));
  return body;
}
async function rpc(method, params) {
  const r = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }), signal: AbortSignal.timeout(2e4) });
  const j = await r.json();
  if (j.error) throw new CliError(`rpc ${method}: ${j.error.message}`);
  return j.result;
}
async function resolve(token) {
  if (!token) throw new CliError("a token is required (contract address or exact symbol, e.g. NVDAc)");
  if (ADDR.test(token)) return token;
  const list = (await api("/v1/assets")).data;
  const m = list.filter((a) => a.symbol === token);
  if (m.length !== 1) throw new CliError(m.length ? `${m.length} tokens use symbol ${token}; pass the address` : `no token with exact symbol ${token} (try: keldrin assets ${token.slice(0, 4)})`);
  return m[0].contract_address;
}
var out = (human, json) => console.log(JSON_OUT ? JSON.stringify(json, null, 1) : human);
var word = (hex, i) => BigInt("0x" + hex.slice(2 + i * 64, 2 + (i + 1) * 64));
var int256 = (u) => u >= 1n << 255n ? u - (1n << 256n) : u;
var commands = {
  async assets() {
    const q = (pos[1] ?? "").toLowerCase();
    const rows = (await api("/v1/assets")).data.filter((a) => !q || a.symbol.toLowerCase().includes(q) || (a.name ?? "").toLowerCase().includes(q));
    out(rows.map((a) => `${a.symbol.padEnd(8)} ${a.contract_address}  multiplier ${a.multiplier_wad}`).join("\n") || "no match", rows);
    return 0;
  },
  async actions() {
    const b = await api(`/v1/assets/${await resolve(pos[1])}/corporate-actions`);
    out(`${b.meta.symbol}: ${b.meta.count} corporate action(s); current multiplier ${b.meta.current_multiplier_wad}
` + b.data.map((e) => `  ${e.status.padEnd(17)} ${e.event_type.padEnd(8)} ${(e.adjusted_at ?? e.expected_adjustment_date ?? "?").slice(0, 10)}  per share ${e.per_share ?? "?"}  \u0394 ${e.multiplier_delta ?? "?"}  ${e.evidence?.onchain_tx ?? e.sec_filing_url ?? ""}`).join("\n"), b);
    return 0;
  },
  async nav() {
    const q = new URLSearchParams();
    for (const k of ["from", "to", "interval", "limit"]) if (flags.has(k)) q.set(k, flags.get(k));
    const b = await api(`/v1/assets/${await resolve(pos[1])}/nav/history?${q}`);
    out(`${b.meta.symbol} ${b.meta.interval} NAV (${b.meta.feed}), verification ${b.meta.quality.verification.verdict}
` + b.data.map((p) => `  ${(p.session_day ?? p.updated_at).padEnd(20)} ${p.nav.padStart(14)}  round ${p.round_id}${p.provisional ? "  (provisional)" : ""}`).join("\n") + (b.meta.quality.missing_trading_days?.length ? `
  missing trading days: ${b.meta.quality.missing_trading_days.join(", ")}` : ""), b);
    return 0;
  },
  async context() {
    const d = (await api(`/v1/assets/${await resolve(pos[1])}/market-context`)).data;
    const nav = d.nav ? `NAV ${d.nav.nav} (round ${d.nav.round_id}, ${Math.round(d.nav.age_s / 60)} min old) \u2192 ${d.staleness.state}` : `NAV unavailable (${d.nav_unavailable_reason})`;
    const gap = typeof d.dex?.nav_premium_pct === "number" ? `${d.dex.nav_premium_pct >= 0 ? "+" : ""}${d.dex.nav_premium_pct}% vs NAV` : `gap vs NAV withheld (${d.dex?.premium_unavailable_reason ?? "unavailable"})`;
    const dex = d.dex?.price_usd ? `DEX ${d.dex.price_usd} on ${d.dex.venue} \u2192 ${gap}` : `DEX unavailable (${d.dex?.unavailable_reason})`;
    out(`${d.symbol}: market ${d.market.session}, next open ${d.market.next_open ?? "?"}
  ${nav}
  ${dex}
  The NAV is the last published reference, not a live equity price.`, d);
    return 0;
  },
  async dex() {
    const d = (await api(`/v1/assets/${await resolve(pos[1])}/dex`)).data;
    out(d.main ? `${d.symbol}: $${d.main.price_usd} on ${d.main.venue} (${d.main.quote}), est. 2% depth $${Math.round(d.main.depth_2pct_usd)}${d.main.thin_market ? " (thin)" : ""}, block ${d.block}
` + d.pools.map((p) => `  ${p.status.padEnd(10)} ${p.venue.padEnd(13)} ${p.quote.padEnd(4)} ${String(p.price_usd ?? "-").padStart(14)}  depth ${p.depth_2pct_usd === null ? "-" : "$" + Math.round(p.depth_2pct_usd)}  ${p.pool}`).join("\n") : `${d.symbol}: no usable DEX price (${d.unavailable_reason})`, d);
    return 0;
  },
  async snapshot() {
    const b = await api("/v1/snapshot");
    const d = b.data;
    out(`market ${d.market.session} \xB7 ${d.count} verified stocks \xB7 ${b.meta.free_tries_left_today} free tries left today
` + d.stocks.map((s) => `  ${s.symbol.padEnd(7)} NAV ${s.nav ? String(s.nav.nav).padStart(12) : "unknown".padStart(12)}  ${String(s.staleness?.state ?? "").padEnd(18)} DEX ${s.dex?.price_usd ? String(Number(s.dex.price_usd).toFixed(2)).padStart(9) : "     none"}  ${typeof s.dex?.nav_premium_pct === "number" ? (s.dex.nav_premium_pct >= 0 ? "+" : "") + s.dex.nav_premium_pct + "%" : ""}  ${s.next_corporate_action ? "next " + s.next_corporate_action.event_type + " " + (s.next_corporate_action.expected_adjustment_date ?? "") : ""}`).join("\n"), b);
    return 0;
  },
  async report() {
    if (!pos[1]) throw new CliError("a token is required (contract address or exact symbol, e.g. NVDAc)");
    const b = await api(`/v1/report?token=${encodeURIComponent(pos[1])}`);
    const d = b.data;
    const c = d.market_context;
    out(`${d.symbol} (${d.token}) \xB7 ${b.meta.free_tries_left_today} free tries left today
  corporate actions: ${d.corporate_actions.length}
  NAV: ${c?.nav ? c.nav.nav + " (round " + c.nav.round_id + ", " + c.staleness.state + ")" : "unknown (" + (c?.nav_unavailable_reason ?? d.nav_unavailable_reason ?? "") + ")"}
  DEX: ${c?.dex?.price_usd ? c.dex.price_usd + " on " + c.dex.venue : "none"}
  daily NAV closes (30 d): ${d.nav_daily_30d ? d.nav_daily_30d.meta.count : "none"} \xB7 DEX pools: ${d.dex_pools?.pools_total ?? 0}`, b);
    return 0;
  },
  async session() {
    const m = (await api("/v1/market/session")).data;
    out(`US market: ${m.session} (${m.ny_date} ${m.ny_time} New York); next open ${m.next_open ?? "?"}, next close ${m.next_close ?? "?"}`, m);
    return 0;
  },
  async "verify-nav"() {
    const n = Math.min(Math.max(Number(flags.get("n") ?? 20), 1), 200);
    const b = await api(`/v1/assets/${await resolve(pos[1])}/nav/history?interval=round&from=2026-01-01&limit=1000`);
    const pts = b.data;
    const pick = pts.filter((_, i) => i % Math.max(1, Math.floor(pts.length / n)) === 0).slice(0, n);
    let bad = 0;
    for (const p of pick) {
      const r = await rpc("eth_call", [{ to: b.meta.feed, data: "0x9a6fc8f5" + BigInt(p.round_id).toString(16).padStart(64, "0") }, "latest"]);
      const same = word(r, 0) === BigInt(p.round_id) && int256(word(r, 1)) === BigInt(p.answer_raw) && Number(word(r, 3)) === Date.parse(p.updated_at) / 1e3;
      if (!same) bad++;
      if (!JSON_OUT) console.log(`  ${same ? "match   " : "MISMATCH"} round ${p.round_id} answer ${p.answer_raw} updated ${p.updated_at}`);
    }
    out(`${b.meta.symbol}: ${pick.length - bad}/${pick.length} served NAV rounds match getRoundData on ${b.meta.feed} via ${new URL(RPC).host}`, { symbol: b.meta.symbol, feed: b.meta.feed, checked: pick.length, mismatches: bad, rpc: new URL(RPC).host });
    return bad ? 1 : 0;
  },
  async "verify-dex"() {
    const d = (await api(`/v1/assets/${await resolve(pos[1])}/dex`)).data;
    if (!d.main) throw new CliError(`no main pool to verify (${d.unavailable_reason})`);
    if (d.main.venue === "aerodrome_v2" || d.main.venue === "uniswap_v4") {
      out(`${d.symbol}: main pool is ${d.main.venue}; verify-dex re-reads Uniswap v3 / Slipstream slot0 only for now`, { skipped: true });
      return 0;
    }
    const s0 = await rpc("eth_call", [{ to: d.main.pool, data: "0x3850c7bd" }, "0x" + BigInt(d.block).toString(16)]);
    const t0 = "0x" + (await rpc("eth_call", [{ to: d.main.pool, data: "0x0dfe1681" }, "latest"])).slice(-40);
    const dec = Number(BigInt(await rpc("eth_call", [{ to: d.token, data: "0x313ce567" }, "latest"])));
    const sq = word(s0, 0);
    const decQ = d.main.quote === "USDC" ? 6 : 18;
    const raw = Number(sq * sq) / 2 ** 192;
    const stock0 = t0.toLowerCase() === d.token.toLowerCase();
    const priceQuote = (stock0 ? raw : 1 / raw) * 10 ** (dec - decQ);
    const rel = Math.abs(priceQuote / Number(d.main.price_quote) - 1);
    out(`${d.symbol}: pool ${d.main.pool} at block ${d.block}: onchain ${priceQuote.toPrecision(10)} ${d.main.quote} vs served ${d.main.price_quote} \u2192 ${rel < 1e-9 ? "match" : `MISMATCH (${(rel * 100).toFixed(6)}%)`}`, { pool: d.main.pool, block: d.block, onchain: priceQuote, served: d.main.price_quote, relative_difference: rel });
    return rel < 1e-9 ? 0 : 1;
  },
  async mcp() {
    let buf = "";
    process.stdout.on("error", () => process.exit(0));
    for await (const chunk of process.stdin) {
      buf += chunk.toString();
      let nl;
      while ((nl = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        let id = null;
        try {
          id = JSON.parse(line).id ?? null;
          const r = await fetch(API + "/mcp", { method: "POST", headers: { "content-type": "application/json", "user-agent": "keldrin-cli/" + VERSION }, body: line, signal: AbortSignal.timeout(3e4) });
          if (r.status === 202) continue;
          process.stdout.write((await r.text()).trim() + "\n");
        } catch (e) {
          if (id !== null) process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, error: { code: -32603, message: "Keldrin unreachable: " + e.message } }) + "\n");
        }
      }
    }
    return 0;
  }
};
async function main() {
  const cmd = pos[0];
  if (flags.has("version")) {
    console.log(VERSION);
    return 0;
  }
  if (!cmd || flags.has("help") || cmd === "help") {
    console.log(`keldrin ${VERSION}: verified record for Coinbase tokenized stocks on Base

  keldrin assets [query]
  keldrin actions <token>
  keldrin nav <token> [--from=YYYY-MM-DD] [--to=YYYY-MM-DD] [--interval=daily|round]
  keldrin context <token>
  keldrin dex <token>
  keldrin session
  keldrin snapshot
  keldrin report <token>
  keldrin verify-nav <token> [--n=20]
  keldrin verify-dex <token>
  keldrin mcp

  --json  --api=<url>  --rpc=<url>
  Facts with provenance, not advice.`);
    return 0;
  }
  const f = commands[cmd];
  if (!f) throw new CliError(`unknown command ${cmd} (keldrin help)`);
  return f();
}
main().then((code) => process.exit(code), (e) => {
  console.error(e instanceof CliError ? "error: " + e.message : "error: " + (e.stack ?? e));
  process.exit(2);
});
