import type { PGlite } from "@electric-sql/pglite";
import { randomUUID } from "node:crypto";
import { CHAIN_ID, LIMITS, SEC_USER_AGENT } from "../config.ts";
import { fetchText } from "../lib/http.ts";

// Independent check of each stored earnings release (ROADMAP 6.2). The indexer read SEC's submissions JSON on
// data.sec.gov; this re-reads the filing's own SGML headers on www.sec.gov and confirms, from that second source:
// the form type, that "Results of Operations and Financial Condition" (item 2.02) is listed, the filing date, and the
// acceptance time (headers give it in New York time; compared in UTC). Any disagreement: REJECTED, never served.

const opts = { headers: { "user-agent": SEC_USER_AGENT }, minIntervalMs: LIMITS.secMinIntervalMs };

/** "20261117162051" (America/New_York wall time) -> ISO UTC, DST-correct via Intl. */
export function nyToUtc(ts: string): string | null {
  const m = ts.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi, s);
  // offset of New York at that instant (try both candidate offsets: -4h / -5h)
  for (const off of [4, 5]) {
    const t = guess + off * 3_600_000;
    const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(new Date(t));
    const g = (k: string) => Number(p.find((x) => x.type === k)?.value);
    if (g("year") === y && g("month") === mo && g("day") === d && g("hour") === h && g("minute") === mi && g("second") === s) return new Date(t).toISOString();
  }
  return null;
}

export type HeaderFacts = { form: string | null; items: string[]; filed: string | null; accepted_utc: string | null; ciks: string[] };

/** Pure: facts from an EDGAR -index-headers.html page. */
export function parseHeaders(html: string): HeaderFacts {
  const t = html.replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const form = t.match(/CONFORMED SUBMISSION TYPE:\s*([^\s<]+)/)?.[1] ?? null;
  const items = [...t.matchAll(/ITEM INFORMATION:\s*([^\n<]+)/g)].map((m) => m[1].trim());
  const f = t.match(/FILED AS OF DATE:\s*(\d{8})/)?.[1];
  const a = t.match(/<ACCEPTANCE-DATETIME>(\d{14})/)?.[1];
  const ciks = [...new Set([...t.matchAll(/CENTRAL INDEX KEY:\s*(\d{10})/g)].map((m) => m[1]))]; // co-registrants list several
  return { form, items, filed: f ? `${f.slice(0, 4)}-${f.slice(4, 6)}-${f.slice(6)}` : null, accepted_utc: a ? nyToUtc(a) : null, ciks };
}

export function judge(stored: { form: string; filed_date: string; accepted_at: string; cik?: string }, h: HeaderFacts): { verdict: "CONFIRMED" | "REJECTED"; claims: { claim: string; ok: boolean; evidence: string }[] } {
  const claims = [
    { claim: "form", ok: h.form === stored.form, evidence: `headers ${h.form} vs stored ${stored.form}` },
    { claim: "item 2.02 listed", ok: h.items.some((i) => /^Results of Operations and Financial Condition$/i.test(i)), evidence: h.items.join(" | ") },
    { claim: "filed date", ok: h.filed === stored.filed_date, evidence: `headers ${h.filed} vs stored ${stored.filed_date}` },
    ...(stored.cik ? [{ claim: "filer CIK", ok: h.ciks.includes(stored.cik), evidence: `headers ${h.ciks.join(",")} vs stored ${stored.cik}` }] : []),
    { claim: "acceptance time", ok: h.accepted_utc !== null && Date.parse(h.accepted_utc) === Date.parse(stored.accepted_at), evidence: `headers ${h.accepted_utc} vs stored ${stored.accepted_at}` },
  ];
  return { verdict: claims.every((c) => c.ok) ? "CONFIRMED" : "REJECTED", claims };
}

/** Reviews stored releases without a final (CONFIRMED or REJECTED) review, at most `limit` per run (the first backfill
 *  spreads over several runs). UNSURE ones (SEC page unreachable) are retried on later runs, up to 3 times. */
export async function verifyEarnings(db: PGlite, limit = 600): Promise<Record<string, number>> {
  const rows = (await db.query<{ contract_address: string; cik: string; accession: string; form: string; filed_date: string; accepted_at: string }>(
    `SELECT e.contract_address, e.cik, e.accession, e.form, to_char(e.filed_date, 'YYYY-MM-DD') AS filed_date, to_char(e.accepted_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS accepted_at
     FROM earnings_releases e WHERE e.chain_id = $1 AND NOT EXISTS (SELECT 1 FROM earnings_reviews r WHERE r.accession = e.accession AND lower(r.contract_address) = lower(e.contract_address) AND r.verdict IN ('CONFIRMED', 'REJECTED'))
       AND (SELECT count(*) FROM earnings_reviews u WHERE u.accession = e.accession AND lower(u.contract_address) = lower(e.contract_address) AND u.verdict = 'UNSURE') < 3
     ORDER BY e.accepted_at DESC LIMIT ${Math.max(1, Math.floor(limit))}`,
    [CHAIN_ID],
  )).rows;
  const tally: Record<string, number> = {};
  for (const r of rows) {
    const url = `https://www.sec.gov/Archives/edgar/data/${Number(r.cik)}/${r.accession.replace(/-/g, "")}/${r.accession}-index-headers.html`;
    let verdict: "CONFIRMED" | "REJECTED" | "UNSURE" = "UNSURE";
    let detail: Record<string, unknown> = { url };
    try {
      const page = await fetchText(url, opts);
      if (page.status !== 200) detail.reason = `HTTP ${page.status}`;
      else {
        const j = judge(r, parseHeaders(page.body));
        verdict = j.verdict;
        detail = { url, sha256: page.sha256, claims: j.claims };
      }
    } catch (e) {
      detail.reason = String((e as Error).message).slice(0, 200);
    }
    await db.query("INSERT INTO earnings_reviews (review_id, chain_id, contract_address, accession, verdict, detail) VALUES ($1,$2,$3,$4,$5,$6)",
      [randomUUID(), CHAIN_ID, r.contract_address, r.accession, verdict, JSON.stringify(detail)]);
    tally[verdict] = (tally[verdict] ?? 0) + 1;
  }
  return tally;
}
