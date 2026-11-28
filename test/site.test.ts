// Phase 12 tests: website page and the feedback route.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { openDb } from "../src/db/db.ts";
import { handle } from "../src/api/server.ts";

const html = readFileSync(new URL("../public/index.html", import.meta.url), "utf8");

test("site: lowercase wordmark, SOMEHOW footer, honest live numbers, no metered call, reduced-motion support", () => {
  assert.match(html, /keldrin, built by <a href="https:\/\/somehowinternet.app\/"[^>]*>SOMEHOW<\/a>/);
  assert.doesNotMatch(html, />Keldrin</, "the wordmark is lowercase");
  assert.match(html, /prefers-reduced-motion/);
  assert.match(html, /fetch\("\/health"|getJson\("\/health"\)/);
  assert.doesNotMatch(html, /getJson\("\/v1\/snapshot|fetch\("\/v1\/snapshot/, "the page must not spend visitors' free tries");
  const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(srcs, ["/_vercel/insights/script.js"], "no third-party scripts: only Vercel Analytics from our own origin");
  assert.match(html, /Not affiliated with Base, Coinbase or Chainlink/);
  assert.match(html, /Never sold or shared/);
});

async function server() {
  const db = await openDb();
  const srv = createServer((req, res) => void handle(db, req, res));
  await new Promise<void>((r) => srv.listen(0, "127.0.0.1", () => r()));
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  const post = (body: unknown, ip = "5.5.5.5") => fetch(base + "/v1/feedback", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": ip }, body: typeof body === "string" ? body : JSON.stringify(body) });
  return { db, srv, base, post };
}

test("feedback: validated, stored with a hashed client (no IP), honeypot ignored, 5 per client per day", async () => {
  const { db, srv, base, post } = await server();
  try {
    assert.equal((await post({ email: "nope" })).status, 400);
    assert.equal((await post({ email: "a@b.co", x: "has space" })).status, 400);
    assert.equal((await post({ email: "a@b.co", message: "x".repeat(1001) })).status, 400);
    assert.equal((await post("{not json")).status, 400);
    assert.equal((await post({ email: "bot@b.co", website: "spam" })).status, 200);
    const ok = await post({ email: "dev@example.com", x: "@builder_1", message: "more feeds please" });
    assert.equal(ok.status, 200);
    const rows = (await db.query<Record<string, unknown>>("SELECT email, x_handle, message, client_hash FROM feedback")).rows;
    assert.equal(rows.length, 1, "the honeypot submission is not stored");
    assert.equal(rows[0].x_handle, "builder_1");
    assert.ok(!JSON.stringify(rows).includes("5.5.5.5"));
    for (let i = 0; i < 4; i++) assert.equal((await post({ email: `d${i}@example.com` })).status, 200);
    assert.equal((await post({ email: "six@example.com" })).status, 429);
    assert.equal((await post({ email: "other@example.com" }, "6.6.6.6")).status, 200, "another client is not limited");
    assert.ok([404, 405].includes((await fetch(base + "/v1/feedback")).status), "GET is not a feedback route");
    assert.equal((await fetch(base + "/v1/events", { method: "POST" })).status, 405, "other routes stay read-only");
    assert.equal((await fetch(base + "/v1")).status, 200, "API index at /v1");
  } finally {
    srv.close();
    await db.close();
  }
});

test("product pages: no hard-coded financial figures; every number comes from the API at load time", () => {
  for (const f of ["explorer", "playground", "transparency"]) {
    const page = readFileSync(new URL(`../public/${f}.html`, import.meta.url), "utf8");
    const body = page.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/\$0\.05 USDC/g, "PRICE");
    assert.doesNotMatch(body, /\$\s?\d/, `${f}: a dollar figure is hard-coded`);
    assert.doesNotMatch(body, /\b\d{2,3},\d{3}\b/, `${f}: a count is hard-coded`);
    assert.match(page, /keldrin, built by SOMEHOW|nav\(/, `${f}: shared nav/footer`);
  }
});
