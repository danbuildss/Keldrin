// Phase 5/5b tests: session calendar, round-id math, gap retry, live windows, daily closes, the verifier and the API.
// Rows here are labelled test fixtures for logic tests; real data is only ever read from chain.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { toFunctionSelector } from "viem";
import { openDb, upsertAsset } from "../src/db/db.ts";
import { serve } from "../src/api/server.ts";
import { acceptedDescriptions, classifyWindow, gaps, insertRounds, phaseStartBlock, proxyRoundId, splitRoundId, type NavRoundRow } from "../src/pipeline/navIndex.ts";
import { computeNavStats, insertNavReview, loadReviewInput } from "../src/pipeline/navStore.ts";
import { NAV_SEL, verifyNavFeed } from "../src/verify/navVerify.ts";
import { dailyCloses, formatNav, type NavRow } from "../src/api/nav.ts";
import { isTradingDay, nyParts, sessionClose, sessionOpen } from "../src/lib/sessions.ts";

const TOKEN = "0xb20000000000000000000078ee7ce2fE4908108C";
const FEED = "0x04689a41629776563E6822F76f2e57D148d28513";
const AGG1 = "0x1469c86475f6356dE848349d64c45C43189A8f6E";
const AGG2 = "0xF72B1eB5932800F3d2a5EeC5f99e6cD586479675";

test("session calendar: holidays, early close, weekends, DST, coverage fails closed", () => {
  assert.equal(isTradingDay("2026-11-26"), false, "Thanksgiving");
  assert.equal(isTradingDay("2026-11-28"), false, "Saturday");
  assert.equal(isTradingDay("2026-11-27"), true, "day after Thanksgiving trades");
  assert.equal(isTradingDay("2028-01-03"), null, "beyond coverage → null, never a guess");
  assert.equal(new Date(sessionClose("2026-11-27") * 1000).toISOString(), "2026-11-27T18:00:00.000Z", "13:00 ET early close (EST)");
  assert.equal(new Date(sessionClose("2026-11-25") * 1000).toISOString(), "2026-11-25T21:00:00.000Z", "16:00 EST");
  assert.equal(new Date(sessionClose("2026-10-30") * 1000).toISOString(), "2026-10-30T20:00:00.000Z", "16:00 EDT before the switch");
  assert.equal(new Date(sessionClose("2026-11-02") * 1000).toISOString(), "2026-11-02T21:00:00.000Z", "16:00 EST after the Nov 1 switch");
  assert.equal(new Date(sessionOpen("2027-03-15") * 1000).toISOString(), "2027-03-15T13:30:00.000Z", "09:30 EDT after the Mar 14 2027 switch");
  assert.equal(nyParts(Date.parse("2026-11-21T02:00:00Z") / 1000).date, "2026-11-20", "Friday evening NY is still Friday");
});

test("round ids, gap list and window classification", () => {
  const id = proxyRoundId(2n, 1949n);
  assert.equal(id.toString(), "36893488147419105181", "matches the NVDAc latestRoundData seen onchain");
  assert.deepEqual(splitRoundId(id), { phase: 2n, aggRound: 1949n });
  assert.deepEqual(gaps([1n, 2n, 4n, 6n], 6n), [3n, 5n], "earlier holes are found and retried");
  assert.deepEqual(gaps([], 2n), [1n, 2n]);
  assert.deepEqual(classifyWindow([true, false, true, true], true), { missingIdx: [1], ended: true });
});

test("phase start block: binary search finds the first block of the new phase", async () => {
  const at = async (b: bigint) => (b >= 49_669_080n ? 2 : b >= 1000n ? 1 : 0);
  assert.equal(await phaseStartBlock(at, 2, 62_000_000n), 49_669_080n);
  assert.equal(await phaseStartBlock(at, 1, 62_000_000n), 1000n);
});

test("feed names: only the two exact onchain forms are accepted", () => {
  assert.deepEqual(acceptedDescriptions("NVDAc"), ["Coinbase NVDA", "Coinbase NVDA / USD"]);
  assert.ok(!acceptedDescriptions("NVDAc").includes("Coinbase NVDAX"));
});

test("exact decimal formatting (no floating point)", () => {
  assert.equal(formatNav("20670999999", 8), "206.70999999");
  assert.equal(formatNav("20778000000", 8), "207.78");
  assert.equal(formatNav("5", 8), "0.00000005");
  assert.equal(formatNav("-150000000", 8), "-1.5");
});

const row = (n: number, iso: string, answer: string): NavRow => ({
  round_id: proxyRoundId(2n, BigInt(n)).toString(), phase_id: 2, aggregator_round_id: String(n), aggregator_address: AGG2, answer, decimals: 8,
  started_at: iso, updated_at: iso, answered_in_round: proxyRoundId(2n, BigInt(n)).toString(), retrieved_at: "2026-11-30T00:00:00Z", retrieved_block: "1",
  updated_unix: String(Date.parse(iso) / 1000),
});

test("daily closes: in-session only; after-hours, pre-market, weekend and holiday rounds excluded; gaps listed; open session provisional", () => {
  const rows = [
    row(0, "2026-11-24T13:00:00Z", "995"), // Tue 08:00 ET pre-market only → Tue is missing
    row(1, "2026-11-25T20:50:00Z", "100"), // Wed before close (16:00 EST = 21:00Z)
    row(2, "2026-11-25T23:30:00Z", "999"), // Wed after hours: excluded
    row(3, "2026-11-26T15:00:00Z", "998"), // Thanksgiving: excluded
    row(4, "2026-11-27T17:59:00Z", "101"), // Fri before the 13:00 ET early close (18:00Z)
    row(5, "2026-11-27T18:30:00Z", "997"), // Fri after the early close: excluded
    row(6, "2026-11-28T15:00:00Z", "996"), // Saturday: excluded
  ];
  const after = Date.parse("2026-12-01T00:00:00Z") / 1000;
  const d = dailyCloses(rows, "2026-11-24", "2026-11-30", after);
  assert.deepEqual(d.closes.map((c) => [c.session_day, c.row.answer, c.provisional]), [["2026-11-25", "100", false], ["2026-11-27", "101", false]]);
  assert.deepEqual(d.missing_trading_days, ["2026-11-24", "2026-11-30"]);
  const lagging = dailyCloses(rows.slice(0, 4), "2026-11-24", "2026-11-30", after, Date.parse("2026-11-25T20:50:00Z") / 1000);
  assert.deepEqual(lagging.missing_trading_days, ["2026-11-24"], "only days before the newest indexed round can be missing");
  assert.deepEqual(lagging.not_yet_indexed_days, ["2026-11-27", "2026-11-30"]);
  const during = dailyCloses(rows, "2026-11-27", "2026-11-30", Date.parse("2026-11-27T17:00:00Z") / 1000);
  assert.equal(during.closes[0].provisional, true);
  assert.deepEqual(during.missing_trading_days, []);
  // days that closed before the feed's first official round are before coverage, never "missing"
  const covered = dailyCloses(rows, "2026-11-20", "2026-11-30", after, null, Date.parse("2026-11-25T16:00:00Z") / 1000);
  assert.deepEqual(covered.before_coverage_days, ["2026-11-20", "2026-11-23", "2026-11-24"]);
  assert.deepEqual(covered.missing_trading_days, ["2026-11-30"]);
});

test("daily closes across the DST switch (Nov 1 2026): close boundary moves from 20:00Z to 21:00Z", () => {
  const rows = [
    row(10, "2026-10-30T19:59:00Z", "200"), // Fri 15:59 EDT: in session
    row(11, "2026-10-30T20:30:00Z", "299"), // Fri 16:30 EDT: after the close
    row(12, "2026-11-02T20:30:00Z", "201"), // Mon 15:30 EST: in session (would be after-hours under EDT)
  ];
  const d = dailyCloses(rows, "2026-10-30", "2026-11-02", Date.parse("2026-11-03T00:00:00Z") / 1000);
  assert.deepEqual(d.closes.map((c) => [c.session_day, c.row.answer]), [["2026-10-30", "200"], ["2026-11-02", "201"]]);
});

test("verifier selectors equal the canonical function signatures", () => {
  assert.equal(NAV_SEL.getRoundData, toFunctionSelector("getRoundData(uint80)"));
  assert.equal(NAV_SEL.phaseId, toFunctionSelector("phaseId()"));
  assert.equal(NAV_SEL.phaseAggregators, toFunctionSelector("phaseAggregators(uint16)"));
  assert.equal(NAV_SEL.description, toFunctionSelector("description()"));
  assert.equal(NAV_SEL.decimals, toFunctionSelector("decimals()"));
  assert.equal(NAV_SEL.latestRound, toFunctionSelector("latestRound()"));
});

// ---- a fake chain for the verifier and an in-memory store ----
type R = { answer: bigint; started: bigint; updated: bigint };
const w = (v: bigint) => (v < 0n ? (1n << 256n) + v : v).toString(16).padStart(64, "0");
const abiStr = (s: string) => "0x" + w(32n) + w(BigInt(s.length)) + Buffer.from(s).toString("hex").padEnd(64, "0");
type ChainOpts = { desc?: string; phase?: number; aggLatest?: Record<string, number>; aggDecimals?: Record<string, number>; switchBlock?: number; aggByPhase?: Record<number, string>; blockTimes?: Record<number, number> };
const HOSTS = { verifier: "verifier.example", indexer: "indexer.example" };
const SWITCH_TS = Date.parse("2026-11-23T15:25:00Z") / 1000;
function fakeChain(rounds: Map<string, R>, o: ChainOpts = {}) {
  const aggs = o.aggByPhase ?? { 1: AGG1, 2: AGG2 };
  return {
    async getJson() {
      return { nav_feeds: [{ contract_address: TOKEN, nav_feed_address: FEED }] };
    },
    async rpc(m: string, params: any[]) {
      if (m === "eth_getBlockByNumber") {
        const b = Number(BigInt(params[0]));
        const ts = (o.blockTimes ?? { 100: SWITCH_TS })[b];
        return ts === undefined ? null : { timestamp: "0x" + ts.toString(16) };
      }
      const to: string = params[0].to.toLowerCase();
      const data: string = params[0].data;
      const block = params[1] === "latest" ? Infinity : Number(BigInt(params[1]));
      const agg = Object.values(aggs).find((a) => a.toLowerCase() === to);
      if (agg) {
        if (data === NAV_SEL.decimals) return "0x" + w(BigInt(o.aggDecimals?.[agg] ?? 8));
        if (data === NAV_SEL.latestRound) return "0x" + w(BigInt(o.aggLatest?.[agg] ?? 0));
        throw new Error("unexpected aggregator call");
      }
      if (data === NAV_SEL.description) return abiStr(o.desc ?? "Coinbase NVDA");
      if (data === NAV_SEL.decimals) return "0x" + w(8n);
      if (data === NAV_SEL.phaseId) return "0x" + w(BigInt(block === Infinity ? (o.phase ?? 2) : block >= (o.switchBlock ?? 100) ? 2 : 1));
      if (data.startsWith(NAV_SEL.phaseAggregators)) return "0x" + w(BigInt(aggs[Number(BigInt("0x" + data.slice(10)))]));
      if (data.startsWith(NAV_SEL.getRoundData)) {
        const id = BigInt("0x" + data.slice(10));
        const r = rounds.get(id.toString());
        if (!r) throw new Error("execution reverted: No data present");
        return "0x" + w(id) + w(r.answer) + w(r.started) + w(r.updated) + w(id);
      }
      throw new Error("unexpected call " + data);
    },
  };
}

const base = Date.parse("2026-11-23T15:00:00Z") / 1000; // Mon 10:00 ET
async function seeded(spec: { phase: number; n: number; agg: string; offset?: number }[], phaseRows: { phase: number; agg: string; aggDec: number; fromBlock: number | null; fromTime: string | null; toBlock: number | null; toTime: string | null }[]) {
  const db = await openDb();
  await upsertAsset(db, { chain_id: 8453, contract_address: TOKEN, symbol_registry: "NVDAc", symbol_onchain: "NVDAc", name: "x", decimals_registry: 8, decimals_onchain: 8, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" });
  await db.query("INSERT INTO nav_feeds (chain_id, token_address, feed_address, symbol, description, decimals, source) VALUES (8453,$1,$2,'NVDAc','Coinbase NVDA',8,'test')", [TOKEN, FEED]);
  for (const p of phaseRows) {
    await db.query(
      "INSERT INTO nav_phases (chain_id, feed_address, phase_id, aggregator_address, aggregator_decimals, proxy_decimals, live_from_block, live_from_time, live_to_block, live_to_time, observed_block) VALUES (8453,$1,$2,$3,$4,8,$5,$6,$7,$8,1)",
      [FEED, p.phase, p.agg, p.aggDec, p.fromBlock, p.fromTime, p.toBlock, p.toTime],
    );
  }
  const chain = new Map<string, R>();
  const rows: NavRoundRow[] = [];
  for (const s of spec) {
    for (let i = 1; i <= s.n; i++) {
      const updated = base + (s.offset ?? 0) + i * 600;
      const r = { answer: 15000000000n + BigInt(s.phase * 1000 + i), started: BigInt(updated - 60), updated: BigInt(updated) };
      const id = proxyRoundId(BigInt(s.phase), BigInt(i));
      chain.set(id.toString(), r);
      rows.push({ feed: FEED, round_id: id, phase_id: s.phase, aggregator_round_id: BigInt(i), aggregator: s.agg, answer: r.answer, decimals: 8, started_at: Number(r.started), updated_at: Number(r.updated), answered_in_round: id });
    }
  }
  return { db, chain, rows };
}
const onePhase = [{ phase: 1, agg: AGG1, aggDec: 8, fromBlock: null, fromTime: null, toBlock: null, toTime: null }];

test("insertRounds is append-only and idempotent", async () => {
  const { db, rows } = await seeded([{ phase: 1, n: 5, agg: AGG1 }], onePhase);
  assert.equal(await insertRounds(db, rows, "2026-11-30T00:00:00Z", 1n), 5);
  assert.equal(await insertRounds(db, rows, "2026-11-30T00:00:00Z", 1n), 0);
  await assert.rejects(db.query("UPDATE nav_rounds SET answer = 1"), /append-only/);
  await assert.rejects(db.query("UPDATE nav_phases SET aggregator_decimals = 1"), /append-only/);
  await db.close();
});

test("verifier: a complete single-phase store is CONFIRMED and records what it covered", async () => {
  const { db, chain, rows } = await seeded([{ phase: 1, n: 5, agg: AGG1 }], onePhase);
  await insertRounds(db, rows, "2026-11-30T00:00:00Z", 1n);
  const r = await verifyNavFeed(await loadReviewInput(db, FEED, 10), fakeChain(chain, { phase: 1, aggLatest: { [AGG1]: 5 } }), HOSTS);
  assert.equal(r.verdict, "CONFIRMED", JSON.stringify(r.claims.filter((c) => c.verdict !== "CONFIRMED")));
  assert.deepEqual(r.covered, [{ phase: 1, max_round_id: proxyRoundId(1n, 5n).toString(), phase_observed_block: "1" }]);
  const same = await verifyNavFeed(await loadReviewInput(db, FEED, 10), fakeChain(chain, { phase: 1, aggLatest: { [AGG1]: 5 } }), { verifier: "x", indexer: "x" });
  assert.equal(same.verdict, "UNSURE", "same RPC provider as the indexer is not independent");
  await db.close();
});

test("verifier: REJECTED on a tampered value, a wrong ticker, a wrong aggregator decimals record, or a wrong live-window boundary", async () => {
  const twoPhases = [
    { phase: 1, agg: AGG1, aggDec: 18, fromBlock: null, fromTime: null, toBlock: 100, toTime: "2026-11-23T15:25:00Z" },
    { phase: 2, agg: AGG2, aggDec: 8, fromBlock: 100, fromTime: "2026-11-23T15:25:00Z", toBlock: null, toTime: null },
  ];
  const { db, chain, rows } = await seeded([{ phase: 1, n: 3, agg: AGG1 }, { phase: 2, n: 4, agg: AGG2, offset: -300 }], twoPhases);
  await insertRounds(db, rows, "2026-11-30T00:00:00Z", 1n);
  const input = await loadReviewInput(db, FEED, 20);
  const good = { phase: 2, aggLatest: { [AGG1]: 3, [AGG2]: 4 }, aggDecimals: { [AGG1]: 18, [AGG2]: 8 }, switchBlock: 100 };
  const ok = await verifyNavFeed(input, fakeChain(chain, good), HOSTS);
  assert.equal(ok.verdict, "CONFIRMED", JSON.stringify(ok.claims.filter((c) => c.verdict !== "CONFIRMED")));
  const tampered = new Map(chain);
  tampered.set(rows[1].round_id.toString(), { ...chain.get(rows[1].round_id.toString())!, answer: 1n });
  assert.equal((await verifyNavFeed(input, fakeChain(tampered, good, HOSTS))).verdict, "REJECTED");
  assert.equal((await verifyNavFeed(input, fakeChain(chain, { ...good, desc: "Coinbase AAPL" }, HOSTS))).verdict, "REJECTED");
  assert.equal((await verifyNavFeed(input, fakeChain(chain, { ...good, aggDecimals: { [AGG1]: 8, [AGG2]: 8 } }, HOSTS))).verdict, "REJECTED", "stored aggregator decimals must match onchain");
  assert.equal((await verifyNavFeed(input, fakeChain(chain, { ...good, switchBlock: 90 }, HOSTS))).verdict, "REJECTED", "the proxy switched at a different block");
  assert.notEqual((await verifyNavFeed(input, fakeChain(chain, { ...good, aggLatest: { [AGG1]: 5, [AGG2]: 4 } }, HOSTS))).verdict, "CONFIRMED", "closed phase stored short of its last round");
  assert.equal((await verifyNavFeed(input, fakeChain(chain, { ...good, blockTimes: { 100: SWITCH_TS + 2 } }), HOSTS)).verdict, "REJECTED", "stored live_from time must equal the block timestamp");
  await db.close();
});

test("verifier: a hole, a missing phase, or rows naming two aggregators in one phase are never CONFIRMED", async () => {
  const { db, chain, rows } = await seeded([{ phase: 1, n: 6, agg: AGG1 }], onePhase);
  await insertRounds(db, rows.filter((_, i) => i !== 3), "2026-11-30T00:00:00Z", 1n);
  const holed = await verifyNavFeed(await loadReviewInput(db, FEED, 10), fakeChain(chain, { phase: 1, aggLatest: { [AGG1]: 6 } }, HOSTS));
  assert.ok(holed.claims.some((c) => c.verdict === "UNSURE" && /contiguous/.test(c.claim)));
  const missingPhase = await verifyNavFeed(await loadReviewInput(db, FEED, 10), fakeChain(chain, { phase: 2, aggLatest: { [AGG1]: 6 } }, HOSTS));
  assert.ok(missingPhase.claims.some((c) => c.claim === "phase 2 is indexed" && c.verdict === "UNSURE"));
  await insertRounds(db, [{ ...rows[3], aggregator: AGG2 }], "2026-11-30T00:00:00Z", 1n);
  const mixed = await verifyNavFeed(await loadReviewInput(db, FEED, 10), fakeChain(chain, { phase: 1, aggLatest: { [AGG1]: 6 } }, HOSTS));
  assert.equal(mixed.verdict, "REJECTED");
  await db.close();
});

test("stats: overlap and decimals-conflict rounds are not official; in-session gaps measured", async () => {
  const twoPhases = [
    { phase: 1, agg: AGG1, aggDec: 18, fromBlock: null, fromTime: null, toBlock: 100, toTime: "2026-11-23T15:25:00Z" },
    { phase: 2, agg: AGG2, aggDec: 8, fromBlock: 100, fromTime: "2026-11-23T15:25:00Z", toBlock: null, toTime: null },
  ];
  // phase 2 starts publishing 15:05 (before it goes live at 15:25): its first rounds are overlap, not official
  const { db, rows } = await seeded([{ phase: 1, n: 3, agg: AGG1 }, { phase: 2, n: 5, agg: AGG2, offset: -300 }], twoPhases);
  await insertRounds(db, rows, "2026-11-30T00:00:00Z", 1n);
  const s = await computeNavStats(db, FEED);
  assert.deepEqual(s.decimals_conflict_phases, [1]);
  assert.equal(s.official_rounds, 3, "phase-2 rounds from 15:25 on");
  assert.equal(s.overlap_rounds_excluded, 2, "phase-2 rounds at 15:05 and 15:15");
  assert.equal(s.max_in_session_gap_s, 600);
  await db.close();
});

test("API: gate, unknown asset, no feed, fails closed until verified, official-only by default, include=all with flags, covered rounds only, cursor paging", async () => {
  const twoPhases = [
    { phase: 1, agg: AGG1, aggDec: 18, fromBlock: null, fromTime: null, toBlock: 100, toTime: "2026-11-23T15:25:00Z" },
    { phase: 2, agg: AGG2, aggDec: 8, fromBlock: 100, fromTime: "2026-11-23T15:25:00Z", toBlock: null, toTime: null },
  ];
  const { db, rows } = await seeded([{ phase: 1, n: 3, agg: AGG1 }, { phase: 2, n: 6, agg: AGG2, offset: -300 }], twoPhases);
  const srv = await serve(db, 0);
  const prev = process.env.NAV_HISTORY_PUBLIC;
  const baseUrl = "http://127.0.0.1:" + (srv.address() as AddressInfo).port;
  const get = async (p: string) => {
    const r = await fetch(baseUrl + p);
    return { status: r.status, body: await r.json() };
  };
  try {
    delete process.env.NAV_HISTORY_PUBLIC;
    assert.equal((await get(`/v1/assets/${TOKEN}/nav/history`)).body.error.code, "NAV_NOT_ENABLED");
    process.env.NAV_HISTORY_PUBLIC = "true";
    assert.equal((await get("/v1/assets/0x1111111111111111111111111111111111111111/nav/history")).body.error.code, "UNKNOWN_ASSET");
    await upsertAsset(db, { chain_id: 8453, contract_address: "0xb2000000000000000000002d0ba3164cc74f58b7", symbol_registry: "GOOGLc", symbol_onchain: "GOOGLc", name: "x", decimals_registry: 8, decimals_onchain: 8, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" });
    assert.equal((await get("/v1/assets/0xb2000000000000000000002d0ba3164cc74f58b7/nav/history")).body.error.code, "NO_NAV_FEED");
    await insertRounds(db, rows.slice(0, 8), "2026-11-30T00:00:00Z", 1n); // 3 phase-1 + 5 phase-2
    assert.equal((await get(`/v1/assets/${TOKEN}/nav/history?interval=round`)).body.error.code, "NAV_NOT_VERIFIED");
    // review covers phase 1 up to round 3 and phase 2 up to round 5; round 6 arrives after the review
    await insertNavReview(db, FEED, { verdict: "CONFIRMED", sampled: 8, mismatches: 0, claims: [], checked_at: "2026-11-30T00:00:01.000Z", covered: [{ phase: 1, max_round_id: proxyRoundId(1n, 3n).toString(), phase_observed_block: "1" }, { phase: 2, max_round_id: proxyRoundId(2n, 5n).toString(), phase_observed_block: "1" }], verifier_rpc_host: "verifier.example" }, 8, await computeNavStats(db, FEED));
    await insertRounds(db, rows.slice(8), "2026-11-30T00:05:00Z", 2n);
    const off = await get(`/v1/assets/${TOKEN}/nav/history?interval=round&from=2026-11-01`);
    assert.equal(off.status, 200);
    // official = phase 2 rounds 3..5 (15:25, 15:35, 15:45); phase 1 has a decimals conflict; phase-2 rounds 1-2 are overlap; round 6 not covered
    assert.deepEqual(off.body.data.map((x: any) => x.aggregator_round_id), ["3", "4", "5"]);
    assert.ok(!("official" in off.body.data[0]), "flags only with include=all");
    const p0 = off.body.data[0];
    for (const k of ["chain_id", "token", "feed", "round_id", "phase_id", "aggregator", "answer_raw", "decimals", "nav", "updated_at", "retrieved_at", "retrieved_block"]) assert.ok(k in p0, "provenance field " + k);
    assert.equal(off.body.meta.quality.official_rounds, 3);
    assert.equal(off.body.meta.quality.phases.length, 2);
    const all = await get(`/v1/assets/${TOKEN}/nav/history?interval=round&from=2026-11-01&include=all`);
    assert.equal(all.body.data.length, 8, "every covered round, ordered by time");
    const times = all.body.data.map((x: any) => x.updated_at);
    assert.deepEqual([...times].sort(), times, "time never goes backwards");
    assert.equal(all.body.data.filter((x: any) => x.official).length, 3);
    const p1 = all.body.data.filter((x: any) => x.phase_id === 1);
    assert.ok(p1.length === 3 && p1.every((x: any) => x.decimals_ok === false && x.decimals === 18 && x.nav === null && x.nav_unavailable_reason === "aggregator_decimals_differ_from_proxy"), "phase-1 rows: their own decimals, raw answer only");
    // a newer, unreviewed phase row must not change what is official
    await db.query("INSERT INTO nav_phases (chain_id, feed_address, phase_id, aggregator_address, aggregator_decimals, proxy_decimals, live_from_block, live_from_time, live_to_block, live_to_time, observed_block) VALUES (8453,$1,2,$2,8,8,100,'2026-11-23T15:00:00Z',NULL,NULL,5)", [FEED, AGG2]);
    const pinned = await get(`/v1/assets/${TOKEN}/nav/history?interval=round&from=2026-11-01`);
    assert.deepEqual(pinned.body.data.map((x: any) => x.aggregator_round_id), ["3", "4", "5"], "served windows stay the reviewed ones");
    const page1 = await get(`/v1/assets/${TOKEN}/nav/history?interval=round&from=2026-11-01&include=all&limit=5`);
    const page2 = await get(`/v1/assets/${TOKEN}/nav/history?interval=round&from=2026-11-01&include=all&limit=5&cursor=${page1.body.meta.next_cursor}`);
    assert.equal(page1.body.data.length + page2.body.data.length, 8);
    assert.equal(page2.body.meta.next_cursor, null);
    const daily = await get(`/v1/assets/${TOKEN}/nav/history?from=2026-11-23&to=2026-11-23`);
    assert.equal(daily.body.data.length, 1);
    assert.equal(daily.body.data[0].aggregator_round_id, "5", "last official covered round of the day");
    for (const [q, code] of [["interval=weekly", "BAD_INTERVAL"], ["from=2026-13-01", "BAD_DATE"], ["from=2026-02-31", "BAD_DATE"], ["from=2026-11-30&to=2026-11-01", "BAD_RANGE"], ["interval=round&limit=0", "BAD_LIMIT"], ["interval=round&cursor=abc", "BAD_CURSOR"], ["include=all", "BAD_INCLUDE"], ["interval=round&include=some", "BAD_INCLUDE"]]) {
      const r = await get(`/v1/assets/${TOKEN}/nav/history?${q}`);
      assert.equal(r.status, 400, q);
      assert.equal(r.body.error.code, code);
    }
  } finally {
    if (prev === undefined) delete process.env.NAV_HISTORY_PUBLIC;
    else process.env.NAV_HISTORY_PUBLIC = prev;
    srv.close();
    await db.close();
  }
});
