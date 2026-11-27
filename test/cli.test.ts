import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

// Phase 10: the published CLI (npm/cli.js, the committed bundle) run as a subprocess against a local fake Keldrin API
// and a fake Base RPC. Offline; checks output, exit codes and that verify-* really compares against the chain.

const CLI = fileURLToPath(new URL("../npm/cli.js", import.meta.url));
const NV = "0xd4E6dfCA1a4fBc4cBB5D46e1A1E1e3e7f1f1f1f1";
const FEED = "0x04689a41629776563E6822F76f2e57D148d28513";
const ROUND = ((2n << 64n) | 9n).toString();

function listen(handler: (path: string, body: string) => { status: number; json?: unknown }): Promise<{ url: string; server: Server }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let body = "";
      req.on("data", (c) => (body += c));
      req.on("end", () => {
        const r = handler(req.url ?? "/", body);
        res.writeHead(r.status, { "content-type": "application/json" });
        res.end(r.json === undefined ? "" : JSON.stringify(r.json));
      });
    });
    server.listen(0, "127.0.0.1", () => resolve({ url: `http://127.0.0.1:${(server.address() as { port: number }).port}`, server }));
  });
}
function run(args: string[], stdin?: string): Promise<{ code: number; out: string; err: string }> {
  return new Promise((resolve) => {
    const p = spawn(process.execPath, [CLI, ...args], { env: { ...process.env, KELDRIN_API: "", BASE_RPC_URL: "" } });
    let out = "";
    let err = "";
    p.stdout.on("data", (c) => (out += c));
    p.stderr.on("data", (c) => (err += c));
    p.on("close", (code) => resolve({ code: code ?? -1, out, err }));
    if (stdin !== undefined) p.stdin.end(stdin);
    else p.stdin.end();
  });
}

const served = { round_id: ROUND, answer_raw: "15000000000", updated_at: "2026-11-27T17:55:00.000Z", nav: "150.00000000" };
function fakeApi(opts: { premium: number | null }) {
  return listen((path, body) => {
    if (path === "/v1/assets") return { status: 200, json: { data: [{ symbol: "NVDAc", contract_address: NV, name: "NVIDIA", multiplier_wad: "1000000000000000000" }] } };
    if (path.startsWith(`/v1/assets/${NV}/market-context`))
      return { status: 200, json: { data: { symbol: "NVDAc", market: { session: "open", next_open: null }, nav: { nav: "150", round_id: ROUND, age_s: 600 }, staleness: { state: opts.premium === null ? "unexpectedly_stale" : "fresh" }, dex: { price_usd: "151.5", venue: "uniswap_v3", nav_premium_pct: opts.premium, ...(opts.premium === null ? { premium_unavailable_reason: "nav_unexpectedly_stale" } : {}) } } } };
    if (path.startsWith(`/v1/assets/${NV}/nav/history`)) return { status: 200, json: { data: [served], meta: { symbol: "NVDAc", feed: FEED, interval: "round", quality: { verification: { verdict: "CONFIRMED" } } } } };
    if (path === "/mcp") {
      const m = JSON.parse(body);
      if (m.id === undefined) return { status: 202 };
      return { status: 200, json: { jsonrpc: "2.0", id: m.id, result: { echoed: m.method } } };
    }
    return { status: 404, json: { error: { code: "NOT_FOUND", message: "no route" } } };
  });
}
// getRoundData answer: roundId, answer, startedAt, updatedAt, answeredInRound
function fakeChain(answer: bigint) {
  const w = (n: bigint) => n.toString(16).padStart(64, "0");
  return listen((_p, body) => {
    const m = JSON.parse(body);
    const upd = BigInt(Date.parse(served.updated_at) / 1000);
    return { status: 200, json: { jsonrpc: "2.0", id: m.id, result: "0x" + w(BigInt(ROUND)) + w(answer) + w(upd) + w(upd) + w(BigInt(ROUND)) } };
  });
}

test("CLI: help, version, unknown command exit code", async () => {
  assert.match((await run(["--version"])).out, /^\d+\.\d+\.\d+/);
  assert.match((await run(["help"])).out, /verify-nav/);
  const bad = await run(["nope"]);
  assert.equal(bad.code, 2);
  assert.match(bad.err, /unknown command/);
});

test("CLI: assets, symbol resolution and market context (gap shown, or withheld with its reason)", async () => {
  const a = await fakeApi({ premium: 1 });
  const b = await fakeApi({ premium: null });
  try {
    const list = await run(["assets", `--api=${a.url}`]);
    assert.equal(list.code, 0);
    assert.match(list.out, /NVDAc/);
    const ctx = await run(["context", "NVDAc", `--api=${a.url}`]);
    assert.equal(ctx.code, 0, ctx.err);
    assert.match(ctx.out, /\+1% vs NAV/);
    const withheld = await run(["context", "NVDAc", `--api=${b.url}`]);
    assert.match(withheld.out, /gap vs NAV withheld \(nav_unexpectedly_stale\)/);
    assert.doesNotMatch(withheld.out, /null%/);
    const json = await run(["context", NV, "--json", `--api=${a.url}`]);
    assert.equal(JSON.parse(json.out).symbol, "NVDAc");
    const missing = await run(["context", "AAPLc", `--api=${a.url}`]);
    assert.equal(missing.code, 2);
    assert.match(missing.err, /no token with exact symbol/);
  } finally {
    a.server.close();
    b.server.close();
  }
});

test("CLI: verify-nav re-reads getRoundData; exit 0 on match, 1 on mismatch", async () => {
  const api = await fakeApi({ premium: 1 });
  const good = await fakeChain(15000000000n);
  const bad = await fakeChain(15000000001n);
  try {
    const ok = await run(["verify-nav", "NVDAc", `--api=${api.url}`, `--rpc=${good.url}`]);
    assert.equal(ok.code, 0, ok.out + ok.err);
    assert.match(ok.out, /1\/1 served NAV rounds match/);
    const no = await run(["verify-nav", "NVDAc", `--api=${api.url}`, `--rpc=${bad.url}`]);
    assert.equal(no.code, 1);
    assert.match(no.out, /MISMATCH/);
  } finally {
    api.server.close();
    good.server.close();
    bad.server.close();
  }
});

test("CLI: mcp bridges stdio lines to the remote endpoint; notifications get no reply", async () => {
  const api = await fakeApi({ premium: 1 });
  try {
    const r = await run(["mcp", `--api=${api.url}`], JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n" + JSON.stringify({ jsonrpc: "2.0", id: 7, method: "tools/list" }) + "\n");
    const lines = r.out.trim().split("\n");
    assert.equal(lines.length, 1, r.out);
    assert.deepEqual(JSON.parse(lines[0]), { jsonrpc: "2.0", id: 7, result: { echoed: "tools/list" } });
  } finally {
    api.server.close();
  }
});
