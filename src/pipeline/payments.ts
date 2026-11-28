import type { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import { CHAIN_ID } from "../config.ts";

// ROADMAP Phase 1.4 (approved 2026-11-28): the research robot counts keldrin's x402 payments onchain (it has an
// Alchemy RPC; Base's public RPC refuses eth_getLogs from the API) and appends them to x402_payments. /v1/stats then
// reads the table instead of scanning the chain at request time. Incremental: each run scans from the last scanned
// block + 1 up to the chain's FINALIZED block, so an append-only row can never come from a block that is later reorged.

export const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
export const ROUTER = "0x8aee621035d93deb3c0c1177fac252dc2dd501a0";
export const PAYOUT = "0xb98f0de777eea8c481b64e33d3e0066cea38fa91";
export const PRICE_RAW = 50_000n; // $0.05 USDC (6 decimals)
export const PAYMENTS_FROM_BLOCK = 63_080_000n; // keldrin's Bankr endpoints went live after this block (2026-11-27)
const TRANSFER = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const CHUNK = 10_000n;
const pad = (a: string) => "0x" + a.toLowerCase().replace(/^0x/, "").padStart(64, "0");

export type Rpc = (method: string, params: unknown[]) => Promise<any>;
type Log = { transactionHash: string; blockNumber?: string; topics: string[]; data: string; address?: string };
export type Payment = { tx_hash: string; block_number: bigint; payer: string; amount_raw: bigint };

/** Payments in [from, to]: forwards router -> payout, then each forward's receipt must hold a 50000 transfer into the router. */
export async function scanPayments(rpc: Rpc, from: bigint, to: bigint): Promise<Payment[]> {
  const forwards: Log[] = [];
  for (let a = from; a <= to; a += CHUNK) {
    const b = a + CHUNK - 1n < to ? a + CHUNK - 1n : to;
    forwards.push(...((await rpc("eth_getLogs", [{ address: USDC, topics: [TRANSFER, pad(ROUTER), pad(PAYOUT)], fromBlock: "0x" + a.toString(16), toBlock: "0x" + b.toString(16) }])) as Log[]));
  }
  const out: Payment[] = [];
  for (const tx of [...new Set(forwards.map((l) => l.transactionHash))]) {
    const rc = (await rpc("eth_getTransactionReceipt", [tx])) as { blockNumber: string; status?: string; logs: Log[] } | null;
    if (!rc) throw new Error(`receipt unavailable for ${tx}`); // fail the run (retried next run) rather than skip a payment
    if (rc.status !== undefined && rc.status !== "0x1") continue;
    // assumes one keldrin payment per transaction (Bankr settles each x402 call in its own tx); a batched tx paying
    // several sellers could be misattributed, so re-check this if Bankr ever batches
    const inbound = rc.logs.find((l) => l.address?.toLowerCase() === USDC.toLowerCase() && l.topics[0] === TRANSFER && l.topics[2]?.toLowerCase() === pad(ROUTER) && BigInt(l.data) === PRICE_RAW);
    if (inbound) out.push({ tx_hash: tx.toLowerCase(), block_number: BigInt(rc.blockNumber), payer: "0x" + inbound.topics[1].slice(26).toLowerCase(), amount_raw: PRICE_RAW });
  }
  return out;
}

/** One incremental run: scan new blocks, append payments and a scan row. */
export async function indexPayments(db: PGlite, rpc: Rpc, rpcHost: string): Promise<{ from: bigint; to: bigint; found: number; skipped: boolean }> {
  const fin = (await rpc("eth_getBlockByNumber", ["finalized", false])) as { number?: string } | null;
  if (!fin?.number) throw new Error("finalized block unavailable");
  const head = BigInt(fin.number);
  const last = (await db.query<{ to_block: string | null }>("SELECT max(to_block)::text AS to_block FROM x402_payment_scans WHERE chain_id = $1", [CHAIN_ID])).rows[0]?.to_block;
  const from = last ? BigInt(last) + 1n : PAYMENTS_FROM_BLOCK;
  const to = head;
  if (to < from) return { from, to, found: 0, skipped: true };
  const found = await scanPayments(rpc, from, to);
  for (const p of found) {
    await db.query("INSERT INTO x402_payments (chain_id, tx_hash, block_number, payer, amount_raw, router, payout) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING",
      [CHAIN_ID, p.tx_hash, p.block_number.toString(), p.payer, p.amount_raw.toString(), ROUTER, PAYOUT]);
  }
  await db.query("INSERT INTO x402_payment_scans (scan_id, chain_id, from_block, to_block, payments_found, rpc_host) VALUES ($1,$2,$3,$4,$5,$6)",
    [randomUUID(), CHAIN_ID, from.toString(), to.toString(), found.length, rpcHost]);
  return { from, to, found: found.length, skipped: false };
}
