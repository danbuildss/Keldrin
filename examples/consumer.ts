// Sample third-party consumer: what an integrator (lending agent, options venue, index vault) would write.
// Uses only HTTP + the published JSON Schema. No Keldrin internals, no web search, no keys.
//   node examples/consumer.ts [base_url] [contract]
import { readFileSync } from "node:fs";
import { Ajv2020 } from "ajv/dist/2020.js";
import addFormatsMod from "ajv-formats";

const BASE = process.argv[2] ?? "http://127.0.0.1:8787";
const CONTRACT = process.argv[3] ?? "0xb2000000000000000000002D0BA3164cc74f58B7"; // GOOGLc
const MAX_AGE_HOURS = 24;

const addFormats = ((addFormatsMod as any).default ?? addFormatsMod) as (a: Ajv2020) => void;
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(readFileSync(new URL("../schemas/issuer-action.schema.json", import.meta.url), "utf8")));

const get = async (p: string) => {
  const r = await fetch(BASE + p);
  const body = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${body.error?.code}: ${body.error?.message} (${body.error?.hint ?? ""})`);
  return body;
};

const health = await get("/health");
const lastRun = health.data.last_run;
const ageH = lastRun ? (Date.now() - Date.parse(lastRun.finished_at)) / 3.6e6 : Infinity;
const fresh = ageH <= MAX_AGE_HOURS;
console.log(`health: ${health.data.status}; ${health.data.records_confirmed} confirmed records; data age ${ageH.toFixed(2)} h → ${fresh ? "fresh" : "STALE: treat as unknown, not as 'no events'"}`);

const { data: actions } = await get(`/v1/actions?contract=${CONTRACT}&limit=50`);
let ok = 0;
for (const a of actions) {
  if (!validate(a)) throw new Error(`schema violation: ${JSON.stringify(validate.errors)}`);
  if (a.verification.state !== "confirmed") throw new Error("unconfirmed record served");
  // Never trust a derived number blindly: recompute the ratio from the exact integers.
  const r = (BigInt(a.action.multiplier_after_wad) * 10n ** 18n) / BigInt(a.action.multiplier_before_wad);
  const s = r.toString().padStart(19, "0");
  const mine = (s.slice(0, -18) + "." + s.slice(-18)).replace(/\.?0+$/, "");
  if (mine !== a.action.ratio) throw new Error(`ratio mismatch ${mine} vs ${a.action.ratio}`);
  ok++;
  console.log(`${a.asset.symbol} ${a.action.status} at block ${a.action.effective?.block} (${a.action.effective?.time}): "${a.action.operator_description}" multiplier ×${a.action.ratio}; flags [${a.flags.join(", ")}]; evidence: ${a.announcements.map((x: any) => x.tx_hash).join(", ")}`);
}
console.log(`consumer: ${ok}/${actions.length} records schema-valid, confirmed and arithmetic-checked${fresh ? "" : " (STALE)"}`);
process.exit(fresh ? 0 : 3);
