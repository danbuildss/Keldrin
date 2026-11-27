// Integration test for the Phase 4 writer path against a REAL Postgres (not PGlite).
// Runs only when KELDRIN_TEST_PG_ADMIN is set to an admin URL of a throwaway server, e.g.
//   KELDRIN_TEST_PG_ADMIN=postgres://postgres@127.0.0.1:55432/postgres node --test test/pg-writer.test.ts
// It creates the `keldrin` schema with every migration (incl. Supabase hardening) and logs in as keldrin_writer.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import pg from "pg";
import { insertRecord, insertReview, recordSource, upsertAsset } from "../src/db/db.ts";
import { openPg, openPgWriter } from "../src/db/pg.ts";
import type { PGlite } from "@electric-sql/pglite";

const ADMIN = process.env.KELDRIN_TEST_PG_ADMIN;
const fx = JSON.parse(readFileSync(new URL("../fixtures/recorded/googlc-e82812a6.json", import.meta.url), "utf8"));
const GOOGL = "0xb2000000000000000000002D0BA3164cc74f58B7";
const asset = { chain_id: 8453, contract_address: GOOGL, symbol_registry: "GOOGLc", symbol_onchain: "GOOGLc", name: "x", decimals_registry: 8, decimals_onchain: 8, isin_registry: null, isin_onchain: null, is_b20: true, multiplier_wad: "1000000000000000000", registry_multiplier_double: 1, first_mint_date: null, observed_block: "1", checks: [], identity_state: "verified" as const };
const mig = (d: string) => readdirSync(new URL(d, import.meta.url)).filter((f) => f.endsWith(".sql")).sort().map((f) => readFileSync(new URL(d + f, import.meta.url), "utf8"));

async function setup() {
  const admin = new pg.Client({ connectionString: ADMIN });
  await admin.connect();
  await admin.query("DROP SCHEMA IF EXISTS keldrin CASCADE; DROP ROLE IF EXISTS keldrin_writer; DROP ROLE IF EXISTS keldrin_reader;");
  await admin.query("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; END $$;");
  await admin.query("CREATE SCHEMA keldrin; SET search_path TO keldrin, public;");
  for (const sql of [...mig("../src/db/migrations/"), ...mig("../src/db/migrations/supabase/")]) await admin.query("SET search_path TO keldrin, public; " + sql);
  await admin.query("ALTER ROLE keldrin_writer WITH LOGIN PASSWORD 'test-only'; ALTER ROLE keldrin_reader WITH LOGIN PASSWORD 'test-only';");
  const u = new URL(ADMIN!);
  const as = (role: string) => { const x = new URL(u); x.username = role; x.password = "test-only"; return x.toString(); };
  return { admin, writerUrl: as("keldrin_writer"), readerUrl: as("keldrin_reader") };
}

test("writer role: pipeline writes work, are idempotent, and nothing beyond append/upsert is allowed", { skip: !ADMIN && "set KELDRIN_TEST_PG_ADMIN to run" }, async () => {
  const { admin, writerUrl, readerUrl } = await setup();
  const w = openPgWriter(writerUrl + "?sslmode=disable") as unknown as PGlite;
  try {
    await upsertAsset(w, asset);
    await upsertAsset(w, { ...asset, multiplier_wad: "1000377118676784179" }); // upsert path (UPDATE on assets)
    await recordSource(w, { sha256: "a".repeat(64), url: "https://example.test", kind: "t", status: 200, bytes: 1, retrievedAt: new Date().toISOString(), rights: "unknown" });
    await recordSource(w, { sha256: "a".repeat(64), url: "https://example.test", kind: "t", status: 200, bytes: 1, retrievedAt: new Date().toISOString(), rights: "unknown" });
    const first = await insertRecord(w, structuredClone(fx.record));
    assert.equal(first.created, true);
    assert.equal(first.hash, fx.payload_sha256, "same canonical hash as PGlite");
    const again = await insertRecord(w, structuredClone(fx.record));
    assert.deepEqual([again.created, again.revision], [false, 1], "rerun is a no-op (jsonb round trip through real Postgres)");
    await insertReview(w, { review_id: "r1", record_id: fx.record.record_id, revision: 1, payload_sha256: first.hash, reviewer: "test", checked_at: new Date().toISOString(), verdict: "CONFIRMED", claims: [], limitations: [] });
    await w.query("INSERT INTO runs (run_id, kind, started_at, head_block, rpc_calls, outcome, summary) VALUES ($1,'discover',now(),$2,$3,'ok',$4)", ["run-test", 123n, 5, JSON.stringify({ ok: true })]);
    const denied = async (sql: string) => assert.rejects(w.query(sql), /permission denied|append-only|must be owner/i, sql);
    await denied("DELETE FROM runs");
    await denied("DELETE FROM records");
    await denied("UPDATE records SET record_type = record_type");
    await denied("UPDATE runs SET outcome = 'x'");
    await denied("TRUNCATE records");
    await denied("SELECT * FROM schema_migrations");
    await denied("CREATE TABLE x_probe (a int)");
    await denied("DROP TABLE records");
    // the read-only API role sees what the writer wrote
    const r = openPg(readerUrl + "?sslmode=disable");
    assert.equal((await r.query<{ n: number }>("SELECT count(*)::int AS n FROM confirmed_records")).rows[0].n, 1);
    await r.close();
  } finally {
    await w.close();
    await admin.end();
  }
});
