// INDEPENDENT VERIFIER. Deliberately shares no code with the research pipeline except constants:
// its own JSON-RPC client, its own ABI decoding, its own arithmetic. It receives only the record,
// re-fetches every source, and tries to falsify each material claim.
// Verdict per claim: CONFIRMED | REJECTED | UNSURE. Any REJECTED → record REJECTED; else any UNSURE → UNSURE.

import { createHash } from "node:crypto";
import { ALLOWED_HOSTS, B20_FACTORY, COINBASE_API, RPC_URL } from "../config.ts";

const T = {
  Announcement: "0xccebf8218a62875909564adef86a6f4df81503cb617221e793357d62f8e813f7",
  EndAnnouncement: "0x96d64dafe2c790596430196b982ad1da3221cb3b0f4e6e2df77f2e4f71a90037",
  MultiplierUpdated: "0x4dbe4840d7465bd162f67814cea0b519567a2e0e578bcde61e7f4ced361e5a3d",
  UIMultiplierUpdated: "0x2205df4534432b2f60654a3fdb48737ffdaf3e9edb1a498bd985bc026b15b055",
};
const SEL = { multiplier: "0x1b3ed722", isB20: "0xfa19b927", extraMetadata: "0x4ddf9da0", symbol: "0x95d89b41" };

export type Verdict = "CONFIRMED" | "REJECTED" | "UNSURE";
export type Claim = { claim: string; verdict: Verdict; evidence: string };
export type Review = { review_id: string; record_id: string; revision: number; payload_sha256: string; reviewer: string; checked_at: string; verdict: Verdict; claims: Claim[]; limitations: string[] };

type Rec = Record<string, any>;
type Transport = { rpc: (method: string, params: unknown[]) => Promise<any>; getJson: (url: string) => Promise<any> };

// ---------- independent transport ----------
function allowed(url: string) {
  const u = new URL(url);
  if (u.protocol !== "https:" || !ALLOWED_HOSTS.has(u.host)) throw new Error(`verifier: host not allowed ${u.host}`);
}
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function req(url: string, init: RequestInit): Promise<string> {
  allowed(url);
  for (let i = 0; i < 5; i++) {
    const r = await fetch(url, { ...init, redirect: "error", signal: AbortSignal.timeout(30_000) });
    const text = await r.text();
    if (r.status === 429 || r.status >= 500 || text.includes('"code":-32011')) {
      await pause(1500 * 2 ** i);
      continue;
    }
    if (r.status !== 200) throw new Error(`verifier: HTTP ${r.status} ${url}`);
    return text;
  }
  throw new Error(`verifier: gave up on ${url}`);
}
let n = 0;
export const liveTransport: Transport = {
  async rpc(method, params) {
    await pause(150);
    const j = JSON.parse(await req(RPC_URL, { method: "POST", headers: { "content-type": "application/json", "user-agent": "Keldrin-Verifier/0.1" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++n, method, params }) }));
    if (j.error) throw new Error(`verifier rpc ${method}: ${j.error.message}`);
    return j.result;
  },
  async getJson(url) {
    await pause(400);
    return JSON.parse(await req(url, { headers: { accept: "application/json", "user-agent": "Keldrin-Verifier/0.1" } }));
  },
};

// ---------- minimal ABI decoding (no library) ----------
const word = (hex: string, i: number) => hex.slice(2 + i * 64, 2 + (i + 1) * 64);
const uint = (hex: string, i: number) => BigInt("0x" + word(hex, i));
function str(hex: string, headIndex: number): string {
  const off = Number(uint(hex, headIndex)) / 32;
  const len = Number(uint(hex, off));
  const start = 2 + (off + 1) * 64;
  return Buffer.from(hex.slice(start, start + len * 2), "hex").toString("utf8");
}
const addrFromTopic = (t: string) => "0x" + t.slice(26).toLowerCase();
const pad32 = (h: string) => h.replace(/^0x/, "").toLowerCase().padStart(64, "0");
/** ABI-encode a single `string` argument: offset 0x20, length, UTF-8 bytes right-padded to 32 bytes. */
function encodeString(s: string) {
  const b = Buffer.from(s, "utf8").toString("hex");
  const padded = b.padEnd(Math.max(64, Math.ceil(b.length / 64) * 64), "0");
  return pad32("20") + pad32((b.length / 2).toString(16)) + padded;
}
function exactDecimal(after: bigint, before: bigint): string {
  const q = (after * 10n ** 18n) / before;
  const s = q.toString().padStart(19, "0");
  const frac = s.slice(-18).replace(/0+$/, "");
  return s.slice(0, -18) + (frac ? "." + frac : "");
}
function canon(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === "object") return Object.fromEntries(Object.keys(v).sort().filter((k) => (v as Rec)[k] !== undefined).map((k) => [k, canon((v as Rec)[k])]));
  return v;
}
export function independentHash(record: Rec): string {
  const { verification: _v, ...rest } = record;
  return createHash("sha256").update(JSON.stringify(canon(rest)), "utf8").digest("hex");
}

// ---------- the review ----------
export async function verifyIssuerAction(record: Rec, tx: Transport = liveTransport): Promise<Review> {
  const claims: Claim[] = [];
  const add = (claim: string, verdict: Verdict, evidence: string) => claims.push({ claim, verdict, evidence });
  const guard = async (claim: string, fn: () => Promise<[Verdict, string]>) => {
    try {
      const [v, e] = await fn();
      add(claim, v, e);
    } catch (e) {
      add(claim, "UNSURE", `source unavailable: ${(e as Error).message.slice(0, 160)}`);
    }
  };
  const contract = String(record.asset?.contract_address ?? "").toLowerCase();
  const call = (data: string, block: bigint | "latest") => tx.rpc("eth_call", [{ to: contract, data }, block === "latest" ? "latest" : "0x" + block.toString(16)]);

  if (record.synthetic !== false) add("record is not synthetic", "REJECTED", `synthetic=${record.synthetic}`);
  if (record.record_type !== "issuer_action") add("supported record type", "REJECTED", String(record.record_type));
  if (!/^0x[0-9a-f]{40}$/.test(contract)) add("contract address well-formed", "REJECTED", contract);

  await guard("asset is a B20 token (factory precompile)", async () => {
    const r = await tx.rpc("eth_call", [{ to: B20_FACTORY, data: SEL.isB20 + pad32(contract) }, "latest"]);
    return [uint(r, 0) === 1n ? "CONFIRMED" : "REJECTED", `isB20=${uint(r, 0)}`];
  });
  await guard("symbol matches chain", async () => {
    const s = str(await call(SEL.symbol, "latest"), 0);
    return [s === record.asset.symbol ? "CONFIRMED" : "REJECTED", `onchain=${s}`];
  });
  if (record.asset?.isin) {
    await guard("ISIN matches onchain extraMetadata(\"isin\")", async () => {
      const s = str(await call(SEL.extraMetadata + encodeString("isin"), "latest"), 0);
      return [s === record.asset.isin ? "CONFIRMED" : s === "" ? "UNSURE" : "REJECTED", `onchain=${s || "unset"}`];
    });
  }

  const a = record.action ?? {};
  if (a.status === "applied") {
    const B = BigInt(a.effective.block);
    await guard("multiplier before/after at effective block", async () => {
      const before = uint(await call(SEL.multiplier, B - 1n), 0);
      const after = uint(await call(SEL.multiplier, B), 0);
      const ok = before.toString() === a.multiplier_before_wad && after.toString() === a.multiplier_after_wad;
      return [ok ? "CONFIRMED" : "REJECTED", `block ${B - 1n}: ${before}; block ${B}: ${after}`];
    });
    await guard("effective block hash and time", async () => {
      const blk = await tx.rpc("eth_getBlockByNumber", ["0x" + B.toString(16), false]);
      const time = new Date(Number(BigInt(blk.timestamp)) * 1000).toISOString();
      const ok = blk.hash.toLowerCase() === String(a.effective.block_hash).toLowerCase() && Date.parse(time) === Date.parse(a.effective.time);
      return [ok ? "CONFIRMED" : "REJECTED", `hash ${blk.hash} time ${time}`];
    });
    if (a.multiplier_before_wad) {
      const r = exactDecimal(BigInt(a.multiplier_after_wad), BigInt(a.multiplier_before_wad));
      add("ratio arithmetic", r === a.ratio ? "CONFIRMED" : "REJECTED", `recomputed ${r}`);
    }
  }

  const receipts = new Map<string, any>();
  const receipt = async (h: string) => {
    if (!receipts.has(h)) receipts.set(h, await tx.rpc("eth_getTransactionReceipt", [h]));
    return receipts.get(h);
  };
  for (const ann of record.announcements ?? []) {
    await guard(`announcement ${ann.id} in tx ${ann.tx_hash.slice(0, 10)}…`, async () => {
      const rc = await receipt(ann.tx_hash);
      if (!rc || rc.status !== "0x1") return ["REJECTED", "tx missing or failed"];
      const logs = rc.logs.filter((l: any) => l.address.toLowerCase() === contract);
      const lg = logs.find((l: any) => Number(BigInt(l.logIndex)) === ann.log_index);
      if (!lg || lg.topics[0] !== T.Announcement) return ["REJECTED", "no Announcement at stated log index"];
      const id = str(lg.data, 0);
      const uri = str(lg.data, 2);
      const caller = addrFromTopic(lg.topics[1]);
      const end = logs.find((l: any) => l.topics[0] === T.EndAnnouncement && Number(BigInt(l.logIndex)) > ann.log_index && str(l.data, 0) === id);
      const inner = end ? logs.filter((l: any) => Number(BigInt(l.logIndex)) > ann.log_index && Number(BigInt(l.logIndex)) < Number(BigInt(end.logIndex))) : [];
      const innerNames = inner.map((l: any) => Object.entries(T).find(([, v]) => v === l.topics[0])?.[0] ?? "Other");
      const ok = id === ann.id && uri === ann.uri && caller === ann.caller.toLowerCase() && BigInt(rc.blockNumber).toString() === ann.block && !!end === ann.bracketed && JSON.stringify(innerNames) === JSON.stringify(ann.inner_events);
      return [ok ? "CONFIRMED" : "REJECTED", `id=${id} caller=${caller} block=${BigInt(rc.blockNumber)} bracketed=${!!end} inner=[${innerNames}]`];
    });
  }
  for (const m of record.multiplier_events ?? []) {
    await guard(`${m.event} log ${m.log_index}`, async () => {
      const rc = await receipt(m.tx_hash);
      const lg = rc?.logs.find((l: any) => Number(BigInt(l.logIndex)) === m.log_index && l.address.toLowerCase() === contract);
      if (!lg || lg.topics[0] !== (T as Rec)[m.event]) return ["REJECTED", "log missing or different event"];
      const val = m.event === "MultiplierUpdated" ? uint(lg.data, 0).toString() : uint(lg.data, 1).toString();
      const claimed = m.event === "MultiplierUpdated" ? m.args.multiplier : m.args.newMultiplier;
      return [val === claimed ? "CONFIRMED" : "REJECTED", `value ${val}`];
    });
  }

  // Flags are claims too: recompute the ones derivable from logs.
  const evNames = (record.multiplier_events ?? []).map((m: Rec) => m.event);
  const legacyOnly = evNames.length > 0 && !evNames.includes("UIMultiplierUpdated");
  add("flag legacy_event_only", legacyOnly === (record.flags ?? []).includes("legacy_event_only") ? "CONFIRMED" : "REJECTED", `recomputed ${legacyOnly}`);
  const multiIds = new Set((record.announcements ?? []).map((x: Rec) => x.id)).size > 1;
  add("flag multiple_announcement_ids", multiIds === (record.flags ?? []).includes("multiple_announcement_ids") ? "CONFIRMED" : "REJECTED", `recomputed ${multiIds}`);

  if (a.corporate_action_uuid) {
    await guard("issuer corporate-action record agrees", async () => {
      const cb = await tx.getJson(`${COINBASE_API}/corporate-actions/${a.corporate_action_uuid}`);
      const txs = new Set((record.announcements ?? []).map((x: Rec) => x.tx_hash.toLowerCase()));
      const listed = (cb.announcements ?? []).every((x: Rec) => txs.has(String(x.tx_hash).toLowerCase()));
      const ok = String(cb.contract_address).toLowerCase() === contract && cb.status === record.issuer_record?.status && cb.applied_at === record.issuer_record?.applied_at && listed;
      return [ok ? "CONFIRMED" : "REJECTED", `status=${cb.status} applied_at=${cb.applied_at} listed_txs_covered=${listed}`];
    });
  }

  const verdict: Verdict = claims.some((c) => c.verdict === "REJECTED") ? "REJECTED" : claims.some((c) => c.verdict === "UNSURE") ? "UNSURE" : "CONFIRMED";
  const hash = independentHash(record);
  return {
    review_id: `rev-${hash.slice(0, 12)}-${Date.now()}`,
    record_id: record.record_id,
    revision: record.revision,
    payload_sha256: hash,
    reviewer: "keldrin-verifier/0.1 (independent code path, live re-fetch)",
    checked_at: new Date().toISOString(),
    verdict,
    claims,
    limitations: [
      "Re-derives every chain value from raw JSON-RPC; does not prove the issuer's off-chain description is true.",
      "Cannot detect announcements the research pipeline never discovered (completeness is not reviewed here).",
    ],
  };
}

// ---------- reconciliation review ----------
export async function verifyReconciliation(recon: Rec, actionRecord: Rec, tx: Transport = liveTransport): Promise<{ verdict: Verdict; claims: Claim[]; checked_at: string }> {
  const claims: Claim[] = [];
  const add = (claim: string, verdict: Verdict, evidence: string) => claims.push({ claim, verdict, evidence });
  add("links the exact issuer-action payload", recon.issuer_action?.payload_sha256 === independentHash(actionRecord) ? "CONFIRMED" : "REJECTED", `record hash ${independentHash(actionRecord).slice(0, 16)}`);
  const ev = recon.company_event;
  if (ev) {
    try {
      const j = await tx.getJson(ev.source_url);
      const facts: Rec[] = j?.units?.["USD/shares"] ?? [];
      const hit = facts.find((f) => f.accn === ev.accession && f.start === ev.period_start && f.end === ev.period_end);
      add("SEC XBRL fact re-fetched", hit && String(hit.val) === ev.per_share_usd && hit.form === ev.form ? "CONFIRMED" : "REJECTED", hit ? `${hit.val} ${hit.form} ${hit.accn}` : "fact not found");
      const eff = String(actionRecord.action.effective.time).slice(0, 10);
      add("action date falls inside the fact's period", ev.period_start <= eff && eff <= ev.period_end ? "CONFIRMED" : "REJECTED", `${eff} in ${ev.period_start}..${ev.period_end}`);
    } catch (e) {
      add("SEC XBRL fact re-fetched", "UNSURE", (e as Error).message.slice(0, 120));
    }
  }
  const ref = recon.reference;
  if (ref) {
    try {
      const out = await tx.rpc("eth_call", [{ to: ref.feed, data: "0xfeaf968c" }, "0x" + BigInt(ref.read_at_block).toString(16)]);
      let answer = BigInt("0x" + word(out, 1));
      if (answer >= 2n ** 255n) answer -= 2n ** 256n;
      add("reference value at block", answer.toString() === ref.answer_raw ? "CONFIRMED" : "REJECTED", `answer ${answer} at ${ref.read_at_block}`);
      if (recon.interpretation) {
        const a = actionRecord.action;
        const r = (BigInt(a.multiplier_after_wad) * 10n ** 18n) / BigInt(a.multiplier_before_wad);
        const implied = ((r - 10n ** 18n) * answer) / 10n ** 18n;
        const s = implied.toString().padStart(ref.decimals + 1, "0");
        const txt = (s.slice(0, -ref.decimals) + "." + s.slice(-ref.decimals)).replace(/\.?0+$/, "");
        add("implied net per share arithmetic", txt === recon.interpretation.implied_net_reinvested_per_share_usd ? "CONFIRMED" : "REJECTED", `recomputed ${txt}`);
      }
    } catch (e) {
      add("reference value at block", "UNSURE", (e as Error).message.slice(0, 120));
    }
  }
  const verdict: Verdict = claims.some((c) => c.verdict === "REJECTED") ? "REJECTED" : claims.some((c) => c.verdict === "UNSURE") ? "UNSURE" : "CONFIRMED";
  return { verdict, claims, checked_at: new Date().toISOString() };
}
