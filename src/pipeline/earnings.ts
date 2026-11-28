import type { PGlite } from "@electric-sql/pglite";
import { CHAIN_ID, LIMITS, SEC_USER_AGENT } from "../config.ts";
import { fetchJson } from "../lib/http.ts";
import { resolveCik, underlyingTicker } from "./company.ts";

// ROADMAP Phase 6.2 (approved 2026-11-28): earnings releases. An earnings release here is a Form 8-K whose item list
// includes 2.02 (Results of Operations and Financial Condition), read from SEC's submissions index on data.sec.gov,
// with SEC's own acceptance time. Facts only: no estimates, no consensus, no forecast dates. Foreign issuers that file
// 6-K (no item numbers) are reported as not covered rather than guessed. Independently re-checked by
// verify/earningsVerify.ts against the filing's headers on www.sec.gov before anything is served.

export const EARNINGS_SINCE = "2025-01-01";
const opts = { headers: { "user-agent": SEC_USER_AGENT }, minIntervalMs: LIMITS.secMinIntervalMs };

export type FilesPage = { name: string; filingFrom: string; filingTo: string };
export type Recent = { accessionNumber: string[]; filingDate: string[]; reportDate: string[]; acceptanceDateTime: string[]; form: string[]; items: string[]; primaryDocument: string[] };
export type Release = { accession: string; form: string; is_amendment: boolean; items: string; filed_date: string; accepted_at: string; report_date: string | null; primary_document_url: string };

/** Pure: 8-K (and 8-K/A) filings listing item 2.02, filed on or after `since`, newest first. */
export function earningsReleases(recent: Recent, cik: string, since = EARNINGS_SINCE): Release[] {
  const out: Release[] = [];
  for (let i = 0; i < recent.form.length; i++) {
    const form = recent.form[i];
    if (form !== "8-K" && form !== "8-K/A") continue;
    const items = recent.items[i] ?? "";
    if (!items.split(",").map((x) => x.trim()).includes("2.02")) continue;
    if (recent.filingDate[i] < since) continue;
    const acc = recent.accessionNumber[i];
    const accepted = recent.acceptanceDateTime[i];
    // SEC gives acceptanceDateTime in UTC with a Z; anything else would be parsed in local time, so it is skipped
    if (!/^\d{10}-\d{2}-\d{6}$/.test(acc) || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(accepted ?? "")) continue;
    out.push({
      accession: acc, form, is_amendment: form === "8-K/A", items, filed_date: recent.filingDate[i], accepted_at: new Date(accepted).toISOString(),
      report_date: recent.reportDate[i] || null,
      primary_document_url: `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${acc.replace(/-/g, "")}/${recent.primaryDocument[i]}`,
    });
  }
  return out.sort((a, b) => b.accepted_at.localeCompare(a.accepted_at));
}

/** All filings since `since`: the submissions index's `recent` block plus every older page it lists whose range
 *  reaches `since` (heavy filers keep only about a year in `recent`). */
export async function filingsSince(cik: string, since = EARNINGS_SINCE): Promise<{ recent: Recent; sources: { url: string; sha256: string }[] }> {
  const { data, meta } = await fetchJson<{ filings: { recent: Recent; files?: FilesPage[] } }>(`https://data.sec.gov/submissions/CIK${cik}.json`, opts);
  const all: Recent = JSON.parse(JSON.stringify(data.filings.recent));
  const sources = [{ url: meta.url, sha256: meta.sha256 }];
  for (const f of data.filings.files ?? []) {
    if (f.filingTo < since || !/^CIK\d{10}-submissions-\d{3}\.json$/.test(f.name)) continue;
    const page = await fetchJson<Recent>(`https://data.sec.gov/submissions/${f.name}`, opts);
    for (const k of Object.keys(all) as (keyof Recent)[]) all[k].push(...((page.data[k] as string[]) ?? []));
    sources.push({ url: page.meta.url, sha256: page.meta.sha256 });
  }
  return { recent: all, sources };
}

/** One run: for each identity-verified token (or `symbols`), resolve the SEC company once and append new releases. */
export async function indexEarnings(db: PGlite, symbols?: string[]): Promise<{ tokens: { symbol: string; releases: number; added: number; note?: string }[] }> {
  const assets = (await db.query<{ contract_address: string; symbol: string; name: string }>(
    "SELECT contract_address, symbol, name FROM assets WHERE chain_id = $1 AND identity_state = 'verified' ORDER BY symbol", [CHAIN_ID],
  )).rows.filter((a) => !symbols || symbols.includes(a.symbol));
  const res: { symbol: string; releases: number; added: number; note?: string }[] = [];
  for (const a of assets) {
    const ticker = underlyingTicker(a.symbol);
    if (!ticker) { res.push({ symbol: a.symbol, releases: 0, added: 0, note: "no underlying ticker" }); continue; }
    let cik = (await db.query<{ cik: string }>("SELECT cik FROM sec_companies WHERE chain_id=$1 AND lower(contract_address)=lower($2) ORDER BY resolved_at DESC LIMIT 1", [CHAIN_ID, a.contract_address])).rows[0]?.cik;
    if (!cik) {
      let r;
      try {
        r = await resolveCik(a.name, ticker);
      } catch (e) {
        res.push({ symbol: a.symbol, releases: 0, added: 0, note: "CIK lookup failed: " + String((e as Error).message).slice(0, 120) });
        continue;
      }
      if (!r.cik) { res.push({ symbol: a.symbol, releases: 0, added: 0, note: r.reason }); continue; }
      cik = r.cik;
      await db.query("INSERT INTO sec_companies (chain_id, contract_address, cik, company_name, ticker, evidence) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING",
        [CHAIN_ID, a.contract_address, cik, r.name, ticker, JSON.stringify(r.evidence)]);
    }
    try {
      const { recent, sources } = await filingsSince(cik);
      const rel = earningsReleases(recent, cik);
      let added = 0;
      for (const r of rel) {
        const ins = await db.query("INSERT INTO earnings_releases (chain_id, contract_address, cik, accession, form, items, filed_date, accepted_at, report_date, primary_document_url, source_url, source_sha256) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT DO NOTHING RETURNING accession",
          [CHAIN_ID, a.contract_address, cik, r.accession, r.form, r.items, r.filed_date, r.accepted_at, r.report_date, r.primary_document_url, sources.map((x) => x.url).join(" "), sources.map((x) => x.sha256).join(" ")]);
        added += ins.rows.length;
      }
      const files6k = recent.form.some((f) => f === "6-K");
      res.push({ symbol: a.symbol, releases: rel.length, added, ...(rel.length === 0 && files6k ? { note: "files 6-K (foreign issuer): not covered" } : {}) });
    } catch (e) {
      // one company's SEC error never stops the others; it is retried next run
      res.push({ symbol: a.symbol, releases: 0, added: 0, note: "SEC read failed: " + String((e as Error).message).slice(0, 120) });
    }
  }
  return { tokens: res };
}
