import { getAddress } from "viem";
import type { PGlite } from "@electric-sql/pglite";
import { declarationCandidates, filingsIndex, resolveCik, underlyingTicker } from "./company.ts";
import { extractDividendDeclarations, filingDocuments, type Declaration } from "./declarations.ts";

// Leading calendar: dividends a company has DECLARED (SEC filing text, with evidence) mapped to the token
// that should adjust. State is derived, never assumed:
//   upcoming      payable date is in the future
//   applied       a confirmed issuer action for this token took effect on/after the record date
//   not_observed  payable date has passed and no confirmed action exists yet (late, or not applicable)
// The "adjusts on the payable date" expectation is an observed issuer pattern, stated with its measured rate.

export type CalendarEntry = {
  entry_id: string;
  token: { chain_id: 8453; contract_address: string; symbol: string };
  company: { cik: string; name: string };
  declaration: Declaration & { accession: string; form: string; filed: string; document_url: string; document_sha256: string };
  state: "upcoming" | "applied" | "not_observed";
  expected_adjustment_date: string | null;
  applied_record_id: string | null;
  basis: string;
  as_of: string;
};

export async function buildCalendar(db: PGlite, symbols: string[], asOf = new Date(), lookbackDays = 120): Promise<{ entries: CalendarEntry[]; skipped: { symbol: string; reason: string }[] }> {
  const pattern = await observedPattern(db);
  const entries: CalendarEntry[] = [];
  const skipped: { symbol: string; reason: string }[] = [];
  const today = asOf.toISOString().slice(0, 10);
  for (const symbol of symbols) {
    const asset = (await db.query<{ contract_address: string; name: string }>("SELECT contract_address, name FROM assets WHERE symbol=$1", [symbol])).rows[0];
    const ticker = underlyingTicker(symbol);
    if (!asset || !ticker) {
      skipped.push({ symbol, reason: asset ? "no underlying ticker" : "not a tracked asset" });
      continue;
    }
    const r = await resolveCik(asset.name, ticker);
    if (!r.cik) {
      skipped.push({ symbol, reason: r.reason });
      continue;
    }
    const idx = await filingsIndex(r.cik);
    const cands = declarationCandidates(idx.recent, r.cik, asOf.toISOString(), lookbackDays);
    const seen = new Set<string>();
    for (const cand of cands) {
      for (const d of await filingDocuments(r.cik, cand.accession)) {
        for (const x of extractDividendDeclarations(d.text)) {
          if (!x.payable_date || !x.record_date) continue;
          const key = `${x.per_share}|${x.payable_date}`;
          if (seen.has(key)) continue;
          seen.add(key);
          const applied = (await db.query<{ record_id: string }>(
            `SELECT record_id FROM confirmed_records WHERE lower(contract_address)=lower($1) AND payload->'action'->>'status'='applied'
             AND (payload->'action'->'effective'->>'time') >= $2 ORDER BY effective_block LIMIT 1`,
            [asset.contract_address, x.record_date],
          )).rows[0];
          const state: CalendarEntry["state"] = applied ? "applied" : x.payable_date > today ? "upcoming" : "not_observed";
          entries.push({
            entry_id: `cal:8453:${asset.contract_address.toLowerCase()}:${x.payable_date}:${x.per_share}`,
            token: { chain_id: 8453, contract_address: getAddress(asset.contract_address), symbol },
            company: { cik: r.cik, name: r.name },
            declaration: { ...x, accession: cand.accession, form: cand.form, filed: cand.filed, document_url: d.url, document_sha256: d.sha256 },
            state,
            expected_adjustment_date: state === "applied" ? null : x.payable_date,
            applied_record_id: applied?.record_id ?? null,
            basis: `Expected date = payable date, an observed issuer pattern (${pattern}); not a guarantee.`,
            as_of: asOf.toISOString(),
          });
        }
      }
    }
  }
  return { entries: entries.sort((a, b) => (a.declaration.payable_date ?? "").localeCompare(b.declaration.payable_date ?? "")), skipped };
}

/** Measured rate at which confirmed actions took effect on the declared payable date. */
async function observedPattern(db: PGlite): Promise<string> {
  const rows = (await db.query<{ payload: any; record_payload_sha256: string }>("SELECT payload, record_payload_sha256 FROM reconciliations WHERE review_verdict='CONFIRMED' ORDER BY created_at DESC")).rows;
  const latest = new Map<string, any>();
  for (const r of rows) if (!latest.has(r.payload.issuer_action.record_id)) latest.set(r.payload.issuer_action.record_id, r.payload);
  let n = 0;
  let same = 0;
  for (const p of latest.values()) {
    const ck = (p.checks ?? []).find((c: any) => c.name === "token_adjusted_on_payable_date");
    if (!ck) continue;
    n++;
    if (ck.result === "pass") same++;
  }
  return n ? `${same} of ${n} reconciled dividends adjusted on the payable date` : "no reconciled dividends yet";
}
