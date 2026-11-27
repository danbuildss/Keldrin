// Phase 13: docs-drift tests. Agents read skill.md, llms.txt, OpenAPI and the Bankr listing; these must never disagree
// with the code about prices, payees, URLs, versions or tool names.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PAID } from "../src/api/trial.ts";
import { TOOLS } from "../src/api/mcp.ts";
import { LLMS_TXT } from "../src/api/server.ts";
import { PACKAGE_VERSION } from "../src/version.ts";

const read = (p: string) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const skill = read("public/skill.md");
const openapi = JSON.parse(read("openapi/keldrin.v1.json"));
const bankr = JSON.parse(read("bankr/bankr.x402.json"));
const vercel = JSON.parse(read("vercel.json"));
const ROUTER = "0x8AEE621035D93Deb3C0C1177fac252dC2dd501a0";

test("one price and one payee everywhere: $0.05 = 50000 USDC units to Bankr's router", () => {
  for (const s of Object.values(bankr.services) as { price: string }[]) assert.equal(s.price, "0.05");
  assert.match(PAID.price, /^0\.05 USDC on Base$/);
  assert.match(skill, /`50000` or less/);
  assert.ok(skill.includes(ROUTER));
  for (const p of ["/api/snapshot", "/api/report"]) {
    const info = openapi.paths[p].get["x-payment-info"];
    assert.equal(info.amount, "50000");
    assert.equal(info.payTo, ROUTER);
    assert.equal(info.network, "eip155:8453");
  }
});

test("the paid URLs agree: code, guide, OpenAPI and the website forwards", () => {
  const rw = Object.fromEntries((vercel.rewrites as { source: string; destination: string }[]).map((r) => [r.source, r.destination]));
  assert.equal(rw["/api/snapshot"], PAID.snapshot);
  assert.equal(rw["/api/report"], PAID.report);
  for (const u of [PAID.snapshot, PAID.report]) assert.ok(skill.includes(u.replace(/\/keldrin-(snapshot|report)$/, "")), "guide names the Bankr endpoints");
  for (const name of Object.keys(bankr.services)) assert.ok(PAID.snapshot.endsWith(name) || PAID.report.endsWith(name), `${name} has a paid link`);
  // the forwards must come before the catch-all API rewrite
  const order = (vercel.rewrites as { source: string }[]).map((r) => r.source);
  assert.ok(order.indexOf("/api/snapshot") < order.indexOf("/:path*"));
});

test("one version everywhere", () => {
  assert.equal(JSON.parse(read("package.json")).version, PACKAGE_VERSION);
  assert.equal(JSON.parse(read("npm/package.json")).version, PACKAGE_VERSION);
  assert.equal(JSON.parse(read("server.json")).version, PACKAGE_VERSION);
  assert.equal(openapi.info.version, PACKAGE_VERSION);
  assert.ok(read("src/npm/cli.ts").includes(`const VERSION = "${PACKAGE_VERSION}"`));
  assert.ok(skill.includes(`keldrin@${PACKAGE_VERSION}`), "the guide pins the current CLI version");
});

test("agents can find the guide and every documented route exists", () => {
  assert.ok(LLMS_TXT.includes("/skill.md"));
  assert.ok(openapi.paths["/skill.md"]);
  for (const p of ["/v1/snapshot", "/v1/report", "/v1/assets/{contract}/market-context", "/v1/assets/{contract}/dex", "/v1/assets/{contract}/corporate-actions", "/v1/assets/{contract}/nav/history"]) assert.ok(openapi.paths[p], p);
  const names = TOOLS.map((t) => t.name);
  for (const t of ["get_snapshot", "get_report", "get_market_context", "get_dex_price"]) assert.ok(names.includes(t), t);
  for (const code of ["FREE_TRIES_USED", "INCOMPLETE", "UNKNOWN_ASSET", "AMBIGUOUS_SYMBOL", "NO_NAV_FEED"]) assert.ok(skill.includes(code), code);
});
