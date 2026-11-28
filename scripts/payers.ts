// keldrin paying wallets (Phase 13), counted onchain from USDC transfers. Read-only.
//   node scripts/payers.ts [--from=<block>] [--exclude=0xabc,0xdef]
// A keldrin x402 payment is a $0.05 USDC (50000) transfer from the buyer to Bankr's fee router, which forwards to the
// payout wallet in the same transaction. Breakra shares the payout wallet at $0.02, so keldrin payments are told apart
// by the 50000 amount AND a router → payout transfer in the same transaction. A wallet is never a person; the owner's
// own wallets (payout, test wallets passed in --exclude) are left out of the external count.
const RPC = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ROUTER = "0x8aee621035d93deb3c0c1177fac252dc2dd501a0";
const PAYOUT = "0xb98f0de777eea8c481b64e33d3e0066cea38fa91";
const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const DEPLOYED_FROM = 63_080_000n; // keldrin's Bankr endpoints went live after this block (2026-11-27)
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1];
const from = BigInt(arg("from") ?? DEPLOYED_FROM);
const exclude = new Set([PAYOUT, ...(arg("exclude") ?? "").split(",").filter(Boolean)].map((a) => a.toLowerCase()));
const pad = (a: string) => "0x" + a.toLowerCase().replace(/^0x/, "").padStart(64, "0");

async function rpc(method: string, params: unknown[]) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.BASE_RPC_BEARER) headers.authorization = `Bearer ${process.env.BASE_RPC_BEARER}`;
  const r = await fetch(RPC, { method: "POST", headers, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  const j = (await r.json()) as { result?: any; error?: { message: string } };
  if (j.error) throw new Error(`${method}: ${j.error.message}`);
  return j.result;
}
type Log = { transactionHash: string; topics: string[]; data: string; blockNumber: string };
async function logs(topics: (string | null)[], fromBlock: bigint, toBlock: bigint): Promise<Log[]> {
  const out: Log[] = [];
  const step = 10_000n;
  for (let a = fromBlock; a <= toBlock; a += step) {
    const b = a + step - 1n < toBlock ? a + step - 1n : toBlock;
    out.push(...((await rpc("eth_getLogs", [{ address: USDC, topics, fromBlock: "0x" + a.toString(16), toBlock: "0x" + b.toString(16) }])) as Log[]));
  }
  return out;
}

const head = BigInt(await rpc("eth_blockNumber", []));
const forwarded = new Set((await logs([TRANSFER, pad(ROUTER), pad(PAYOUT)], from, head)).map((l) => l.transactionHash));
const toRouter = (await logs([TRANSFER, null, pad(ROUTER)], from, head)).filter((l) => BigInt(l.data) === 50_000n && forwarded.has(l.transactionHash));
const byWallet = new Map<string, { calls: number; days: Set<string> }>();
for (const l of toRouter) {
  const payer = "0x" + l.topics[1].slice(26);
  const ts = Number(BigInt((await rpc("eth_getBlockByNumber", [l.blockNumber, false])).timestamp));
  const w = byWallet.get(payer) ?? { calls: 0, days: new Set<string>() };
  w.calls++;
  w.days.add(new Date(ts * 1000).toISOString().slice(0, 10));
  byWallet.set(payer, w);
}
const external = [...byWallet].filter(([a]) => !exclude.has(a));
console.log(`blocks ${from}..${head}: ${toRouter.length} keldrin payment(s) of $0.05 forwarded to the payout wallet`);
console.log(`wallets: ${byWallet.size} total, ${external.length} external (excluded: payout + ${exclude.size - 1} given)`);
for (const [a, w] of external) console.log(`  ${a}  ${w.calls} call(s) on ${w.days.size} day(s)`);
console.log(`external wallets that paid on 2+ different days: ${external.filter(([, w]) => w.days.size >= 2).length}`);
