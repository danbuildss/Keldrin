import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { verifyIssuerAction } from "../src/verify/verify.ts";

// Replays REAL recorded responses (fixtures/recorded) so the verifier is tested offline and deterministically.
const fx = JSON.parse(readFileSync(new URL("../fixtures/recorded/googlc-e82812a6.json", import.meta.url), "utf8"));
const replay = {
  rpc: async (m: string, p: unknown[]) => {
    const k = `${m} ${JSON.stringify(p)}`;
    if (!(k in fx.transcript)) throw new Error(`not recorded: ${k}`);
    return structuredClone(fx.transcript[k]);
  },
  getJson: async (u: string) => {
    const k = `GET ${JSON.stringify(u)}`;
    if (!(k in fx.transcript)) throw new Error(`not recorded: ${k}`);
    return structuredClone(fx.transcript[k]);
  },
};
const clone = () => structuredClone(fx.record);

test("real GOOGLc record is CONFIRMED on replayed evidence, bound to its payload hash", async () => {
  const rv = await verifyIssuerAction(clone(), replay);
  assert.equal(rv.verdict, "CONFIRMED", JSON.stringify(rv.claims.filter((c) => c.verdict !== "CONFIRMED")));
  assert.equal(rv.payload_sha256, fx.payload_sha256);
  assert.ok(rv.claims.length >= 10);
});

const tamper: [string, (r: any) => void][] = [
  ["multiplier after (1 wei)", (r) => (r.action.multiplier_after_wad = "1000377118676784180")],
  ["ratio", (r) => (r.action.ratio = "1.0004")],
  ["effective block hash", (r) => (r.action.effective.block_hash = "0x" + "0".repeat(64))],
  ["announcement id", (r) => (r.announcements[0].id = "2098")],
  ["announcement caller", (r) => (r.announcements[1].caller = "0x0000000000000000000000000000000000000001")],
  ["bracket claim", (r) => (r.announcements[0].bracketed = false)],
  ["dropped legacy flag", (r) => (r.flags = r.flags.filter((f: string) => f !== "legacy_event_only"))],
  ["synthetic", (r) => (r.synthetic = true)],
  ["issuer status", (r) => (r.issuer_record.status = "CORPORATE_ACTION_STATUS_ANNOUNCED")],
  ["symbol (ticker collision GOOG vs GOOGL)", (r) => (r.asset.symbol = "GOOGc")],
];
for (const [name, mutate] of tamper) {
  test(`tampered ${name} → REJECTED`, async () => {
    const r = clone();
    mutate(r);
    const rv = await verifyIssuerAction(r, replay);
    assert.equal(rv.verdict, "REJECTED");
  });
}

test("unavailable source → UNSURE, never CONFIRMED", async () => {
  const flaky = { ...replay, getJson: async () => { throw new Error("503 from issuer"); } };
  const rv = await verifyIssuerAction(clone(), flaky);
  assert.equal(rv.verdict, "UNSURE");
});

test("a changed payload changes the hash the review binds to", async () => {
  const r = clone();
  r.action.operator_description = "Cash Dividend (edited)";
  const rv = await verifyIssuerAction(r, replay);
  assert.notEqual(rv.payload_sha256, fx.payload_sha256);
});
