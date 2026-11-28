// Earnings releases (ROADMAP 6.2): SEC 8-K item 2.02, independently re-checked against the filing headers.
import { test } from "node:test";
import assert from "node:assert/strict";
import { openDb, upsertAsset } from "../src/db/db.ts";
import { earningsReleases } from "../src/pipeline/earnings.ts";
import { judge, nyToUtc, parseHeaders } from "../src/verify/earningsVerify.ts";
import { assetEarnings } from "../src/api/earnings.ts";

// shape of data.sec.gov submissions "recent" (values from NVIDIA's real 2026-11-17 filing, plus decoys)
const recent = {
  accessionNumber: ["0001045810-26-000088", "0001045810-26-000090", "0001045810-26-000091", "0001045810-24-000010"],
  filingDate: ["2026-11-17", "2026-11-18", "2026-11-19", "2024-11-20"],
  reportDate: ["2026-11-17", "2026-11-18", "", "2024-11-20"],
  acceptanceDateTime: ["2026-11-17T21:20:51.000Z", "2026-11-18T12:00:00.000Z", "2026-11-19T12:00:00.000Z", "2024-11-20T21:00:00.000Z"],
  form: ["8-K", "8-K", "4", "8-K"],
  items: ["2.02,9.01", "5.02", "", "2.02,9.01"],
  primaryDocument: ["nvda-20261117.htm", "x.htm", "y.xml", "old.htm"],
};

test("earnings: only 8-K filings listing item 2.02, since 2025, with SEC's acceptance time", () => {
  const r = earningsReleases(recent, "0001045810");
  assert.equal(r.length, 1, "the 5.02 8-K, the Form 4 and the 2024 filing are not earnings releases here");
  assert.equal(r[0].accession, "0001045810-26-000088");
  assert.equal(r[0].accepted_at, "2026-11-17T21:20:51.000Z");
  assert.equal(r[0].primary_document_url, "https://www.sec.gov/Archives/edgar/data/1045810/000104581026000088/nvda-20261117.htm");
  assert.equal(earningsReleases({ ...recent, items: ["12.02", "", "", ""] }, "1").length, 0, "12.02 is not 2.02");
});

const headers = `<ACCEPTANCE-DATETIME>20261117162051
CONFORMED SUBMISSION TYPE:	8-K
CONFORMED PERIOD OF REPORT:	20261117
ITEM INFORMATION:		Results of Operations and Financial Condition
ITEM INFORMATION:		Financial Statements and Exhibits
FILED AS OF DATE:		20261117`;

test("earnings verifier: New York acceptance time converts to UTC across daylight saving", () => {
  assert.equal(nyToUtc("20261117162051"), "2026-11-17T21:20:51.000Z", "EST: UTC-5");
  assert.equal(nyToUtc("20260826162119"), "2026-08-26T20:21:19.000Z", "EDT: UTC-4");
  assert.equal(nyToUtc("2026"), null);
});

test("earnings verifier: CONFIRMED only when form, item, filed date and acceptance time all agree", () => {
  const h = parseHeaders(headers);
  assert.deepEqual(h, { form: "8-K", items: ["Results of Operations and Financial Condition", "Financial Statements and Exhibits"], filed: "2026-11-17", accepted_utc: "2026-11-17T21:20:51.000Z" });
  const stored = { form: "8-K", filed_date: "2026-11-17", accepted_at: "2026-11-17T21:20:51Z" };
  assert.equal(judge(stored, h).verdict, "CONFIRMED");
  assert.equal(judge({ ...stored, accepted_at: "2026-11-17T21:20:52Z" }, h).verdict, "REJECTED");
  assert.equal(judge(stored, parseHeaders(headers.replace("Results of Operations and Financial Condition", "Other Events"))).verdict, "REJECTED");
});

test("earnings API: serves only CONFIRMED releases and says why a token is not covered", async () => {
  const db = await openDb();
  try {
    const c = "0xb20000000000000000000078ee7ce2fE4908108C";
    await upsertAsset(db, { chain_id: 8453, contract_address: c, symbol_registry: "NVDAc", symbol_onchain: "NVDAc", name: "NVIDIA", decimals_registry: 18, decimals_onchain: 18, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" });
    const none: any = await assetEarnings(db, c);
    assert.equal(none.body.data.length, 0);
    assert.match(none.body.meta.unavailable_reason, /no SEC company/);
    await db.query("INSERT INTO sec_companies (chain_id, contract_address, cik, company_name, ticker, evidence) VALUES (8453,$1,'0001045810','NVIDIA CORP','NVDA','[]')", [c]);
    for (const [acc, t] of [["0001045810-26-000088", "2026-11-17T21:20:51Z"], ["0001045810-26-000073", "2026-08-26T20:21:19Z"]])
      await db.query("INSERT INTO earnings_releases (chain_id, contract_address, cik, accession, form, items, filed_date, accepted_at, report_date, primary_document_url, source_url, source_sha256) VALUES (8453,$1,'0001045810',$2,'8-K','2.02,9.01',$3::timestamptz::date,$3,NULL,'https://www.sec.gov/Archives/edgar/data/1045810/x/doc.htm','https://data.sec.gov/submissions/CIK0001045810.json','abc')", [c, acc, t]);
    await db.query("INSERT INTO earnings_reviews (review_id, chain_id, contract_address, accession, verdict, detail) VALUES ('r1',8453,$1,'0001045810-26-000088','CONFIRMED','{}')", [c]);
    const out: any = await assetEarnings(db, c);
    assert.equal(out.body.data.length, 1, "the unreviewed release is not served");
    assert.equal(out.body.data[0].accepted_at, "2026-11-17T21:20:51Z");
    assert.equal(out.body.data[0].sec_index_url, "https://www.sec.gov/Archives/edgar/data/1045810/x/0001045810-26-000088-index.htm");
    assert.equal(out.body.meta.not_yet_verified, 1);
    assert.equal(out.body.meta.company.cik, "0001045810");
  } finally {
    await db.close();
  }
});
