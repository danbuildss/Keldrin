// Phase 8 tests: pool math, v4 pool ids, log parsing, the pool verifier, live DEX reads (fake RPC) and the market-context gap.
import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeFunctionData, encodeFunctionResult, parseAbi, toFunctionSelector } from "viem";
import { openDb, upsertAsset } from "../src/db/db.ts";
import { depth2pctConcentrated, fmt18, liveDex, priceFromSqrt, selectMain, type PoolQuote } from "../src/api/dex.ts";
import { scanV4Initialize, V4_FROM_BLOCK, V4_LOG_CHUNK } from "../src/pipeline/dexPools.ts";
import { parseV4Initialize, V4_INITIALIZE_TOPIC } from "../src/pipeline/dexPools.ts";
import { DEX_SEL, v4PoolId, verifyDexPools } from "../src/verify/dexVerify.ts";
import { marketContext } from "../src/api/marketContext.ts";
import { insertNavReview } from "../src/pipeline/navStore.ts";

const NV = "0xb20000000000000000000078ee7ce2fE4908108C";
const USDC = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
const ETH = "0x0000000000000000000000000000000000000000";
const V3_POOL = "0x60661b315553EB81872deEA9a66d567Cf0CCd33B";
const HOSTS = { verifier: "v.example", indexer: "i.example" };

test("selectors equal the canonical signatures", () => {
  assert.equal(DEX_SEL.getPoolV3, toFunctionSelector("getPool(address,address,uint24)"));
  assert.equal(DEX_SEL.getPoolAeroV2, toFunctionSelector("getPool(address,address,bool)"));
  assert.equal(DEX_SEL.getPoolCl, toFunctionSelector("getPool(address,address,int24)"));
  assert.equal(DEX_SEL.getSlot0V4, toFunctionSelector("getSlot0(bytes32)"));
});

test("v4 pool id: keccak256(abi.encode(PoolKey)) matches a real pool id read from Base", () => {
  // a real NVDAc/ETH no-hook pool from the PoolManager's Initialize event (2026-11-27)
  assert.equal(v4PoolId({ currency0: ETH, currency1: NV, fee: 810000, tickSpacing: 8100, hooks: ETH }), "0x08bc5dabb29b203a9c991865f913e973ebbe125ceec372b440ab46e755ec8e16");
});

test("Initialize log parsing incl. a negative-looking int24", () => {
  const word = (h: string) => h.padStart(64, "0");
  const p = parseV4Initialize({
    topics: [V4_INITIALIZE_TOPIC, "0x" + "ab".repeat(32), "0x" + word(USDC.slice(2).toLowerCase()), "0x" + word(NV.slice(2).toLowerCase())],
    data: "0x" + word((3000).toString(16)) + word((60).toString(16)) + word("0") + word("1") + "f".repeat(64),
    transactionHash: "0x1",
  });
  assert.deepEqual([p.currency0, p.currency1, p.fee, p.tickSpacing, p.hooks], [USDC, NV, 3000, 60, ETH]);
});

test("price from sqrtPriceX96, both token orders, with decimal shift; exact formatting", () => {
  const Q96 = 2n ** 96n;
  assert.equal(priceFromSqrt(Q96, true, 18, 18), "1");
  assert.equal(priceFromSqrt(Q96, false, 18, 18), "1");
  // token0 = USDC (6 dec), token1 = stock (18 dec); raw price token1/token0 = 1e18/150e6 → 150 USDC per stock
  const sqrt = BigInt(Math.floor(Math.sqrt(1e18 / 150e6) * 2 ** 48)) * 2n ** 48n;
  const p = Number(priceFromSqrt(sqrt, false, 18, 6));
  assert.ok(Math.abs(p - 150) < 1e-6, String(p));
  assert.equal(fmt18(1500000000000000000n), "1.5");
});

test("2% depth for concentrated liquidity matches the closed form", () => {
  const Q96 = 2n ** 96n;
  const d = depth2pctConcentrated(10n ** 18n, Q96, true, 18);
  assert.ok(Math.abs(d - (Math.sqrt(1.02) - 1)) < 1e-12);
  assert.equal(depth2pctConcentrated(0n, Q96, true, 18), 0);
});

// a fake chain that answers factory/pool/StateView calls for the verifier
function fakeVerifyRpc(o: { factoryReturns?: string; token0?: string; token1?: string; v4Init?: boolean } = {}) {
  return {
    async rpc(_m: string, params: any[]) {
      const data: string = params[0].data;
      const w = (a: string) => "0x" + a.slice(2).toLowerCase().padStart(64, "0");
      if (data.startsWith(DEX_SEL.getPoolV3)) return w(o.factoryReturns ?? V3_POOL);
      if (data === DEX_SEL.token0) return w(o.token0 ?? USDC);
      if (data === DEX_SEL.token1) return w(o.token1 ?? NV);
      if (data.startsWith(DEX_SEL.getSlot0V4)) return "0x" + ((o.v4Init ?? true) ? "1".padStart(64, "0") : "0".padStart(64, "0")) + "0".repeat(192);
      throw new Error("unexpected");
    },
  };
}
const v3 = { venue: "uniswap_v3", pool_ref: V3_POOL, currency0: USDC, currency1: NV, quote: "USDC", fee: 3000, tick_spacing: null, hooks: null, stable: null };
const v4 = { venue: "uniswap_v4", pool_ref: "0x08bc5dabb29b203a9c991865f913e973ebbe125ceec372b440ab46e755ec8e16", currency0: ETH, currency1: NV, quote: "ETH", fee: 810000, tick_spacing: 8100, hooks: ETH, stable: null };

test("pool verifier: CONFIRMED when re-derived; REJECTED for a wrong factory answer, wrong tokens, a hooked or mis-keyed v4 pool", async () => {
  const ok = await verifyDexPools(NV, [v3, v4], fakeVerifyRpc(), HOSTS);
  assert.equal(ok.verdict, "CONFIRMED", JSON.stringify(ok.claims.filter((c) => c.verdict !== "CONFIRMED")));
  assert.deepEqual(ok.covered, [`uniswap_v3:${V3_POOL}`, `uniswap_v4:${v4.pool_ref}`]);
  assert.equal((await verifyDexPools(NV, [v3], fakeVerifyRpc({ factoryReturns: "0x1111111111111111111111111111111111111111" }), HOSTS)).verdict, "REJECTED");
  assert.equal((await verifyDexPools(NV, [v3], fakeVerifyRpc({ token1: USDC }), HOSTS)).verdict, "REJECTED");
  assert.equal((await verifyDexPools(NV, [{ ...v4, hooks: "0xbdf938149ac6a781f94faa0ed45e6a0e984c6544" }], fakeVerifyRpc(), HOSTS)).verdict, "REJECTED");
  assert.equal((await verifyDexPools(NV, [{ ...v4, fee: 3000 }], fakeVerifyRpc(), HOSTS)).verdict, "REJECTED", "the id must match the stored key");
  assert.equal((await verifyDexPools(NV, [v4], fakeVerifyRpc({ v4Init: false }), HOSTS)).verdict, "REJECTED");
  assert.equal((await verifyDexPools(NV, [v3], fakeVerifyRpc(), { verifier: "x", indexer: "x" })).verdict, "UNSURE", "same provider as the indexer");
});

// a fake public RPC that answers Multicall3.aggregate3 by decoding each sub-call
const MC = parseAbi([
  "function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[])",
  "function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)",
  "function liquidity() view returns (uint128)",
  "function decimals() view returns (uint8)",
  "function getPool(address,address,uint24) view returns (address)",
  "function getSlot0(bytes32) view returns (uint160, int24, uint24, uint24)",
  "function getLiquidity(bytes32) view returns (uint128)",
  "function balanceOf(address) view returns (uint256)",
]);
function fakeDexRpc(prices: { stockSqrt: bigint; stockL: bigint; stockBal?: bigint }) {
  const ETH_USD_POOL = "0xd0b53D9277642d899DF5C87A3966A349A798F224";
  const ethSqrt = BigInt(Math.floor(Math.sqrt(3000e6 / 1e18) * 2 ** 96)); // ≈ 3000 USDC per WETH (WETH token0)
  return async (method: string, params: any[]) => {
    if (method === "eth_blockNumber") return "0x3b9aca00";
    try {
    const { args } = decodeFunctionData({ abi: MC, data: params[0].data });
    const calls = args[0] as { target: string; callData: `0x${string}` }[];
    const results = calls.map((c) => {
      const d = decodeFunctionData({ abi: MC, data: c.callData });
      let ret: `0x${string}`;
      if (d.functionName === "decimals") ret = encodeFunctionResult({ abi: MC, functionName: "decimals", result: 18 });
      else if (d.functionName === "getPool") ret = encodeFunctionResult({ abi: MC, functionName: "getPool", result: ETH_USD_POOL });
      else if (d.functionName === "slot0") ret = encodeFunctionResult({ abi: MC, functionName: "slot0", result: [c.target.toLowerCase() === ETH_USD_POOL.toLowerCase() ? ethSqrt : prices.stockSqrt, 0, 0, 0, 0, 0, true] });
      else if (d.functionName === "liquidity") ret = encodeFunctionResult({ abi: MC, functionName: "liquidity", result: prices.stockL });
      else if (d.functionName === "balanceOf") ret = encodeFunctionResult({ abi: MC, functionName: "balanceOf", result: prices.stockBal ?? 10n ** 30n });
      else if (d.functionName === "getSlot0") ret = encodeFunctionResult({ abi: MC, functionName: "getSlot0", result: [0n, 0, 0, 0] });
      else ret = encodeFunctionResult({ abi: MC, functionName: "getLiquidity", result: 0n });
      return { success: true, returnData: ret };
    });
    return encodeFunctionResult({ abi: MC, functionName: "aggregate3", result: [results] as never });
    } catch (e) {
      console.log("FAKE RPC ERROR", (e as Error).message.slice(0, 300));
      throw e;
    }
  };
}

async function seeded() {
  const db = await openDb();
  await upsertAsset(db, { chain_id: 8453, contract_address: NV, symbol_registry: "NVDAc", symbol_onchain: "NVDAc", name: "x", decimals_registry: 18, decimals_onchain: 18, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" });
  for (const p of [v3, v4]) {
    await db.query("INSERT INTO dex_pools (chain_id, token_address, venue, pool_ref, currency0, currency1, quote, fee, tick_spacing, hooks, stable, source, discovered_block) VALUES (8453,$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'test',1)", [NV, p.venue, p.pool_ref, p.currency0, p.currency1, p.quote, p.fee, p.tick_spacing, p.hooks, p.stable]);
  }
  return db;
}
// stock (token1, 18 dec) at 150 USDC (token0, 6 dec)
const sqrt150 = BigInt(Math.floor(Math.sqrt(1e18 / 150e6) * 2 ** 48)) * 2n ** 48n;

test("live DEX: fails closed without a CONFIRMED review; prices only covered pools; picks the deepest usable pool; thin flag", async () => {
  const db = await seeded();
  try {
    const none: any = await liveDex(db, NV, fakeDexRpc({ stockSqrt: sqrt150, stockL: 10n ** 15n }));
    assert.equal(none.body.data.unavailable_reason, "no_verified_pools");
    await db.query("INSERT INTO dex_reviews (review_id, chain_id, token_address, verdict, pools_checked, detail, checked_at) VALUES ('r1',8453,$1,'CONFIRMED',2,$2,now())", [NV, JSON.stringify({ covered: [`uniswap_v3:${V3_POOL}`] })]);
    const out: any = await liveDex(db, NV, fakeDexRpc({ stockSqrt: sqrt150, stockL: 10n ** 15n }));
    const d = out.body.data;
    assert.equal(d.pools_total, 1, "the uncovered v4 pool is not used");
    assert.equal(d.main.venue, "uniswap_v3");
    assert.ok(Math.abs(Number(d.main.price_usd) - 150) < 1e-4, d.main.price_usd);
    assert.ok(d.main.depth_2pct_usd > 100, String(d.main.depth_2pct_usd));
    assert.equal(typeof d.main.thin_market, "boolean");
    assert.equal(d.block, String(0x3b9aca00));
    assert.equal(d.main.depth_capped_by_balance, true);
    // the same liquidity backed by only 0.75 tokens ($112.50) is capped to what the pool holds
    const capped: any = await liveDex(db, NV, fakeDexRpc({ stockSqrt: sqrt150, stockL: 10n ** 15n, stockBal: 75n * 10n ** 16n }));
    assert.ok(Math.abs(capped.body.data.main.depth_2pct_usd - 112.5) < 0.01, String(capped.body.data.main.depth_2pct_usd));
    assert.equal(capped.body.data.main.thin_market, true);
    const thin: any = await liveDex(db, NV, fakeDexRpc({ stockSqrt: sqrt150, stockL: 10n }));
    assert.equal(thin.body.data.main, null);
    assert.equal(thin.body.data.unavailable_reason, "no_pool_with_usable_depth");
    const down: any = await liveDex(db, NV, async () => {
      throw new Error("x");
    });
    assert.equal(down.body.data.unavailable_reason, "rpc_unavailable");
  } finally {
    await db.close();
  }
});

test("market context carries the DEX price and the gap vs NAV, with a closure note", async () => {
  const db = await seeded();
  const FEED = "0x04689a41629776563E6822F76f2e57D148d28513";
  await db.query("INSERT INTO nav_feeds (chain_id, token_address, feed_address, symbol, description, decimals, source) VALUES (8453,$1,$2,'NVDAc','Coinbase NVDA',8,'test')", [NV, FEED]);
  await db.query("INSERT INTO nav_phases (chain_id, feed_address, phase_id, aggregator_address, aggregator_decimals, proxy_decimals, live_from_block, live_from_time, live_to_block, live_to_time, observed_block) VALUES (8453,$1,2,'0xF72B1eB5932800F3d2a5EeC5f99e6cD586479675',8,8,49669080,'2026-08-07T18:31:47Z',NULL,NULL,1)", [FEED]);
  await insertNavReview(db, FEED, { verdict: "CONFIRMED", sampled: 1, mismatches: 0, claims: [], checked_at: "2026-11-27T19:00:00.000Z", covered: [{ phase: 2, max_round_id: "1", phase_observed_block: "1" }], verifier_rpc_host: "v" }, 1, { official_rounds: 1, missing_round_ids: [], max_in_session_gap_s: 3000, p99_in_session_gap_s: 1200, overlap_rounds_excluded: 0, decimals_conflict_phases: [] });
  const now = new Date("2026-11-28T15:00:00Z");
  const reader = async () => ({ round_id: ((2n << 64n) | 9n).toString(), answer_raw: "15000000000", updated_unix: Date.parse("2026-11-27T17:55:00Z") / 1000, read_at: now.toISOString() });
  const dexReader = async () => ({ status: 200, body: { data: { block: "123", main: { venue: "uniswap_v3", pool: V3_POOL, quote: "USDC", price_usd: "151.50000000", depth_2pct_usd: 2000, thin_market: false } } } });
  try {
    const out: any = await marketContext(db, NV, now, reader, dexReader);
    const dex = out.body.data.dex;
    assert.equal(dex.price_usd, "151.50000000");
    assert.equal(dex.nav_premium_pct, 1, "151.5 vs NAV 150 = +1%");
    assert.match(dex.premium_note, /Market closed/);
    assert.match(dex.premium_note, /block 123/);
    // a NAV that should have updated during an open session: the gap is withheld, not computed
    const openLate = new Date("2026-11-30T19:00:00Z");
    const stale: any = await marketContext(db, NV, openLate, reader, dexReader);
    assert.equal(stale.body.data.staleness.state, "unexpectedly_stale");
    assert.equal(stale.body.data.dex.nav_premium_pct, null);
    assert.equal(stale.body.data.dex.premium_unavailable_reason, "nav_unexpectedly_stale");
    const noDex: any = await marketContext(db, NV, now, reader, async () => ({ status: 200, body: { data: { main: null, unavailable_reason: "no_pool_with_usable_depth" } } }));
    assert.equal(noDex.body.data.dex.price_usd, null);
    assert.equal(noDex.body.data.dex.unavailable_reason, "no_pool_with_usable_depth");
  } finally {
    await db.close();
  }
});

const pq = (o: Partial<PoolQuote>): PoolQuote => ({ venue: "uniswap_v3", pool: "p", quote: "USDC", fee: 3000, price_quote: "1", price_usd: "100", depth_2pct_usd: 5000, depth_capped_by_balance: true, status: "ok", ...o });

test("main market: an uncapped v4 pool must be corroborated; outliers vs capped pools are excluded", () => {
  // a deep but uncorroborated v4 pool cannot become main; the capped pool wins
  let r = selectMain([pq({ pool: "cap", depth_2pct_usd: 500 }), pq({ venue: "uniswap_v4", pool: "v4", price_usd: "110", depth_2pct_usd: 1e9, depth_capped_by_balance: false })]);
  assert.equal(r.main?.pool, "cap");
  // corroborated within 2% → the deeper v4 pool can be main
  r = selectMain([pq({ pool: "cap", depth_2pct_usd: 500 }), pq({ venue: "uniswap_v4", pool: "v4", price_usd: "101", depth_2pct_usd: 1e6, depth_capped_by_balance: false })]);
  assert.equal(r.main?.pool, "v4");
  assert.equal(r.main?.corroborated, true);
  // only an uncapped, uncorroborated pool → no main, with a reason
  r = selectMain([pq({ venue: "uniswap_v4", depth_capped_by_balance: false })]);
  assert.equal(r.main, null);
  assert.equal(r.reason, "uncorroborated_uncapped_pools_only");
  // a pool 30% off the capped median is an outlier
  const out = [pq({ pool: "a" }), pq({ pool: "b", price_usd: "101" }), pq({ pool: "far", price_usd: "130", depth_2pct_usd: 1e6 })];
  r = selectMain(out);
  assert.equal(out[2].status, "outlier");
  assert.notEqual(r.main?.pool, "far");
});

test("live DEX: pools above 1% fee are excluded; coverage is venue-aware", async () => {
  const db = await seeded();
  const HI = "0x2222222222222222222222222222222222222222";
  try {
    await db.query("INSERT INTO dex_pools (chain_id, token_address, venue, pool_ref, currency0, currency1, quote, fee, tick_spacing, hooks, stable, source, discovered_block) VALUES (8453,$1,'uniswap_v3',$2,$3,$1,'USDC',20000,NULL,NULL,NULL,'test',1)", [NV, HI, USDC]);
    await db.query("INSERT INTO dex_reviews (review_id, chain_id, token_address, verdict, pools_checked, detail, checked_at) VALUES ('r2',8453,$1,'CONFIRMED',1,$2,now())", [NV, JSON.stringify({ covered: [`uniswap_v3:${HI}`] })]);
    const d: any = (await liveDex(db, NV, fakeDexRpc({ stockSqrt: sqrt150, stockL: 10n ** 15n }))).body.data;
    assert.equal(d.main, null);
    assert.equal(d.pools[0].status, "high_fee");
    // coverage is venue-aware: the same ref under another venue is not served
    await db.query("INSERT INTO dex_reviews (review_id, chain_id, token_address, verdict, pools_checked, detail, checked_at) VALUES ('r3',8453,$1,'CONFIRMED',1,$2,now() + interval '1 second')", [NV, JSON.stringify({ covered: [`aerodrome_cl:${V3_POOL}`] })]);
    assert.equal((await liveDex(db, NV, fakeDexRpc({ stockSqrt: sqrt150, stockL: 10n ** 15n }))).body.data.pools_total, 0);
  } finally {
    await db.close();
  }
});

test("v4 discovery scan: chunked, both currency orders, halves a refused chunk, reports an incomplete scan", async () => {
  const seen: any[] = [];
  const head = V4_FROM_BLOCK + V4_LOG_CHUNK * 2n;
  const log = (tx: string) => ({ topics: ["0x0", "0x" + tx.padStart(64, "0")], data: "0x", transactionHash: "0x" + tx, blockNumber: "0x1" });
  const r = await scanV4Initialize(head, [["q", "t"], ["t", "q"]], async (f: any) => {
    seen.push(f);
    if (BigInt(f.toBlock) - BigInt(f.fromBlock) + 1n === V4_LOG_CHUNK && BigInt(f.fromBlock) === V4_FROM_BLOCK && f.topics[2] === "q") throw new Error("too large");
    return f.topics[2] === "t" ? [log("aa"), log("aa")] : [log("bb")];
  });
  assert.equal(r.complete, true);
  assert.deepEqual(r.logs.map((l) => l.transactionHash).sort(), ["0xaa", "0xbb"], "deduplicated across chunks and orders");
  assert.ok(seen.some((f) => f.topics[2] === "t" && f.topics[3] === "q"), "the reversed order is queried");
  const bad = await scanV4Initialize(head, [["q", "t"]], async () => {
    throw new Error("down");
  });
  assert.equal(bad.complete, false);
  assert.deepEqual(bad.logs, []);
});

test("priceFromSqrt: the decimal shift is applied before dividing (no precision lost when the stock is token1)", () => {
  // stock token1 (18 dec) vs quote token0 (6 dec), raw ratio 9 stock per quote → 1e12/9 quote per stock
  assert.equal(priceFromSqrt(3n * 2n ** 96n, false, 18, 6), "111111111111.111111111111111111");
});
