// Public product experience: /v1/stats counts from real tables and payments counted onchain (fake chain here).
import { test } from "node:test";
import assert from "node:assert/strict";
import { openDb, upsertAsset } from "../src/db/db.ts";
import { countPayments, resetPaymentCursor, stats } from "../src/api/stats.ts";

const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const pad = (a: string) => "0x" + a.toLowerCase().replace(/^0x/, "").padStart(64, "0");
const ROUTER = "0x8aee621035d93deb3c0c1177fac252dc2dd501a0";
const PAYOUT = "0xb98f0de777eea8c481b64e33d3e0066cea38fa91";
const BUYER = "0x1111111111111111111111111111111111111111";
const amt = (n: number) => "0x" + n.toString(16).padStart(64, "0");

function fakeChain() {
  // tx A: an external buyer pays keldrin (50000); tx B: a Breakra payment (20000) to the same router/payout
  const receipts: Record<string, unknown> = {
    "0xa": { logs: [{ address: USDC, topics: [TRANSFER, pad(BUYER), pad(ROUTER)], data: amt(50000) }, { address: USDC, topics: [TRANSFER, pad(ROUTER), pad(PAYOUT)], data: amt(47500) }] },
    "0xb": { logs: [{ address: USDC, topics: [TRANSFER, pad(PAYOUT), pad(ROUTER)], data: amt(20000) }, { address: USDC, topics: [TRANSFER, pad(ROUTER), pad(PAYOUT)], data: amt(19000) }] },
  };
  return async (method: string, params: any[]) => {
    if (method === "eth_blockNumber") return "0x" + (63_085_000).toString(16);
    if (method === "eth_getLogs") return [{ transactionHash: "0xa", topics: [], data: "0x" }, { transactionHash: "0xb", topics: [], data: "0x" }];
    if (method === "eth_getTransactionReceipt") return receipts[params[0]];
    throw new Error("unexpected " + method);
  };
}

test("payments: only $0.05 transfers to Bankr's router that were forwarded to the payout wallet count; the owner is not external", async () => {
  resetPaymentCursor();
  const p = await countPayments(fakeChain());
  assert.equal(p.payments, 1);
  assert.deepEqual(p.transactions, ["0xa"]);
  assert.equal(p.external_paying_wallets, 1);
});

test("stats: counts come from the tables; a failed onchain read is reported, never invented", async () => {
  const db = await openDb();
  try {
    await upsertAsset(db, { chain_id: 8453, contract_address: "0xb20000000000000000000078ee7ce2fE4908108C", symbol_registry: "NVDAc", symbol_onchain: "NVDAc", name: "NVIDIA", decimals_registry: 18, decimals_onchain: 18, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" });
    resetPaymentCursor();
    await db.query("INSERT INTO dex_pools (chain_id, token_address, venue, pool_ref, currency0, currency1, quote, fee, tick_spacing, hooks, stable, source, discovered_block) VALUES (8453,$1,'uniswap_v3','0xp1','a','b','USDC',3000,null,null,null,'factory','1'),(8453,$1,'uniswap_v3','0xp2','a','b','USDC',500,null,null,null,'factory','1')", ["0xb20000000000000000000078ee7ce2fE4908108C"]);
    await db.query("INSERT INTO dex_reviews (review_id, chain_id, token_address, verdict, pools_checked, detail, checked_at) VALUES ('r1',8453,$1,'CONFIRMED',2,$2,now())", ["0xb20000000000000000000078ee7ce2fE4908108C", JSON.stringify({ covered: ["uniswap_v3:0xp1"] })]);
    const ok: any = await stats(db, fakeChain());
    assert.equal(ok.body.data.dex_pools_verified.count, 1, "only pools in the latest CONFIRMED review are 'verified'");
    assert.equal(ok.body.data.dex_pools_verified.discovered, 2);
    assert.equal(ok.body.data.assets_tracked, 1);
    assert.equal(ok.body.data.x402_payments.payments, 1);
    assert.deepEqual(ok.body.data.confirmed_external_integrations, []);
    resetPaymentCursor();
    const down: any = await stats(db, async () => { throw new Error("429"); });
    assert.equal(down.body.data.x402_payments, null);
    assert.ok(down.body.data.x402_payments_unavailable_reason);
  } finally {
    await db.close();
  }
});

test("payments: after one full scan, the next count only scans new blocks", async () => {
  resetPaymentCursor();
  let head = 63_085_000;
  const ranges: string[] = [];
  const base = fakeChain();
  const rpc = async (m: string, p: any[]) => {
    if (m === "eth_blockNumber") return "0x" + head.toString(16);
    if (m === "eth_getLogs") { ranges.push(p[0].fromBlock); return ranges.length <= 1 ? base(m, p) : []; }
    return base(m, p);
  };
  assert.equal((await countPayments(rpc)).payments, 1);
  const full = ranges.length;
  head += 50;
  const again = await countPayments(rpc);
  assert.equal(again.payments, 1, "earlier payments are kept");
  assert.equal(ranges.length, full + 1, "only one new range scanned");
  assert.equal(BigInt(ranges.at(-1)!), 63_085_001n);
  resetPaymentCursor();
});
