import type { PGlite } from "@electric-sql/pglite";
import { createHash } from "node:crypto";
import { TRIAL_CONSUME_SQL } from "../db/pg.ts";
import { assetCorporateActions } from "./assetActions.ts";
import { navHistory } from "./nav.ts";
import { marketContext, liveLatestRound, type DexReader, type RoundReader } from "./marketContext.ts";
import { batchRead, liveDex } from "./dex.ts";
import { marketNow } from "../lib/marketSession.ts";
import { CHAIN_ID } from "../config.ts";
import { mapLimit } from "../lib/retry.ts";

// Snapshot and report with 3 free tries (Phase 11, founder: "approve 3 free tries for snapshot and report").
// GET /v1/snapshot and GET /v1/report?token=… answer exactly like the paid Bankr x402 endpoints (keldrin-snapshot,
// keldrin-report, $0.05 USDC on Base). Each client gets 3 complete answers per UTC day across both; after that the
// answer is 402 with the paid links. Only complete answers count; anything incomplete is a 503 and doesn't use a try.
// The counter is shared (Postgres) and keyed on a salted hash of the client IP; it is a trial allowance, not access control.

export const FREE_TRIES_PER_DAY = 3;
export const PAID = {
  price: "0.05 USDC on Base",
  protocol: "x402",
  snapshot: "https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/keldrin-snapshot",
  report: "https://x402.bankr.bot/0xb98f0de777eea8c481b64e33d3e0066cea38fa91/keldrin-report",
};
type Out = { status: number; body: unknown };
const ADDR = /^0x[0-9a-fA-F]{40}$/;
const TRANSIENT = new Set(["rpc_unavailable", "rpc_result_invalid"]);
const UNVERIFIED = new Set(["feed_not_verified", "phase_not_reviewed", "aggregator_decimals_differ_from_proxy"]);
const err = (status: number, code: string, message: string, hint?: string): Out => ({ status, body: { error: { code, message, ...(hint ? { hint } : {}) } } });
const incomplete = (why: string) => err(503, "INCOMPLETE", `could not build a complete answer right now (${why}); this did not use a free try`, "retry in a minute");

// ── trial counter ───────────────────────────────────────────────────────
// Shared across server instances: one row per (hashed client, UTC day) in Postgres, via trial_used / trial_consume
// (which refuses past the limit). The client is the request IP, hashed with a secret salt; the raw IP is never stored.
// Fail closed: if the counter can't be read, no free answer is given (FREE_TRIES_UNAVAILABLE), never unlimited ones.
// Two parallel calls with the last try left can both be answered; that is bounded by the rate limit and accepted.
type CounterDb = { query: PGlite["query"]; writeOne?: (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }> };
const dayOf = (now: Date) => now.toISOString().slice(0, 10);
/** Secret salt: TRIAL_SALT, else derived from the (secret) database URL. On Vercel with neither, hashing refuses. */
function salt(): string {
  if (process.env.TRIAL_SALT) return process.env.TRIAL_SALT;
  if (process.env.DATABASE_URL) return createHash("sha256").update("keldrin-trial-salt|" + process.env.DATABASE_URL).digest("hex");
  if (process.env.VERCEL) throw new Error("no secret salt configured");
  return "keldrin-local-test-only";
}
export function clientHash(client: string): string {
  return createHash("sha256").update(salt() + "|" + client).digest("hex").slice(0, 32);
}
/** Free tries left today, or -1 when the counter is unavailable (fail closed). */
export async function triesLeft(db: CounterDb, client: string, now = new Date()): Promise<number> {
  try {
    const r = await db.query<{ n: number }>("SELECT trial_used($1, $2::date) AS n", [clientHash(client), dayOf(now)]);
    return Math.max(0, FREE_TRIES_PER_DAY - Number(r.rows[0]?.n ?? 0));
  } catch (e) {
    console.warn("free-try counter unavailable (failing closed):", (e as Error).message);
    return -1;
  }
}
/** Count one complete free answer; returns the tries left (0 if the limit was already reached). */
export async function useTry(db: CounterDb, client: string, now = new Date()): Promise<number> {
  try {
    const args = [clientHash(client), dayOf(now)];
    const r = db.writeOne ? await db.writeOne(TRIAL_CONSUME_SQL, args) : await db.query<{ n: number }>(TRIAL_CONSUME_SQL, args);
    const n = Number((r.rows[0] as { n?: number | null })?.n ?? FREE_TRIES_PER_DAY + 1);
    return Math.max(0, FREE_TRIES_PER_DAY - n);
  } catch (e) {
    console.warn("free-try counter write failed:", (e as Error).message);
    return 0;
  }
}
/** Kept for tests; the counter has no in-memory state any more. */
export function resetTrials() {}
export const trialUnavailable = (): Out => ({
  status: 503,
  body: { error: { code: "FREE_TRIES_UNAVAILABLE", message: "free tries can't be counted right now, so none are given; this did not use a try", hint: "retry in a minute, use the paid link, or use the free one-stock routes" }, pay: PAID },
});
export const trialUsedUp = (): Out => ({
  status: 402,
  body: { error: { code: "FREE_TRIES_USED", message: `the ${FREE_TRIES_PER_DAY} free tries for today are used; each further answer is ${PAID.price} via x402`, hint: "call the paid endpoint with an x402 client (e.g. Bankr); the one-stock routes under /v1/assets stay free" }, pay: PAID },
});

// ── answers ─────────────────────────────────────────────────────────────
async function withDeadline<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([p, new Promise<T>((_, rej) => (t = setTimeout(() => rej(new Error("deadline")), ms)))]);
  } finally {
    clearTimeout(t);
  }
}
async function nextAction(db: PGlite, token: string) {
  const ca = await assetCorporateActions(db, token);
  if (ca.status !== 200) throw new Error("corporate actions");
  const e = (((ca.body as { data?: Record<string, any>[] }).data ?? []).filter((x) => x.status === "predicted")).sort((a, b) => String(a.expected_adjustment_date ?? "").localeCompare(String(b.expected_adjustment_date ?? "")))[0];
  return e ? { event_type: e.event_type, expected_adjustment_date: e.expected_adjustment_date ?? null, per_share: e.per_share ?? null } : null;
}

/** Every stock with a verified Chainlink NAV feed: live NAV + freshness, main DEX price + gap, next corporate action. */
export async function snapshot(db: PGlite, now = new Date(), readRound: RoundReader = liveLatestRound, readDex: DexReader = liveDex): Promise<Out> {
  if (process.env.NAV_HISTORY_PUBLIC !== "true") return err(503, "NAV_NOT_ENABLED", "NAV data is not enabled on this server");
  const feeds = (await db.query<{ token_address: string }>("SELECT DISTINCT f.token_address FROM nav_feeds f JOIN assets a ON lower(a.contract_address)=lower(f.token_address) WHERE f.chain_id=$1", [CHAIN_ID])).rows;
  // One time budget for the whole answer, inside Vercel's 15 s function limit.
  const started = Date.now();
  const BUDGET_MS = 13_000;
  // Fast path (production readers only): every stock's DEX pools and NAV round in one multicall at one block.
  // A stock or feed the batch could not read falls back to its own live read, so one failed sub-call never fails the answer.
  if (readRound === liveLatestRound && readDex === liveDex) {
    try {
      const feedRows = (await db.query<{ token_address: string; feed_address: string }>("SELECT DISTINCT ON (lower(f.token_address)) f.token_address, f.feed_address FROM nav_feeds f JOIN assets a ON lower(a.contract_address)=lower(f.token_address) WHERE f.chain_id=$1 ORDER BY lower(f.token_address), f.discovered_at DESC", [CHAIN_ID])).rows;
      const b = await withDeadline(batchRead(db, feeds.map((f) => f.token_address), feedRows.map((f) => f.feed_address)), 6_000);
      readRound = async (feed) => b.rounds.get(feed.toLowerCase()) ?? liveLatestRound(feed);
      readDex = async (d, c) => {
        const hit = b.dex.get(c.toLowerCase());
        const reason = (hit?.body as { data?: { unavailable_reason?: string } } | undefined)?.data?.unavailable_reason;
        return hit && !TRANSIENT.has(reason as string) ? hit : liveDex(d, c);
      };
    } catch {
      // fall back to per-stock live reads below
    }
  }
  try {
    // at most 4 stocks in flight: the public RPC throttles a burst of ~40 reads
    const stocks = await withDeadline(mapLimit(feeds, 4, async (f) => {
      const mc = await marketContext(db, f.token_address, now, readRound, readDex);
      if (mc.status !== 200) throw new Error("market context");
      const d = (mc.body as { data: Record<string, any> }).data;
      if (TRANSIENT.has(d.nav_unavailable_reason) || TRANSIENT.has(d.dex?.unavailable_reason)) throw new Error(`live read ${d.symbol}`);
      return { symbol: d.symbol as string, token: d.token, nav: d.nav, nav_unavailable_reason: d.nav_unavailable_reason ?? null, staleness: d.staleness, dex: d.dex, next_corporate_action: await nextAction(db, f.token_address) };
    }), Math.max(1_000, BUDGET_MS - (Date.now() - started)));
    const verified = stocks.filter((s) => !UNVERIFIED.has(s.nav_unavailable_reason)).sort((a, b) => a.symbol.localeCompare(b.symbol));
    return { status: 200, body: { data: { market: marketNow(Math.floor(now.getTime() / 1000)), count: verified.length, stocks: verified }, meta: { note: "Verified data with provenance, not advice. The NAV is Chainlink's last published total-return reference, not a live equity price." } } };
  } catch (e) {
    return incomplete((e as Error).message);
  }
}

/** Everything Keldrin verifies about one token: corporate actions, market context, 30 daily NAV closes, DEX pools (one DEX read). */
export async function report(db: PGlite, token: string, now = new Date(), readRound: RoundReader = liveLatestRound, readDex: DexReader = liveDex): Promise<Out> {
  const t = token.trim();
  if (!t || t.length > 64) return err(400, "TOKEN_REQUIRED", "pass ?token=<exact symbol or 0x contract address>, e.g. NVDAc");
  const rows = (await db.query<{ contract_address: string; symbol: string }>(ADDR.test(t) ? "SELECT contract_address, symbol FROM assets WHERE lower(contract_address)=lower($1)" : "SELECT contract_address, symbol FROM assets WHERE symbol=$1", [t])).rows;
  if (rows.length === 0) return err(404, "UNKNOWN_ASSET", `no tracked token ${t.slice(0, 64)}`, "GET /v1/assets lists tracked tokens");
  if (rows.length > 1) return err(409, "AMBIGUOUS_SYMBOL", `${rows.length} tokens use symbol ${t.slice(0, 40)}`, "pass the contract address");
  const a = rows[0];
  const hasFeed = (await db.query("SELECT 1 FROM nav_feeds WHERE chain_id=$1 AND lower(token_address)=lower($2) LIMIT 1", [CHAIN_ID, a.contract_address])).rows.length > 0;
  if (hasFeed && process.env.NAV_HISTORY_PUBLIC !== "true") return err(503, "NAV_NOT_ENABLED", "NAV data is not enabled on this server");
  try {
    return await withDeadline((async (): Promise<Out> => {
      const dex = await readDex(db, a.contract_address);
      if (dex.status !== 200) return incomplete("dex");
      const dexData = (dex.body as { data: Record<string, any> }).data;
      if (TRANSIENT.has(dexData?.unavailable_reason)) return incomplete("live dex read");
      const once: DexReader = async () => dex; // the market context uses the same DEX read
      const [ca, mc] = await Promise.all([assetCorporateActions(db, a.contract_address), marketContext(db, a.contract_address, now, readRound, once)]);
      if (ca.status !== 200 || mc.status !== 200) return incomplete("section");
      const c = (mc.body as { data: Record<string, any> }).data;
      if (TRANSIENT.has(c.nav_unavailable_reason)) return incomplete("live NAV read");
      let history: unknown = null;
      if (hasFeed) {
        const nh = await navHistory(db, a.contract_address, new URLSearchParams({ interval: "daily", from: new Date(now.getTime() - 30 * 86400_000).toISOString().slice(0, 10) }), now);
        if (nh.status !== 200) return incomplete("nav history");
        history = nh.body;
      }
      return { status: 200, body: { data: { token: a.contract_address, symbol: a.symbol, corporate_actions: (ca.body as { data: unknown }).data, market_context: c, nav_daily_30d: history, ...(hasFeed ? {} : { nav_unavailable_reason: "no_nav_feed" }), dex_pools: dexData }, meta: { note: "Verified data with provenance, not advice." } } };
    })(), 10_000);
  } catch (e) {
    return incomplete((e as Error).message);
  }
}
