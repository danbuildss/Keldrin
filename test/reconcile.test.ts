import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyDividendFact, exactUnits } from "../src/pipeline/reconcile.ts";
import { quarterlyFacts, type XbrlFact } from "../src/adapters/sec.ts";

// Shapes as returned by data.sec.gov companyconcept for Alphabet (values observed 2026-11-27).
const facts: XbrlFact[] = [
  { start: "2026-01-01", end: "2026-09-30", val: 0.65, accn: "0001652044-26-000084", fy: 2026, fp: "Q3", form: "10-Q", filed: "2026-10-29" },
  { start: "2026-07-01", end: "2026-09-30", val: 0.22, accn: "0001652044-26-000084", fy: 2026, fp: "Q3", form: "10-Q", filed: "2026-10-29" },
  { start: "2026-04-01", end: "2026-06-30", val: 0.22, accn: "0001652044-26-000071", fy: 2026, fp: "Q2", form: "10-Q", filed: "2026-07-23" },
  { start: "2026-04-01", end: "2026-06-30", val: 0.22, accn: "0001652044-26-000999", fy: 2026, fp: "Q2", form: "10-Q/A", filed: "2026-08-30" },
];

test("quarterly facts drop year-to-date durations; the latest filing wins and a differing amendment is visible", () => {
  const q = quarterlyFacts(facts);
  assert.deepEqual(q.map((f) => [f.end, f.accn]), [["2026-06-30", "0001652044-26-000999"], ["2026-09-30", "0001652044-26-000084"]]);
  assert.equal(q[0].amended_from, undefined, "same value: no conflict");
  const amended = quarterlyFacts([...facts, { ...facts[2], val: 0.2, accn: "0001652044-26-000050", filed: "2026-07-01" }]);
  assert.deepEqual(amended[0].amended_from, [{ accn: "0001652044-26-000050", val: 0.2, filed: "2026-07-01" }]);
  assert.equal(amended[0].val, 0.22);
});

test("exact decimal parsing for declared amounts (no floats, no exponent forms)", () => {
  assert.equal(exactUnits("0.22", 8), 22000000n);
  assert.equal(exactUnits("0", 8), 0n);
  assert.equal(exactUnits("1e-7", 8), null);
  assert.equal(exactUnits("0.123456789", 8), null);
});

test("action inside a reported quarter → pass with the fact", () => {
  const r = classifyDividendFact(quarterlyFacts(facts), "2026-09-14");
  assert.equal(r.result, "pass");
  assert.equal(r.fact?.val, 0.22);
});

test("action after the latest reported quarter → unknown (reporting lag), never fail", () => {
  const r = classifyDividendFact(quarterlyFacts(facts), "2026-10-26");
  assert.equal(r.result, "unknown");
  assert.ok(r.unknownNote);
});

test("action in a gap before a later reported quarter → fail", () => {
  const q = quarterlyFacts(facts).filter((f) => f.end !== "2026-06-30");
  assert.equal(classifyDividendFact(q, "2026-05-10").result, "fail");
});
