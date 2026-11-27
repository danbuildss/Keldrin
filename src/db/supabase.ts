import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { PGlite } from "@electric-sql/pglite";
import { fetchText } from "../lib/http.ts";

// Supabase over HTTPS (Management API SQL endpoint). In this cloud session the access token is injected
// by the network layer; elsewhere set SUPABASE_ACCESS_TOKEN. The token is never logged or stored.
// Phase 3 serving will use a read-only Postgres role instead of this admin path.

export const SUPABASE_REF = process.env.SUPABASE_PROJECT_REF ?? "ozrihkoekkadskgyrrtm";
const URL_ = `https://api.supabase.com/v1/projects/${SUPABASE_REF}/database/query`;
const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), "migrations");

export async function sbQuery<T = Record<string, unknown>>(sql: string): Promise<T[]> {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.SUPABASE_ACCESS_TOKEN) headers.authorization = `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`;
  const r = await fetchText(URL_, { method: "POST", body: JSON.stringify({ query: sql }), headers, minIntervalMs: 150 });
  if (r.status >= 300) throw new Error(`supabase SQL HTTP ${r.status}: ${r.body.slice(0, 300)}`);
  return JSON.parse(r.body) as T[];
}

/** Dollar-quote a value with a tag guaranteed not to occur inside it. */
export function dollarQuote(s: string): string {
  let tag = "kld";
  for (let i = 0; s.includes(`$${tag}$`); i++) tag = `kld${i}`;
  return `$${tag}$${s}$${tag}$`;
}

/** Apply 001.., 002.. into `schema` (search_path) and, for the live schema, the Supabase hardening. Idempotent. */
export async function migrate(schema = "keldrin", withSecurity = true): Promise<string[]> {
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error("bad schema name");
  const applied: string[] = [];
  await sbQuery(`CREATE SCHEMA IF NOT EXISTS ${schema}; SET search_path TO ${schema}; CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());`);
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort().map((f) => ({ f, sql: readFileSync(join(MIGRATIONS, f), "utf8") }));
  if (withSecurity) for (const f of readdirSync(join(MIGRATIONS, "supabase")).filter((x) => x.endsWith(".sql")).sort()) files.push({ f: `supabase/${f}`, sql: readFileSync(join(MIGRATIONS, "supabase", f), "utf8") });
  for (const { f, sql } of files) {
    const done = await sbQuery<{ n: number }>(`SELECT count(*)::int AS n FROM ${schema}.schema_migrations WHERE version = ${dollarQuote(f)}`);
    if (done[0].n > 0) continue;
    // One request = one transaction-ish batch; the migration's own statements are idempotent.
    await sbQuery(`SET search_path TO ${schema}, public; ${sql}\nINSERT INTO ${schema}.schema_migrations (version) VALUES (${dollarQuote(f)}) ON CONFLICT DO NOTHING;`);
    applied.push(f);
  }
  return applied;
}

const TABLES: { name: string; key: string; upsert?: string }[] = [
  { name: "sources", key: "sha256" },
  { name: "assets", key: "chain_id, contract_address", upsert: "symbol=EXCLUDED.symbol, name=EXCLUDED.name, isin=EXCLUDED.isin, identity_state=EXCLUDED.identity_state, multiplier_wad=EXCLUDED.multiplier_wad, observed_block=EXCLUDED.observed_block, identity=EXCLUDED.identity, updated_at=EXCLUDED.updated_at" },
  { name: "records", key: "record_id, revision" },
  { name: "reviews", key: "review_id" },
  { name: "runs", key: "run_id" },
  { name: "reconciliations", key: "reconciliation_id" },
  { name: "calendar_entries", key: "snapshot_id, entry_id" },
];

/** Copy every row of the local store into Supabase. Append-only tables: insert-if-absent; assets: upsert. */
export async function syncFromLocal(local: PGlite, schema = "keldrin", batchBytes = 400_000): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const t of TABLES) {
    const rows = (await local.query<Record<string, unknown>>(`SELECT * FROM ${t.name}`)).rows;
    let batch: Record<string, unknown>[] = [];
    let size = 0;
    const flush = async () => {
      if (!batch.length) return;
      const json = JSON.stringify(batch, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
      await sbQuery(`INSERT INTO ${schema}.${t.name} SELECT * FROM jsonb_populate_recordset(NULL::${schema}.${t.name}, ${dollarQuote(json)}::jsonb) ON CONFLICT (${t.key}) ${t.upsert ? `DO UPDATE SET ${t.upsert}` : "DO NOTHING"};`);
      batch = [];
      size = 0;
    };
    for (const r of rows) {
      const s = JSON.stringify(r, (_k, v) => (typeof v === "bigint" ? v.toString() : v)).length;
      if (size + s > batchBytes) await flush();
      batch.push(r);
      size += s;
    }
    await flush();
    out[t.name] = rows.length;
  }
  return out;
}
