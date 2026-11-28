import type { PGlite } from "@electric-sql/pglite";
import { assetCorporateActions } from "./assetActions.ts";
import { navHistory } from "./nav.ts";
import { assetRisk } from "./risk.ts";
import { coverageMap } from "./coverage.ts";
import { marketContext } from "./marketContext.ts";
import { liveDex } from "./dex.ts";
import { marketNow } from "../lib/marketSession.ts";
import { PACKAGE_VERSION } from "../version.ts";
import { PAID, report, snapshot, triesLeft, trialUnavailable, trialUsedUp, useTry } from "./trial.ts";

// Remote MCP server (Phase 9): Streamable HTTP, stateless, JSON responses (no SSE). POST /mcp with one JSON-RPC
// message. Read-only tools that call the same functions as the REST API, so an agent gets exactly what the API
// serves (verified data only, the same fail-closed rules and the same NAV switch). No sessions, no state.

export const PROTOCOL_VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const tokenArg = { type: "string", description: "Token contract address (0x…) or exact Coinbase symbol, e.g. NVDAc. Addresses are preferred." };
const ro = { readOnlyHint: true, idempotentHint: true, openWorldHint: false };

export const TOOLS = [
  { name: "list_assets", title: "List tokenized stocks", description: "Coinbase tokenized stocks on Base that keldrin tracks: symbol, contract address, current multiplier (WAD) and whether a verified Chainlink NAV feed exists. Optional `query` filters by symbol or name.", inputSchema: { type: "object", properties: { query: { type: "string", description: "Optional case-insensitive filter on symbol or name" }, with_nav_only: { type: "boolean", description: "Only tokens with an indexed Chainlink NAV feed" } }, additionalProperties: false }, annotations: ro },
  { name: "get_corporate_actions", title: "Corporate actions for a token", description: "Verified dividends, splits and multiplier changes for one token, applied and upcoming: multiplier before/after (WAD), effective time, SEC filing, onchain tx and evidence links. Balances never change; the multiplier does.", inputSchema: { type: "object", properties: { token: tokenArg }, required: ["token"], additionalProperties: false }, annotations: ro },
  { name: "get_nav_history", title: "Chainlink NAV history with proof", description: "Official Chainlink total-return NAV history for one token, each point with feed, phase, aggregator and round id (re-readable with getRoundData). interval=daily gives the last official in-session round per NYSE trading day; interval=round gives every official round. Missing days are listed, never filled. The NAV already includes dividends and splits.", inputSchema: { type: "object", properties: { token: tokenArg, interval: { type: "string", enum: ["daily", "round"], default: "daily" }, from: { type: "string", description: "YYYY-MM-DD" }, to: { type: "string", description: "YYYY-MM-DD" }, limit: { type: "integer", minimum: 1, maximum: 1000, description: "round interval only" } }, required: ["token"], additionalProperties: false }, annotations: ro },
  { name: "get_risk", title: "NAV-based risk for a token", description: "Volatility (30- and 60-day, annualized), max drawdown (since the first official close and over the last 90 closes, with peak and trough round ids) and 1/5/20-day returns, computed from official Chainlink total-return NAV daily closes. Facts from history, not a forecast or advice.", inputSchema: { type: "object", properties: { token: tokenArg }, required: ["token"], additionalProperties: false }, annotations: ro },
  { name: "get_market_context", title: "Market context for a token", description: "US session now (open/pre/after/closed/weekend/holiday), next open/close, the latest Chainlink NAV read live with round id and age, staleness (fresh / expected_closed / unexpectedly_stale), and the main DEX price with its gap vs NAV. The NAV is the last published reference, not a live equity price.", inputSchema: { type: "object", properties: { token: tokenArg }, required: ["token"], additionalProperties: false }, annotations: { ...ro, idempotentHint: false } },
  { name: "get_dex_price", title: "Live DEX price on Base", description: "Live DEX price of one token read onchain at one block from keldrin's verified pools (Uniswap v3, Aerodrome, Slipstream, plain Uniswap v4 vs USDC/WETH/ETH): price per token in USD, estimated 2% depth, the main (deepest usable) pool and every pool's status.", inputSchema: { type: "object", properties: { token: tokenArg }, required: ["token"], additionalProperties: false }, annotations: { ...ro, idempotentHint: false } },
  { name: "get_snapshot", title: "All verified stocks in one answer", description: "Every Coinbase tokenized stock on Base with a verified Chainlink NAV feed: latest NAV with round id, freshness, main DEX price with gap vs NAV, next corporate action, plus the US session. Uses the caller's 3 free snapshots/reports per day; after that it returns the paid x402 link ($0.05 USDC on Base) and never pays by itself.", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { ...ro, idempotentHint: false } },
  { name: "get_report", title: "Everything on one stock", description: "Corporate actions with evidence, market context (live NAV, freshness, DEX gap), 30 daily NAV closes with round ids and every verified DEX pool, for one token. Uses the caller's 3 free snapshots/reports per day; after that it returns the paid x402 link and never pays by itself.", inputSchema: { type: "object", properties: { token: tokenArg }, required: ["token"], additionalProperties: false }, annotations: { ...ro, idempotentHint: false } },
  { name: "get_market_session", title: "US equity session now", description: "Whether the US stock market is open right now, with next open/close and last close (NYSE calendar 2026-2027; beyond it: calendar_not_covered).", inputSchema: { type: "object", properties: {}, additionalProperties: false }, annotations: { ...ro, idempotentHint: false } },
];

type Msg = { jsonrpc?: string; id?: string | number | null; method?: string; params?: any };
type Out = { status: number; body: unknown };
const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const ADDR = /^0x[0-9a-fA-F]{40}$/;

async function resolveToken(db: PGlite, token: unknown): Promise<string> {
  if (typeof token !== "string" || !token.trim()) throw new ToolError("token is required (contract address or exact symbol)");
  const t = token.trim();
  if (ADDR.test(t)) return t;
  const m = (await db.query<{ contract_address: string }>("SELECT contract_address FROM assets WHERE symbol = $1", [t])).rows;
  if (m.length === 0) throw new ToolError(`no token with exact symbol ${t.slice(0, 40)}; use list_assets or a contract address`);
  if (m.length > 1) throw new ToolError(`${m.length} tokens use symbol ${t.slice(0, 40)}; pass the contract address`);
  return m[0].contract_address;
}
class ToolError extends Error {}

/** Turn an internal API result into an MCP tool result: one plain lead sentence + the JSON, or isError on non-200. */
function toolResult(out: Out, lead: (data: any) => string) {
  const body = out.body as any;
  if (out.status !== 200) {
    const e = body?.error ?? { code: "ERROR", message: "request failed" };
    return { content: [{ type: "text", text: `${e.code}: ${e.message}${e.hint ? " → " + e.hint : ""}` }], isError: true };
  }
  return { content: [{ type: "text", text: lead(body) }, { type: "text", text: JSON.stringify(body) }], structuredContent: body, isError: false };
}

async function callTool(db: PGlite, name: unknown, args: Record<string, unknown>, client: string) {
  const navOn = process.env.NAV_HISTORY_PUBLIC === "true";
  const navOff = { status: 503, body: { error: { code: "NAV_NOT_ENABLED", message: "NAV data is not publicly enabled on this server" } } };
  try {
    switch (name) {
      case "list_assets": {
        const q = typeof args.query === "string" ? args.query.trim().toLowerCase() : "";
        const cov = await coverageMap(db);
        const rows = (await db.query<{ symbol: string; contract_address: string; name: string; multiplier_wad: string; has_nav: boolean }>(
          "SELECT a.symbol, a.contract_address, a.name, a.multiplier_wad::text AS multiplier_wad, EXISTS (SELECT 1 FROM nav_feeds f WHERE lower(f.token_address)=lower(a.contract_address)) AS has_nav FROM assets a ORDER BY a.symbol",
        )).rows.filter((r) => (!q || r.symbol.toLowerCase().includes(q) || (r.name ?? "").toLowerCase().includes(q)) && (!args.with_nav_only || r.has_nav));
        const body = { data: rows.slice(0, 200).map((r) => ({ ...r, coverage_level: cov ? (cov.get(r.contract_address.toLowerCase())?.coverage_level ?? "unknown") : "unknown" })), meta: { count: rows.length, shown: Math.min(rows.length, 200) } };
        return toolResult({ status: 200, body }, () => `${rows.length} tracked token(s)${q ? ` matching "${q}"` : ""}; ${rows.filter((r) => r.has_nav).length} with an indexed Chainlink NAV feed.`);
      }
      case "get_corporate_actions": {
        const out = await assetCorporateActions(db, await resolveToken(db, args.token));
        return toolResult(out, (b) => `${b.meta.symbol}: ${b.meta.count} corporate action(s); next: ${(b.data.find((e: any) => e.status === "predicted")?.expected_adjustment_date ?? "none announced")}. Shares per token = multiplier / 1e18.`);
      }
      case "get_nav_history": {
        if (!navOn) return toolResult(navOff, () => "");
        const q = new URLSearchParams();
        for (const k of ["interval", "from", "to"]) if (typeof args[k] === "string") q.set(k, args[k] as string);
        if (typeof args.limit === "number") q.set("limit", String(args.limit));
        const out = await navHistory(db, await resolveToken(db, args.token), q);
        return toolResult(out, (b) => `${b.meta.symbol}: ${b.meta.count} ${b.meta.interval} NAV point(s) ${b.meta.from}..${b.meta.to}; verification ${b.meta.quality.verification.verdict}; missing trading days: ${(b.meta.quality.missing_trading_days ?? []).length}. Total-return NAV: do not apply the multiplier again.`);
      }
      case "get_risk": {
        if (!navOn) return toolResult(navOff, () => "");
        const out = await assetRisk(db, await resolveToken(db, args.token));
        return toolResult(out, (b) => `${b.data.symbol}: 30-day volatility ${b.data.volatility_30d_annualized.value_pct ?? "n/a"}% (annualized), max drawdown since start ${b.data.max_drawdown_since_start.value_pct ?? "n/a"}%, from ${b.data.closes_used} official closes to ${b.data.as_of_close}. NAV-based, not advice.`);
      }
      case "get_market_context": {
        if (!navOn) return toolResult(navOff, () => "");
        const out = await marketContext(db, await resolveToken(db, args.token));
        return toolResult(out, (b) => {
          const d = b.data;
          const nav = d.nav ? `last NAV $${d.nav.nav} (${Math.round(d.nav.age_s / 60)} min old, ${d.staleness.state})` : `NAV unavailable (${d.nav_unavailable_reason})`;
          const gap = typeof d.dex?.nav_premium_pct === "number" ? `${d.dex.nav_premium_pct >= 0 ? "+" : ""}${d.dex.nav_premium_pct}% vs NAV` : `gap vs NAV withheld: ${d.dex?.premium_unavailable_reason ?? "unavailable"}`;
          const dex = d.dex?.price_usd ? `; DEX $${Number(d.dex.price_usd).toFixed(2)} (${gap})` : "";
          return `${d.symbol}: market ${d.market.session}; ${nav}${dex}. The NAV is the last published reference, not a live equity price.`;
        });
      }
      case "get_dex_price": {
        const out = await liveDex(db, await resolveToken(db, args.token));
        return toolResult(out, (b) => {
          const d = b.data;
          return d.main ? `${d.symbol}: $${Number(d.main.price_usd).toFixed(2)} on ${d.main.venue} (${d.main.quote}), est. 2% depth $${Math.round(d.main.depth_2pct_usd)}${d.main.thin_market ? " (thin market)" : ""}, block ${d.block}.` : `${d.symbol}: no usable DEX price (${d.unavailable_reason}).`;
        });
      }
      case "get_snapshot":
      case "get_report": {
        const before = await triesLeft(db as never, client);
        if (before === -1) return { content: [{ type: "text", text: `FREE_TRIES_UNAVAILABLE: free tries can't be counted right now, so none are given. Paid (${PAID.price}, x402, ask the user first): ${name === "get_snapshot" ? PAID.snapshot : PAID.report}` }], structuredContent: trialUnavailable().body, isError: true };
        if (before === 0) {
          const used = trialUsedUp();
          return { content: [{ type: "text", text: `FREE_TRIES_USED: today's 3 free snapshots/reports are used. Each further answer is ${PAID.price} via x402: ${name === "get_snapshot" ? PAID.snapshot : PAID.report}${name === "get_report" ? "?token=<token>" : ""}. Ask the user before paying; never pay automatically.` }], structuredContent: used.body, isError: true };
        }
        const out = name === "get_snapshot" ? await snapshot(db) : await report(db, typeof args.token === "string" ? args.token : "");
        if (out.status !== 200) return toolResult(out, () => "");
        const left = await useTry(db as never, client);
        const body = out.body as { data: any; meta?: Record<string, unknown> };
        const withMeta = { ...body, meta: { ...(body.meta ?? {}), free_tries_left_today: left, paid: PAID } };
        return toolResult({ status: 200, body: withMeta }, (b) => name === "get_snapshot" ? `${b.data.count} verified stocks; market ${b.data.market.session}. ${left} free snapshot/report tries left today.` : `${b.data.symbol}: ${b.data.corporate_actions.length} corporate action(s), ${b.data.nav_daily_30d ? b.data.nav_daily_30d.meta.count + " daily NAV closes" : "no NAV feed"}, ${b.data.dex_pools?.pools_total ?? 0} DEX pools. ${left} free tries left today.`);
      }
      case "get_market_session": {
        const m = marketNow(Math.floor(Date.now() / 1000));
        return toolResult({ status: 200, body: { data: m } }, () => `US market: ${m.session} (${m.ny_date} ${m.ny_time} New York); next open ${m.next_open ?? "unknown"}.`);
      }
      default:
        throw Object.assign(new Error(`Unknown tool: ${String(name).slice(0, 80)}`), { rpc: -32602 });
    }
  } catch (e) {
    if (e instanceof ToolError) return { content: [{ type: "text", text: e.message }], isError: true };
    throw e;
  }
}

/** Handle one JSON-RPC message. Returns { status, body } where body null means "no response" (notification → 202). */
export async function handleMcp(db: PGlite, raw: unknown, client = "mcp"): Promise<Out> {
  if (!isObj(raw)) return { status: 400, body: { jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request: one JSON-RPC object per POST (batches are not supported)" } } };
  const msg = raw as Msg;
  const isRequest = msg.id !== undefined && msg.id !== null;
  const reply = (result: unknown) => ({ status: 200, body: { jsonrpc: "2.0", id: msg.id, result } });
  const error = (code: number, message: string) => ({ status: 200, body: { jsonrpc: "2.0", id: msg.id ?? null, error: { code, message } } });
  try {
    switch (msg.method) {
      case "initialize": {
        const asked = isObj(msg.params) ? msg.params.protocolVersion : undefined;
        const version = typeof asked === "string" && PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0];
        return reply({
          protocolVersion: version,
          capabilities: { tools: {} },
          serverInfo: { name: "keldrin", title: "keldrin", version: PACKAGE_VERSION },
          instructions: "keldrin (intelligence for programmable equities) is the verified record for Coinbase tokenized stocks on Base. Use get_corporate_actions for dividends/splits/multipliers, get_nav_history for Chainlink NAV with round ids, get_risk for NAV-based volatility and drawdown, get_market_context for session + NAV freshness + DEX gap, get_dex_price for onchain DEX prices, get_snapshot / get_report for everything in one answer (3 free per day, then a paid x402 link; never pay without the user). Values are facts with provenance, not trade signals or advice. 'unknown' is a valid answer.",
        });
      }
      case "ping":
        return reply({});
      case "tools/list":
        return reply({ tools: TOOLS });
      case "tools/call": {
        const p = isObj(msg.params) ? msg.params : {};
        return reply(await callTool(db, p.name, isObj(p.arguments) ? p.arguments : {}, client));
      }
      default:
        if (!isRequest) return { status: 202, body: null };
        return error(-32601, `Method not found: ${String(msg.method).slice(0, 80)}`);
    }
  } catch (err) {
    const code = (err as { rpc?: number }).rpc ?? -32603;
    return isRequest ? error(code, code === -32603 ? "Internal error" : (err as Error).message) : { status: 202, body: null };
  }
}
