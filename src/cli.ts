import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getBlock, readMany, rpcCalls } from "./adapters/chain.ts";
import { listTokens } from "./adapters/coinbase.ts";
import { serve } from "./api/server.ts";
import { insertRecord, insertReview, openDb, recordSource, upsertAsset } from "./db/db.ts";
import { findChangePoints, gatherEvidence } from "./pipeline/discover.ts";
import { buildIssuerActionRecord, hashRecord, type IssuerActionRecord } from "./pipeline/records.ts";
import { hashReconciliation, reconcileDividend } from "./pipeline/reconcile.ts";
import { verifyIdentities } from "./pipeline/registry.ts";
import { verifyIssuerAction, verifyReconciliation } from "./verify/verify.ts";
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

async function proofGoogl() {
  const db = await openDb(DB_DIR);
  const row = (await db.query<{ payload: IssuerActionRecord; payload_sha256: string }>("SELECT payload, payload_sha256 FROM confirmed_records WHERE payload->'asset'->>'symbol' = 'GOOGLc' AND payload->'action'->>'corporate_action_uuid' = 'e82812a6-0b24-41c4-8ed1-322d1b466d33'")).rows[0];
  if (!row) throw new Error("GOOGLc action not confirmed yet: run `npm run discover -- --symbols=GOOGLc` first");
  const recon = await reconcileDividend(row.payload, row.payload_sha256, { cik: "0001652044", secTicker: "GOOGL" });
  const review = await verifyReconciliation(JSON.parse(JSON.stringify(recon)), JSON.parse(JSON.stringify(row.payload)));
  const h = hashReconciliation(recon);
  await db.query(
    "INSERT INTO reconciliations (reconciliation_id, record_id, record_payload_sha256, status, payload, payload_sha256, review_verdict, review) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (reconciliation_id) DO NOTHING",
    [recon.reconciliation_id, row.payload.record_id, row.payload_sha256, recon.status, JSON.stringify(recon), h, review.verdict, JSON.stringify(review)],
  );
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, "googlc-sec-reconciliation.json"), JSON.stringify({ reconciliation: recon, payload_sha256: h, review }, null, 1) + "\n");
  console.log(`reconciliation ${recon.status}; review ${review.verdict}`);
  for (const c of recon.checks) console.log(`  ${c.result.padEnd(7)} ${c.name} ${c.detail ?? ""}`);
  for (const c of review.claims) console.log(`  review ${c.verdict.padEnd(9)} ${c.claim} | ${c.evidence}`);
  if (recon.interpretation) console.log(`  interpretation: implied net ${recon.interpretation.implied_net_reinvested_per_share_usd} USD vs declared ${recon.company_event?.per_share_usd} (ratio ${recon.interpretation.ratio_to_declared})`);
  console.log(`  unknown: ${recon.unknown.join(" | ")}`);
  await db.close();
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
  "proof-googl": proofGoogl,
  "verify-file": verifyFile,
  serve: async () => {
    const db = await openDb(DB_DIR);
    const port = Number(flag("port") ?? 8787);
    await serve(db, port);
    console.log(`Keldrin API (read-only, confirmed records only) on http://127.0.0.1:${port}  — try /llms.txt`);
  },
  proof: async () => {
    await run();
    await proofGoogl();
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
