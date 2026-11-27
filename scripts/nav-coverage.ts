// Research probe (2026-11-27): how much Chainlink NAV history exists per Coinbase tokenized stock on Base.
import { createPublicClient, http, parseAbi } from "viem";
import { base } from "viem/chains";
const c = createPublicClient({ chain: base, transport: http(process.env.BASE_RPC_URL), batch: { multicall: true } });
const A = parseAbi(["function latestRoundData() view returns (uint80,int256,uint256,uint256,uint80)", "function getRoundData(uint80) view returns (uint80,int256,uint256,uint256,uint80)", "function phaseId() view returns (uint16)"]);
const feeds = (await (await fetch("https://api.coinbase.com/v1/tokenized-stocks/nav-feeds")).json()).nav_feeds as any[];
const toks = (await (await fetch("https://api.coinbase.com/v1/tokenized-stocks?page_size=500")).json()).tokens as any[];
let total = 0;
for (const f of feeds) {
  const sym = toks.find((t) => t.contract_address.toLowerCase() === f.contract_address.toLowerCase())?.symbol ?? "?";
  const [phase, latest] = await Promise.all([c.readContract({ address: f.nav_feed_address, abi: A, functionName: "phaseId" }), c.readContract({ address: f.nav_feed_address, abi: A, functionName: "latestRoundData" })]);
  let rounds = 0; let first = "";
  for (let p = 1; p <= Number(phase); p++) {
    const last = p === Number(phase) ? Number((latest as any)[0] & ((1n << 64n) - 1n)) : -1;
    if (p === 1) { const r: any = await c.readContract({ address: f.nav_feed_address, abi: A, functionName: "getRoundData", args: [(1n << 64n) | 1n] }).catch(() => null); first = r ? new Date(Number(r[3]) * 1000).toISOString().slice(0, 10) : "?"; }
    if (last > 0) rounds += last;
  }
  total += rounds;
  console.log(sym.padEnd(7), "phases", phase, "rounds(current phase)", String(rounds).padStart(5), "first", first, "latest", new Date(Number((latest as any)[3]) * 1000).toISOString().slice(0, 16));
}
console.log("feeds", feeds.length, "rounds in current phases", total);
