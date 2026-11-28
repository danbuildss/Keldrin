import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getBlock, readMany, rpcCalls } from "./adapters/chain.ts";
import { listTokens } from "./adapters/coinbase.ts";
import { serve } from "./api/server.ts";
import { insertRecord, insertReview, openDb, recordSource, upsertAsset } from "./db/db.ts";
import { findChangePoints, gatherEvidence } from "./pipeline/discover.ts";
import { buildIssuerActionRecord, hashRecord, type IssuerActionRecord } from "./pipeline/records.ts";
import { hashReconciliation, reconcileAction } from "./pipeline/reconcile.ts";
import { verifyIdentities } from "./pipeline/registry.ts";
import { verifyDeclaration, verifyIssuerAction, verifyIssuerAnnouncement, verifyReconciliation } from "./verify/verify.ts";
import { buildCalendar, mergeIssuerAnnounced } from "./pipeline/calendar.ts";
import { scanLogs } from "./pipeline/indexer.ts";
import { getCorporateAction } from "./adapters/coinbase.ts";
import { canonicalJson } from "./lib/canonical.ts";
import { indexAll } from "./pipeline/navIndex.ts";
import { computeNavStats, insertNavReview, loadReviewInput } from "./pipeline/navStore.ts";
import { verifyNavFeed } from "./verify/navVerify.ts";
import { indexDexPools } from "./pipeline/dexPools.ts";
import { verifyDexPools } from "./verify/dexVerify.ts";
import { indexPayments } from "./pipeline/payments.ts";
import { indexEarnings } from "./pipeline/earnings.ts";
import { verifyEarnings } from "./verify/earningsVerify.ts";
import { rpc as chainRpc } from "./adapters/chain.ts";
import { RPC_URL } from "./config.ts";

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");
const DB_DIR = flag("db") ?? "data/db";
const OUT = "records";

async function run() {
  const started = new Date().toISOString();
  const runId = `run-${started.replace(/[:.]/g, "-")}`;
  const db = await openDb(DB_DIR);
  const head = await getBlock("latest");
  console.log(`run ${runId}: head block ${head.number}`);

  const { tokens, pages } = await listTokens();
  for (const p of pages) await recordSource(db, { sha256: p.sha256, url: p.url, kind: "coinbase_registry", status: p.status, bytes: p.bytes, retrievedAt: p.retrievedAt, rights: "unknown" });
  const only = flag("symbols")?.split(",");
  const scope = only ? tokens.filter((t) => only.includes(t.symbol)) : tokens;
  console.log(`registry: ${tokens.length} tokens (${pages.length} pages); scope ${scope.length}`);

  const assets = await verifyIdentities(scope, head.number);
  for (const a of assets) await upsertAsset(db, a);
  const byState = Object.groupBy(assets, (a) => a.identity_state);
  console.log(`identity: verified ${byState.verified?.length ?? 0}, incomplete ${byState.incomplete?.length ?? 0}, mismatch ${byState.mismatch?.length ?? 0}`);

  const { points } = await findChangePoints(scope, head.number);
  const results: { record_id: string; symbol: string; verdict: string; revision: number; created: boolean; flags: string[] }[] = [];
  mkdirSync(OUT, { recursive: true });
  const work: { contract: string; cp: (typeof points)[number] | null }[] = points.map((p) => ({ contract: p.contract, cp: p }));
  // pending scheduled updates (effectiveAt in the future), checked in one batched pass
  const pend = await readMany(assets.map((a) => ({ address: a.contract_address, fn: "effectiveAt" as const })), head.number);
  assets.forEach((a, i) => {
    const ea = pend[i] as bigint | null;
    if (ea !== null && ea > head.timestamp) work.push({ contract: a.contract_address, cp: null });
  });
  console.log(`pending scheduled updates: ${work.filter((w) => !w.cp).length}`);
  for (const w of work) {
    const asset = assets.find((a) => a.contract_address === w.contract)!;
    const ev = await gatherEvidence(w.contract, w.cp, head);
    if (!w.cp && !ev.pending) continue;
    if (ev.coinbase) await recordSource(db, { sha256: ev.coinbase.source.sha256, url: ev.coinbase.source.url, kind: "coinbase_corporate_action", status: ev.coinbase.source.status, bytes: ev.coinbase.source.bytes, retrievedAt: ev.coinbase.source.retrievedAt, rights: "unknown" });
    const rec = buildIssuerActionRecord(ev, asset);
    const ins = await insertRecord(db, rec);
    const stored = (await db.query<{ payload: IssuerActionRecord }>("SELECT payload FROM records WHERE record_id=$1 AND revision=$2", [rec.record_id, ins.revision])).rows[0].payload;
    const review = await verifyIssuerAction(JSON.parse(JSON.stringify(stored)));
    if (review.payload_sha256 !== ins.hash) throw new Error(`hash disagreement for ${rec.record_id}: research ${ins.hash} vs verifier ${review.payload_sha256}`);
    await insertReview(db, review);
    writeFileSync(join(OUT, `${rec.record_id.replace(/[:]/g, "_")}.json`), JSON.stringify({ record: stored, payload_sha256: ins.hash, review }, null, 1) + "\n");
    results.push({ record_id: rec.record_id, symbol: rec.asset.symbol, verdict: review.verdict, revision: ins.revision, created: ins.created, flags: rec.flags });
    console.log(`  ${review.verdict.padEnd(9)} ${rec.asset.symbol.padEnd(8)} ${rec.action.status} ${rec.action.effective?.block ?? "pending"} ratio ${rec.action.ratio} [${rec.flags.join(",")}]`);
  }

  const summary = {
    run_id: runId,
    head_block: head.number.toString(),
    tokens: tokens.length,
    scope: scope.length,
    identity: { verified: byState.verified?.length ?? 0, incomplete: byState.incomplete?.length ?? 0, mismatch: byState.mismatch?.length ?? 0, mismatches: (byState.mismatch ?? []).map((a) => ({ symbol: a.symbol_registry, failed: a.checks.filter((c) => c.result === "fail").map((c) => `${c.name}: ${c.detail ?? ""}`) })) },
    change_points: points.length,
    records: results,
    verdicts: Object.fromEntries(Object.entries(Object.groupBy(results, (r) => r.verdict)).map(([k, v]) => [k, v!.length])),
    rpc_calls: rpcCalls,
  };
  await db.query("INSERT INTO runs (run_id, kind, started_at, finished_at, head_block, rpc_calls, outcome, summary) VALUES ($1,'discover',$2,now(),$3,$4,$5,$6)", [runId, started, head.number.toString(), rpcCalls, "ok", JSON.stringify(summary)]);
  writeFileSync(join(OUT, "_last_run.json"), JSON.stringify(summary, null, 1) + "\n");
  console.log(`done: ${results.length} record(s); verdicts ${JSON.stringify(summary.verdicts)}; rpc calls ${rpcCalls}`);
  await db.close();
}

async function reconcileAll(only?: string[]) {
  const db = await openDb(DB_DIR);
  const rows = (await db.query<{ payload: IssuerActionRecord; payload_sha256: string }>("SELECT payload, payload_sha256 FROM confirmed_records WHERE payload->'action'->>'status' = 'applied' ORDER BY effective_block")).rows.filter((r) => !only || only.includes(r.payload.asset.symbol));
  if (!rows.length) throw new Error("no confirmed applied actions: run `npm run discover` first");
  const dir = join(OUT, "reconciliations");
  mkdirSync(dir, { recursive: true });
  const tally: Record<string, number> = {};
  for (const row of rows) {
    const recon = await reconcileAction(row.payload, row.payload_sha256);
    const review = await verifyReconciliation(JSON.parse(JSON.stringify(recon)), JSON.parse(JSON.stringify(row.payload)));
    const h = hashReconciliation(recon);
    await db.query(
      "INSERT INTO reconciliations (reconciliation_id, record_id, record_payload_sha256, status, payload, payload_sha256, review_verdict, review) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (reconciliation_id) DO NOTHING",
      [`${recon.reconciliation_id}:${h.slice(0, 12)}`, row.payload.record_id, row.payload_sha256, recon.status, JSON.stringify(recon), h, review.verdict, JSON.stringify(review)],
    );
    writeFileSync(join(dir, `${row.payload.asset.symbol}-${row.payload.action.effective!.block}.json`), JSON.stringify({ reconciliation: recon, payload_sha256: h, review }, null, 1) + "\n");
    tally[`${recon.status}/${review.verdict}`] = (tally[`${recon.status}/${review.verdict}`] ?? 0) + 1;
    const ev = recon.company_event ? `${recon.company_event.type}=${recon.company_event.value} (${recon.company_event.accession})` : "no SEC fact";
    console.log(`  ${row.payload.asset.symbol.padEnd(7)} ${recon.action_kind.padEnd(13)} ${recon.status.padEnd(20)} review ${review.verdict.padEnd(9)} cik ${recon.company?.cik ?? "-"} ${ev}; candidates ${recon.declaration_candidates.length}${recon.interpretation ? `; implied/declared ${recon.interpretation.ratio_to_declared}` : ""}`);
    if (recon.declaration) console.log("      declaration $" + recon.declaration.per_share + " record " + recon.declaration.record_date + " payable " + recon.declaration.payable_date + " (" + recon.declaration.form + " " + recon.declaration.filed + "); token adjusted " + row.payload.action.effective!.time.slice(0, 10));
    for (const c of recon.checks.filter((x) => x.result === "fail")) console.log(`      FAIL ${c.name}: ${c.detail ?? ""}`);
    for (const c of review.claims.filter((x) => x.verdict !== "CONFIRMED")) console.log(`      review ${c.verdict} ${c.claim}: ${c.evidence}`);
  }
  console.log(`reconcile: ${rows.length} action(s); ${JSON.stringify(tally)}`);
  await db.close();
}

async function calendar(symbols?: string[]) {
  const db = await openDb(DB_DIR);
  const scope = symbols ?? (await db.query<{ symbol: string }>("SELECT DISTINCT payload->'asset'->>'symbol' AS symbol FROM confirmed_records ORDER BY 1")).rows.map((r) => r.symbol);
  const asOf = new Date();
  const snapshotId = "snap-" + asOf.toISOString().replace(/[:.]/g, "-");
  // Issuer side: announced-but-not-applied actions from the log index (needs a log-capable RPC).
  const assetRows = (await db.query<{ contract_address: string; symbol: string }>("SELECT contract_address, symbol FROM assets")).rows;
  const pending: Parameters<typeof mergeIssuerAnnounced>[1] = [];
  try {
    const idx = await scanLogs(new Set(assetRows.map((a) => a.contract_address)));
    for (const [uuid, anns] of Object.entries(idx.byUuid)) {
      const ca = (await getCorporateAction(uuid)).data;
      if (ca.status !== "CORPORATE_ACTION_STATUS_ANNOUNCED") continue;
      const sym = assetRows.find((a) => a.contract_address.toLowerCase() === ca.contract_address.toLowerCase())?.symbol ?? ca.symbol;
      pending.push({ contract: ca.contract_address, symbol: sym, uuid, status: ca.status, description: ca.description, announcedAt: ca.announced_at ?? null, anns });
    }
    console.log("calendar: " + pending.length + " issuer-announced action(s) not yet applied");
  } catch (e) {
    console.log("calendar: issuer-announced side skipped (" + String((e as Error).message).slice(0, 100) + ")");
  }
  const secScope = [...new Set([...scope, ...pending.map((p) => p.symbol)])];
  const built = await buildCalendar(db, secScope, asOf);
  const entries = mergeIssuerAnnounced(built.entries, pending, asOf);
  const skipped = built.skipped;
  if (built.notApplicable.length) console.log("calendar: " + built.notApplicable.length + " past declaration(s) not applicable to the token: " + built.notApplicable.map((n) => n.symbol + " (" + n.reason + ")").join("; "));
  const out: unknown[] = [];
  for (const e of entries) {
    const parts = [] as { verdict: string; claims: unknown[] }[];
    if (e.declaration) parts.push(await verifyDeclaration(JSON.parse(JSON.stringify(e.declaration))));
    if (e.issuer_announcement) parts.push(await verifyIssuerAnnouncement(e.token.contract_address, JSON.parse(JSON.stringify(e.issuer_announcement))));
    const verdict = parts.some((p) => p.verdict === "REJECTED") ? "REJECTED" : parts.some((p) => p.verdict === "UNSURE") || !parts.length ? "UNSURE" : "CONFIRMED";
    const review = { verdict, claims: parts.flatMap((p) => p.claims), checked_at: new Date().toISOString() };
    await db.query(
      "INSERT INTO calendar_entries (snapshot_id, entry_id, as_of, contract_address, state, payable_date, payload, review_verdict, review) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [snapshotId, e.entry_id, e.as_of, e.token.contract_address, e.state, e.declaration?.payable_date ?? null, JSON.stringify(e), review.verdict, JSON.stringify(review)],
    );
    out.push({ entry: e, review });
    console.log("  " + review.verdict.padEnd(9) + " " + e.token.symbol.padEnd(7) + " " + e.state.padEnd(12) + (e.declaration ? " $" + e.declaration.per_share + " record " + e.declaration.record_date + " payable " + e.declaration.payable_date : " " + (e.issuer_announcement?.description ?? "")) + (e.issuer_announcement ? " [issuer-announced]" : "") + (e.applied_record_id ? " -> applied" : ""));
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "calendar-latest.json"), JSON.stringify({ snapshot_id: snapshotId, as_of: asOf.toISOString(), scope: secScope, skipped, not_applicable: built.notApplicable, entries: out }, null, 1) + "\n");
  console.log("calendar: " + entries.length + " entr(ies) for " + scope.length + " token(s); skipped " + JSON.stringify(skipped));
  await db.close();
}

/** Score pipeline output against independently annotated gold events (research/gold/events.json). */
async function gold() {
  const g = JSON.parse(readFileSync("research/gold/events.json", "utf8"));
  const db = await openDb(DB_DIR);
  const fields = ["multiplier_before_wad", "multiplier_after_wad", "per_share", "record_date", "payable_date"] as const;
  const tally: Record<string, { match: number; mismatch: number }> = {};
  let annotated = 0;
  const mismatches: string[] = [];
  for (const ev of g.events) {
    if (!ev.annotated_by) continue;
    annotated++;
    const rec = ev.effective_block
      ? (await db.query<{ payload: IssuerActionRecord }>("SELECT payload FROM confirmed_records WHERE lower(contract_address)=lower($1) AND effective_block=$2", [ev.token.contract_address, ev.effective_block])).rows[0]?.payload
      : undefined;
    const recon = rec ? (await db.query<{ payload: any }>("SELECT payload FROM reconciliations WHERE record_id=$1 AND review_verdict='CONFIRMED' ORDER BY created_at DESC LIMIT 1", [rec.record_id])).rows[0]?.payload : undefined;
    const got: Record<string, string | null | undefined> = {
      multiplier_before_wad: rec?.action.multiplier_before_wad,
      multiplier_after_wad: rec?.action.multiplier_after_wad,
      per_share: recon?.declaration?.per_share,
      record_date: recon?.declaration?.record_date,
      payable_date: recon?.declaration?.payable_date,
    };
    for (const f of fields) {
      if (!(f in ev.expected) || ev.expected[f] === null) continue;
      const t = (tally[f] ??= { match: 0, mismatch: 0 });
      if (got[f] === ev.expected[f]) t.match++;
      else {
        t.mismatch++;
        mismatches.push(ev.event_key + " " + f + ": expected " + ev.expected[f] + ", pipeline " + (got[f] ?? "none"));
      }
    }
  }
  console.log("gold: " + annotated + " of " + g.events.length + " events annotated");
  for (const [f, t] of Object.entries(tally)) console.log("  " + f.padEnd(22) + " " + t.match + "/" + (t.match + t.mismatch) + " match");
  for (const m of mismatches) console.log("  MISMATCH " + m);
  if (!annotated) console.log("  no annotations yet: see research/gold/README.md (accuracy is not claimed until annotated)");
  await db.close();
  process.exit(mismatches.length ? 1 : 0);
}

async function supabaseCmd(sub: string) {
  const { migrate, sbQuery, syncFromLocal } = await import("./db/supabase.ts");
  if (sub === "migrate") {
    const applied = await migrate("keldrin", true);
    console.log("supabase migrate: applied " + (applied.length ? applied.join(", ") : "nothing (up to date)"));
  } else if (sub === "rollback-test") {
    // Replay all migrations into a throwaway schema twice (must be idempotent), check, then drop it.
    const s = "keldrin_rollback_test";
    await sbQuery("DROP SCHEMA IF EXISTS " + s + " CASCADE");
    const first = await migrate(s, false);
    const second = await migrate(s, false);
    const tables = await sbQuery<{ n: number }>("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema = '" + s + "'");
    await sbQuery("DROP SCHEMA " + s + " CASCADE");
    const gone = await sbQuery<{ n: number }>("SELECT count(*)::int AS n FROM pg_namespace WHERE nspname = '" + s + "'");
    console.log("rollback-test: first apply " + first.length + " migration(s), replay applied " + second.length + ", " + tables[0].n + " tables/views; dropped: " + (gone[0].n === 0));
    if (second.length !== 0 || gone[0].n !== 0) process.exit(1);
  } else if (sub === "sync") {
    const db = await openDb(DB_DIR);
    const counts = await syncFromLocal(db);
    await db.close();
    console.log("supabase sync (local rows copied): " + JSON.stringify(counts));
  } else if (sub === "check") {
    const q = async (label: string, sql: string) => {
      try {
        console.log("  " + label.padEnd(48) + " " + JSON.stringify(await sbQuery(sql)));
      } catch (e) {
        console.log("  " + label.padEnd(48) + " ERROR " + String((e as Error).message).replace(/\s+/g, " ").slice(0, 160));
      }
    };
    await q("row counts", "SELECT (SELECT count(*) FROM keldrin.assets) assets, (SELECT count(*) FROM keldrin.records) records, (SELECT count(*) FROM keldrin.reviews) reviews, (SELECT count(*) FROM keldrin.confirmed_records) confirmed, (SELECT count(*) FROM keldrin.reconciliations) reconciliations, (SELECT count(*) FROM keldrin.calendar_entries) calendar");
    await q("RLS enabled on every keldrin table", "SELECT bool_and(c.relrowsecurity) AS all_rls, count(*) AS tables FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='keldrin' AND c.relkind='r'");
    await q("anon can read records? (must be permission denied)", "SET ROLE anon; SELECT count(*) FROM keldrin.records");
    await q("authenticated can read records? (must be denied)", "SET ROLE authenticated; SELECT count(*) FROM keldrin.records");
    await q("reader can read confirmed records", "SET ROLE keldrin_reader; SELECT count(*) AS confirmed FROM keldrin.confirmed_records");
    await q("reader cannot write (must be denied)", "SET ROLE keldrin_reader; INSERT INTO keldrin.runs (run_id, kind, started_at) VALUES ('x','x',now())");
    await q("writer can read confirmed records", "SET ROLE keldrin_writer; SELECT count(*) AS confirmed FROM keldrin.confirmed_records");
    await q("writer cannot delete (must be denied)", "SET ROLE keldrin_writer; DELETE FROM keldrin.runs WHERE false");
    await q("writer cannot update records (must be denied)", "SET ROLE keldrin_writer; UPDATE keldrin.records SET record_type = record_type WHERE false");
    await q("writer cannot read migrations (must be denied)", "SET ROLE keldrin_writer; SELECT count(*) FROM keldrin.schema_migrations");
    await q("writer cannot create tables (must be denied)", "SET ROLE keldrin_writer; CREATE TABLE keldrin.x_probe (a int)");
    await q("records are append-only (must raise)", "UPDATE keldrin.records SET record_type = record_type WHERE false OR true");
    await q("keldrin not exposed via Data API schemas", "SELECT current_setting('pgrst.db_schemas', true) AS pgrst_db_schemas");
  } else {
    console.error("usage: supabase <migrate|rollback-test|sync|check>");
    process.exit(2);
  }
}

/** Phase 5: index Chainlink NAV rounds for every feed-backed token (or --symbols), append-only. */
async function navIndexCmd() {
  const db = await openDb(DB_DIR);
  const res = await indexAll(db, flag("symbols")?.split(","));
  for (const f of res.feeds) {
    const miss = f.phases.reduce((n, p) => n + p.missing.length, 0);
    console.log(`  ${f.symbol.padEnd(7)} ${f.feed} +${f.inserted} round(s); phases ${f.phases.map((p) => `${p.phase}:${p.last}`).join(" ")}; missing ${miss}`);
    for (const p of f.phases) console.log(`      phase ${p.phase} ${p.aggregator} decimals ${p.aggregator_decimals} live blocks ${p.live_from_block ?? "start"}..${p.live_to_block ?? "now"}`);
    for (const p of f.phases) if (p.missing.length) console.log(`      phase ${p.phase} missing ids: ${p.missing.slice(0, 10).join(", ")}${p.missing.length > 10 ? " …" : ""}`);
  }
  for (const r of res.rejected) console.log(`  REJECTED feed ${r.feed} for ${r.token}: ${r.reason}`);
  // gitignored location: local runs must never drop files into the committed records/ evidence folder
  mkdirSync("data", { recursive: true });
  writeFileSync(join("data", "_last_nav_index.json"), JSON.stringify(res, (_k, v) => (typeof v === "bigint" ? v.toString() : v), 1) + "\n");
  console.log(`nav-index: head ${res.head}; ${res.feeds.length} feed(s); +${res.feeds.reduce((n, f) => n + f.inserted, 0)} round(s); ${res.rejected.length} rejected`);
  await db.close();
}

/** Phase 5: independent re-verification of stored NAV rounds per feed (random sample + phase ends). */
async function navVerifyCmd() {
  const db = await openDb(DB_DIR);
  const only = flag("symbols")?.split(",");
  const feeds = (await db.query<{ feed_address: string; symbol: string }>("SELECT DISTINCT feed_address, symbol FROM nav_feeds ORDER BY symbol")).rows.filter((f) => !only || only.includes(f.symbol));
  const tally: Record<string, number> = {};
  for (const f of feeds) {
    const input = await loadReviewInput(db, f.feed_address, Number(flag("sample") ?? 50));
    const review = await verifyNavFeed(input);
    const stats = await computeNavStats(db, f.feed_address);
    await insertNavReview(db, f.feed_address, review, input.rounds_indexed, stats);
    tally[review.verdict] = (tally[review.verdict] ?? 0) + 1;
    console.log(`  ${review.verdict.padEnd(9)} ${f.symbol.padEnd(7)} rounds ${input.rounds_indexed} official ${stats.official_rounds} overlap-excluded ${stats.overlap_rounds_excluded} decimals-conflict phases [${stats.decimals_conflict_phases}] sampled ${review.sampled} mismatches ${review.mismatches} max-gap ${stats.max_in_session_gap_s}s`);
    for (const c of review.claims.filter((x) => x.verdict !== "CONFIRMED")) console.log(`      ${c.verdict} ${c.claim}: ${c.evidence}`);
  }
  console.log(`nav-verify: ${feeds.length} feed(s); ${JSON.stringify(tally)}`);
  await db.close();
  if (tally.REJECTED) process.exit(1);
}

/** Phase 8: discover DEX pools (canonical factories + plain Uniswap v4 pools) for the feed-backed tokens. */
async function dexIndexCmd() {
  const db = await openDb(DB_DIR);
  const res = await indexDexPools(db, flag("symbols")?.split(","));
  for (const t of res.tokens) console.log(`  ${t.symbol.padEnd(7)} pools found ${t.found}, new ${t.added}${t.v4_scan_complete ? "" : " (v4 log scan incomplete: retried next run)"}`);
  console.log(`dex-index: head ${res.head}; ${res.tokens.length} token(s)`);
  await db.close();
}

/** Phase 1.4: count keldrin's x402 payments onchain (incremental, append-only); /v1/stats reads the result. */
async function paymentsIndexCmd() {
  const db = await openDb(DB_DIR);
  const r = await indexPayments(db, (m, p) => chainRpc(m, p), new URL(RPC_URL).host);
  console.log(r.skipped ? `payments-index: nothing new (last scanned block ${r.from - 1n})` : `payments-index: blocks ${r.from}..${r.to}, ${r.found} new payment(s)`);
  await db.close();
}

/** Phase 6.2: earnings releases (SEC 8-K item 2.02) for identity-verified tokens, append-only. */
async function earningsIndexCmd() {
  const db = await openDb(DB_DIR);
  const res = await indexEarnings(db, flag("symbols")?.split(","));
  const covered = res.tokens.filter((t) => t.releases > 0);
  for (const t of covered) console.log(`  ${t.symbol.padEnd(8)} releases ${t.releases}, new ${t.added}`);
  console.log(`earnings-index: ${res.tokens.length} token(s) read (${res.skipped_recent} skipped: read in the last 20 h), ${covered.length} with releases, ${res.tokens.reduce((n, t) => n + t.added, 0)} new; not covered: ${res.tokens.length - covered.length}`);
  await db.close();
}

/** Phase 6.2: independently re-check stored releases against SEC filing headers on www.sec.gov. */
async function earningsVerifyCmd() {
  const db = await openDb(DB_DIR);
  const tally = await verifyEarnings(db, Number(flag("limit") ?? 1500));
  console.log(`earnings-verify: ${JSON.stringify(tally)}`);
  await db.close();
  if (tally.REJECTED) process.exit(1);
}

/** Phase 8: independently re-derive every stored pool (public RPC) and record a review per token. */
async function dexVerifyCmd() {
  const db = await openDb(DB_DIR);
  const only = flag("symbols")?.split(",");
  const toks = (await db.query<{ token_address: string; symbol: string }>("SELECT DISTINCT p.token_address, f.symbol FROM dex_pools p JOIN nav_feeds f ON lower(f.token_address)=lower(p.token_address) ORDER BY f.symbol")).rows.filter((x) => !only || only.includes(x.symbol));
  const tally: Record<string, number> = {};
  for (const t of toks) {
    const pools = (await db.query<{ venue: string; pool_ref: string; currency0: string; currency1: string; quote: string; fee: number | null; tick_spacing: number | null; hooks: string | null; stable: boolean | null }>(
      "SELECT venue, pool_ref, currency0, currency1, quote, fee, tick_spacing, hooks, stable FROM dex_pools WHERE lower(token_address)=lower($1)", [t.token_address])).rows;
    const review = await verifyDexPools(t.token_address, pools);
    await db.query("INSERT INTO dex_reviews (review_id, chain_id, token_address, verdict, pools_checked, detail, checked_at) VALUES ($1,8453,$2,$3,$4,$5,$6)",
      [`dexrev:${t.token_address.toLowerCase()}:${review.checked_at}`, t.token_address, review.verdict, review.pools_checked, JSON.stringify({ claims: review.claims, covered: review.covered, verifier_rpc_host: review.verifier_rpc_host }), review.checked_at]);
    tally[review.verdict] = (tally[review.verdict] ?? 0) + 1;
    console.log(`  ${review.verdict.padEnd(9)} ${t.symbol.padEnd(7)} pools ${review.pools_checked} covered ${review.covered.length}`);
    for (const c of review.claims.filter((x) => x.verdict !== "CONFIRMED").slice(0, 5)) console.log(`      ${c.verdict} ${c.claim}: ${c.evidence}`);
  }
  console.log(`dex-verify: ${toks.length} token(s); ${JSON.stringify(tally)}`);
  await db.close();
  if (tally.REJECTED) process.exit(1);
}

async function verifyFile() {
  const f = args[1];
  const doc = JSON.parse(readFileSync(f, "utf8"));
  const rec = doc.record ?? doc;
  const rv = await verifyIssuerAction(rec);
  console.log(canonicalJson({ verdict: rv.verdict, payload_sha256: rv.payload_sha256, claims: rv.claims.map((c) => [c.verdict, c.claim]) }));
  process.exit(rv.verdict === "CONFIRMED" ? 0 : 1);
}

const commands: Record<string, () => Promise<void>> = {
  discover: run,
  reconcile: () => reconcileAll(flag("symbols")?.split(",")),
  calendar: () => calendar(flag("symbols")?.split(",")),
  gold,
  supabase: () => supabaseCmd(args[1] ?? ""),
  "proof-googl": () => reconcileAll(["GOOGLc"]),
  "verify-file": verifyFile,
  "nav-index": navIndexCmd,
  "nav-verify": navVerifyCmd,
  "dex-index": dexIndexCmd,
  "payments-index": paymentsIndexCmd,
  "earnings-index": earningsIndexCmd,
  "earnings-verify": earningsVerifyCmd,
  "dex-verify": dexVerifyCmd,
  serve: async () => {
    const db = await openDb(DB_DIR);
    const port = Number(flag("port") ?? 8787);
    await serve(db, port);
    console.log(`Keldrin API (read-only, confirmed records only) on http://127.0.0.1:${port}  — try /llms.txt`);
  },
  proof: async () => {
    await run();
    await reconcileAll();
  },
};

if (!commands[cmd]) {
  console.error(`usage: node src/cli.ts <${Object.keys(commands).join("|")}> [--symbols=GOOGLc,NVDAc] [--db=data/db] [--port=8787]`);
  process.exit(2);
}
commands[cmd]().catch((e) => {
  console.error(`FAILED: ${(e as Error).stack ?? e}`);
  process.exit(1);
});
