import { liveTransport } from "./verify.ts";

// Independent verifier for stored Chainlink NAV rounds (Phase 5). It shares no code with the indexer:
// its own transport (verify.ts liveTransport), hand-written selectors and ABI decoding, and its own read of
// Coinbase's token→feed list. Verdict: any value mismatch → REJECTED; incomplete coverage or an unreadable
// source → UNSURE; otherwise CONFIRMED. Only CONFIRMED feeds are served.

type Transport = { rpc: (method: string, params: unknown[]) => Promise<any>; getJson: (url: string) => Promise<any> };

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
function abiString(hex: string): string {
  const off = Number(word(hex, 0));
  const len = Number(BigInt("0x" + hex.slice(2 + off * 2, 2 + off * 2 + 64)));
  return Buffer.from(hex.slice(2 + off * 2 + 64, 2 + off * 2 + 64 + len * 2), "hex").toString("utf8");
}

/** started/updated are unix seconds as decimal strings (exact; no date parsing). */
export type StoredRound = { round_id: string; phase_id: number; answer: string; started_unix: string; updated_unix: string; answered_in_round: string };
export type StoredPhase = { phase: number; aggregator: string; min: string; max: string; count: number };
export type NavReviewInput = { token: string; symbol: string; feed: string; decimals: number; phases: StoredPhase[]; sample: StoredRound[] };
export type NavClaim = { claim: string; verdict: "CONFIRMED" | "REJECTED" | "UNSURE"; evidence: string };
export type NavReview = { verdict: "CONFIRMED" | "REJECTED" | "UNSURE"; sampled: number; mismatches: number; claims: NavClaim[]; checked_at: string };

export async function verifyNavFeed(input: NavReviewInput, tx: Transport = liveTransport): Promise<NavReview> {
  const claims: NavClaim[] = [];
  const add = (claim: string, verdict: NavClaim["verdict"], evidence: string) => claims.push({ claim, verdict, evidence });
  const call = async (data: string): Promise<string | null> => {
    try {
      const out = await tx.rpc("eth_call", [{ to: input.feed, data }, "latest"]);
      return typeof out === "string" && out.length > 2 ? out : null;
    } catch {
      return null;
    }
  };

  // 1. Coinbase lists this exact token→feed pair (fetched independently).
  try {
    const list = await tx.getJson("https://api.coinbase.com/v1/tokenized-stocks/nav-feeds");
    const hit = (list.nav_feeds as { contract_address: string; nav_feed_address: string }[]).some((x) => x.contract_address.toLowerCase() === input.token.toLowerCase() && x.nav_feed_address.toLowerCase() === input.feed.toLowerCase());
    add("Coinbase lists this token→feed pair", hit ? "CONFIRMED" : "REJECTED", hit ? "present in /nav-feeds" : "pair not in /nav-feeds");
  } catch (e) {
    add("Coinbase lists this token→feed pair", "UNSURE", "nav-feeds unavailable: " + String((e as Error).message).slice(0, 80));
  }

  // 2. The feed describes the same ticker with the stored decimals.
  const desc = await call(NAV_SEL.description);
  const tick = input.symbol.replace(/c$/, "");
  const want = ["Coinbase " + tick, "Coinbase " + tick + " / USD"];
  add("feed description names the token", desc === null ? "UNSURE" : want.includes(abiString(desc)) ? "CONFIRMED" : "REJECTED", desc === null ? "unreadable" : `"${abiString(desc)}"`);
  const dec = await call(NAV_SEL.decimals);
  add("feed decimals match stored decimals", dec === null ? "UNSURE" : Number(word(dec, 0)) === input.decimals ? "CONFIRMED" : "REJECTED", dec === null ? "unreadable" : String(word(dec, 0)));

  // 3. Phase structure: aggregator per phase, completeness, closed phases really ended.
  const ph = await call(NAV_SEL.phaseId);
  const currentPhase = ph === null ? null : Number(word(ph, 0));
  for (const p of input.phases) {
    const agg = await call(NAV_SEL.phaseAggregators + pad(BigInt(p.phase)));
    const onchain = agg === null ? null : "0x" + agg.slice(-40);
    add(`phase ${p.phase} aggregator`, onchain === null ? "UNSURE" : onchain.toLowerCase() === p.aggregator.toLowerCase() ? "CONFIRMED" : "REJECTED", onchain ?? "unreadable");
    const first = (BigInt(p.phase) << 64n) | 1n;
    const contiguous = BigInt(p.min) === first && BigInt(p.max) - BigInt(p.min) + 1n === BigInt(p.count);
    add(`phase ${p.phase} stored rounds are contiguous from round 1`, contiguous ? "CONFIRMED" : "UNSURE", `min ${p.min} max ${p.max} count ${p.count}`);
    if (currentPhase !== null && p.phase < currentPhase && onchain !== null) {
      let last: bigint | null = null;
      try {
        const out = await tx.rpc("eth_call", [{ to: onchain, data: NAV_SEL.latestRound }, "latest"]);
        last = typeof out === "string" && out.length > 2 ? word(out, 0) : null;
      } catch {
        last = null;
      }
      const storedLast = BigInt(p.max) & ((1n << 64n) - 1n);
      add(`phase ${p.phase} stored up to the aggregator's last round`, last === null ? "UNSURE" : last === storedLast ? "CONFIRMED" : "UNSURE", last === null ? "aggregator latestRound unreadable" : `aggregator latestRound ${last}, stored last ${storedLast}`);
    }
  }
  if (currentPhase === null) add("phaseId readable", "UNSURE", "unreadable");
  else for (let q = 1; q <= currentPhase; q++) if (!input.phases.some((p) => p.phase === q)) add(`phase ${q} is indexed`, "UNSURE", `phaseId is ${currentPhase} but phase ${q} has no stored rounds`);

  // 4. Re-read sampled rounds and compare every stored field.
  let mismatches = 0;
  for (const r of input.sample) {
    const out = await call(NAV_SEL.getRoundData + pad(BigInt(r.round_id)));
    if (out === null) {
      add(`round ${r.round_id}`, "UNSURE", "unreadable onchain");
      continue;
    }
    const got = { id: word(out, 0), answer: int256(word(out, 1)), started: word(out, 2), updated: word(out, 3), air: word(out, 4) };
    const same = got.id === BigInt(r.round_id) && got.answer === BigInt(r.answer) && got.started === BigInt(r.started_unix) && got.updated === BigInt(r.updated_unix) && got.air === BigInt(r.answered_in_round);
    if (!same) {
      mismatches++;
      add(`round ${r.round_id}`, "REJECTED", `onchain answer ${got.answer} updatedAt ${got.updated} vs stored ${r.answer} ${r.updated_unix}`);
    }
  }
  add(`${input.sample.length} sampled rounds match onchain`, mismatches ? "REJECTED" : "CONFIRMED", `${mismatches} mismatch(es)`);

  const verdict = claims.some((c) => c.verdict === "REJECTED") ? "REJECTED" : claims.some((c) => c.verdict === "UNSURE") ? "UNSURE" : "CONFIRMED";
  return { verdict, sampled: input.sample.length, mismatches, claims, checked_at: new Date().toISOString() };
}
