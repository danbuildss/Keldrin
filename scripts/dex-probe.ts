// Research probe (Phase 8, 2026-11-27): where do the feed-backed tokenized stocks trade on Base, read onchain only.
// Usage: node scripts/dex-probe.ts NVDAc
import { createPublicClient, http, parseAbi, keccak256, toHex, getAddress, pad } from "viem";
import { base } from "viem/chains";
const c = createPublicClient({ chain: base, transport: http(process.env.BASE_RPC_URL), batch: { multicall: true } });
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const WETH = "0x4200000000000000000000000000000000000006";
const UNI_V3 = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD";
const AERO_V2 = "0x420DD381b31aEf6683db6B902084cB0FFECe40Da";
const AERO_CL = "0x5e7BB104d84c7CB9B682AaC2F3d509f5F406809A";
const V4_PM = "0x498581fF718922c3f8e6A244956aF099B2652b2b";
const A = parseAbi([
  "function getPool(address,address,uint24) view returns (address)",
  "function getPool(address,address,bool) view returns (address)",
  "function getPool(address,address,int24) view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
]);
const toks = (await (await fetch("https://api.coinbase.com/v1/tokenized-stocks?page_size=500")).json()).tokens as any[];
const sym = process.argv[2] ?? "NVDAc";
const t = getAddress(toks.find((x) => x.symbol === sym).contract_address);
console.log(sym, t);
for (const [n, a] of [["uni_v3", UNI_V3], ["aero_v2", AERO_V2], ["aero_cl", AERO_CL], ["v4_pm", V4_PM]]) console.log("code", n, ((await c.getCode({ address: a as `0x${string}` })) ?? "0x").length > 2);
const ZERO = "0x0000000000000000000000000000000000000000";
const found: { venue: string; pool: string; quote: string; key: string }[] = [];
for (const q of [USDC, WETH]) {
  for (const fee of [100, 500, 3000, 10000]) {
    const p = await c.readContract({ address: UNI_V3, abi: [A[0]], functionName: "getPool", args: [t, q, fee] }).catch(() => ZERO);
    if (p !== ZERO) found.push({ venue: "uniswap_v3", pool: p, quote: q, key: `fee ${fee}` });
  }
  for (const st of [false, true]) {
    const p = await c.readContract({ address: AERO_V2, abi: [A[1]], functionName: "getPool", args: [t, q, st] }).catch(() => ZERO);
    if (p !== ZERO) found.push({ venue: "aerodrome_v2", pool: p, quote: q, key: st ? "stable" : "volatile" });
  }
  for (const ts of [1, 10, 50, 100, 200, 2000]) {
    const p = await c.readContract({ address: AERO_CL, abi: [A[2]], functionName: "getPool", args: [t, q, ts] }).catch(() => ZERO);
    if (p !== ZERO) found.push({ venue: "aerodrome_cl", pool: p, quote: q, key: `tickSpacing ${ts}` });
  }
}
for (const f of found) {
  const [bt, bq] = await Promise.all([
    c.readContract({ address: t, abi: [A[3]], functionName: "balanceOf", args: [f.pool as `0x${string}`] }),
    c.readContract({ address: f.quote as `0x${string}`, abi: [A[3]], functionName: "balanceOf", args: [f.pool as `0x${string}`] }),
  ]);
  console.log(f.venue, f.key, f.quote === USDC ? "USDC" : "WETH", f.pool, "token bal", Number(bt) / 1e18, "quote bal", f.quote === USDC ? Number(bq) / 1e6 : Number(bq) / 1e18);
}
// Uniswap v4: Initialize(bytes32 indexed id, address indexed currency0, address indexed currency1, uint24 fee, int24 tickSpacing, address hooks, uint160 sqrtPriceX96, int24 tick)
const topic0 = keccak256(toHex("Initialize(bytes32,address,address,uint24,int24,address,uint160,int24)"));
const tp = pad(t.toLowerCase() as `0x${string}`);
for (const pos of [2, 3]) {
  const topics: (string | null)[] = [topic0, null, null, null];
  topics[pos] = tp;
  const r = await fetch(process.env.BASE_RPC_URL!, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getLogs", params: [{ address: V4_PM, fromBlock: "0x2000000", toBlock: "latest", topics }] }) });
  const j = await r.json();
  if (j.error) console.log("v4 logs error", j.error.message);
  for (const l of j.result ?? []) {
    const d = l.data.slice(2);
    const fee = Number(BigInt("0x" + d.slice(0, 64)));
    const hooks = "0x" + d.slice(128 + 24, 192);
    console.log("uniswap_v4", "id", l.topics[1], "c0", "0x" + l.topics[2].slice(26), "c1", "0x" + l.topics[3].slice(26), "fee", fee, "hooks", hooks, "block", BigInt(l.blockNumber));
  }
}
