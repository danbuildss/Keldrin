import { LIMITS, SEC_USER_AGENT } from "../config.ts";
import { fetchJson } from "../lib/http.ts";
import { submissions } from "../adapters/sec.ts";

// Company identity and declaration-candidate discovery from SEC, keyless (efts.sec.gov + data.sec.gov).
// Never guesses a CIK: a candidate must match the ticker in SEC's own entity index AND in SEC submissions.

export type CikResolution = { cik: string; name: string; tickers: string[]; evidence: string[] } | { cik: null; reason: string; evidence: string[] };

const opts = { headers: { "user-agent": SEC_USER_AGENT }, minIntervalMs: LIMITS.secMinIntervalMs };

/** Underlying ticker from a Coinbase token symbol: "GOOGLc" → "GOOGL". Null when the convention does not hold. */
export function underlyingTicker(tokenSymbol: string): string | null {
  return /^[A-Z][A-Z0-9.]{0,9}c$/.test(tokenSymbol) ? tokenSymbol.slice(0, -1) : null;
}

type EntityHit = { _id: string; _source: { entity?: string; tickers?: string } };

/** Pure selection rule, separated for tests: exactly one hit whose ticker list contains the ticker. */
export function pickEntity(hits: EntityHit[], ticker: string): { cik: string; entity: string } | { cik: null; reason: string } {
  const matches = hits.filter((h) => (h._source.tickers ?? "").split(/,\s*/).includes(ticker));
  if (matches.length === 1) return { cik: matches[0]._id.padStart(10, "0"), entity: matches[0]._source.entity ?? "" };
  return { cik: null, reason: matches.length === 0 ? `no SEC entity lists ticker ${ticker}` : `${matches.length} SEC entities list ticker ${ticker}` };
}

export async function resolveCik(name: string, ticker: string): Promise<CikResolution> {
  const evidence: string[] = [];
  for (const q of [name, ticker]) {
    const url = `https://efts.sec.gov/LATEST/search-index?keysTyped=${encodeURIComponent(q)}`;
    const { data, meta } = await fetchJson<{ hits: { hits: EntityHit[] } }>(url, opts);
    evidence.push(`${url} sha256=${meta.sha256.slice(0, 16)}`);
    const pick = pickEntity(data.hits.hits, ticker);
    if (pick.cik === null) continue;
    const sub = await submissions(pick.cik);
    evidence.push(`${sub.meta.url} sha256=${sub.meta.sha256.slice(0, 16)}`);
    if (!sub.data.tickers.includes(ticker)) return { cik: null, reason: `SEC submissions for ${pick.cik} do not list ${ticker}`, evidence };
    return { cik: pick.cik, name: sub.data.name, tickers: sub.data.tickers, evidence };
  }
  return { cik: null, reason: `could not resolve a unique SEC entity for ${ticker}`, evidence };
}

export type FilingRef = { accession: string; form: string; filed: string; items: string; url: string };

/**
 * Filings that may contain the declaration of an action: 8-K (items 8.01 other events, 2.02 results,
 * 5.03 charter/split) or 6-K for foreign issuers, filed in the window before the action took effect.
 * These are CANDIDATES (pointers), not evidence of the declaration: their text is on www.sec.gov (decision D2).
 */
export function declarationCandidates(recent: { form: string[]; filingDate: string[]; accessionNumber: string[]; items: string[]; primaryDocument: string[] }, cik: string, effectiveDate: string, windowDays = 120): FilingRef[] {
  const end = Date.parse(effectiveDate);
  const start = end - windowDays * 86_400_000;
  const out: FilingRef[] = [];
  for (let i = 0; i < recent.form.length; i++) {
    const t = Date.parse(recent.filingDate[i]);
    if (t < start || t > end) continue;
    const form = recent.form[i];
    const items = recent.items[i] ?? "";
    const relevant = form === "6-K" || (form === "8-K" && /(^|,)\s*(8\.01|2\.02|5\.03|7\.01)/.test(items));
    if (!relevant) continue;
    const acc = recent.accessionNumber[i];
    out.push({ accession: acc, form, filed: recent.filingDate[i], items, url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${acc.replace(/-/g, "")}/${recent.primaryDocument[i]}` });
  }
  return out.sort((a, b) => b.filed.localeCompare(a.filed));
}

export async function filingsIndex(cik: string) {
  const { data, meta } = await fetchJson<{ filings: { recent: { form: string[]; filingDate: string[]; accessionNumber: string[]; items: string[]; primaryDocument: string[] } } }>(`https://data.sec.gov/submissions/CIK${cik}.json`, opts);
  return { recent: data.filings.recent, meta };
}
