import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { datesIn, extractDividendDeclarations, htmlToText, isoDate } from "../src/pipeline/declarations.ts";

// RECORDED excerpts of real SEC filings (fixtures/recorded/sec-declarations.json), not synthetic.
const fx = JSON.parse(readFileSync(new URL("../fixtures/recorded/sec-declarations.json", import.meta.url), "utf8"));

for (const c of fx.cases) {
  test(`real declaration ${c.symbol} payable ${c.expected.payable_date}: amount and dates extracted exactly`, () => {
    const got = extractDividendDeclarations(c.text).find((d) => d.per_share === c.expected.per_share && d.payable_date === c.expected.payable_date);
    assert.ok(got, JSON.stringify(extractDividendDeclarations(c.text)));
    assert.equal(got.record_date, c.expected.record_date);
  });
}

test("Alphabet raw HTML: inline tags split a word ('t</font><font>he common'); preferred dividend never attributed to common", () => {
  const ds = extractDividendDeclarations(htmlToText(fx.raw_html.html));
  const common = ds.find((d) => d.per_share === "0.22");
  assert.ok(common);
  assert.equal(common.payable_date, "2026-12-14");
  assert.equal(common.record_date, "2026-12-07");
  assert.ok(!ds.some((d) => d.per_share === "15.63"), "preferred $15.63 must not be extracted as a common dividend");
  assert.ok(!ds.some((d) => d.payable_date === "2026-11-15"), "preferred payable date must not leak");
});

test("phrasing variants seen in real filings", () => {
  const cases: [string, string, string | null, string | null][] = [
    ["NVIDIA will pay its next quarterly cash dividend of $0.25 per share on October 1, 2026, to all shareholders of record on September 10, 2026.", "0.25", "2026-10-01", "2026-09-10"],
    ["The board of directors declared a quarterly cash dividend of $0.50 per share of outstanding common stock. This dividend will be paid to stockholders of record as of the close of business on October 9, 2026, with a payment date of October 23, 2026.", "0.50", "2026-10-23", "2026-10-09"],
    ["the Company's Board of Directors has declared a quarterly dividend of $0.30 per share to be paid on November 24, 2026, to shareholders of record at the close of business on November 10, 2026.", "0.30", "2026-11-24", "2026-11-10"],
    ["Micron's Board of Directors declared a quarterly dividend of $0.15 per share, payable in cash on October 29, 2026, to shareholders of record as of the close of business on October 14, 2026.", "0.15", "2026-10-29", "2026-10-14"],
    ["announced a quarterly dividend of $0.06 per share of common stock, including preferred stock on an as converted to common stock basis, payable on October 29, 2026 to stockholders of record as of October 9, 2026.", "0.06", "2026-10-29", "2026-10-09"],
  ];
  for (const [text, per, pay, rec] of cases) {
    const d = extractDividendDeclarations(text)[0];
    assert.ok(d, text);
    assert.deepEqual([d.per_share, d.payable_date, d.record_date], [per, pay, rec], text);
  }
});

test("dividend mentions without dates (guidance tables, cash-flow lines) are not declarations", () => {
  assert.deepEqual(extractDividendDeclarations("Dividend Program Q4 2026 dividend of $0.30 per share(2) Share Repurchase Program"), []);
  assert.deepEqual(extractDividendDeclarations("Dividend and dividend equivalent payments were $1.35 billion."), []);
  assert.deepEqual(extractDividendDeclarations("Increased regular quarterly dividend by 8.8% to $1.60 per share, or an annualized $6.40 per share."), []);
});

test("dates: strict calendar validation", () => {
  assert.equal(isoDate("February", "30", "2026"), null);
  assert.equal(isoDate("December", "14", "2026"), "2026-12-14");
  assert.deepEqual(datesIn("payable on December 14, 2026 … as of December 7, 2026"), ["2026-12-14", "2026-12-07"]);
});
