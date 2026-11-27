import { PGlite } from "@electric-sql/pglite";
import { mkdirSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { hashRecord, type IssuerActionRecord } from "../pipeline/records.ts";
import { canonicalJson } from "../lib/canonical.ts";
import type { AssetIdentity } from "../pipeline/registry.ts";
import type { Review } from "../verify/verify.ts";

const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), "migrations");

/**
 * Open the database. `dataDir` undefined = in-memory (tests); "supabase" = the Supabase primary store
 * over the Management API (admin; cloud sessions only); "pg" = the same store through the
 * least-privilege `keldrin_writer` login in KELDRIN_WRITER_URL (scheduled runs).
 */
export async function openDb(dataDir?: string): Promise<PGlite> {
  if (dataDir === "pg") {
    const { openPgWriter } = await import("./pg.ts");
    return openPgWriter(process.env.KELDRIN_WRITER_URL ?? "") as unknown as PGlite; // schema managed by `supabase migrate`
  }
  if (dataDir === "supabase") {
    const { SupabaseDb } = await import("./supabase.ts");
    return new SupabaseDb() as unknown as PGlite; // schema managed by `supabase migrate`, not here
  }
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  const db = new PGlite(dataDir);
  for (const f of readdirSync(MIGRATIONS).filter((x) => x.endsWith(".sql")).sort()) {
    const done = await db.query("SELECT 1 FROM pg_tables WHERE tablename = 'schema_migrations'").then(async (r) => (r.rows.length ? (await db.query("SELECT 1 FROM schema_migrations WHERE version = $1", [f])).rows.length > 0 : false));
    if (done) continue;
    await db.exec(readFileSync(join(MIGRATIONS, f), "utf8"));
    await db.query("INSERT INTO schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING", [f]);
  }
  return db;
}

export async function upsertAsset(db: PGlite, a: AssetIdentity) {
  await db.query(
    `INSERT INTO assets (chain_id, contract_address, symbol, name, isin, identity_state, multiplier_wad, observed_block, identity, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
     ON CONFLICT (chain_id, contract_address) DO UPDATE SET symbol=EXCLUDED.symbol, name=EXCLUDED.name, isin=EXCLUDED.isin,
       identity_state=EXCLUDED.identity_state, multiplier_wad=EXCLUDED.multiplier_wad, observed_block=EXCLUDED.observed_block, identity=EXCLUDED.identity, updated_at=now()`,
    [a.chain_id, a.contract_address, a.symbol_onchain ?? a.symbol_registry, a.name, a.isin_onchain ?? a.isin_registry, a.identity_state, a.multiplier_wad, a.observed_block, JSON.stringify(a)],
  );
}

/**
 * Idempotent, append-only insert. Same content → no-op. Changed content for an existing record_id →
 * new revision that supersedes the previous one (a correction), never an update.
 */
export async function insertRecord(db: PGlite, rec: IssuerActionRecord): Promise<{ revision: number; created: boolean; hash: string }> {
  const prev = (await db.query<{ revision: number; payload_sha256: string }>("SELECT revision, payload_sha256 FROM records WHERE record_id=$1 ORDER BY revision DESC LIMIT 1", [rec.record_id])).rows[0];
  // observed_at / retrieved_at change every run; compare content without them so reruns stay idempotent
  if (prev) {
    const old = (await db.query<{ payload: IssuerActionRecord }>("SELECT payload FROM records WHERE record_id=$1 AND revision=$2", [rec.record_id, prev.revision])).rows[0].payload;
    if (sameContent(old, rec)) return { revision: prev.revision, created: false, hash: prev.payload_sha256 };
  }
  const next = { ...rec, revision: prev ? prev.revision + 1 : 1, supersedes: prev ? prev.revision : null };
  const hash = hashRecord(next);
  await db.query(
    "INSERT INTO records (record_id, revision, record_type, chain_id, contract_address, effective_block, payload, payload_sha256) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [next.record_id, next.revision, next.record_type, next.asset.chain_id, next.asset.contract_address, next.action.effective?.block ?? null, JSON.stringify(next), hash],
  );
  return { revision: next.revision, created: true, hash };
}

const volatile = (r: IssuerActionRecord) => ({ ...r, revision: 0, supersedes: null, observed_at: "", verification: null, sources: r.sources.map((s) => ({ ...s, retrieved_at: "" })) });
// jsonb does not preserve key order, so compare canonically (sorted keys), never with JSON.stringify.
export const sameContent = (a: IssuerActionRecord, b: IssuerActionRecord) => canonicalJson(volatile(a)) === canonicalJson(volatile(b));

export async function insertReview(db: PGlite, rv: Review) {
  await db.query(
    "INSERT INTO reviews (review_id, record_id, revision, payload_sha256, verdict, reviewer, claims, checked_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [rv.review_id, rv.record_id, rv.revision, rv.payload_sha256, rv.verdict, rv.reviewer, JSON.stringify({ claims: rv.claims, limitations: rv.limitations }), rv.checked_at],
  );
}

export async function recordSource(db: PGlite, s: { sha256: string; url: string; kind: string; status: number; bytes: number; retrievedAt: string; rights: string }) {
  await db.query("INSERT INTO sources (sha256, url, kind, http_status, bytes, retrieved_at, rights_state) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING", [s.sha256, s.url, s.kind, s.status, s.bytes, s.retrievedAt, s.rights]);
}
