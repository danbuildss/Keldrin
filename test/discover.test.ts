import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { bisectChanges, pairBrackets } from "../src/pipeline/discover.ts";
import { decodeB20Logs, type RpcReceipt } from "../src/adapters/chain.ts";
import { actionUuidFromUri } from "../src/adapters/coinbase.ts";

const fx = JSON.parse(readFileSync(new URL("../fixtures/recorded/googlc-e82812a6.json", import.meta.url), "utf8"));
const GOOGL = "0xb2000000000000000000002D0BA3164cc74f58B7";
const receipt = (h: string) => fx.transcript[`eth_getTransactionReceipt ${JSON.stringify([h])}`] as RpcReceipt;
const RC_NOTICE = receipt("0xb5aa54fb26131123a7bb931e31d63baf466e1a1075d74450d048da88ad6a1444");
const RC_APPLY = receipt("0xcd45e69e5b84d3f1808fe832d73c1ff7f332c7447bdf9c87925f196240ffeb00");

test("bisection finds every step of a step function, including a deployment", async () => {
  const f = async (b: bigint) => (b < 100n ? null : b < 400n ? 1n : b < 401n ? 2n : 3n);
  const out = await bisectChanges(f, 0n, await f(0n), 1000n, await f(1000n));
  assert.deepEqual(out.map((c) => [c.block, c.before, c.after]), [[100n, null, 1n], [400n, 1n, 2n], [401n, 2n, 3n]]);
  assert.deepEqual(await bisectChanges(f, 500n, 3n, 900n, 3n), []);
});

test("real GOOGLc receipts: brackets paired by id; multiplier change inside the applied bracket", () => {
  const logs = decodeB20Logs([...RC_NOTICE.logs, ...RC_APPLY.logs], GOOGL);
  const { announcements, unbracketed } = pairBrackets(logs);
  assert.equal(announcements.length, 2);
  assert.deepEqual(announcements.map((a) => [a.id, a.bracketed, a.innerEvents]), [["2097", true, []], ["e82812a6-0b24-41c4-8ed1-322d1b466d33", true, ["MultiplierUpdated"]]]);
  assert.equal(unbracketed.length, 0);
  assert.equal(logs.filter((l) => l.eventName === "UIMultiplierUpdated").length, 0, "issuer emitted only the legacy event");
});

test("a multiplier event outside any bracket is flagged as unbracketed", () => {
  const logs = decodeB20Logs(RC_APPLY.logs, GOOGL);
  const noEnd = logs.filter((l) => l.eventName !== "EndAnnouncement");
  const r = pairBrackets(noEnd);
  assert.equal(r.announcements[0].bracketed, false);
  assert.equal(r.unbracketed.length, 1);
  const r2 = pairBrackets(logs.filter((l) => l.eventName === "MultiplierUpdated"));
  assert.equal(r2.announcements.length, 0);
  assert.equal(r2.unbracketed.length, 1);
});

test("logs from other contracts are ignored", () => {
  assert.equal(decodeB20Logs(RC_APPLY.logs, "0xb20000000000000000000078ee7ce2fE4908108C").length, 0);
});

test("corporate-action uuid only from the documented issuer uri", () => {
  assert.equal(actionUuidFromUri("https://api.coinbase.com/v1/tokenized-stocks/corporate-actions/e82812a6-0b24-41c4-8ed1-322d1b466d33"), "e82812a6-0b24-41c4-8ed1-322d1b466d33");
  assert.equal(actionUuidFromUri("https://evil.example/v1/tokenized-stocks/corporate-actions/e82812a6-0b24-41c4-8ed1-322d1b466d33"), null);
  assert.equal(actionUuidFromUri("https://api.coinbase.com/v1/tokenized-stocks/corporate-actions/2097"), null);
  assert.equal(actionUuidFromUri("https://api.coinbase.com/v1/tokenized-stocks/corporate-actions/../chains"), null);
  assert.equal(actionUuidFromUri("not a url"), null);
});
