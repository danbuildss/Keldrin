import { encodeAbiParameters, keccak256 } from "viem";
import { navTransport } from "./navVerify.ts";
import { RPC_URL } from "../config.ts";

// Independent verifier for discovered DEX pools (Phase 8). Shares no code with the discovery step: hand-written
// selectors and decoding, its own copy of the canonical factory addresses, and by default Base's public RPC (a
// different provider from the indexer's). For each stored pool it re-derives the pool from its definition:
//   v3 / Aerodrome v2 / Slipstream: the factory's getPool(...) must return the stored address, and the pool's
//   token0/token1 must be the stored currencies; Uniswap v4: keccak256(abi.encode(PoolKey)) must equal the stored id
//   and StateView.getSlot0(id) must show an initialized pool. Only CONFIRMED tokens' pools are served.

type Transport = { rpc: (method: string, params: unknown[]) => Promise<any> };
export const DEX_SEL = {
  getPoolV3: "0x1698ee82", // getPool(address,address,uint24)
  getPoolAeroV2: "0x79bc57d5", // getPool(address,address,bool)
  getPoolCl: "0x28af8d0b", // getPool(address,address,int24)
  token0: "0x0dfe1681",
  token1: "0xd21220a7",
  getSlot0V4: "0xc815641c", // StateView.getSlot0(bytes32)
} as const;
const CANON = {
  USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  WETH: "0x4200000000000000000000000000000000000006",
  ETH: "0x0000000000000000000000000000000000000000",
  uniswap_v3: "0x33128a8fc17869897dce68ed026d694621f6fdfd",
  aerodrome_v2: "0x420dd381b31aef6683db6b902084cb0ffece40da",
  aerodrome_cl: "0x5e7bb104d84c7cb9b682aac2f3d509f5f406809a",
  stateView: "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71",
} as const;

export type StoredPool = { venue: string; pool_ref: string; currency0: string; currency1: string; quote: string; fee: number | null; tick_spacing: number | null; hooks: string | null; stable: boolean | null };
export type DexClaim = { claim: string; verdict: "CONFIRMED" | "REJECTED" | "UNSURE"; evidence: string };
export type DexReview = { verdict: "CONFIRMED" | "REJECTED" | "UNSURE"; pools_checked: number; claims: DexClaim[]; covered: string[]; checked_at: string; verifier_rpc_host: string };

const addrWord = (a: string) => a.toLowerCase().replace(/^0x/, "").padStart(64, "0");
const uintWord = (v: number | bigint) => BigInt(v).toString(16).padStart(64, "0");
const intWord = (v: number) => (v < 0 ? (1n << 256n) + BigInt(v) : BigInt(v)).toString(16).padStart(64, "0");
const asAddr = (hex: string | null) => (hex && hex.length >= 66 ? "0x" + hex.slice(-40).toLowerCase() : null);

/** The Uniswap v4 pool id: keccak256(abi.encode(currency0, currency1, fee, tickSpacing, hooks)). */
export function v4PoolId(p: { currency0: string; currency1: string; fee: number; tickSpacing: number; hooks: string }): string {
  return keccak256(encodeAbiParameters([{ type: "address" }, { type: "address" }, { type: "uint24" }, { type: "int24" }, { type: "address" }], [p.currency0 as `0x${string}`, p.currency1 as `0x${string}`, p.fee, p.tickSpacing, p.hooks as `0x${string}`]));
}

export async function verifyDexPools(token: string, pools: StoredPool[], tx: Transport = navTransport, hosts = { verifier: new URL(process.env.VERIFY_RPC_URL || "https://mainnet.base.org").host, indexer: new URL(RPC_URL).host }): Promise<DexReview> {
  const claims: DexClaim[] = [];
  const add = (claim: string, verdict: DexClaim["verdict"], evidence: string) => claims.push({ claim, verdict, evidence });
  const call = async (to: string, data: string): Promise<string | null> => {
    try {
      const out = await tx.rpc("eth_call", [{ to, data }, "latest"]);
      return typeof out === "string" && out.length > 2 ? out : null;
    } catch {
      return null;
    }
  };
  add("verifier reads a different RPC provider than the indexer", hosts.verifier !== hosts.indexer ? "CONFIRMED" : "UNSURE", `verifier ${hosts.verifier}, indexer ${hosts.indexer}`);
  const t = token.toLowerCase();
  const covered: string[] = [];
  for (const p of pools) {
    const c0 = p.currency0.toLowerCase();
    const c1 = p.currency1.toLowerCase();
    const q = CANON[p.quote as "USDC" | "WETH" | "ETH"];
    const shape = q !== undefined && [c0, c1].includes(t) && [c0, c1].includes(q) && BigInt(c0) < BigInt(c1);
    if (!shape) {
      add(`${p.venue} ${p.pool_ref} currencies`, "REJECTED", `stored ${c0}/${c1} quote ${p.quote}`);
      continue;
    }
    if (p.venue === "uniswap_v4") {
      if (p.hooks?.toLowerCase() !== CANON.ETH) {
        add(`v4 ${p.pool_ref} has no hooks`, "REJECTED", `hooks ${p.hooks}`);
        continue;
      }
      const id = v4PoolId({ currency0: c0, currency1: c1, fee: p.fee ?? -1, tickSpacing: p.tick_spacing ?? 0, hooks: CANON.ETH });
      if (id.toLowerCase() !== p.pool_ref.toLowerCase()) {
        add(`v4 ${p.pool_ref} id`, "REJECTED", `keccak(PoolKey) = ${id}`);
        continue;
      }
      const s0 = await call(CANON.stateView, DEX_SEL.getSlot0V4 + p.pool_ref.slice(2).padStart(64, "0"));
      const init = s0 !== null && BigInt("0x" + s0.slice(2, 66)) > 0n;
      add(`v4 ${p.pool_ref.slice(0, 12)}… initialized`, s0 === null ? "UNSURE" : init ? "CONFIRMED" : "REJECTED", s0 === null ? "unreadable" : init ? "sqrtPriceX96 > 0" : "not initialized");
      if (init) covered.push(p.pool_ref);
      continue;
    }
    const factory = CANON[p.venue as "uniswap_v3" | "aerodrome_v2" | "aerodrome_cl"];
    if (!factory) {
      add(`${p.pool_ref} venue`, "REJECTED", `unknown venue ${p.venue}`);
      continue;
    }
    const arg = p.venue === "uniswap_v3" ? uintWord(p.fee ?? 0) : p.venue === "aerodrome_v2" ? uintWord(p.stable ? 1 : 0) : intWord(p.tick_spacing ?? 0);
    const sel = p.venue === "uniswap_v3" ? DEX_SEL.getPoolV3 : p.venue === "aerodrome_v2" ? DEX_SEL.getPoolAeroV2 : DEX_SEL.getPoolCl;
    const got = asAddr(await call(factory, sel + addrWord(t) + addrWord(q) + arg));
    const [a0, a1] = [asAddr(await call(p.pool_ref, DEX_SEL.token0)), asAddr(await call(p.pool_ref, DEX_SEL.token1))];
    if (got === null || a0 === null || a1 === null) {
      add(`${p.venue} ${p.pool_ref}`, "UNSURE", "unreadable");
      continue;
    }
    const ok = got === p.pool_ref.toLowerCase() && a0 === c0 && a1 === c1;
    add(`${p.venue} ${p.pool_ref} is the factory's pool for this pair`, ok ? "CONFIRMED" : "REJECTED", `factory ${got}, token0 ${a0}, token1 ${a1}`);
    if (ok) covered.push(p.pool_ref);
  }
  const verdict = claims.some((c) => c.verdict === "REJECTED") ? "REJECTED" : claims.some((c) => c.verdict === "UNSURE") ? "UNSURE" : "CONFIRMED";
  return { verdict, pools_checked: pools.length, claims, covered, checked_at: new Date().toISOString(), verifier_rpc_host: hosts.verifier };
}
