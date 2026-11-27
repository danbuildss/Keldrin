import { LIMITS, SEC_DATA, SEC_USER_AGENT } from "../config.ts";
import { fetchJson } from "../lib/http.ts";

// SEC EDGAR via data.sec.gov only (www.sec.gov Archives need an approved contact UA: decision D2).

const cik10 = (cik: string | number) => String(cik).replace(/^0+/, "").padStart(10, "0");
const opts = { headers: { "user-agent": SEC_USER_AGENT }, minIntervalMs: LIMITS.secMinIntervalMs };

export type XbrlFact = { start?: string; end: string; val: number; accn: string; fy: number; fp: string; form: string; filed: string; frame?: string };

export async function submissions(cik: string | number) {
  return fetchJson<{ cik: string; name: string; tickers: string[]; exchanges: string[] }>(`${SEC_DATA}/submissions/CIK${cik10(cik)}.json`, opts);
}

/** One us-gaap concept, all USD/shares facts. Uses the per-concept endpoint to avoid the 3 MB companyfacts file. */
export async function concept(cik: string | number, tag: string) {
  return fetchJson<{ units: Record<string, XbrlFact[]> }>(`${SEC_DATA}/api/xbrl/companyconcept/CIK${cik10(cik)}/us-gaap/${tag}.json`, opts);
}

/** Quarterly (≈3-month duration) facts, de-duplicated by period, keeping the earliest filing that reported it. */
export function quarterlyFacts(facts: XbrlFact[]): XbrlFact[] {
  const byPeriod = new Map<string, XbrlFact>();
  for (const f of facts) {
    if (!f.start) continue;
    const days = (Date.parse(f.end) - Date.parse(f.start)) / 86_400_000;
    if (days < 80 || days > 100) continue;
    const key = `${f.start}/${f.end}`;
    const prev = byPeriod.get(key);
    if (!prev || f.filed < prev.filed) byPeriod.set(key, f);
  }
  return [...byPeriod.values()].sort((a, b) => a.end.localeCompare(b.end));
}
