import type { PGlite } from "@electric-sql/pglite";
import { CHAIN_ID } from "../config.ts";

// GET /v1/assets/{contract}/earnings (ROADMAP 6.2): the company's earnings releases (SEC Form 8-K with item 2.02),
// with SEC's acceptance time, served only when the latest independent review is CONFIRMED. Facts only.

type Out = { status: number; body: unknown };
const iso = `'YYYY-MM-DD"T"HH24:MI:SS"Z"'`;

export async function assetEarnings(db: PGlite, contract: string): Promise<Out> {
  const a = (await db.query<{ contract_address: string; symbol: string }>("SELECT contract_address, symbol FROM assets WHERE lower(contract_address)=lower($1)", [contract])).rows[0];
  if (!a) return { status: 404, body: { error: { code: "UNKNOWN_ASSET", message: `no tracked asset ${contract}`, hint: "GET /v1/assets lists tracked tokens" } } };
  const co = (await db.query<{ cik: string; company_name: string; ticker: string }>("SELECT cik, company_name, ticker FROM sec_companies WHERE chain_id=$1 AND lower(contract_address)=lower($2) ORDER BY resolved_at DESC LIMIT 1", [CHAIN_ID, contract])).rows[0];
  const rows = (await db.query<{ accession: string; form: string; items: string; filed_date: string; accepted_at: string; report_date: string | null; primary_document_url: string; verdict: string | null; checked_at: string | null }>(
    `SELECT e.accession, e.form, e.items, to_char(e.filed_date, 'YYYY-MM-DD') AS filed_date, to_char(e.accepted_at AT TIME ZONE 'UTC', ${iso}) AS accepted_at,
            to_char(e.report_date, 'YYYY-MM-DD') AS report_date, e.primary_document_url, r.verdict, to_char(r.checked_at AT TIME ZONE 'UTC', ${iso}) AS checked_at
     FROM earnings_releases e LEFT JOIN LATERAL (SELECT verdict, checked_at FROM earnings_reviews v WHERE v.accession = e.accession AND lower(v.contract_address) = lower(e.contract_address) ORDER BY checked_at DESC LIMIT 1) r ON true
     WHERE e.chain_id = $1 AND lower(e.contract_address) = lower($2) ORDER BY e.accepted_at DESC`,
    [CHAIN_ID, contract],
  )).rows;
  const ok = rows.filter((r) => r.verdict === "CONFIRMED");
  const data = ok.map((r) => ({
    event_type: "earnings_release", form: r.form, items: r.items, accession: r.accession, filed_date: r.filed_date, accepted_at: r.accepted_at, report_date: r.report_date,
    sec_filing_url: r.primary_document_url, sec_index_url: r.primary_document_url.replace(/\/[^/]+$/, `/${r.accession}-index.htm`), verification: { verdict: r.verdict, checked_at: r.checked_at },
  }));
  return {
    status: 200,
    body: {
      data,
      meta: {
        token: a.contract_address, symbol: a.symbol, company: co ? { cik: co.cik, name: co.company_name, ticker: co.ticker } : null, count: data.length,
        not_yet_verified: rows.filter((r) => r.verdict !== "CONFIRMED" && r.verdict !== "REJECTED").length, rejected: rows.filter((r) => r.verdict === "REJECTED").length,
        ...(co ? {} : { unavailable_reason: "no SEC company resolved for this token yet (foreign issuers filing 6-K, ETFs and unmatched tickers are not covered)" }),
        semantics: "An earnings release = an SEC Form 8-K that lists item 2.02 (Results of Operations and Financial Condition), at SEC's acceptance time. Facts only: no estimates, consensus or predicted dates. Results are in the filing (exhibit 99.1); keldrin does not summarise them.",
        source: "SEC submissions index (data.sec.gov), independently re-checked against each filing's headers on www.sec.gov. Since 2025-01-01.",
      },
    },
  };
}
