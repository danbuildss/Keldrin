import { getAddress } from "viem";
import { read } from "../adapters/chain.ts";
import { navFeeds } from "../adapters/coinbase.ts";
import { concept, quarterlyFacts, submissions, type XbrlFact } from "../adapters/sec.ts";
import { payloadHash } from "../lib/canonical.ts";
import { formatUnits } from "../lib/decimal.ts";
import { cusipFromIsin } from "../lib/isin.ts";
import { HttpError } from "../lib/http.ts";
import { declarationCandidates, filingsIndex, resolveCik, underlyingTicker, type FilingRef } from "./company.ts";
import type { Check, IssuerActionRecord } from "./records.ts";

// Link a confirmed issuer action (token side) to the underlying company's official SEC disclosures.
// Facts, pointers and interpretation are kept apart; anything we cannot evidence is "unknown".
// "fail" requires positive contrary evidence; missing or not-yet-reported data is never a fail.

export type ActionKind = "cash_dividend" | "stock_split" | "other";

export type Reconciliation = {
  schema_version: "0.2";
  record_type: "reconciliation";
  synthetic: false;
  reconciliation_id: string;
  action_kind: ActionKind;
  issuer_action: { record_id: string; payload_sha256: string };
  company: { cik: string; name: string; sec_tickers: string[]; resolution_evidence: string[] } | null;
  company_event: { type: string; value: string; unit: string; period_start: string; period_end: string; accession: string; form: string; filed: string; source_url: string; source_sha256: string } | null;
  declaration_candidates: FilingRef[];
  reference: { feed: string; description: string | null; answer_raw: string; decimals: number; value_usd: string; updated_at: string; read_at_block: string } | null;
  interpretation: { implied_net_reinvested_per_share_usd: string; ratio_to_declared: string; caveat: string } | null;
  checks: Check[];
  unknown: string[];
  status: "consistent" | "partially_reconciled" | "inconsistent" | "unsure";
  generated_at: string;
};

/** Classify from the operator's description. Issuer text is untrusted, so this only chooses which SEC facts to look for. */
export function actionKind(description: string | null): ActionKind {
  const d = (description ?? "").toLowerCase();
  if (/\bsplit\b/.test(d) && !/reverse/.test(d)) return "stock_split";
  if (/\bdividend\b/.test(d)) return "cash_dividend";
  return "other";
}

export async function reconcileAction(rec: IssuerActionRecord, recHash: string, opts: { cik?: string; secTicker?: string } = {}): Promise<Reconciliation> {
  const checks: Check[] = [];
  const c = (name: string, ok: boolean | null, detail?: string) => checks.push({ name, result: ok === null ? "unknown" : ok ? "pass" : "fail", ...(detail ? { detail } : {}) });
  const unknown: string[] = [];
  if (rec.action.status !== "applied" || !rec.action.effective || !rec.action.multiplier_before_wad) throw new Error("reconcile: needs an applied action");
  const kind = actionKind(rec.action.operator_description);
  const effTime = rec.action.effective.time;
  const effDate = effTime.slice(0, 10);
  const B = BigInt(rec.action.effective.block);
  const ratioNum = (BigInt(rec.action.multiplier_after_wad) * 10n ** 18n) / BigInt(rec.action.multiplier_before_wad);
  const base = { schema_version: "0.2" as const, record_type: "reconciliation" as const, synthetic: false as const, reconciliation_id: `${rec.record_id}:sec:${recHash.slice(0, 12)}`, action_kind: kind, issuer_action: { record_id: rec.record_id, payload_sha256: recHash } };

  // 1. Company identity: resolve the CIK from SEC's own indexes, never from memory.
  const secTicker = opts.secTicker ?? underlyingTicker(rec.asset.symbol);
  let company: Reconciliation["company"] = null;
  if (opts.cik) {
    const sub = await submissions(opts.cik);
    company = { cik: opts.cik, name: sub.data.name, sec_tickers: sub.data.tickers, resolution_evidence: [`given CIK; ${sub.meta.url}`] };
  } else if (secTicker) {
    const r = await resolveCik(rec.asset.name, secTicker);
    if (r.cik) company = { cik: r.cik, name: r.name, sec_tickers: r.tickers, resolution_evidence: r.evidence };
    else unknown.push(`SEC company not resolved: ${r.reason}.`);
  } else unknown.push("Underlying ticker not derivable from the token symbol.");
  if (!company) {
    c("sec_company_resolved", null, "no unique SEC entity");
    return { ...base, company: null, company_event: null, declaration_candidates: [], reference: null, interpretation: null, checks, unknown, status: "unsure", generated_at: new Date().toISOString() };
  }
  // Identity is established by ticker in two SEC indexes; a differing display name is not contrary evidence.
  c("sec_company_name_matches_token_name", normName(company.name) === normName(rec.asset.name) ? true : null, `SEC="${company.name}" token="${rec.asset.name}"`);
  c("sec_lists_expected_ticker", secTicker ? company.sec_tickers.includes(secTicker) : null, `SEC tickers ${company.sec_tickers.join(",")}`);
  const cusip = rec.asset.isin ? cusipFromIsin(rec.asset.isin) : null;
  c("isin_to_cusip_valid", rec.asset.isin?.startsWith("US") ? cusip !== null : null, cusip ?? `non-US ISIN ${rec.asset.isin ?? "missing"}`);
  c("share_class_evidenced", null, "share class not yet evidenced from a primary source");
  unknown.push("Share class of the underlying (needs SEC filing text or the ADGM prospectus).");

  // 2. Declaration candidates: pointers to the filings that may contain the declaration.
  const idx = await filingsIndex(company.cik);
  const candidates = declarationCandidates(idx.recent, company.cik, effTime);
  c("declaration_candidate_filings_found", candidates.length ? true : null, `${candidates.length} 8-K/6-K filing(s) in the 120 days before the action`);
  unknown.push("Declaration, record and payment dates (in the candidate filings' text on www.sec.gov; needs an approved SEC contact User-Agent, decision D2).");

  // 3. Typed company facts by action kind.
  let companyEvent: Reconciliation["company_event"] = null;
  let reference: Reconciliation["reference"] = null;
  let interpretation: Reconciliation["interpretation"] = null;
  if (kind === "cash_dividend") {
    c("multiplier_increased_consistent_with_reinvestment", ratioNum > 10n ** 18n, `ratio ${rec.action.ratio}`);
    // Declared is preferred; some filers only tag the cash paid per share.
    const tag = (await conceptOrNull(company.cik, "CommonStockDividendsPerShareDeclared")) ? "CommonStockDividendsPerShareDeclared" : "CommonStockDividendsPerShareCashPaid";
    const con = await conceptOrNull(company.cik, tag);
    if (!con) {
      c("dividend_declared_in_quarter_of_action", null, "no us-gaap dividend-per-share facts (e.g. a foreign filer reporting under IFRS)");
      unknown.push("No us-gaap dividend-per-share facts for this company.");
    } else {
      const q = quarterlyFacts(con.data.units["USD/shares"] ?? []);
      const cls = classifyDividendFact(q, effDate);
      const f = cls.fact;
      if (f?.amended_from) c("sec_fact_amended", null, `latest ${f.val} (${f.accn}) supersedes ${f.amended_from.map((h) => `${h.val} (${h.accn})`).join(", ")}`);
      c("dividend_declared_in_quarter_of_action", cls.result === "unknown" ? null : cls.result === "pass", cls.detail);
      if (cls.unknownNote) unknown.push(cls.unknownNote);
      if (f) companyEvent = { type: tag === "CommonStockDividendsPerShareDeclared" ? "cash_dividend_declared_per_share" : "cash_dividend_paid_per_share", value: String(f.val), unit: "USD/share", period_start: f.start!, period_end: f.end, accession: f.accn, form: f.form, filed: f.filed, source_url: con.meta.url, source_sha256: con.meta.sha256 };
      // Reference value just before the action (Chainlink NAV feed, total-return semantics) → interpretation only.
      const feeds = await navFeeds();
      const feed = feeds.data.nav_feeds.find((x) => getAddress(x.contract_address) === getAddress(rec.asset.contract_address));
      if (!feed) {
        c("reference_feed_available", null, "no NAV feed listed for this token");
        unknown.push("No reference value feed, so the implied amount per share cannot be computed.");
      } else {
        const rd = (await read(feed.nav_feed_address, "latestRoundData", [], B - 1n)) as readonly bigint[] | null;
        const desc = (await read(feed.nav_feed_address, "description", [], B - 1n)) as string | null;
        const dec = Number(((await read(feed.nav_feed_address, "decimals", [], B - 1n)) as number | null) ?? 8);
        if (rd) {
          reference = { feed: getAddress(feed.nav_feed_address), description: desc, answer_raw: rd[1].toString(), decimals: dec, value_usd: formatUnits(rd[1], dec), updated_at: new Date(Number(rd[3]) * 1000).toISOString(), read_at_block: (B - 1n).toString() };
          const implied = ((ratioNum - 10n ** 18n) * rd[1]) / 10n ** 18n;
          const declared = f ? exactUnits(String(f.val), dec) : null;
          if (f && declared !== null && declared > 0n) {
            interpretation = {
              implied_net_reinvested_per_share_usd: formatUnits(implied, dec),
              ratio_to_declared: formatUnits((implied * 10n ** 6n) / declared, 6),
              caveat: "Interpretation, not fact: assumes reinvestment at the feed's total-return reference just before the action. The issuer does not publish its per-action tax/fee breakdown, so the gap to the declared amount is unexplained, not an error.",
            };
            c("implied_net_not_above_declared", implied > 0n && implied <= declared, `implied ${formatUnits(implied, dec)} vs declared ${f.val}`);
          }
        }
      }
    }
  } else if (kind === "stock_split") {
    const con = await conceptOrNull(company.cik, "StockholdersEquityNoteStockSplitConversionRatio1");
    const facts = (con?.data.units.pure ?? []).filter((x) => x.end >= shiftDays(effDate, -400));
    const hit = facts.find((x) => exactUnits(String(x.val), 18) === ratioNum);
    if (hit && con) {
      companyEvent = { type: "stock_split_conversion_ratio", value: String(hit.val), unit: "pure", period_start: hit.start ?? hit.end, period_end: hit.end, accession: hit.accn, form: hit.form, filed: hit.filed, source_url: con.meta.url, source_sha256: con.meta.sha256 };
      c("sec_split_ratio_matches_multiplier", true, `XBRL ratio ${hit.val} (${hit.form} ${hit.accn}) = multiplier ratio ${rec.action.ratio}`);
    } else {
      c("sec_split_ratio_matches_multiplier", null, facts.length ? `XBRL split ratios ${facts.map((x) => x.val).join(",")} do not include ${rec.action.ratio}` : "no XBRL split ratio fact yet (reporting lag or not tagged)");
      unknown.push("Split ratio not yet evidenced in SEC structured data.");
    }
  } else {
    unknown.push("Action kind not recognised from the issuer's description; no SEC facts compared.");
  }

  const failed = checks.some((x) => x.result === "fail");
  return {
    ...base,
    company,
    company_event: companyEvent,
    declaration_candidates: candidates,
    reference,
    interpretation,
    checks,
    unknown,
    status: failed ? "inconsistent" : unknown.length ? "partially_reconciled" : "consistent",
    generated_at: new Date().toISOString(),
  };
}

/** Backwards-compatible entry point used by the GOOGLc deep proof. */
export const reconcileDividend = (rec: IssuerActionRecord, recHash: string, opts: { cik: string; secTicker: string }) => reconcileAction(rec, recHash, opts);

async function conceptOrNull(cik: string, tag: string) {
  try {
    return await concept(cik, tag);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) return null;
    throw e;
  }
}

export const normName = (s: string) => s.toLowerCase().replace(/[.,]/g, "").replace(/\b(inc|incorporated|corp|corporation|co|company|ltd|limited|plc|sa|ag|nv|the)\b/g, "").replace(/\s+/g, " ").trim();
const shiftDays = (d: string, n: number) => new Date(Date.parse(d) + n * 86_400_000).toISOString().slice(0, 10);

/** Exact decimal string → integer scaled by 10^dec; null for exponent forms or excess precision. */
export function exactUnits(s: string, dec: number): bigint | null {
  const m = s.match(/^(\d+)(?:\.(\d+))?$/);
  if (!m || (m[2] ?? "").length > dec) return null;
  return BigInt(m[1]) * 10n ** BigInt(dec) + BigInt((m[2] ?? "").padEnd(dec, "0") || "0");
}

/** Pure: does a quarterly XBRL dividend fact cover the action date? Missing-because-not-yet-reported is unknown, not fail. */
export function classifyDividendFact(q: XbrlFact[], effDate: string): { fact: XbrlFact | null; result: "pass" | "fail" | "unknown"; detail: string; unknownNote: string | null } {
  const f = q.find((x) => x.start! <= effDate && effDate <= x.end) ?? null;
  if (f) return { fact: f, result: f.val > 0 ? "pass" : "fail", detail: `${f.val} USD/share for ${f.start}..${f.end} (${f.form} ${f.accn})`, unknownNote: null };
  const latestEnd = q.at(-1)?.end ?? null;
  if (!latestEnd || latestEnd < effDate)
    return { fact: null, result: "unknown", detail: `not yet reported in XBRL (latest quarterly fact ends ${latestEnd ?? "none"})`, unknownNote: "The quarter containing the action has no SEC XBRL dividend fact yet (reporting lag)." };
  return { fact: null, result: "fail", detail: "a later quarter is reported but none covers the action date", unknownNote: null };
}

export const hashReconciliation = (r: Reconciliation) => payloadHash({ ...r, generated_at: undefined } as Record<string, unknown>);
