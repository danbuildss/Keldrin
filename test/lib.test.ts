import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { keccak256, toFunctionSelector, toHex } from "viem";
import { isValidIsin, cusipFromIsin } from "../src/lib/isin.ts";
import { decimalToWad, doubleMatchesWad, formatUnits, ratio, wadToDecimal } from "../src/lib/decimal.ts";
import { canonicalJson, payloadHash } from "../src/lib/canonical.ts";
import { assertAllowed } from "../src/lib/http.ts";
import { TOPICS } from "../src/config.ts";
import { independentHash } from "../src/verify/verify.ts";

const fx = JSON.parse(readFileSync(new URL("../fixtures/recorded/googlc-e82812a6.json", import.meta.url), "utf8"));

test("ISIN check digits (real registry ISINs) and CUSIP extraction", () => {
  for (const i of ["US02079K3059", "US67066G1040", "US0378331005", "US88160R1014", "US30303M1027"]) assert.ok(isValidIsin(i), i);
  assert.equal(isValidIsin("US02079K3058"), false);
  assert.equal(isValidIsin("us02079K3059"), false);
  assert.equal(cusipFromIsin("US02079K3059"), "02079K305");
  assert.equal(cusipFromIsin("AE000A4AV8D4"), null);
});

test("exact decimal math never uses floats", () => {
  assert.equal(wadToDecimal(1000377118676784179n), "1.000377118676784179");
  assert.equal(wadToDecimal(10n ** 18n), "1");
  assert.equal(ratio(1000377118676784179n, 10n ** 18n), "1.000377118676784179");
  assert.equal(ratio(2n * 10n ** 18n, 10n ** 18n), "2");
  assert.equal(formatUnits(34710000000n, 8), "347.1");
  assert.equal(decimalToWad("1.000377118676784179"), 1000377118676784179n);
  assert.throws(() => ratio(1n, 0n));
  assert.throws(() => decimalToWad("1e18"));
});

test("API doubles are accepted only within double precision of the WAD", () => {
  assert.ok(doubleMatchesWad(1.0003771186767842, 1000377118676784179n));
  assert.equal(doubleMatchesWad(1.0003771, 1000377118676784179n), false);
  assert.equal(doubleMatchesWad(NaN, 10n ** 18n), false);
});

test("canonical JSON is key-order independent and rejects bigint", () => {
  assert.equal(canonicalJson({ b: 1, a: { d: 2, c: [3, { f: 1, e: 0 }] } }), '{"a":{"c":[3,{"e":0,"f":1}],"d":2},"b":1}');
  assert.throws(() => canonicalJson({ x: 1n }));
  assert.equal(payloadHash({ a: 1, verification: { state: "x" } }), payloadHash({ a: 1, verification: { state: "y" } }));
});

test("research and verifier hash implementations agree on the real GOOGLc record", () => {
  assert.equal(payloadHash(fx.record), fx.payload_sha256);
  assert.equal(independentHash(fx.record), fx.payload_sha256);
});

test("verifier/indexer constants equal keccak of their signatures", () => {
  assert.equal(TOPICS.Announcement, keccak256(toHex("Announcement(address,string,string,string)")));
  assert.equal(TOPICS.EndAnnouncement, keccak256(toHex("EndAnnouncement(string)")));
  const src = readFileSync(new URL("../src/verify/verify.ts", import.meta.url), "utf8");
  for (const [sig, val] of [
    ["MultiplierUpdated(uint256)", keccak256(toHex("MultiplierUpdated(uint256)"))],
    ["UIMultiplierUpdated(uint256,uint256,uint256)", keccak256(toHex("UIMultiplierUpdated(uint256,uint256,uint256)"))],
    ["multiplier()", toFunctionSelector("multiplier()")],
    ["isB20(address)", toFunctionSelector("isB20(address)")],
    ["extraMetadata(string)", toFunctionSelector("extraMetadata(string)")],
    ["symbol()", toFunctionSelector("symbol()")],
    ["latestRoundData()", toFunctionSelector("latestRoundData()")],
  ]) assert.ok(src.includes(val), `${sig} ${val} pinned in verifier`);
});

test("host allowlist blocks other hosts and plain http", () => {
  assert.doesNotThrow(() => assertAllowed("https://api.coinbase.com/v1/tokenized-stocks"));
  assert.throws(() => assertAllowed("https://evil.example.com/"));
  assert.throws(() => assertAllowed("http://api.coinbase.com/"));
  assert.throws(() => assertAllowed("https://169.254.169.254/latest/meta-data"));
});
