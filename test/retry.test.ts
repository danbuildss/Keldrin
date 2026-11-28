import { test } from "node:test";
import assert from "node:assert/strict";
import { mapLimit, retryOnce } from "../src/lib/retry.ts";

test("retryOnce: one retry after a transient failure, then the error is returned", async () => {
  let n = 0;
  assert.equal(await retryOnce(async () => (++n === 1 ? Promise.reject(new Error("throttled")) : "ok"), 1), "ok");
  assert.equal(n, 2);
  let m = 0;
  await assert.rejects(retryOnce(async () => { m++; throw new Error("down"); }, 1), /down/);
  assert.equal(m, 2, "never more than one retry");
});

test("mapLimit: keeps order and never exceeds the limit", async () => {
  let inFlight = 0, peak = 0;
  const out = await mapLimit([1, 2, 3, 4, 5, 6, 7, 8, 9], 4, async (x) => {
    peak = Math.max(peak, ++inFlight);
    await new Promise((r) => setTimeout(r, 5));
    inFlight--;
    return x * 2;
  });
  assert.deepEqual(out, [2, 4, 6, 8, 10, 12, 14, 16, 18]);
  assert.ok(peak <= 4, `peak ${peak}`);
});
