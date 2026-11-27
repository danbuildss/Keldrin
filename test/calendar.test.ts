import { test } from "node:test";
import assert from "node:assert/strict";
import { mergeIssuerAnnounced, type CalendarEntry } from "../src/pipeline/calendar.ts";

const NV = "0xb20000000000000000000078ee7ce2fE4908108C";
const AEO = "0xb200000000000000000000000000000000000aE0";
const sec: CalendarEntry = {
  entry_id: "cal:x", token: { chain_id: 8453, contract_address: NV, symbol: "NVDAc" }, company: { cik: "0001045810", name: "NVIDIA CORP" },
  declaration: { per_share: "0.25", currency: "USD", payable_date: "2026-12-23", record_date: "2026-12-02", declared_on: null, declared_month: null, quote: "q", offset: 0, accession: "a", form: "8-K", filed: "2026-11-19", document_url: "https://www.sec.gov/x", document_sha256: "0".repeat(64) },
  issuer_announcement: null, state: "upcoming", expected_adjustment_date: "2026-12-23", applied_record_id: null, basis: "b.", as_of: "2026-11-27T00:00:00Z",
};
const ann = (contract: string, symbol: string, uuid: string) => ({ contract, symbol, uuid, status: "CORPORATE_ACTION_STATUS_ANNOUNCED", description: "Cash Dividend", announcedAt: "2026-11-25T00:00:00Z", anns: [{ address: contract, id: uuid, caller: "0x0000000000000000000000000000000000000001", description: "Cash Dividend", uri: "u", txHash: "0x" + "1".repeat(64), block: "1", logIndex: 0, bracketed: true, innerEvents: [] }] });

test("issuer announcement enriches the matching SEC upcoming entry instead of duplicating it", () => {
  const out = mergeIssuerAnnounced([structuredClone(sec)], [ann(NV, "NVDAc", "4f332b80-3d7e-4f13-ad0d-0cb4cdc1a442")], new Date("2026-11-27T00:00:00Z"));
  assert.equal(out.length, 1);
  assert.equal(out[0].issuer_announcement?.corporate_action_uuid, "4f332b80-3d7e-4f13-ad0d-0cb4cdc1a442");
  assert.equal(out[0].expected_adjustment_date, "2026-12-23");
});

test("an issuer-only announcement gets no invented date", () => {
  const out = mergeIssuerAnnounced([structuredClone(sec)], [ann(AEO, "AEOc", "4bc64a71-ac15-4253-b9c2-f7296257f3aa")], new Date("2026-11-27T00:00:00Z"));
  const e = out.find((x) => x.token.symbol === "AEOc")!;
  assert.equal(e.state, "announced");
  assert.equal(e.expected_adjustment_date, null);
  assert.equal(e.declaration, null);
  assert.equal(out[0].token.symbol, "NVDAc", "dated entries sort before undated ones");
});
