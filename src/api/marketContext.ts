import type { PGlite } from "@electric-sql/pglite";
import { CHAIN_ID } from "../config.ts";
import { classifyStaleness, marketNow, STALENESS_METHOD } from "../lib/marketSession.ts";
import { formatNav } from "./nav.ts";

// GET /v1/assets/{contract}/market-context (Phase 6). The US session right now, the latest Chainlink NAV round read
// live at request time from Base's public RPC (short cache), its age, and whether that age is normal for the
// session ("expected_closed") or not ("unexpectedly_stale"), judged against the feed's own verified update rhythm.
// A provider failure degrades to nav: null with a reason; it never invents a value. No DEX price is served.

export const PUBLIC_RPC_URL = process.env.MARKET_RPC_URL || "https://mainnet.base.org";
type Round = { round_id: string; answer_raw: string; updated_unix: number; read_at: string };
const cache = new Map<string, { at: number; value: Round }>();
const CACHE_MS = 30_000;
const word = (hex: string, i: number) => BigInt("0x" + hex.slice(2 + i * 64, 2 + (i + 1) * 64));

export type RoundReader = (feed: string) => Promise<Round>;
/** latestRoundData() on the proxy, read live (selector 0xfeaf968c). */
export const liveLatestRound: RoundReader = async (feed) => {
  const hit = cache.get(feed);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const r = await fetch(PUBLIC_RPC_URL, {
    method: "POST",
    signal: AbortSignal.timeout(5000),
    headers: { "content-type": "application/json", "user-agent": "Keldrin-API/0.4" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_call", params: [{ to: feed, data: "0xfeaf968c" }, "latest"] }),
  });
  const j = (await r.json()) as { result?: string; error?: unknown };
  if (!j.result || j.result.length < 2 + 64 * 5) throw new Error("rpc_unavailable");
  const a = word(j.result, 1);
  const value = { round_id: word(j.result, 0).toString(), answer_raw: (a >= 1n << 255n ? a - (1n << 256n) : a).toString(), updated_unix: Number(word(j.result, 3)), read_at: new Date().toISOString() };
  cache.set(feed, { at: Date.now(), value });
  return value;
};

type Out = { status: number; body: unknown };

export async function marketContext(db: PGlite, contract: string, now = new Date(), readRound: RoundReader = liveLatestRound): Promise<Out> {
  const asset = (await db.query<{ contract_address: string; symbol: string }>("SELECT contract_address, symbol FROM assets WHERE lower(contract_address)=lower($1)", [contract])).rows[0];
  if (!asset) return { status: 404, body: { error: { code: "UNKNOWN_ASSET", message: `no tracked asset ${contract}`, hint: "GET /v1/assets lists tracked tokens" } } };
  const nowSec = Math.floor(now.getTime() / 1000);
  const market = marketNow(nowSec);
  const feed = (await db.query<{ feed_address: string; decimals: number }>("SELECT feed_address, decimals FROM nav_feeds WHERE chain_id=$1 AND lower(token_address)=lower($2) ORDER BY discovered_at DESC LIMIT 1", [CHAIN_ID, contract])).rows[0];
  const dex = { price: null, nav_premium: null, unavailable_reason: "no_approved_dex_source", note: "Keldrin does not serve a DEX price yet; compare against an onchain pool yourself." };
  const base = { token: asset.contract_address, symbol: asset.symbol, market, dex };
  if (!feed) return { status: 200, body: { data: { ...base, feed: null, nav: null, nav_unavailable_reason: "no_nav_feed", staleness: { state: "unknown", threshold_s: null } } } };

  const rev = (await db.query<{ verdict: string; detail: { stats?: { p99_in_session_gap_s?: number | null; max_in_session_gap_s?: number | null } | null } }>(
    "SELECT verdict, detail FROM nav_reviews WHERE chain_id=$1 AND feed_address=$2 ORDER BY checked_at DESC LIMIT 1",
    [CHAIN_ID, feed.feed_address],
  )).rows[0];
  const detail = typeof rev?.detail === "string" ? JSON.parse(rev.detail as unknown as string) : rev?.detail;
  if (!rev || rev.verdict !== "CONFIRMED") return { status: 200, body: { data: { ...base, feed: feed.feed_address, nav: null, nav_unavailable_reason: "feed_not_verified", staleness: { state: "unknown", threshold_s: null } } } };
  const p99 = detail?.stats?.p99_in_session_gap_s ?? null;

  let round: Round;
  try {
    round = await readRound(feed.feed_address);
  } catch {
    return { status: 200, body: { data: { ...base, feed: feed.feed_address, nav: null, nav_unavailable_reason: "rpc_unavailable", staleness: { state: "unknown", threshold_s: null } } } };
  }
  const st = classifyStaleness(nowSec, round.updated_unix, p99);
  const id = BigInt(round.round_id);
  return {
    status: 200,
    body: {
      data: {
        ...base,
        feed: feed.feed_address,
        nav: {
          round_id: round.round_id, phase_id: Number(id >> 64n), answer_raw: round.answer_raw, decimals: feed.decimals, nav: formatNav(round.answer_raw, feed.decimals),
          updated_at: new Date(round.updated_unix * 1000).toISOString(), age_s: Math.max(0, nowSec - round.updated_unix), read_at: round.read_at,
          source: "latestRoundData() on the Chainlink proxy, read live from Base's public RPC (cached up to 30 s)",
          label: "Last published total-return reference per token, not a live equity price. It already includes dividends and splits.",
        },
        staleness: { state: st.state, threshold_s: st.threshold_s, p99_in_session_gap_s: p99, method: STALENESS_METHOD },
      },
    },
  };
}
