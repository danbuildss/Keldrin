// Coverage run: Alchemy log index vs the bisection pipeline's confirmed records.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { getAddress } from "viem";
import { listTokens, getCorporateAction } from "../src/adapters/coinbase.ts";
import { scanLogs } from "../src/pipeline/indexer.ts";

const { tokens } = await listTokens();
const registry = new Set(tokens.map((t) => getAddress(t.contract_address)));
const t0 = Date.now();
const r = await scanLogs(registry);
const recDir = "records/";
const covered = new Set<string>();
for (const f of readdirSync(recDir).filter((x) => x.startsWith("kld_"))) {
  const rec = JSON.parse(readFileSync(recDir + f, "utf8")).record;
  for (const a of rec.announcements) covered.add(a.tx_hash.toLowerCase() + ":" + a.log_index);
}
const uncovered = r.announcements.filter((a) => !covered.has(a.txHash.toLowerCase() + ":" + a.logIndex));
const uuids = Object.keys(r.byUuid);
const statuses: Record<string, string[]> = {};
for (const u of uuids) {
  const covers = r.byUuid[u].some((a) => covered.has(a.txHash.toLowerCase() + ":" + a.logIndex));
  let status = "?";
  try { status = (await getCorporateAction(u)).data.status.replace("CORPORATE_ACTION_STATUS_", ""); } catch (e) { status = "ERR " + String((e as Error).message).slice(0, 40); }
  const sym = tokens.find((t) => getAddress(t.contract_address) === r.byUuid[u][0].address)?.symbol ?? "?";
  (statuses[status] ??= []).push(sym.padEnd(7) + " " + u + " " + (covers ? "covered" : "NEW") + " " + r.byUuid[u].map((a) => a.description).join("|"));
}
console.log("scan blocks " + r.from + ".." + r.to + " requests " + r.requests + " logs " + r.logs + " in " + Math.round((Date.now() - t0) / 1000) + "s");
console.log("announcements " + r.announcements.length + "; distinct corporate-action uuids " + uuids.length + "; without uuid " + r.noUuid.length + "; unbracketed multiplier logs " + r.unbracketedMultiplierLogs);
console.log("announcements not in any confirmed record: " + uncovered.length);
for (const [s, list] of Object.entries(statuses)) console.log("  " + s + ": " + list.length + "\n    " + list.join("\n    "));
writeFileSync("research/phase2-log-index.json", JSON.stringify({ ...r, announcements: r.announcements, generated_at: new Date().toISOString() }, null, 1));
