import { getAddress, keccak256, pad, parseAbi, toHex } from "viem";
import { getBlock, readManyAbi, rpc, type BlockRef } from "../adapters/chain.ts";
import { CHAIN_ID } from "../config.ts";
import type { PGlite } from "@electric-sql/pglite";

// Phase 8: discover the DEX pools of the feed-backed tokenized stocks on Base, onchain only (no aggregator):
//   - Uniswap v3: factory getPool(token, quote, fee)
//   - Aerodrome v2: factory getPool(token, quote, stable)
//   - Aerodrome Slipstream (CL): factory getPool(token, quote, tickSpacing)
//   - Uniswap v4: PoolManager Initialize events whose other currency is USDC, WETH or native ETH and that have NO
//     hooks (launchpad pools with hooks are excluded: their price is not a plain market for the stock).
// Quotes: USDC and WETH (and native ETH on v4). Prices are not stored; pools are (append-only), with their source.

export const BASE = {
  USDC: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  WETH: "0x4200000000000000000000000000000000000006",
  ETH: "0x0000000000000000000000000000000000000000",
  UNI_V3_FACTORY: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
  AERO_V2_FACTORY: "0x420DD381b31aEf6683db6B902084cB0FFECe40Da",
  AERO_CL_FACTORY: "0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A",
  V4_POOL_MANAGER: "0x498581fF718922c3f8e6A244956aF099B2652b2b",
  V4_STATE_VIEW: "0xA3c0c9b65baD0b08107Aa264b0f3dB444b867A71",
} as const;
export const V3_FEES = [100, 500, 3000, 10000];
export const CL_TICK_SPACINGS = [1, 10, 50, 100, 200, 2000];
// A lower bound below the v4 PoolManager's launch on Base (Jan 2025, ~block 25.9M); the stock tokens are newer, so no
// earlier block can hold their pools. The scan is filtered by currency topics and read in chunks.
export const V4_FROM_BLOCK = 25_000_000n;
export const V4_LOG_CHUNK = 2_500_000n;
const ZERO = BASE.ETH;

const ABI_V3 = parseAbi(["function getPool(address,address,uint24) view returns (address)"]);
const ABI_AERO_V2 = parseAbi(["function getPool(address,address,bool) view returns (address)"]);
const ABI_CL = parseAbi(["function getPool(address,address,int24) view returns (address)"]);
export const V4_INITIALIZE_TOPIC = keccak256(toHex("Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)"));

export type DexPool = { venue: "uniswap_v3" | "aerodrome_v2" | "aerodrome_cl" | "uniswap_v4"; pool_ref: string; currency0: string; currency1: string; quote: "USDC" | "WETH" | "ETH"; fee: number | null; tick_spacing: number | null; hooks: string | null; stable: boolean | null; source: string };

const sorted = (a: string, b: string) => (BigInt(a) < BigInt(b) ? [getAddress(a), getAddress(b)] : [getAddress(b), getAddress(a)]);
const int24 = (w: string) => {
  const v = BigInt("0x" + w) & 0xffffffn;
  return Number(v >= 0x800000n ? v - 0x1000000n : v);
};

/** Parse a Uniswap v4 Initialize log into a pool (exported for tests). */
export function parseV4Initialize(log: { topics: string[]; data: string; transactionHash: string }): { id: string; currency0: string; currency1: string; fee: number; tickSpacing: number; hooks: string } {
  const d = log.data.slice(2);
  return {
    id: log.topics[1],
    currency0: getAddress("0x" + log.topics[2].slice(26)),
    currency1: getAddress("0x" + log.topics[3].slice(26)),
    fee: Number(BigInt("0x" + d.slice(0, 64))),
    tickSpacing: int24(d.slice(64, 128)),
    hooks: getAddress("0x" + d.slice(128 + 24, 192)),
  };
}

type V4Log = { topics: string[]; data: string; transactionHash: string; blockNumber: string };
/** Read PoolManager Initialize logs in block chunks (halving a chunk once if the provider refuses it). */
export async function scanV4Initialize(headBlock: bigint, orders: (string | string[])[][], getLogs: (f: unknown) => Promise<V4Log[]> = (f) => rpc<V4Log[]>("eth_getLogs", [f])): Promise<{ logs: V4Log[]; complete: boolean }> {
  const logs: V4Log[] = [];
  const seen = new Set<string>();
  let complete = true;
  const hex = (n: bigint) => "0x" + n.toString(16);
  for (const [t2, t3] of orders) {
    for (let from = V4_FROM_BLOCK; from <= headBlock; from += V4_LOG_CHUNK) {
      const to = from + V4_LOG_CHUNK - 1n < headBlock ? from + V4_LOG_CHUNK - 1n : headBlock;
      try {
        await getLogs({ address: BASE.V4_POOL_MANAGER, fromBlock: hex(from), toBlock: hex(to), topics: [V4_INITIALIZE_TOPIC, null, t2, t3] }).then((r) => push(r));
      } catch {
        const mid = (from + to) / 2n;
        for (const [a, b] of [[from, mid], [mid + 1n, to]] as [bigint, bigint][]) {
          try {
            push(await getLogs({ address: BASE.V4_POOL_MANAGER, fromBlock: hex(a), toBlock: hex(b), topics: [V4_INITIALIZE_TOPIC, null, t2, t3] }));
          } catch {
            complete = false;
          }
        }
      }
    }
  }
  return { logs, complete };
  function push(r: V4Log[]) {
    for (const l of r) {
      const k = `${l.transactionHash}:${l.topics[1]}`;
      if (!seen.has(k)) (seen.add(k), logs.push(l));
    }
  }
}

export async function discoverPools(token: string, head: BlockRef): Promise<DexPool[]> {
  const t = getAddress(token);
  const quotes: { sym: "USDC" | "WETH"; addr: string }[] = [{ sym: "USDC", addr: BASE.USDC }, { sym: "WETH", addr: BASE.WETH }];
  const calls: { address: string; abi: readonly unknown[]; fn: string; args: readonly unknown[]; meta: Omit<DexPool, "pool_ref" | "currency0" | "currency1" | "source"> & { factory: string; arg: string; q: string } }[] = [];
  for (const q of quotes) {
    for (const fee of V3_FEES) calls.push({ address: BASE.UNI_V3_FACTORY, abi: ABI_V3, fn: "getPool", args: [t, q.addr, fee], meta: { venue: "uniswap_v3", quote: q.sym, fee, tick_spacing: null, hooks: null, stable: null, factory: BASE.UNI_V3_FACTORY, arg: `fee=${fee}`, q: q.addr } });
    for (const stable of [false, true]) calls.push({ address: BASE.AERO_V2_FACTORY, abi: ABI_AERO_V2, fn: "getPool", args: [t, q.addr, stable], meta: { venue: "aerodrome_v2", quote: q.sym, fee: null, tick_spacing: null, hooks: null, stable, factory: BASE.AERO_V2_FACTORY, arg: `stable=${stable}`, q: q.addr } });
    for (const ts of CL_TICK_SPACINGS) calls.push({ address: BASE.AERO_CL_FACTORY, abi: ABI_CL, fn: "getPool", args: [t, q.addr, ts], meta: { venue: "aerodrome_cl", quote: q.sym, fee: null, tick_spacing: ts, hooks: null, stable: null, factory: BASE.AERO_CL_FACTORY, arg: `tickSpacing=${ts}`, q: q.addr } });
  }
  const res = await readManyAbi(calls, head.number);
  const out: DexPool[] = [];
  res.forEach((r, i) => {
    const addr = r as string | null;
    if (!addr || addr === ZERO) return;
    const m = calls[i].meta;
    const [c0, c1] = sorted(t, m.q);
    out.push({ venue: m.venue, pool_ref: getAddress(addr), currency0: c0, currency1: c1, quote: m.quote, fee: m.fee, tick_spacing: m.tick_spacing, hooks: null, stable: m.stable, source: `${m.factory}.getPool(${t},${m.q},${m.arg})@${head.number}` });
  });
  // Uniswap v4: currencies are sorted by address, so the stock can be currency0 or currency1: query both orders.
  const quoteTopics = [BASE.ETH, BASE.WETH, BASE.USDC].map((a) => pad(a.toLowerCase() as `0x${string}`));
  const tokTopic = pad(t.toLowerCase() as `0x${string}`);
  const { logs, complete } = await scanV4Initialize(head.number, [[quoteTopics, tokTopic], [tokTopic, quoteTopics]]);
  const quoteOf = (a: string) => (a === getAddress(BASE.USDC) ? "USDC" : a === getAddress(BASE.WETH) ? "WETH" : a === ZERO ? "ETH" : null);
  for (const l of logs) {
    const p = parseV4Initialize(l);
    if (p.hooks !== ZERO) continue; // launchpad / custom-logic pools are not a plain market
    const other = p.currency0 === t ? p.currency1 : p.currency1 === t ? p.currency0 : null;
    const quote = other === null ? null : quoteOf(other);
    if (!quote) continue;
    out.push({ venue: "uniswap_v4", pool_ref: p.id, currency0: p.currency0, currency1: p.currency1, quote, fee: p.fee, tick_spacing: p.tickSpacing, hooks: p.hooks, stable: null, source: `PoolManager Initialize tx ${l.transactionHash} block ${BigInt(l.blockNumber)}` });
  }
  // a failed v4 scan never drops the factory pools; it is reported so the next run retries
  (out as DexPool[] & { v4_scan_complete?: boolean }).v4_scan_complete = complete;
  return out;
}

export async function indexDexPools(db: PGlite, only?: string[]): Promise<{ head: string; tokens: { symbol: string; token: string; found: number; added: number; v4_scan_complete: boolean }[] }> {
  const head = await getBlock("latest");
  const feeds = (await db.query<{ token_address: string; symbol: string }>("SELECT DISTINCT token_address, symbol FROM nav_feeds WHERE chain_id=$1 ORDER BY symbol", [CHAIN_ID])).rows.filter((f) => !only || only.includes(f.symbol));
  const tokens: { symbol: string; token: string; found: number; added: number; v4_scan_complete: boolean }[] = [];
  for (const f of feeds) {
    const pools = await discoverPools(f.token_address, head);
    let added = 0;
    for (const p of pools) {
      const r = await db.query<{ pool_ref: string }>(
        "INSERT INTO dex_pools (chain_id, token_address, venue, pool_ref, currency0, currency1, quote, fee, tick_spacing, hooks, stable, source, discovered_block) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT DO NOTHING RETURNING pool_ref",
        [CHAIN_ID, getAddress(f.token_address), p.venue, p.pool_ref, p.currency0, p.currency1, p.quote, p.fee, p.tick_spacing, p.hooks, p.stable, p.source, head.number.toString()],
      );
      added += r.rows.length;
    }
    tokens.push({ symbol: f.symbol, token: f.token_address, found: pools.length, added, v4_scan_complete: (pools as { v4_scan_complete?: boolean }).v4_scan_complete !== false });
  }
  return { head: head.number.toString(), tokens };
}
