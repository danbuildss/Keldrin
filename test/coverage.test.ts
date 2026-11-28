// Coverage level per token (ROADMAP Phase 1.3): derived from records only.
import { test } from "node:test";
import assert from "node:assert/strict";
import { openDb, upsertAsset } from "../src/db/db.ts";
import { coverageMap, coverageOf } from "../src/api/coverage.ts";

test("coverage: levels follow identity, a CONFIRMED NAV review and CONFIRMED pools", () => {
  assert.equal(coverageOf({ id_ok: true, nav_ok: true, dex_ok: true }).coverage_level, "full");
  assert.equal(coverageOf({ id_ok: true, nav_ok: false, dex_ok: true }).coverage_level, "market");
  assert.equal(coverageOf({ id_ok: true, nav_ok: false, dex_ok: false }).coverage_level, "identity");
  const bad = coverageOf({ id_ok: false, nav_ok: true, dex_ok: true });
  assert.equal(bad.coverage_level, "unverified");
  assert.equal(bad.capabilities.nav_history, false, "a failed identity check never unlocks NAV");
  assert.deepEqual(coverageOf({ id_ok: true, nav_ok: false, dex_ok: true }).capabilities, { identity: true, corporate_actions: true, nav_history: false, risk: false, market_context: false, dex_price: true });
});

test("coverage: the SQL runs on the real schema; a token with no reviews is identity-level", async () => {
  const db = await openDb();
  try {
    await upsertAsset(db, { chain_id: 8453, contract_address: "0xb20000000000000000000078ee7ce2fE4908108C", symbol_registry: "NVDAc", symbol_onchain: "NVDAc", name: "NVIDIA", decimals_registry: 18, decimals_onchain: 18, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" });
    const m = await coverageMap(db);
    assert.equal(m.get("0xb20000000000000000000078ee7ce2fe4908108c")?.coverage_level, "identity");
    await db.query("INSERT INTO dex_reviews (review_id, chain_id, token_address, verdict, pools_checked, detail, checked_at) VALUES ('r1',8453,'0xb20000000000000000000078ee7ce2fE4908108C','CONFIRMED',1,$1,now())", [JSON.stringify({ covered: ["uniswap_v3:0xp"] })]);
    assert.equal((await coverageMap(db)).get("0xb20000000000000000000078ee7ce2fe4908108c")?.coverage_level, "market");
  } finally {
    await db.close();
  }
});

test("coverage: a failing coverage query returns null so /v1/assets can still answer (as unknown)", async () => {
  const broken = { query: async () => { throw new Error("permission denied for table nav_reviews"); } };
  assert.equal(await coverageMap(broken as never), null);
});
