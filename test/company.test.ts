import { test } from "node:test";
import assert from "node:assert/strict";
import { declarationCandidates, pickEntity, underlyingTicker } from "../src/pipeline/company.ts";
import { actionKind, normName } from "../src/pipeline/reconcile.ts";

// Hit shapes as returned by efts.sec.gov/LATEST/search-index (observed 2026-11-27).
test("CIK selection requires exactly one entity listing the ticker (two 'Sandisk' entities exist)", () => {
  const hits = [
    { _id: "2023554", _source: { entity: "Sandisk Corp (SNDK)", tickers: "SNDK" } },
    { _id: "1000180", _source: { entity: "SANDISK CORP" } },
  ];
  assert.deepEqual(pickEntity(hits, "SNDK"), { cik: "0002023554", entity: "Sandisk Corp (SNDK)" });
  assert.equal(pickEntity(hits, "SNDQ").cik, null);
  const dup = [...hits, { _id: "9", _source: { entity: "Other", tickers: "SNDK" } }];
  assert.equal(pickEntity(dup, "SNDK").cik, null, "ambiguous → fail closed");
  const alpha = [{ _id: "1652044", _source: { entity: "Alphabet Inc.", tickers: "GOOG, GOOGN, GOOGM, GOOGL" } }];
  assert.equal(pickEntity(alpha, "GOOGL").cik, "0001652044");
  assert.equal(pickEntity(alpha, "GOO").cik, null, "no substring matches");
});

test("underlying ticker from Coinbase token symbols", () => {
  assert.equal(underlyingTicker("GOOGLc"), "GOOGL");
  assert.equal(underlyingTicker("SNDKc"), "SNDK");
  assert.equal(underlyingTicker("GOOGL"), null);
  assert.equal(underlyingTicker("c"), null);
});

test("declaration candidates: relevant 8-K items or 6-K, inside the window before the action only", () => {
  const recent = {
    form: ["8-K", "8-K", "10-Q", "8-K", "6-K", "8-K"],
    filingDate: ["2026-09-20", "2026-07-22", "2026-07-23", "2026-06-11", "2026-08-01", "2026-03-01"],
    accessionNumber: ["a-1", "a-2", "a-3", "a-4", "a-5", "a-6"],
    items: ["8.01,9.01", "2.02,9.01", "", "5.02,5.07,9.01", "", "8.01"],
    primaryDocument: ["d1.htm", "d2.htm", "d3.htm", "d4.htm", "d5.htm", "d6.htm"],
  };
  const c = declarationCandidates(recent, "0001652044", "2026-09-14T18:29:45Z");
  assert.deepEqual(c.map((x) => x.accession), ["a-5", "a-2"], "after-action, 10-Q, unrelated items and out-of-window filings excluded");
  assert.equal(c[1].url, "https://www.sec.gov/Archives/edgar/data/1652044/a2/d2.htm");
});

test("action kind from issuer text only selects which SEC facts to compare", () => {
  assert.equal(actionKind("Cash Dividend"), "cash_dividend");
  assert.equal(actionKind("Stock Split | 8-for-1 Stock Split"), "stock_split");
  assert.equal(actionKind("1-for-10 Reverse Split"), "other");
  assert.equal(actionKind(null), "other");
});

test("company name normalisation tolerates legal suffix variants", () => {
  assert.equal(normName("Infosys Ltd"), normName("Infosys Limited"));
  assert.equal(normName("Alphabet Inc."), normName("Alphabet Inc"));
  assert.notEqual(normName("Meta Platforms Inc."), normName("Meta Materials Inc."));
});
