import type { PGlite } from "@electric-sql/pglite";
import { decodeFunctionResult, encodeFunctionData, parseAbi, type Hex } from "viem";
import { CHAIN_ID } from "../config.ts";

// GET /v1/assets/{contract}/dex (Phase 8). Live DEX price of a tokenized stock on Base, read onchain at ONE pinned
// block from Base's public RPC, over the pools Keldrin discovered and independently verified (dex_reviews CONFIRMED).
// For each pool: price per token in the quote and in USD, and an estimated 2% depth (quote needed to move the price
// up 2%, assuming the active liquidity is constant over that move). The main market = the deepest pool whose price
// is within 0.25x-4x of the median pool price. Nothing is stored or interpolated; every value names its pool and block.

export const DEX_RPC_URL = process.env.MARKET_RPC_URL || "https://mainnet.base.org";
const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11";
const STATE_VIEW = "0xA3c0c9b65baD0b08107Aa264b0f3dB444b867A71";
const UNI_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const WETH = "0x4200000000000000000000000000000000000006";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ETH_USD_POOL = "0xd0b53D9277642d899DF5C87A3966A349A798F224"; // Uniswap v3 WETH/USDC 0.05%, re-checked via the factory on every read
export const MIN_DEPTH_USD = 100;
export const THIN_DEPTH_USD = 1000;
const SQRT_102_MINUS_1 = Math.sqrt(1.02) - 1;
const Q96 = 2n ** 96n;

const ABI = parseAbi([
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[])",
  "function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)",
  "function liquidity() view returns (uint128)",
  "function getReserves() view returns (uint256, uint256, uint256)",
  "function decimals() view returns (uint8)",
  "function getSlot0(bytes32) view returns (uint160, int24, uint24, uint24)",
  "function getLiquidity(bytes32) view returns (uint128)",
  "function getPool(address,address,uint24) view returns (address)",
]);
// Aerodrome Slipstream slot0 has 6 fields; only the first word (sqrtPriceX96) is read, so decode it by hand.
const firstWord = (hex: string) => BigInt("0x" + hex.slice(2, 66));

type Call = { target: string; fn: string; args?: readonly unknown[]; raw?: boolean };
export type Rpc = (method: string, params: unknown[]) => Promise<any>;
export const publicRpc: Rpc = async (method, params) => {
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

/** Quote units per 1 stock token from a sqrtPriceX96, exact to 18 decimals (bigint), as a decimal string. */
export function priceFromSqrt(sqrtP: bigint, stockIsToken0: boolean, decStock: number, decQuote: number): string {
  const S = 10n ** 18n;
  const sq = sqrtP * sqrtP; // token1 raw per token0 raw, scaled by 2^192
  const scale = (n: bigint, d: bigint) => (n * S) / d;
  let v = stockIsToken0 ? scale(sq, 2n ** 192n) : scale(2n ** 192n, sq); // quote raw per stock raw, ×1e18
  const shift = decStock - decQuote;
  v = shift >= 0 ? v * 10n ** BigInt(shift) : v / 10n ** BigInt(-shift);
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
  status: "ok" | "unreadable" | "unsupported" | "outlier" | "too_thin"; note?: string;
};

export async function liveDex(db: PGlite, contract: string, rpc: Rpc = publicRpc): Promise<{ status: number; body: unknown }> {
  const asset = (await db.query<{ contract_address: string; symbol: string }>("SELECT contract_address, symbol FROM assets WHERE lower(contract_address)=lower($1)", [contract])).rows[0];
  if (!asset) return { status: 404, body: { error: { code: "UNKNOWN_ASSET", message: `no tracked asset ${contract}`, hint: "GET /v1/assets lists tracked tokens" } } };
  const rev = (await db.query<{ verdict: string; detail: { covered?: string[] }; checked_at: string }>(
    "SELECT verdict, detail, checked_at::text AS checked_at FROM dex_reviews WHERE chain_id=$1 AND lower(token_address)=lower($2) ORDER BY checked_at DESC LIMIT 1",
    [CHAIN_ID, contract],
  )).rows[0];
  const detail = typeof rev?.detail === "string" ? JSON.parse(rev.detail as unknown as string) : rev?.detail;
  const base = { token: asset.contract_address, symbol: asset.symbol };
  if (!rev || rev.verdict !== "CONFIRMED" || !Array.isArray(detail?.covered) || detail.covered.length === 0) return { status: 200, body: { data: { ...base, main: null, pools: [], unavailable_reason: rev ? "pools_not_verified" : "no_verified_pools" } } };
  const covered = new Set((detail.covered as string[]).map((x) => x.toLowerCase()));
  const pools = (await db.query<{ venue: string; pool_ref: string; currency0: string; currency1: string; quote: string; fee: number | null; stable: boolean | null }>(
    "SELECT venue, pool_ref, currency0, currency1, quote, fee, stable FROM dex_pools WHERE chain_id=$1 AND lower(token_address)=lower($2) ORDER BY venue, pool_ref",
    [CHAIN_ID, contract],
  )).rows.filter((p) => covered.has(p.pool_ref.toLowerCase()));
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
    if (p.venue === "uniswap_v4") calls.push({ target: STATE_VIEW, fn: "getSlot0", args: [p.pool_ref] }, { target: STATE_VIEW, fn: "getLiquidity", args: [p.pool_ref] });
    else if (p.venue === "aerodrome_v2") calls.push({ target: p.pool_ref, fn: "getReserves" }, { target: p.pool_ref, fn: "getReserves" });
    else calls.push({ target: p.pool_ref, fn: "slot0", raw: true }, { target: p.pool_ref, fn: "liquidity" });
  }
  try {
    block = BigInt((await rpc("eth_blockNumber", [])) as string);
    raw = await multicall(rpc, calls, block);
  } catch {
    return { status: 200, body: { data: { ...base, main: null, pools: [], unavailable_reason: "rpc_unavailable" } } };
  }
  const dec = raw[0] ? Number(firstWord(raw[0])) : null;
  const refOk = raw[1] !== null && "0x" + raw[1].slice(-40).toLowerCase() === ETH_USD_POOL.toLowerCase() && raw[2] !== null;
  const ethUsd = refOk ? priceFromSqrt(firstWord(raw[2]!), true, 18, 6) : null; // WETH (token0) priced in USDC (token1)
  if (dec === null) return { status: 200, body: { data: { ...base, main: null, pools: [], unavailable_reason: "rpc_unavailable" } } };
  const out: PoolQuote[] = pools.map((p, i) => {
    const a = raw[idx[i]];
    const b = raw[idx[i] + 1];
    const stockIsToken0 = p.currency0.toLowerCase() === asset.contract_address.toLowerCase();
    const decQuote = p.quote === "USDC" ? 6 : 18;
    const usdPer = p.quote === "USDC" ? 1 : ethUsd === null ? null : Number(ethUsd);
    const q: PoolQuote = { venue: p.venue, pool: p.pool_ref, quote: p.quote, fee: p.fee, price_quote: null, price_usd: null, depth_2pct_usd: null, status: "unreadable" };
    if (a === null || b === null) return q;
    if (p.venue === "aerodrome_v2") {
      if (p.stable) return { ...q, status: "unsupported", note: "stable-curve pool: price is not x*y" };
      const r0 = firstWord(a);
      const r1 = BigInt("0x" + a.slice(66, 130));
      const [rs, rq] = stockIsToken0 ? [r0, r1] : [r1, r0];
      if (rs === 0n || rq === 0n) return { ...q, status: "too_thin" };
      const v = (rq * 10n ** 18n * 10n ** BigInt(dec)) / (rs * 10n ** BigInt(decQuote));
      q.price_quote = fmt18(v);
      const depthQuote = (Number(rq) / 10 ** decQuote) * SQRT_102_MINUS_1;
      q.depth_2pct_usd = usdPer === null ? null : depthQuote * usdPer;
    } else {
      const sqrtP = firstWord(a);
      const L = firstWord(b);
      if (sqrtP === 0n) return { ...q, status: "too_thin" };
      q.price_quote = priceFromSqrt(sqrtP, stockIsToken0, dec, decQuote);
      const dq = depth2pctConcentrated(L, sqrtP, stockIsToken0, decQuote);
      q.depth_2pct_usd = usdPer === null ? null : dq * usdPer;
    }
    q.price_usd = usdPer === null ? null : (Number(q.price_quote) * usdPer).toFixed(8);
    q.status = "ok";
    return q;
  });
  const priced = out.filter((x) => x.status === "ok" && x.price_usd !== null && (x.depth_2pct_usd ?? 0) >= MIN_DEPTH_USD);
  const sortedPrices = priced.map((x) => Number(x.price_usd)).sort((x, y) => x - y);
  const median = sortedPrices.length ? sortedPrices[Math.floor(sortedPrices.length / 2)] : null;
  for (const x of out) {
    if (x.status === "ok" && (x.depth_2pct_usd ?? 0) < MIN_DEPTH_USD) x.status = "too_thin";
    else if (x.status === "ok" && median !== null && (Number(x.price_usd) < median / 4 || Number(x.price_usd) > median * 4)) x.status = "outlier";
  }
  const main = out.filter((x) => x.status === "ok").sort((x, y) => (y.depth_2pct_usd ?? 0) - (x.depth_2pct_usd ?? 0))[0] ?? null;
  out.sort((x, y) => (y.depth_2pct_usd ?? -1) - (x.depth_2pct_usd ?? -1));
  return {
    status: 200,
    body: {
      data: {
        ...base,
        block: block.toString(),
        main: main ? { ...main, thin_market: (main.depth_2pct_usd ?? 0) < THIN_DEPTH_USD } : null,
        ...(main ? {} : { unavailable_reason: "no_pool_with_usable_depth" }),
        eth_usd: ethUsd,
        pools: out.slice(0, 10),
        pools_total: out.length,
        method: `Read onchain at block ${block} (Base public RPC). Price per token from slot0/getReserves; depth_2pct_usd = estimated quote needed to move the price up 2% (assumes constant active liquidity over the move). Main market = deepest pool with depth >= $${MIN_DEPTH_USD} and price within 0.25x-4x of the median pool. Pools come from canonical factories and plain (no-hook) Uniswap v4 pools, independently re-derived (review ${rev.checked_at}).`,
      },
    },
  };
}
