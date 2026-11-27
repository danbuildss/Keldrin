// Phase 5 tests: session calendar, round-id math, gap handling, daily closes, the verifier and the API route.
// Rows here are labelled test fixtures for logic tests; real data is only ever read from chain.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { toFunctionSelector } from "viem";
import { openDb, upsertAsset } from "../src/db/db.ts";
import { serve } from "../src/api/server.ts";
import { acceptedDescriptions, classifyWindow, insertRounds, proxyRoundId, splitRoundId, type NavRoundRow } from "../src/pipeline/navIndex.ts";
import { insertNavReview, loadReviewInput } from "../src/pipeline/navStore.ts";
import { NAV_SEL, verifyNavFeed } from "../src/verify/navVerify.ts";
import { dailyCloses, formatNav, type NavRow } from "../src/api/nav.ts";
import { isTradingDay, nyParts, sessionClose, sessionOpen } from "../src/lib/sessions.ts";

const TOKEN = "0xb20000000000000000000078ee7ce2fE4908108C";
const FEED = "0x04689a41629776563E6822F76f2e57D148d28513";
const AGG = "0xF72B1eB5932800F3d2a5EeC5f99e6cD586479675";

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

test("round ids: phase << 64 | aggregator round, and back", () => {
  const id = proxyRoundId(2n, 1949n);
  assert.equal(id.toString(), "36893488147419105181", "matches the NVDAc latestRoundData seen onchain");
  assert.deepEqual(splitRoundId(id), { phase: 2n, aggRound: 1949n });
});

test("gap handling: missing ids are reported, a closed phase ends at its last round, nothing is filled", () => {
  assert.deepEqual(classifyWindow([true, false, true, true], true), { missingIdx: [1], ended: true });
  assert.deepEqual(classifyWindow([true, true, false, false], false), { missingIdx: [], ended: true }, "closed phase ended after index 1");
  assert.deepEqual(classifyWindow([true, false, true, true], false), { missingIdx: [1], ended: false }, "window full: keep walking");
  assert.deepEqual(classifyWindow([false, false], true), { missingIdx: [0, 1], ended: true });
});

test("feed names: only the two exact onchain forms are accepted", () => {
  assert.deepEqual(acceptedDescriptions("NVDAc"), ["Coinbase NVDA", "Coinbase NVDA / USD"]);
  assert.ok(!acceptedDescriptions("NVDAc").includes("Coinbase NVDAX"));
  assert.ok(acceptedDescriptions("ANTc").includes("Coinbase ANT / USD"));
});

test("exact decimal formatting (no floating point)", () => {
  assert.equal(formatNav("20670999999", 8), "206.70999999");
  assert.equal(formatNav("20778000000", 8), "207.78");
  assert.equal(formatNav("5", 8), "0.00000005");
  assert.equal(formatNav("-150000000", 8), "-1.5");
});

const row = (n: number, iso: string, answer: string): NavRow => ({
  round_id: proxyRoundId(2n, BigInt(n)).toString(), phase_id: 2, aggregator_round_id: String(n), aggregator_address: AGG, answer, decimals: 8,
  started_at: iso, updated_at: iso, answered_in_round: proxyRoundId(2n, BigInt(n)).toString(), retrieved_at: "2026-11-30T00:00:00Z", retrieved_block: "1",
  updated_unix: String(Date.parse(iso) / 1000),
});

test("daily closes: last round at or before the close; after-hours, weekend and holiday rounds excluded; gaps listed not filled; open session provisional", () => {
  const rows = [
    row(0, "2026-11-24T13:00:00Z", "995"), // Tue 08:00 ET pre-market only: never a close → Tue is missing
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
  assert.deepEqual(d.missing_trading_days, ["2026-11-24", "2026-11-30"], "trading days without a round are listed");
  const during = dailyCloses(rows, "2026-11-27", "2026-11-30", Date.parse("2026-11-27T17:00:00Z") / 1000);
  assert.equal(during.closes[0].provisional, true, "session not closed yet");
  assert.deepEqual(during.missing_trading_days, [], "future days are not 'missing'");
});

test("verifier selectors equal the canonical function signatures", () => {
  assert.equal(NAV_SEL.getRoundData, toFunctionSelector("getRoundData(uint80)"));
  assert.equal(NAV_SEL.phaseId, toFunctionSelector("phaseId()"));
  assert.equal(NAV_SEL.phaseAggregators, toFunctionSelector("phaseAggregators(uint16)"));
  assert.equal(NAV_SEL.description, toFunctionSelector("description()"));
  assert.equal(NAV_SEL.decimals, toFunctionSelector("decimals()"));
});

// ---- a fake chain for the verifier and an in-memory store ----
const w = (v: bigint) => (v < 0n ? (1n << 256n) + v : v).toString(16).padStart(64, "0");
const abiStr = (s: string) => "0x" + w(32n) + w(BigInt(s.length)) + Buffer.from(s).toString("hex").padEnd(64, "0");
function fakeChain(rounds: Map<string, { answer: bigint; started: bigint; updated: bigint }>, opts: { desc?: string; phase?: number; aggLatest?: number } = {}) {
  return {
    async getJson() {
      return { nav_feeds: [{ contract_address: TOKEN, nav_feed_address: FEED }] };
    },
    async rpc(_m: string, params: any[]) {
      const data: string = params[0].data;
      if (data === NAV_SEL.description) return abiStr(opts.desc ?? "Coinbase NVDA");
      if (data === NAV_SEL.decimals) return "0x" + w(8n);
      if (data === NAV_SEL.phaseId) return "0x" + w(BigInt(opts.phase ?? 2));
      if (data.startsWith(NAV_SEL.phaseAggregators)) return "0x" + w(BigInt(AGG));
      if (data === NAV_SEL.latestRound) return "0x" + w(BigInt(opts.aggLatest ?? 0));
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

async function seeded(n = 5, phase = 2) {
  const db = await openDb();
  await upsertAsset(db, { chain_id: 8453, contract_address: TOKEN, symbol_registry: "NVDAc", symbol_onchain: "NVDAc", name: "x", decimals_registry: 8, decimals_onchain: 8, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" });
  await db.query("INSERT INTO nav_feeds (chain_id, token_address, feed_address, symbol, description, decimals, source) VALUES (8453,$1,$2,'NVDAc','Coinbase NVDA',8,'test')", [TOKEN, FEED]);
  const chain = new Map<string, { answer: bigint; started: bigint; updated: bigint }>();
  const rows: NavRoundRow[] = [];
  for (let i = 1; i <= n; i++) {
    const updated = Date.parse("2026-11-23T15:00:00Z") / 1000 + i * 600;
    const r = { answer: 15000000000n + BigInt(i), started: BigInt(updated - 60), updated: BigInt(updated) };
    const id = proxyRoundId(BigInt(phase), BigInt(i));
    chain.set(id.toString(), r);
    rows.push({ feed: FEED, round_id: id, phase_id: phase, aggregator_round_id: BigInt(i), aggregator: AGG, answer: r.answer, decimals: 8, started_at: Number(r.started), updated_at: Number(r.updated), answered_in_round: id });
  }
  return { db, chain, rows };
}

test("insertRounds is append-only and idempotent", async () => {
  const { db, rows } = await seeded();
  assert.equal(await insertRounds(db, rows, "2026-11-30T00:00:00Z", 1n), 5);
  assert.equal(await insertRounds(db, rows, "2026-11-30T00:00:00Z", 1n), 0, "rerun adds nothing");
  await assert.rejects(db.query("UPDATE nav_rounds SET answer = 1"), /append-only/);
  await db.close();
});

test("NAV verifier: CONFIRMED on a faithful store, REJECTED on a tampered value, UNSURE on a gap or a closed phase not fully indexed", async () => {
  const { db, chain, rows } = await seeded();
  await insertRounds(db, rows, "2026-11-30T00:00:00Z", 1n);
  const input = await loadReviewInput(db, FEED, 10);
  // the chain reports phaseId 2 but only phase 2 is stored: values match, coverage is incomplete → UNSURE
  const r1 = await verifyNavFeed(input, fakeChain(chain));
  assert.equal(r1.verdict, "UNSURE");
  assert.equal(r1.mismatches, 0);
  assert.ok(r1.claims.some((c) => c.verdict === "UNSURE" && c.claim === "phase 1 is indexed"));

  const tampered = new Map(chain);
  tampered.set(rows[2].round_id.toString(), { ...chain.get(rows[2].round_id.toString())!, answer: 1n });
  const input2 = { ...input, sample: input.sample.filter((s) => s.round_id === rows[2].round_id.toString()) };
  const r2 = await verifyNavFeed(input2, fakeChain(tampered));
  assert.equal(r2.verdict, "REJECTED");
  assert.equal(r2.mismatches, 1);

  const r3 = await verifyNavFeed(input, fakeChain(chain, { desc: "Coinbase AAPL" }));
  assert.equal(r3.verdict, "REJECTED", "feed that names another ticker");
  await db.close();
});

test("NAV verifier: a complete single-phase store is CONFIRMED", async () => {
  const { db, chain, rows } = await seeded(5, 1);
  await insertRounds(db, rows, "2026-11-30T00:00:00Z", 1n);
  const r = await verifyNavFeed(await loadReviewInput(db, FEED, 10), fakeChain(chain, { phase: 1 }));
  assert.equal(r.verdict, "CONFIRMED", JSON.stringify(r.claims.filter((c) => c.verdict !== "CONFIRMED")));
  assert.equal(r.mismatches, 0);
  await db.close();
});

test("NAV verifier: a closed phase stored short of its aggregator's last round is UNSURE", async () => {
  const { db, chain, rows } = await seeded(3, 1);
  await insertRounds(db, rows, "2026-11-30T00:00:00Z", 1n);
  const input = await loadReviewInput(db, FEED, 10);
  // the feed is in phase 2 now; phase 1's aggregator says its last round is 5 but only 1..3 are stored
  const short = await verifyNavFeed(input, fakeChain(chain, { phase: 2, aggLatest: 5 }));
  assert.ok(short.claims.some((c) => c.claim === "phase 1 stored up to the aggregator's last round" && c.verdict === "UNSURE"));
  assert.notEqual(short.verdict, "CONFIRMED");
  const full = await verifyNavFeed(input, fakeChain(chain, { phase: 2, aggLatest: 3 }));
  assert.ok(full.claims.some((c) => c.claim === "phase 1 stored up to the aggregator's last round" && c.verdict === "CONFIRMED"));
  await db.close();
});

test("NAV verifier: a store with a hole is UNSURE (never CONFIRMED)", async () => {
  const { db, chain, rows } = await seeded(6);
  await insertRounds(db, rows.filter((_, i) => i !== 3), "2026-11-30T00:00:00Z", 1n);
  const r = await verifyNavFeed(await loadReviewInput(db, FEED, 10), fakeChain(chain, { phase: 2 }));
  assert.notEqual(r.verdict, "CONFIRMED");
  assert.ok(r.claims.some((c) => c.verdict === "UNSURE" && /contiguous/.test(c.claim)));
  await db.close();
});

test("API: 404 without a feed, 503 until verified (fails closed), 200 with provenance after CONFIRMED, rounds after the review are not served", async () => {
  const { db, rows } = await seeded();
  const srv = await serve(db, 0);
  const prev = process.env.NAV_HISTORY_PUBLIC;
  const base = "http://127.0.0.1:" + (srv.address() as AddressInfo).port;
  const get = async (p: string) => {
    const r = await fetch(base + p);
    return { status: r.status, body: await r.json() };
  };
  try {
    delete process.env.NAV_HISTORY_PUBLIC;
    const off = await get(`/v1/assets/${TOKEN}/nav/history`);
    assert.equal(off.status, 503);
    assert.equal(off.body.error.code, "NAV_NOT_ENABLED", "off until the founder enables it");
    process.env.NAV_HISTORY_PUBLIC = "true";
    assert.equal((await get("/v1/assets/0xb2000000000000000000002d0ba3164cc74f58b7/nav/history")).body.error.code, "NO_NAV_FEED");
    await insertRounds(db, rows.slice(0, 4), "2026-11-30T00:00:00Z", 1n);
    const unv = await get(`/v1/assets/${TOKEN}/nav/history?interval=round`);
    assert.equal(unv.status, 503);
    assert.equal(unv.body.error.code, "NAV_NOT_VERIFIED");
    await insertNavReview(db, FEED, { verdict: "CONFIRMED", sampled: 4, mismatches: 0, claims: [], checked_at: "2026-11-30T00:00:01.000Z" }, 4);
    await insertRounds(db, rows.slice(4), "2026-11-30T00:05:00Z", 2n); // indexed after the review
    const ok = await get(`/v1/assets/${TOKEN}/nav/history?interval=round&from=2026-11-01&limit=3`);
    assert.equal(ok.status, 200);
    assert.equal(ok.body.data.length, 3);
    const p0 = ok.body.data[0];
    for (const k of ["chain_id", "token", "feed", "round_id", "phase_id", "aggregator", "answer_raw", "decimals", "nav", "updated_at", "retrieved_at", "retrieved_block"]) assert.ok(k in p0, "provenance field " + k);
    assert.equal(p0.nav, "150.00000001");
    assert.equal(ok.body.meta.quality.verification.verdict, "CONFIRMED");
    const page2 = await get(`/v1/assets/${TOKEN}/nav/history?interval=round&from=2026-11-01&limit=3&cursor=${ok.body.meta.next_cursor}`);
    assert.equal(page2.body.data.length, 1, "4 reviewed rounds; the 5th was indexed after the review and is not served");
    assert.equal(page2.body.meta.next_cursor, null);
    const daily = await get(`/v1/assets/${TOKEN}/nav/history?from=2026-11-23&to=2026-11-23`);
    assert.equal(daily.body.data.length, 1);
    assert.equal(daily.body.data[0].answer_raw, "15000000004", "last reviewed round of the day");
    for (const [q, code] of [["interval=weekly", "BAD_INTERVAL"], ["from=2026-13-01", "BAD_DATE"], ["from=2026-02-31", "BAD_DATE"], ["from=2026-11-30&to=2026-11-01", "BAD_RANGE"], ["interval=round&limit=0", "BAD_LIMIT"], ["interval=round&cursor=abc", "BAD_CURSOR"]]) {
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
