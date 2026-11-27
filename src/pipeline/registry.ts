import { getAddress } from "viem";
import { B20_FACTORY, CHAIN_ID } from "../config.ts";
import { readMany } from "../adapters/chain.ts";
import type { RegistryToken } from "../adapters/coinbase.ts";
import { isValidIsin } from "../lib/isin.ts";
import { doubleMatchesWad } from "../lib/decimal.ts";

export type AssetIdentity = {
  chain_id: number;
  contract_address: string;
  symbol_registry: string;
  symbol_onchain: string | null;
  name: string;
  decimals_registry: number;
  decimals_onchain: number | null;
  isin_registry: string | null;
  isin_onchain: string | null;
  is_b20: boolean | null;
  multiplier_wad: string | null;
  registry_multiplier_double: number | null;
  first_mint_date: string | null;
  observed_block: string;
  checks: { name: string; result: "pass" | "fail" | "unknown"; detail?: string }[];
  identity_state: "verified" | "mismatch" | "incomplete";
};

/** Cross-check every registry token against chain state at one block. Fails closed: any mismatch → "mismatch". */
export async function verifyIdentities(tokens: RegistryToken[], block: bigint): Promise<AssetIdentity[]> {
  const addrs = tokens.map((t) => getAddress(t.contract_address));
  const calls = addrs.flatMap((a) => [
    { address: B20_FACTORY, fn: "isB20" as const, args: [a] },
    { address: a, fn: "symbol" as const },
    { address: a, fn: "decimals" as const },
    { address: a, fn: "extraMetadata" as const, args: ["isin"] },
    { address: a, fn: "multiplier" as const },
  ]);
  const r = await readMany(calls, block);
  return tokens.map((t, i) => {
    const [isB20, sym, dec, isin, mult] = r.slice(i * 5, i * 5 + 5) as [boolean | null, string | null, number | null, string | null, bigint | null];
    const checks: AssetIdentity["checks"] = [];
    const c = (name: string, ok: boolean | null, detail?: string) => checks.push({ name, result: ok === null ? "unknown" : ok ? "pass" : "fail", detail });
    c("factory_is_b20", isB20);
    c("symbol_matches", sym === null ? null : sym === t.symbol, `registry=${t.symbol} onchain=${sym}`);
    c("decimals_match", dec === null ? null : Number(dec) === Number(t.decimals));
    c("isin_check_digit", t.isin ? isValidIsin(t.isin) : null, t.isin ?? "registry isin missing");
    c("isin_matches_onchain", !t.isin || isin === null || isin === "" ? null : isin === t.isin, `onchain=${isin || "unset"}`);
    c("multiplier_double_matches_wad", mult === null || typeof t.multiplier !== "number" ? null : doubleMatchesWad(t.multiplier, mult));
    const state = checks.some((x) => x.result === "fail") ? "mismatch" : checks.every((x) => x.result === "pass") ? "verified" : "incomplete";
    return {
      chain_id: CHAIN_ID,
      contract_address: addrs[i],
      symbol_registry: t.symbol,
      symbol_onchain: sym,
      name: t.name,
      decimals_registry: Number(t.decimals),
      decimals_onchain: dec === null ? null : Number(dec),
      isin_registry: t.isin ?? null,
      isin_onchain: isin || null,
      is_b20: isB20,
      multiplier_wad: mult?.toString() ?? null,
      registry_multiplier_double: typeof t.multiplier === "number" ? t.multiplier : null,
      first_mint_date: t.first_mint_date ?? null,
      observed_block: block.toString(),
      checks,
      identity_state: state,
    };
  });
}
