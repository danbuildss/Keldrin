import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { insertRecord, insertReview, openDb, upsertAsset } from "../src/db/db.ts";
import { serve } from "../src/api/server.ts";
import type { Review } from "../src/verify/verify.ts";

const fx = JSON.parse(readFileSync(new URL("../fixtures/recorded/googlc-e82812a6.json", import.meta.url), "utf8"));
const GOOGL = "0xb2000000000000000000002D0BA3164cc74f58B7";
const asset = (contract: string, symbol: string) => ({ chain_id: 8453, contract_address: contract, symbol_registry: symbol, symbol_onchain: symbol, name: "x", decimals_registry: 8, decimals_onchain: 8, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" as const });
const review = (rec: any, hash: string, verdict: Review["verdict"], id: string): Review => ({ review_id: id, record_id: rec.record_id, revision: rec.revision, payload_sha256: hash, reviewer: "test", checked_at: new Date(Date.now() + Number(id.replace(/\D/g, "")) * 1000).toISOString(), verdict, claims: [], limitations: [] });

async function setup() {
  const db = await openDb();
  await upsertAsset(db, asset(GOOGL, "GOOGLc"));
  const srv = await serve(db, 0);
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`;
  const get = async (p: string) => {
    const r = await fetch(base + p);
    return { status: r.status, body: r.headers.get("content-type")?.includes("json") ? await r.json() : await r.text() };
  };
  return { db, srv, get };
}

test("only independently CONFIRMED records are served; UNSURE and unreviewed are not", async () => {
  const { db, srv, get } = await setup();
  try {
    const ins = await insertRecord(db, structuredClone(fx.record));
    assert.equal(ins.created, true);
    assert.equal(ins.hash, fx.payload_sha256);
    assert.equal((await get(`/v1/actions?contract=${GOOGL}`)).body.data.length, 0, "unreviewed not served");
    await insertReview(db, review({ ...fx.record, revision: 1 }, ins.hash, "UNSURE", "r1"));
    assert.equal((await get(`/v1/actions?contract=${GOOGL}`)).body.data.length, 0, "UNSURE not served");
    await insertReview(db, review({ ...fx.record, revision: 1 }, ins.hash, "CONFIRMED", "r2"));
    const list = await get(`/v1/actions?contract=${GOOGL.toLowerCase()}`);
    assert.equal(list.status, 200);
    assert.equal(list.body.data.length, 1);
    assert.equal(list.body.data[0].action.multiplier_after_wad, "1000377118676784179");
    assert.equal(list.body.data[0].verification.state, "confirmed");
    const one = await get(`/v1/actions/${encodeURIComponent(fx.record.record_id)}`);
    assert.equal(one.body.data.review.verdict, "CONFIRMED");
    assert.equal(one.body.data.revisions.length, 1);
    assert.equal((await get("/v1/actions?symbol=GOOGLc")).body.data.length, 1);
    const h = await get("/health");
    assert.equal(h.body.data.records_confirmed, 1);
  } finally {
    srv.close();
    await db.close();
  }
});

test("a review of a different payload hash does not make a record servable", async () => {
  const { db, srv, get } = await setup();
  try {
    const ins = await insertRecord(db, structuredClone(fx.record));
    await insertReview(db, review({ ...fx.record, revision: 1 }, "f".repeat(64), "CONFIRMED", "r1"));
    assert.equal((await get(`/v1/actions?contract=${GOOGL}`)).body.data.length, 0);
    assert.ok(ins.created);
  } finally {
    srv.close();
    await db.close();
  }
});

test("reruns are idempotent; changed content becomes a new revision (correction), never an update", async () => {
  const db = await openDb();
  try {
    await upsertAsset(db, asset(GOOGL, "GOOGLc"));
    const a = await insertRecord(db, structuredClone(fx.record));
    // A fresh pipeline run: new timestamps AND a different key order (jsonb reorders keys on storage).
    const reverseKeys = (v: any): any => (Array.isArray(v) ? v.map(reverseKeys) : v && typeof v === "object" ? Object.fromEntries(Object.keys(v).reverse().map((k) => [k, reverseKeys(v[k])])) : v);
    const rerun = reverseKeys(structuredClone(fx.record));
    rerun.observed_at = new Date().toISOString();
    rerun.sources = rerun.sources.map((s: any) => ({ ...s, retrieved_at: new Date().toISOString() }));
    const b = await insertRecord(db, rerun);
    assert.deepEqual([b.created, b.revision], [false, 1]);
    const corrected = structuredClone(fx.record);
    corrected.flags = [...corrected.flags, "test_correction"];
    const c = await insertRecord(db, corrected);
    assert.deepEqual([c.created, c.revision], [true, 2]);
    const rev2 = (await db.query<{ payload: any }>("SELECT payload FROM records WHERE record_id=$1 AND revision=2", [fx.record.record_id])).rows[0].payload;
    assert.equal(rev2.supersedes, 1);
    assert.notEqual(c.hash, a.hash);
    await assert.rejects(db.query("UPDATE records SET payload_sha256 = $1", ["0".repeat(64)]), /append-only/);
    await assert.rejects(db.query("DELETE FROM records"), /append-only/);
  } finally {
    await db.close();
  }
});

test("latest revision must itself be confirmed: an unreviewed correction withdraws the old one from serving", async () => {
  const { db, srv, get } = await setup();
  try {
    const a = await insertRecord(db, structuredClone(fx.record));
    await insertReview(db, review({ ...fx.record, revision: 1 }, a.hash, "CONFIRMED", "r1"));
    assert.equal((await get(`/v1/actions?contract=${GOOGL}`)).body.data.length, 1);
    const corrected = structuredClone(fx.record);
    corrected.flags = [...corrected.flags, "test_correction"];
    await insertRecord(db, corrected);
    assert.equal((await get(`/v1/actions?contract=${GOOGL}`)).body.data.length, 0, "fail closed until the correction is reviewed");
  } finally {
    srv.close();
    await db.close();
  }
});

test("API input errors are structured and specific", async () => {
  const { db, srv, get } = await setup();
  try {
    await upsertAsset(db, asset("0xb200000000000000000000000000000000000001", "DUPc"));
    await upsertAsset(db, asset("0xb200000000000000000000000000000000000002", "DUPc"));
    assert.equal((await get("/v1/actions?contract=0x123")).body.error.code, "BAD_ADDRESS");
    assert.equal((await get("/v1/actions?symbol=NOPEc")).status, 404);
    const amb = await get("/v1/actions?symbol=DUPc");
    assert.deepEqual([amb.status, amb.body.error.code], [409, "AMBIGUOUS_SYMBOL"]);
    assert.equal((await get("/v1/actions?limit=0")).body.error.code, "BAD_LIMIT");
    assert.equal((await get("/v1/actions?cursor=abc")).body.error.code, "BAD_CURSOR");
    assert.equal((await get("/v1/actions/%E0%A4%A")).body.error.code, "BAD_RECORD_ID");
    assert.equal((await get("/v1/actions/kld:8453:nope")).status, 404);
    assert.equal((await get(`/v1/assets/${GOOGL}`)).status, 200);
    assert.equal((await get("/v1/assets/0xb2000000000000000000000000000000000000ff")).status, 404);
    assert.match((await get("/llms.txt")).body as string, /confirmed/);
    const spec = (await get("/openapi.json")).body;
    assert.equal(spec.openapi, "3.1.0");
    for (const route of ["/v1/assets", "/v1/actions", "/v1/actions/{record_id}", "/health"]) assert.ok(spec.paths[route], route);
    assert.equal((await get("/nope")).status, 404);
    const post = await fetch(`http://127.0.0.1:${(srv.address() as AddressInfo).port}/v1/assets`, { method: "POST" });
    assert.equal(post.status, 405);
  } finally {
    srv.close();
    await db.close();
  }
});

test("pagination never skips records sharing a block, and reaches pending (null-block) records", async () => {
  const { db, srv, get } = await setup();
  try {
    const mk = (i: number, block: string | null) => {
      const r = structuredClone(fx.record);
      r.record_id = `kld:8453:${GOOGL.toLowerCase()}:t${i}`;
      if (block === null) { r.action.status = "scheduled"; r.action.effective = null; } else r.action.effective = { ...r.action.effective, block };
      return r;
    };
    const blocks = ["300", "200", "200", "200", "100", null, null];
    for (let i = 0; i < blocks.length; i++) {
      const r = mk(i, blocks[i]);
      const ins = await insertRecord(db, r);
      await insertReview(db, review({ ...r, revision: 1 }, ins.hash, "CONFIRMED", `r${i}`));
    }
    const seen: string[] = [];
    let cursor: string | null = null;
    for (let guard = 0; guard < 10; guard++) {
      const page: any = await get(`/v1/actions?contract=${GOOGL}&limit=2${cursor ? `&cursor=${cursor}` : ""}`);
      seen.push(...page.body.data.map((d: any) => d.record_id));
      cursor = page.body.meta.next_cursor;
      if (!cursor) break;
    }
    assert.equal(seen.length, blocks.length);
    assert.equal(new Set(seen).size, blocks.length);
  } finally {
    srv.close();
    await db.close();
  }
});

test("company_context is served only when its review CONFIRMED and it links the current revision's hash", async () => {
  const { db, srv, get } = await setup();
  try {
    const ins = await insertRecord(db, structuredClone(fx.record));
    await insertReview(db, review({ ...fx.record, revision: 1 }, ins.hash, "CONFIRMED", "r1"));
    const url = `/v1/actions/${encodeURIComponent(fx.record.record_id)}`;
    const add = (key: string, linked: string, verdict: string) =>
      db.query("INSERT INTO reconciliations (reconciliation_id, record_id, record_payload_sha256, status, payload, payload_sha256, review_verdict, review) VALUES ($1,$2,$3,'partially_reconciled',$4,$5,$6,'{}')", [key, fx.record.record_id, linked, JSON.stringify({ k: key }), key.padEnd(64, "0").slice(0, 64), verdict]);
    await add("a", ins.hash, "UNSURE");
    assert.equal((await get(url)).body.data.company_context, null, "UNSURE reconciliation not served");
    await add("b", "f".repeat(64), "CONFIRMED");
    assert.equal((await get(url)).body.data.company_context, null, "reconciliation of another payload not served");
    await add("c", ins.hash, "CONFIRMED");
    assert.equal((await get(url)).body.data.company_context.k, "c");
  } finally {
    srv.close();
    await db.close();
  }
});
