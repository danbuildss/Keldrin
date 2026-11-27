import { getAddress } from "viem";
import type { PGlite } from "@electric-sql/pglite";
import { declarationCandidates, filingsIndex, resolveCik, underlyingTicker } from "./company.ts";
import { extractDividendDeclarations, filingDocuments, type Declaration } from "./declarations.ts";
import type { Announcement } from "./discover.ts";

// Leading calendar: dividends a company has DECLARED (SEC filing text, with evidence) mapped to the token
// that should adjust. State is derived, never assumed:
//   upcoming      payable date is in the future
//   applied       a confirmed issuer action for this token took effect on/after the record date
//   not_observed  payable date has passed and no confirmed action exists yet (late, or not applicable)
// The "adjusts on the payable date" expectation is an observed issuer pattern, stated with its measured rate.

export type CalendarEntry = {
  entry_id: string;
  token: { chain_id: 8453; contract_address: string; symbol: string };
  company: { cik: string; name: string } | null;
  declaration: (Declaration & { accession: string; form: string; filed: string; document_url: string; document_sha256: string }) | null;
  issuer_announcement: IssuerAnnouncement | null;
  state: "upcoming" | "applied" | "not_observed" | "announced";
  expected_adjustment_date: string | null;
  applied_record_id: string | null;
  basis: string;
  as_of: string;
};

export type IssuerAnnouncement = { corporate_action_uuid: string; status: string; description: string; announced_at: string | null; announcements: { tx_hash: string; block: string; log_index: number; id: string; uri: string; caller: string }[] };

export async function buildCalendar(db: PGlite, symbols: string[], asOf = new Date(), lookbackDays = 120): Promise<{ entries: CalendarEntry[]; skipped: { symbol: string; reason: string }[]; notApplicable: { symbol: string; record_date: string; payable_date: string; reason: string }[] }> {
  const pattern = await observedPattern(db);
  const entries: CalendarEntry[] = [];
  const skipped: { symbol: string; reason: string }[] = [];
  const notApplicable: { symbol: string; record_date: string; payable_date: string; reason: string }[] = [];
  const today = asOf.toISOString().slice(0, 10);
  for (const symbol of symbols) {
    const asset = (await db.query<{ contract_address: string; name: string; first_mint: string | null }>("SELECT contract_address, name, identity->>'first_mint_date' AS first_mint FROM assets WHERE symbol=$1", [symbol])).rows[0];
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
          // A declaration whose record date precedes the token's first mint (or a token never minted)
          // cannot adjust the token: it is not applicable, not "late".
          if (!asset.first_mint || x.record_date < asset.first_mint.slice(0, 10)) {
            if (x.payable_date <= today) {
              const reason = asset.first_mint ? `record date ${x.record_date} is before the token's first mint ${asset.first_mint.slice(0, 10)}` : "token has no supply (never minted)";
              if (!notApplicable.some((n) => n.symbol === symbol && n.payable_date === x.payable_date)) notApplicable.push({ symbol, record_date: x.record_date, payable_date: x.payable_date, reason });
              continue;
            }
          }
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
            issuer_announcement: null,
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
  return { entries: entries.sort((a, b) => (a.declaration?.payable_date ?? "").localeCompare(b.declaration?.payable_date ?? "")), skipped, notApplicable };
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

/**
 * Merge issuer announcements that are ANNOUNCED (not yet applied) into the calendar. When an SEC
 * "upcoming" declaration exists for the same token it is enriched (both sides agree something is
 * coming); otherwise an "announced" entry is added with no expected date (none is evidenced).
 */
export function mergeIssuerAnnounced(entries: CalendarEntry[], pending: { contract: string; symbol: string; uuid: string; status: string; description: string; announcedAt: string | null; anns: Announcement[] }[], asOf: Date): CalendarEntry[] {
  const out = [...entries];
  for (const p of pending) {
    const ia: IssuerAnnouncement = {
      corporate_action_uuid: p.uuid,
      status: p.status,
      description: p.description,
      announced_at: p.announcedAt,
      announcements: p.anns.map((a) => ({ tx_hash: a.txHash, block: a.block, log_index: a.logIndex, id: a.id, uri: a.uri, caller: a.caller })),
    };
    const sec = out.find((e) => e.token.contract_address.toLowerCase() === p.contract.toLowerCase() && e.state === "upcoming" && !e.issuer_announcement);
    if (sec) {
      sec.issuer_announcement = ia;
      sec.basis += " The issuer has also announced this action onchain (status " + p.status + ").";
      continue;
    }
    out.push({
      entry_id: `cal:8453:${p.contract.toLowerCase()}:ca:${p.uuid}`,
      token: { chain_id: 8453, contract_address: getAddress(p.contract), symbol: p.symbol },
      company: null,
      declaration: null,
      issuer_announcement: ia,
      state: "announced",
      expected_adjustment_date: null,
      applied_record_id: null,
      basis: "Announced onchain by the issuer and not yet applied. No dated company declaration has been evidenced yet, so no expected date is given.",
      as_of: asOf.toISOString(),
    });
  }
  return out.sort((a, b) => (a.expected_adjustment_date ?? "9999").localeCompare(b.expected_adjustment_date ?? "9999") || a.token.symbol.localeCompare(b.token.symbol));
}
