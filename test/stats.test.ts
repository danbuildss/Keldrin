// Public product experience: /v1/stats counts from real tables and payments counted onchain (fake chain here).
import { test } from "node:test";
import assert from "node:assert/strict";
import { openDb, upsertAsset } from "../src/db/db.ts";
import { countPayments, stats } from "../src/api/stats.ts";

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
  const p = await countPayments(fakeChain());
  assert.equal(p.payments, 1);
  assert.deepEqual(p.transactions, ["0xa"]);
  assert.equal(p.external_paying_wallets, 1);
});

test("stats: counts come from the tables; a failed onchain read is reported, never invented", async () => {
  const db = await openDb();
  try {
    await upsertAsset(db, { chain_id: 8453, contract_address: "0xb20000000000000000000078ee7ce2fE4908108C", symbol_registry: "NVDAc", symbol_onchain: "NVDAc", name: "NVIDIA", decimals_registry: 18, decimals_onchain: 18, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" });
    const ok: any = await stats(db, fakeChain());
    assert.equal(ok.body.data.assets_tracked, 1);
    assert.equal(ok.body.data.x402_payments.payments, 1);
    assert.deepEqual(ok.body.data.confirmed_external_integrations, []);
    const down: any = await stats(db, async () => { throw new Error("429"); });
    assert.equal(down.body.data.x402_payments, null);
    assert.ok(down.body.data.x402_payments_unavailable_reason);
  } finally {
    await db.close();
  }
});
