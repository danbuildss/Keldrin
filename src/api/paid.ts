import type { PGlite } from "@electric-sql/pglite";
import { createHash, timingSafeEqual } from "node:crypto";
import { assetCorporateActions } from "./assetActions.ts";
import { navHistory } from "./nav.ts";
import { marketContext, liveLatestRound, type DexReader, type RoundReader } from "./marketContext.ts";
import { liveDex } from "./dex.ts";
import { marketNow } from "../lib/marketSession.ts";
import { CHAIN_ID } from "../config.ts";

// Paid routes (Phase 11). Served only to Keldrin's x402 endpoints on Bankr x402 Cloud, which settle the payment
// ($0.05 USDC on Base) and call these routes with a bearer key. The key lives only in Vercel (KELDRIN_PAID_KEY) and as
// an encrypted Bankr env var; never in the repository. Fail closed: no key configured → 503; wrong key → 401.
// The answers are built from the same verified functions as the free API, so a paid answer never says more than the
// verified record. Bankr settles only on 2xx, so any incomplete answer is a 4xx/5xx (free to the caller).

type Out = { status: number; body: unknown };
const ADDR = /^0x[0-9a-fA-F]{40}$/;
const err = (status: number, code: string, message: string, hint?: string): Out => ({ status, body: { error: { code, message, ...(hint ? { hint } : {}) } } });

/** True only when KELDRIN_PAID_KEY is set (≥ 32 chars) and the request carries exactly that bearer key. */
export function paidAuth(authorization: string | undefined, key = process.env.KELDRIN_PAID_KEY): "ok" | "not_configured" | "denied" {
  if (!key || key.length < 32) return "not_configured";
  const m = /^Bearer (.+)$/.exec(authorization ?? "");
  if (!m) return "denied";
  const a = createHash("sha256").update(m[1]).digest();
  const b = createHash("sha256").update(key).digest();
  return timingSafeEqual(a, b) ? "ok" : "denied";
}

async function nextAction(db: PGlite, token: string) {
  const ca = await assetCorporateActions(db, token);
  if (ca.status !== 200) return null;
  const rows = ((ca.body as { data?: Record<string, any>[] }).data ?? []).filter((e) => e.status === "predicted");
  const e = rows.sort((a, b) => String(a.expected_adjustment_date ?? "").localeCompare(String(b.expected_adjustment_date ?? "")))[0];
  return e ? { event_type: e.event_type, status: e.status, expected_adjustment_date: e.expected_adjustment_date ?? null, per_share: e.per_share ?? null } : null;
}

/** All stocks with a verified Chainlink NAV feed in one call: session, live NAV + freshness, main DEX price + gap, next corporate action. */
export async function paidSnapshot(db: PGlite, now = new Date(), readRound: RoundReader = liveLatestRound, readDex: DexReader = liveDex): Promise<Out> {
  if (process.env.NAV_HISTORY_PUBLIC !== "true") return err(503, "NAV_NOT_ENABLED", "NAV data is not enabled on this server");
  const feeds = (await db.query<{ token_address: string; symbol: string }>("SELECT DISTINCT ON (lower(token_address)) token_address, symbol FROM nav_feeds WHERE chain_id=$1 ORDER BY lower(token_address), symbol", [CHAIN_ID])).rows.sort((a, b) => a.symbol.localeCompare(b.symbol));
  const stocks: Record<string, unknown>[] = [];
  // a few at a time: each one reads the chain live (NAV round + one DEX multicall)
  for (let i = 0; i < feeds.length; i += 4) {
    const part = await Promise.all(feeds.slice(i, i + 4).map(async (f) => {
      const mc = await marketContext(db, f.token_address, now, readRound, readDex);
      if (mc.status !== 200) throw new Error(`market context ${f.symbol}: ${mc.status}`);
      const d = (mc.body as { data: Record<string, any> }).data;
      return { symbol: d.symbol, token: d.token, nav: d.nav, nav_unavailable_reason: d.nav_unavailable_reason ?? null, staleness: d.staleness, dex: d.dex, next_corporate_action: await nextAction(db, f.token_address) };
    }));
    stocks.push(...part);
  }
  return {
    status: 200,
    body: {
      data: { market: marketNow(Math.floor(now.getTime() / 1000)), count: stocks.length, stocks },
      meta: { paid: true, note: "Facts with provenance, not advice. The NAV is Chainlink's last published total-return reference, not a live equity price; each field is the same as the free per-stock routes." },
    },
  };
}

/** Everything Keldrin verifies about one token in one call: identity, corporate actions, market context, 30 daily NAV closes, DEX pools. */
export async function paidReport(db: PGlite, token: string, now = new Date(), readRound: RoundReader = liveLatestRound, readDex: DexReader = liveDex): Promise<Out> {
  const t = token.trim();
  let rows: { contract_address: string; symbol: string; name: string | null; multiplier_wad: string }[];
  if (ADDR.test(t)) rows = (await db.query<{ contract_address: string; symbol: string; name: string | null; multiplier_wad: string }>("SELECT contract_address, symbol, name, multiplier_wad::text AS multiplier_wad FROM assets WHERE lower(contract_address)=lower($1)", [t])).rows;
  else if (t) rows = (await db.query<{ contract_address: string; symbol: string; name: string | null; multiplier_wad: string }>("SELECT contract_address, symbol, name, multiplier_wad::text AS multiplier_wad FROM assets WHERE symbol=$1", [t])).rows;
  else return err(400, "TOKEN_REQUIRED", "pass ?token=<contract address or exact symbol>, e.g. NVDAc");
  if (rows.length === 0) return err(404, "UNKNOWN_ASSET", `no tracked token ${t.slice(0, 60)}`, "GET /v1/assets lists tracked tokens (free)");
  if (rows.length > 1) return err(409, "AMBIGUOUS_SYMBOL", `${rows.length} tokens use symbol ${t.slice(0, 40)}`, "pass the contract address");
  const a = rows[0];
  const ca = await assetCorporateActions(db, a.contract_address);
  if (ca.status !== 200) return ca;
  const hasFeed = (await db.query("SELECT 1 FROM nav_feeds WHERE chain_id=$1 AND lower(token_address)=lower($2) LIMIT 1", [CHAIN_ID, a.contract_address])).rows.length > 0;
  const navOn = process.env.NAV_HISTORY_PUBLIC === "true";
  let context: unknown = null;
  let history: unknown = null;
  if (hasFeed && navOn) {
    const mc = await marketContext(db, a.contract_address, now, readRound, readDex);
    if (mc.status !== 200) return mc;
    context = (mc.body as { data: unknown }).data;
    const from = new Date(now.getTime() - 30 * 86400_000).toISOString().slice(0, 10);
    const nh = await navHistory(db, a.contract_address, new URLSearchParams({ interval: "daily", from }), now);
    if (nh.status !== 200) return nh;
    history = nh.body;
  }
  const dex = await readDex(db, a.contract_address);
  if (dex.status !== 200) return dex;
  return {
    status: 200,
    body: {
      data: {
        token: a.contract_address,
        symbol: a.symbol,
        name: a.name,
        multiplier_wad: a.multiplier_wad,
        corporate_actions: (ca.body as { data: unknown }).data,
        market_context: context,
        nav_daily_30d: history,
        dex: (dex.body as { data: unknown }).data,
        ...(hasFeed ? {} : { nav_unavailable_reason: "no_nav_feed" }),
      },
      meta: { paid: true, note: "Facts with provenance, not advice. Every section is the same verified data as the free per-stock routes, in one call." },
    },
  };
}
