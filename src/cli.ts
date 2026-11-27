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
import { verifyDeclaration, verifyIssuerAction, verifyReconciliation } from "./verify/verify.ts";
import { buildCalendar } from "./pipeline/calendar.ts";
import { canonicalJson } from "./lib/canonical.ts";

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
  const { entries, skipped } = await buildCalendar(db, scope, asOf);
  const out: unknown[] = [];
  for (const e of entries) {
    const review = await verifyDeclaration(JSON.parse(JSON.stringify(e.declaration)));
    await db.query(
      "INSERT INTO calendar_entries (snapshot_id, entry_id, as_of, contract_address, state, payable_date, payload, review_verdict, review) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
      [snapshotId, e.entry_id, e.as_of, e.token.contract_address, e.state, e.declaration.payable_date, JSON.stringify(e), review.verdict, JSON.stringify(review)],
    );
    out.push({ entry: e, review });
    console.log("  " + review.verdict.padEnd(9) + " " + e.token.symbol.padEnd(7) + " " + e.state.padEnd(12) + " $" + e.declaration.per_share + " record " + e.declaration.record_date + " payable " + e.declaration.payable_date + (e.applied_record_id ? " -> applied" : ""));
  }
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "calendar-latest.json"), JSON.stringify({ snapshot_id: snapshotId, as_of: asOf.toISOString(), scope, skipped, entries: out }, null, 1) + "\n");
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
  "proof-googl": () => reconcileAll(["GOOGLc"]),
  "verify-file": verifyFile,
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
