import type { PGlite } from "@electric-sql/pglite";
import { decodeFunctionResult, encodeFunctionData, parseAbi, type Hex } from "viem";
import { CHAIN_ID } from "../config.ts";
import { retryOnce } from "../lib/retry.ts";

// GET /v1/assets/{contract}/dex (Phase 8). Live DEX price of a tokenized stock on Base, read onchain at ONE pinned
// block from Base's public RPC, over the pools Keldrin discovered and independently verified (dex_reviews CONFIRMED).
// For each pool: price per token in the quote and in USD, and an estimated 2% depth (quote needed to move the price
// up 2%, assuming the active liquidity is constant over that move), capped by the stock the pool really holds where
// that balance is readable. Pools above 1% fee are excluded. The main market = the deepest eligible pool; a pool whose
// depth cannot be capped (Uniswap v4: all v4 pools share one PoolManager balance) must be corroborated by another pool.
// Nothing is stored or interpolated; every value names its pool and block.

export const DEX_RPC_URL = process.env.MARKET_RPC_URL || "https://mainnet.base.org";
const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
const STATE_VIEW = "0xA3c0c9b65baD0b08107Aa264b0f3dB444b867A71";
const UNI_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const WETH = "0x4200000000000000000000000000000000000006";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ETH_USD_POOL = "0xd0b53D9277642d899DF5C87A3966A349A798F224"; // Uniswap v3 WETH/USDC 0.05%, re-checked via the factory on every read
export const MIN_DEPTH_USD = 100;
export const THIN_DEPTH_USD = 1000;
export const MAX_FEE_PPM = 10_000; // above 1% a pool is not a market price
export const AGREE_PCT = 2; // an uncapped pool must be corroborated by another pool within ±2%
export const BAND_PCT = 20; // eligible pools must sit within ±20% of the reference median
const MAX_DECIMALS = 36;
const CACHE_MS = 8_000;
const SQRT_102_MINUS_1 = Math.sqrt(1.02) - 1;
const Q96 = 2n ** 96n;

const ABI = parseAbi([
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[])",
  "function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)",
  "function liquidity() view returns (uint128)",
  "function getReserves() view returns (uint256, uint256, uint256)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function getSlot0(bytes32) view returns (uint160, int24, uint24, uint24)",
  "function getLiquidity(bytes32) view returns (uint128)",
  "function getPool(address,address,uint24) view returns (address)",
]);
// Aerodrome Slipstream slot0 has 6 fields; only the first word (sqrtPriceX96) is read, so decode it by hand.
const firstWord = (hex: string) => BigInt("0x" + hex.slice(2, 66));

type Call = { target: string; fn: string; args?: readonly unknown[]; raw?: boolean };
export type Rpc = (method: string, params: unknown[]) => Promise<any>;
export const publicRpc: Rpc = (method, params) => retryOnce(() => rpcOnce(method, params));
const rpcOnce: Rpc = async (method, params) => {
  const r = await fetch(DEX_RPC_URL, { method: "POST", signal: AbortSignal.timeout(6000), headers: { "content-type": "application/json", "user-agent": "Keldrin-API/0.6" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = (await r.json()) as { result?: unknown; error?: { message: string } };
  if (j.error || j.result === undefined) throw new Error("rpc_unavailable");
  return j.result;
};

async function multicall(rpc: Rpc, calls: Call[], block: bigint): Promise<(string | null)[]> {
  const data = encodeFunctionData({ abi: ABI, functionName: "aggregate3", args: [calls.map((c) => ({ target: c.target as Hex, allowFailure: true, callData: encodeFunctionData({ abi: ABI, functionName: c.fn as never, args: (c.args ?? []) as never }) }))] });
  const raw = (await rpc("eth_call", [{ to: MULTICALL3, data }, "0x" + block.toString(16)])) as Hex;
  const res = decodeFunctionResult({ abi: ABI, functionName: "aggregate3", data: raw }) as readonly { success: boolean; returnData: Hex }[];
  return res.map((r) => (r.success && r.returnData !== "0x" ? r.returnData : null));
}

/** Quote units per 1 stock token from a sqrtPriceX96, exact to 18 decimals (bigint), as a decimal string.
 *  The decimal shift is applied before the single division, so no precision is lost for either token order. */
export function priceFromSqrt(sqrtP: bigint, stockIsToken0: boolean, decStock: number, decQuote: number): string {
  const S = 10n ** 18n;
  const sq = sqrtP * sqrtP; // token1 raw per token0 raw, scaled by 2^192
  const shift = decStock - decQuote;
  const up = shift >= 0 ? 10n ** BigInt(shift) : 1n;
  const down = shift < 0 ? 10n ** BigInt(-shift) : 1n;
  const v = stockIsToken0 ? (sq * S * up) / (2n ** 192n * down) : (2n ** 192n * S * up) / (sq * down);
  return fmt18(v);
}
export function fmt18(v: bigint): string {
  const s = v.toString().padStart(19, "0");
  const f = s.slice(-18).replace(/0+$/, "");
  return s.slice(0, -18) + (f ? "." + f : "");
}
/** Estimated quote (in quote units) needed to move the stock price up 2% in a concentrated-liquidity pool. */
export function depth2pctConcentrated(L: bigint, sqrtP: bigint, stockIsToken0: boolean, decQuote: number): number {
  if (L === 0n || sqrtP === 0n) return 0;
  const raw = stockIsToken0 ? (Number(L) * Number(sqrtP) * SQRT_102_MINUS_1) / Number(Q96) : (Number(L) * Number(Q96) * SQRT_102_MINUS_1) / Number(sqrtP);
  return raw / 10 ** decQuote;
}

export type PoolQuote = {
  venue: string; pool: string; quote: string; fee: number | null; price_quote: string | null; price_usd: string | null; depth_2pct_usd: number | null;
  depth_capped_by_balance: boolean;
  status: "ok" | "unreadable" | "unsupported" | "outlier" | "too_thin" | "high_fee" | "no_eth_usd"; note?: string;
};

/** Pick the main market from priced pools (mutates statuses). Exported for tests. */
export function selectMain(out: PoolQuote[]): { main: (PoolQuote & { corroborated: boolean; single_pool: boolean }) | null; reason?: string } {
  for (const x of out) if (x.status === "ok" && (x.depth_2pct_usd ?? 0) < MIN_DEPTH_USD) x.status = "too_thin";
  const eligible = out.filter((x) => x.status === "ok");
  // reference median: balance-capped pools (cannot be inflated by unbacked liquidity); fall back to all eligible pools
  const capped = eligible.filter((x) => x.depth_capped_by_balance);
  const refPrices = (capped.length ? capped : eligible).map((x) => Number(x.price_usd)).sort((a, b) => a - b);
  const median = refPrices.length ? refPrices[Math.floor(refPrices.length / 2)] : null;
  for (const x of eligible) if (median !== null && Math.abs(Number(x.price_usd) / median - 1) * 100 > BAND_PCT) x.status = "outlier";
  const ok = out.filter((x) => x.status === "ok");
  const corroborated = (x: PoolQuote) => ok.some((y) => y !== x && Math.abs(Number(y.price_usd) / Number(x.price_usd) - 1) * 100 <= AGREE_PCT);
  const candidates = ok.filter((x) => x.depth_capped_by_balance || corroborated(x)).sort((a, b) => (b.depth_2pct_usd ?? 0) - (a.depth_2pct_usd ?? 0));
  const m = candidates[0];
  if (!m) return { main: null, reason: ok.length ? "uncorroborated_uncapped_pools_only" : "no_pool_with_usable_depth" };
  return { main: { ...m, corroborated: corroborated(m), single_pool: ok.length === 1 } };
}

const cache = new Map<string, { at: number; value: { status: number; body: unknown } }>();

export async function liveDex(db: PGlite, contract: string, rpc: Rpc = publicRpc): Promise<{ status: number; body: unknown }> {
  // a short in-process cache spares the public RPC under bursts; only the default reader's successful reads are cached
  const key = contract.toLowerCase();
  const useCache = rpc === publicRpc;
  const hit = useCache ? cache.get(key) : undefined;
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const value = await liveDexUncached(db, contract, rpc);
  const d = (value.body as { data?: { block?: string } })?.data;
  if (useCache && value.status === 200 && d?.block) {
    if (cache.size > 500) cache.clear();
    cache.set(key, { at: Date.now(), value });
  }
  return value;
}

async function liveDexUncached(db: PGlite, contract: string, rpc: Rpc): Promise<{ status: number; body: unknown }> {
  const asset = (await db.query<{ contract_address: string; symbol: string }>("SELECT contract_address, symbol FROM assets WHERE lower(contract_address)=lower($1)", [contract])).rows[0];
  if (!asset) return { status: 404, body: { error: { code: "UNKNOWN_ASSET", message: `no tracked asset ${contract}`, hint: "GET /v1/assets lists tracked tokens" } } };
  const rev = (await db.query<{ verdict: string; detail: { covered?: string[] }; checked_at: string }>(
    "SELECT verdict, detail, checked_at::text AS checked_at FROM dex_reviews WHERE chain_id=$1 AND lower(token_address)=lower($2) ORDER BY checked_at DESC LIMIT 1",
    [CHAIN_ID, contract],
  )).rows[0];
  const detail = typeof rev?.detail === "string" ? JSON.parse(rev.detail as unknown as string) : rev?.detail;
  const base = { token: asset.contract_address, symbol: asset.symbol };
  if (!rev || rev.verdict !== "CONFIRMED" || !Array.isArray(detail?.covered) || detail.covered.length === 0) return { status: 200, body: { data: { ...base, main: null, pools: [], unavailable_reason: rev ? "pools_not_verified" : "no_verified_pools" } } };
  // coverage entries are "venue:pool_ref", so a pool is only served under the venue it was reviewed as
  const covered = new Set((detail.covered as string[]).map((x) => x.toLowerCase()));
  const pools = (await db.query<{ venue: string; pool_ref: string; currency0: string; currency1: string; quote: string; fee: number | null; stable: boolean | null }>(
    "SELECT venue, pool_ref, currency0, currency1, quote, fee, stable FROM dex_pools WHERE chain_id=$1 AND lower(token_address)=lower($2) ORDER BY venue, pool_ref",
    [CHAIN_ID, contract],
  )).rows.filter((p) => covered.has(`${p.venue}:${p.pool_ref}`.toLowerCase()));
  let block: bigint;
  let raw: (string | null)[];
  const calls: Call[] = [
    { target: asset.contract_address, fn: "decimals" },
    { target: UNI_V3_FACTORY, fn: "getPool", args: [WETH, USDC, 500] },
    { target: ETH_USD_POOL, fn: "slot0", raw: true },
  ];
  const idx: number[] = [];
  for (const p of pools) {
    idx.push(calls.length);
    const bal: Call = { target: asset.contract_address, fn: "balanceOf", args: [p.pool_ref] };
    if (p.venue === "uniswap_v4") calls.push({ target: STATE_VIEW, fn: "getSlot0", args: [p.pool_ref] }, { target: STATE_VIEW, fn: "getLiquidity", args: [p.pool_ref] });
    else if (p.venue === "aerodrome_v2") calls.push({ target: p.pool_ref, fn: "getReserves" }, bal);
    else calls.push({ target: p.pool_ref, fn: "slot0", raw: true }, { target: p.pool_ref, fn: "liquidity" }, bal);
  }
  try {
    block = BigInt((await rpc("eth_blockNumber", [])) as string);
    raw = await multicall(rpc, calls, block);
  } catch {
    return { status: 200, body: { data: { ...base, main: null, pools: [], unavailable_reason: "rpc_unavailable" } } };
  }
  const decRaw = raw[0] ? firstWord(raw[0]) : null;
  if (decRaw === null) return { status: 200, body: { data: { ...base, main: null, pools: [], unavailable_reason: "rpc_unavailable" } } };
  if (decRaw > BigInt(MAX_DECIMALS)) return { status: 200, body: { data: { ...base, main: null, pools: [], unavailable_reason: "token_decimals_out_of_range" } } };
  const dec = Number(decRaw);
  const refOk = raw[1] !== null && "0x" + raw[1].slice(-40).toLowerCase() === ETH_USD_POOL.toLowerCase() && raw[2] !== null;
  const ethUsd = refOk ? priceFromSqrt(firstWord(raw[2]!), true, 18, 6) : null; // WETH (token0) priced in USDC (token1)
  const out: PoolQuote[] = pools.map((p, i) => {
    const stockIsToken0 = p.currency0.toLowerCase() === asset.contract_address.toLowerCase();
    const decQuote = p.quote === "USDC" ? 6 : 18;
    const usdPer = p.quote === "USDC" ? 1 : ethUsd === null ? null : Number(ethUsd);
    const q: PoolQuote = { venue: p.venue, pool: p.pool_ref, quote: p.quote, fee: p.fee, price_quote: null, price_usd: null, depth_2pct_usd: null, depth_capped_by_balance: false, status: "unreadable" };
    if (p.fee !== null && p.fee > MAX_FEE_PPM) return { ...q, status: "high_fee", note: `fee ${(p.fee / 10_000).toFixed(2)}% is above 1%: not a market price` };
    const a = raw[idx[i]];
    const b = raw[idx[i] + 1];
    if (a === null || b === null) return q;
    if (usdPer === null) return { ...q, status: "no_eth_usd", note: "ETH/USD reference pool unreadable at this block" };
    let stockBal: bigint | null = null;
    if (p.venue === "aerodrome_v2") {
      if (p.stable) return { ...q, status: "unsupported", note: "stable-curve pool: price is not x*y" };
      const r0 = firstWord(a);
      const r1 = BigInt("0x" + a.slice(66, 130));
      const [rs, rq] = stockIsToken0 ? [r0, r1] : [r1, r0];
      if (rs === 0n || rq === 0n) return { ...q, status: "too_thin" };
      const v = (rq * 10n ** 18n * 10n ** BigInt(dec)) / (rs * 10n ** BigInt(decQuote));
      q.price_quote = fmt18(v);
      q.depth_2pct_usd = (Number(rq) / 10 ** decQuote) * SQRT_102_MINUS_1 * usdPer;
      stockBal = firstWord(b);
    } else {
      const sqrtP = firstWord(a);
      const L = firstWord(b);
      if (sqrtP === 0n) return { ...q, status: "too_thin" };
      q.price_quote = priceFromSqrt(sqrtP, stockIsToken0, dec, decQuote);
      q.depth_2pct_usd = depth2pctConcentrated(L, sqrtP, stockIsToken0, decQuote) * usdPer;
      const c = raw[idx[i] + 2];
      if (p.venue !== "uniswap_v4" && c !== null && c !== undefined) stockBal = firstWord(c);
    }
    q.price_usd = (Number(q.price_quote) * usdPer).toFixed(8);
    // cap the estimate by the value of the stock the pool really holds (liquidity math alone can be inflated)
    if (stockBal !== null) {
      const heldUsd = (Number(stockBal) / 10 ** dec) * Number(q.price_usd);
      if (heldUsd < (q.depth_2pct_usd ?? 0)) q.depth_2pct_usd = heldUsd;
      q.depth_capped_by_balance = true;
    }
    q.status = "ok";
    return q;
  });
  const { main, reason } = selectMain(out);
  out.sort((x, y) => (y.depth_2pct_usd ?? -1) - (x.depth_2pct_usd ?? -1));
  return {
    status: 200,
    body: {
      data: {
        ...base,
        block: block.toString(),
        main: main ? { ...main, thin_market: (main.depth_2pct_usd ?? 0) < THIN_DEPTH_USD } : null,
        ...(main ? {} : { unavailable_reason: reason }),
        eth_usd: ethUsd,
        pools: out.slice(0, 10),
        pools_total: out.length,
        method: `Read onchain at block ${block} (Base public RPC). Price per token from slot0/getReserves; depth_2pct_usd = estimated quote needed to move the price up 2% (assumes constant active liquidity over the move), capped by the pool's real stock balance where readable (not Uniswap v4, whose pools share one balance). Pools above 1% fee are excluded. Main market = deepest pool with depth >= $${MIN_DEPTH_USD}, within ±${BAND_PCT}% of the median of balance-capped pools, and, if its depth is uncapped, corroborated by another pool within ±${AGREE_PCT}%. Pools come from canonical factories and plain (no-hook) Uniswap v4 pools, independently re-derived (review ${rev.checked_at}).`,
      },
    },
  };
}
