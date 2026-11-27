import { createPublicClient, http, parseAbi } from "viem";
import { base } from "viem/chains";
const c = createPublicClient({ chain: base, transport: http(process.env.BASE_RPC_URL), batch: { multicall: true } });
const A = parseAbi([
  "function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)",
  "function getRoundData(uint80) view returns (uint80,int256,uint256,uint256,uint80)",
  "function phaseId() view returns (uint16)", "function phaseAggregators(uint16) view returns (address)",
  "function decimals() view returns (uint8)", "function description() view returns (string)", "function version() view returns (uint256)",
]);
const feeds = (await (await fetch("https://api.coinbase.com/v1/tokenized-stocks/nav-feeds")).json()).nav_feeds as { contract_address: string; nav_feed_address: string }[];
const toks = (await (await fetch("https://api.coinbase.com/v1/tokenized-stocks?include_zero_supply=false&page_size=500")).json()).tokens as any[];
console.log("nav feeds listed:", feeds.length, "| tokens with supply:", toks.length);
const sym = process.argv[2] ?? "NVDAc";
const tok = toks.find((t) => t.symbol === sym)!;
const feed = feeds.find((f) => f.contract_address.toLowerCase() === tok.contract_address.toLowerCase())!.nav_feed_address as `0x${string}`;
const [desc, dec, ver, phase, latest] = await Promise.all(["description", "decimals", "version", "phaseId", "latestRoundData"].map((fn) => c.readContract({ address: feed, abi: A, functionName: fn as any })));
const [rid, ans, , upd] = latest as any;
console.log({ sym, feed, desc, dec, ver: String(ver), phase, latestRound: String(rid), aggRound: String(rid & ((1n << 64n) - 1n)), answer: Number(ans) / 10 ** Number(dec), updatedAt: new Date(Number(upd) * 1000).toISOString(), coinbase_nav: tok.nav_price, multiplier: tok.multiplier });
for (let p = 1; p <= Number(phase); p++) {
  const agg = await c.readContract({ address: feed, abi: A, functionName: "phaseAggregators", args: [p] });
  const first = await c.readContract({ address: feed, abi: A, functionName: "getRoundData", args: [(BigInt(p) << 64n) | 1n] }).catch((e) => "ERR " + String(e.shortMessage ?? e.message).slice(0, 80));
  console.log("phase", p, agg, Array.isArray(first) ? { firstRoundAt: new Date(Number(first[3]) * 1000).toISOString(), firstAnswer: Number(first[1]) / 10 ** Number(dec) } : first);
}
// density: sample last 200 rounds of current phase
const n = Number(rid & ((1n << 64n) - 1n));
const ids = Array.from({ length: Math.min(200, n) }, (_, i) => rid - BigInt(i));
const t0 = Date.now();
const rs = await c.multicall({ allowFailure: true, contracts: ids.map((id) => ({ address: feed, abi: A, functionName: "getRoundData" as const, args: [id] })) });
const ok = rs.filter((r) => r.status === "success").map((r: any) => Number(r.result[3]));
const gaps = ok.slice(1).map((t, i) => ok[i] - t).sort((a, b) => a - b);
console.log({ sampled: ids.length, ok: ok.length, ms: Date.now() - t0, span_hours: ((ok[0] - ok[ok.length - 1]) / 3600).toFixed(1), median_gap_min: (gaps[Math.floor(gaps.length / 2)] / 60).toFixed(1), max_gap_hours: (gaps[gaps.length - 1] / 3600).toFixed(1), rounds_in_current_phase: n });
