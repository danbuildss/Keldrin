import { liveTransport } from "./verify.ts";

// Independent verifier for stored Chainlink NAV rounds (Phase 5, hardened in 5b). It shares no code with the
// indexer: hand-written selectors and ABI decoding, its own read of Coinbase's token→feed list, and by default a
// DIFFERENT data provider (Base's public RPC, VERIFY_RPC_URL) from the indexer's (Alchemy), so one bad provider
// cannot fool both. Verdict: any value mismatch → REJECTED; incomplete coverage or an unreadable source → UNSURE;
// otherwise CONFIRMED. Only CONFIRMED feeds are served, and only up to the rounds this review covered.

type Transport = { rpc: (method: string, params: unknown[]) => Promise<any>; getJson: (url: string) => Promise<any> };

export const VERIFY_RPC_URL = process.env.VERIFY_RPC_URL || "https://mainnet.base.org";
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
let rid = 0;
export const navTransport: Transport = {
  async rpc(method, params) {
    const u = new URL(VERIFY_RPC_URL);
    if (u.protocol !== "https:") throw new Error("verifier: https only");
    for (let i = 0; i < 5; i++) {
      await pause(150);
      const r = await fetch(VERIFY_RPC_URL, { method: "POST", redirect: "error", signal: AbortSignal.timeout(30_000), headers: { "content-type": "application/json", "user-agent": "Keldrin-Verifier/0.2" }, body: JSON.stringify({ jsonrpc: "2.0", id: ++rid, method, params }) });
      if (r.status === 429 || r.status >= 500) {
        await pause(1500 * 2 ** i);
        continue;
      }
      const j = await r.json();
      if (j.error) throw new Error(`verifier rpc ${method}: ${j.error.message}`);
      return j.result;
    }
    throw new Error("verifier: public RPC gave up");
  },
  getJson: (url) => liveTransport.getJson(url),
};

export const NAV_SEL = {
  getRoundData: "0x9a6fc8f5", // getRoundData(uint80)
  phaseId: "0x58303b10", // phaseId()
  phaseAggregators: "0xc1597304", // phaseAggregators(uint16)
  description: "0x7284e416", // description()
  decimals: "0x313ce567", // decimals()
  latestRound: "0x668a0f02", // latestRound() on an aggregator
} as const;

const pad = (v: bigint) => v.toString(16).padStart(64, "0");
const word = (hex: string, i: number) => BigInt("0x" + hex.slice(2 + i * 64, 2 + (i + 1) * 64));
const int256 = (u: bigint) => (u >= 1n << 255n ? u - (1n << 256n) : u);
const LOW64 = (1n << 64n) - 1n;
function abiString(hex: string): string {
  const off = Number(word(hex, 0));
  const len = Number(BigInt("0x" + hex.slice(2 + off * 2, 2 + off * 2 + 64)));
  return Buffer.from(hex.slice(2 + off * 2 + 64, 2 + off * 2 + 64 + len * 2), "hex").toString("utf8");
}

/** started/updated are unix seconds as decimal strings (exact; no date parsing). */
export type StoredRound = { round_id: string; phase_id: number; aggregator_round_id: string; aggregator_address: string; decimals: number; answer: string; started_unix: string; updated_unix: string; answered_in_round: string };
export type StoredPhase = { phase: number; aggregator: string; min: string; max: string; count: number; distinct_aggregators: number; live_from_block: string | null; live_to_block: string | null; aggregator_decimals: number | null };
export type NavReviewInput = { token: string; symbol: string; feed: string; decimals: number; phases: StoredPhase[]; sample: StoredRound[] };
export type NavClaim = { claim: string; verdict: "CONFIRMED" | "REJECTED" | "UNSURE"; evidence: string };
export type NavReview = { verdict: "CONFIRMED" | "REJECTED" | "UNSURE"; sampled: number; mismatches: number; claims: NavClaim[]; checked_at: string; covered: { phase: number; max_round_id: string }[] };

export async function verifyNavFeed(input: NavReviewInput, tx: Transport = navTransport): Promise<NavReview> {
  const claims: NavClaim[] = [];
  const add = (claim: string, verdict: NavClaim["verdict"], evidence: string) => claims.push({ claim, verdict, evidence });
  const callAt = async (to: string, data: string, block: bigint | "latest" = "latest"): Promise<string | null> => {
    try {
      const out = await tx.rpc("eth_call", [{ to, data }, block === "latest" ? "latest" : "0x" + block.toString(16)]);
      return typeof out === "string" && out.length > 2 ? out : null;
    } catch {
      return null;
    }
  };
  const call = (data: string) => callAt(input.feed, data);

  // 1. Coinbase lists this exact token→feed pair (fetched independently).
  try {
    const list = await tx.getJson("https://api.coinbase.com/v1/tokenized-stocks/nav-feeds");
    const hit = (list.nav_feeds as { contract_address: string; nav_feed_address: string }[]).some((x) => x.contract_address.toLowerCase() === input.token.toLowerCase() && x.nav_feed_address.toLowerCase() === input.feed.toLowerCase());
    add("Coinbase lists this token→feed pair", hit ? "CONFIRMED" : "REJECTED", hit ? "present in /nav-feeds" : "pair not in /nav-feeds");
  } catch (e) {
    add("Coinbase lists this token→feed pair", "UNSURE", "nav-feeds unavailable: " + String((e as Error).message).slice(0, 80));
  }

  // 2. The feed describes the same ticker with the stored (proxy) decimals.
  const desc = await call(NAV_SEL.description);
  const tick = input.symbol.replace(/c$/, "");
  const want = ["Coinbase " + tick, "Coinbase " + tick + " / USD"];
  add("feed description names the token", desc === null ? "UNSURE" : want.includes(abiString(desc)) ? "CONFIRMED" : "REJECTED", desc === null ? "unreadable" : `"${abiString(desc)}"`);
  const dec = await call(NAV_SEL.decimals);
  const proxyDec = dec === null ? null : Number(word(dec, 0));
  add("proxy decimals match stored decimals", proxyDec === null ? "UNSURE" : proxyDec === input.decimals ? "CONFIRMED" : "REJECTED", proxyDec === null ? "unreadable" : String(proxyDec));

  // 3. Phase structure: aggregator, its decimals, its live window, completeness.
  const ph = await call(NAV_SEL.phaseId);
  const currentPhase = ph === null ? null : Number(word(ph, 0));
  if (currentPhase === null) add("phaseId readable", "UNSURE", "unreadable");
  else for (let q = 1; q <= currentPhase; q++) if (!input.phases.some((p) => p.phase === q)) add(`phase ${q} is indexed`, "UNSURE", `phaseId is ${currentPhase} but phase ${q} has no stored rounds`);
  const phaseAgg = new Map<number, string>();
  for (const p of input.phases) {
    const agg = await call(NAV_SEL.phaseAggregators + pad(BigInt(p.phase)));
    const onchain = agg === null ? null : "0x" + agg.slice(-40);
    if (onchain) phaseAgg.set(p.phase, onchain.toLowerCase());
    add(`phase ${p.phase} aggregator`, onchain === null ? "UNSURE" : onchain.toLowerCase() === p.aggregator.toLowerCase() ? "CONFIRMED" : "REJECTED", onchain ?? "unreadable");
    add(`phase ${p.phase} rows name one aggregator`, p.distinct_aggregators === 1 ? "CONFIRMED" : "REJECTED", `${p.distinct_aggregators} distinct aggregator address(es) stored`);
    const first = (BigInt(p.phase) << 64n) | 1n;
    const contiguous = BigInt(p.min) === first && BigInt(p.max) - BigInt(p.min) + 1n === BigInt(p.count);
    add(`phase ${p.phase} stored rounds are contiguous from round 1`, contiguous ? "CONFIRMED" : "UNSURE", `min ${p.min} max ${p.max} count ${p.count}`);
    if (onchain !== null) {
      const ad = await callAt(onchain, NAV_SEL.decimals);
      const aggDec = ad === null ? null : Number(word(ad, 0));
      add(`phase ${p.phase} aggregator decimals match the stored record`, aggDec === null ? "UNSURE" : aggDec === p.aggregator_decimals ? "CONFIRMED" : "REJECTED", `onchain ${aggDec ?? "unreadable"}, stored ${p.aggregator_decimals ?? "null"}`);
      const lr = await callAt(onchain, NAV_SEL.latestRound);
      const last = lr === null ? null : word(lr, 0);
      const storedLast = BigInt(p.max) & LOW64;
      if (currentPhase !== null && p.phase < currentPhase) add(`phase ${p.phase} stored up to the aggregator's last round`, last === null ? "UNSURE" : last === storedLast ? "CONFIRMED" : "UNSURE", `aggregator latestRound ${last ?? "unreadable"}, stored last ${storedLast}`);
      else add(`phase ${p.phase} stored last round exists onchain`, last === null ? "UNSURE" : storedLast <= last ? "CONFIRMED" : "REJECTED", `aggregator latestRound ${last ?? "unreadable"}, stored last ${storedLast}`);
    }
    // the live window boundary: phaseId must be p-1 one block before live_from and p at live_from
    if (p.phase > 1) {
      if (p.live_from_block === null) add(`phase ${p.phase} live window known`, "UNSURE", "no live_from_block stored");
      else {
        const b = BigInt(p.live_from_block);
        const before = await callAt(input.feed, NAV_SEL.phaseId, b - 1n);
        const at = await callAt(input.feed, NAV_SEL.phaseId, b);
        const ok = before !== null && at !== null && Number(word(before, 0)) === p.phase - 1 && Number(word(at, 0)) === p.phase;
        add(`phase ${p.phase} became live at block ${b}`, before === null || at === null ? "UNSURE" : ok ? "CONFIRMED" : "REJECTED", `phaseId ${before === null ? "?" : word(before, 0)} at ${b - 1n}, ${at === null ? "?" : word(at, 0)} at ${b}`);
      }
    }
  }

  // 4. Re-read sampled rounds and compare every stored field.
  let mismatches = 0;
  for (const r of input.sample) {
    const id = BigInt(r.round_id);
    const structural = BigInt(r.phase_id) === id >> 64n && BigInt(r.aggregator_round_id) === (id & LOW64) && r.decimals === input.decimals && phaseAgg.get(r.phase_id) === r.aggregator_address.toLowerCase();
    const out = await call(NAV_SEL.getRoundData + pad(id));
    if (out === null) {
      add(`round ${r.round_id}`, "UNSURE", "unreadable onchain");
      continue;
    }
    const got = { id: word(out, 0), answer: int256(word(out, 1)), started: word(out, 2), updated: word(out, 3), air: word(out, 4) };
    const same = got.id === id && got.answer === BigInt(r.answer) && got.started === BigInt(r.started_unix) && got.updated === BigInt(r.updated_unix) && got.air === BigInt(r.answered_in_round);
    if (!same || !structural) {
      mismatches++;
      add(`round ${r.round_id}`, "REJECTED", !structural ? "stored phase/aggregator/decimals do not match the round id or the phase's aggregator" : `onchain answer ${got.answer} updatedAt ${got.updated} vs stored ${r.answer} ${r.updated_unix}`);
    }
  }
  add(`${input.sample.length} sampled rounds match onchain (all fields)`, mismatches ? "REJECTED" : "CONFIRMED", `${mismatches} mismatch(es)`);

  const verdict = claims.some((c) => c.verdict === "REJECTED") ? "REJECTED" : claims.some((c) => c.verdict === "UNSURE") ? "UNSURE" : "CONFIRMED";
  return { verdict, sampled: input.sample.length, mismatches, claims, checked_at: new Date().toISOString(), covered: input.phases.map((p) => ({ phase: p.phase, max_round_id: p.max })) };
}
