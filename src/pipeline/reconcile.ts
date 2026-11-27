import { getAddress } from "viem";
import { read } from "../adapters/chain.ts";
import { navFeeds } from "../adapters/coinbase.ts";
import { concept, quarterlyFacts, submissions } from "../adapters/sec.ts";
import { payloadHash } from "../lib/canonical.ts";
import { formatUnits } from "../lib/decimal.ts";
import { cusipFromIsin } from "../lib/isin.ts";
import type { Check, IssuerActionRecord } from "./records.ts";

// Deep proof: link a confirmed issuer action (token side) to the underlying company's official SEC
// disclosure. Facts and interpretation are kept apart; anything we cannot evidence is "unknown".

export type Reconciliation = ReturnType<typeof shape>;

const shape = (x: {
  reconciliation_id: string;
  issuer_action: { record_id: string; payload_sha256: string };
  company: { cik: string; name: string; sec_tickers: string[] };
  company_event: { type: string; per_share_usd: string; period_start: string; period_end: string; accession: string; form: string; filed: string; source_url: string; source_sha256: string } | null;
  reference: { feed: string; description: string | null; answer_raw: string; decimals: number; value_usd: string; updated_at: string; read_at_block: string } | null;
  interpretation: { implied_net_reinvested_per_share_usd: string; ratio_to_declared: string; caveat: string } | null;
  checks: Check[];
  unknown: string[];
  status: "consistent" | "partially_reconciled" | "inconsistent" | "unsure";
  generated_at: string;
}) => ({ schema_version: "0.2", record_type: "reconciliation" as const, synthetic: false as const, ...x });

export async function reconcileDividend(rec: IssuerActionRecord, recHash: string, opts: { cik: string; secTicker: string }): Promise<Reconciliation> {
  const checks: Check[] = [];
  const c = (name: string, ok: boolean | null, detail?: string) => checks.push({ name, result: ok === null ? "unknown" : ok ? "pass" : "fail", ...(detail ? { detail } : {}) });
  const unknown: string[] = [];
  if (rec.action.status !== "applied" || !rec.action.effective || !rec.action.multiplier_before_wad) throw new Error("reconcile: needs an applied action");
  const effTime = rec.action.effective.time;
  const B = BigInt(rec.action.effective.block);

  // Company identity (SEC submissions)
  const sub = await submissions(opts.cik);
  c("sec_company_name_matches_token_name", sub.data.name === rec.asset.name, `SEC="${sub.data.name}" token="${rec.asset.name}"`);
  c("sec_lists_expected_ticker", sub.data.tickers.includes(opts.secTicker), `SEC tickers ${sub.data.tickers.join(",")}`);
  const cusip = rec.asset.isin ? cusipFromIsin(rec.asset.isin) : null;
  c("isin_to_cusip_valid", cusip !== null, cusip ?? "no CUSIP derivable");
  c("share_class_evidenced", null, `CUSIP ${cusip} → share class not yet evidenced from a primary source`);
  unknown.push("Share class of the underlying (CUSIP → class mapping needs SEC filing text or the ADGM prospectus).");

  // Company event (XBRL dividends declared per share)
  const con = await concept(opts.cik, "CommonStockDividendsPerShareDeclared");
  const q = quarterlyFacts(con.data.units["USD/shares"] ?? []);
  const f = q.find((x) => x.start! <= effTime.slice(0, 10) && effTime.slice(0, 10) <= x.end) ?? null;
  c("dividend_declared_in_quarter_of_action", f ? f.val > 0 : false, f ? `${f.val} USD/share for ${f.start}..${f.end} (${f.form} ${f.accn})` : "no quarterly fact covers the action date");
  if (f && f.filed > effTime.slice(0, 10)) c("sec_fact_filed_after_action", true, `fact first filed ${f.filed}; the declaration itself predates it (date not yet evidenced)`);
  unknown.push("Declaration, record and payment dates (in the declaring 8-K/press release on www.sec.gov; needs an approved SEC contact User-Agent, decision D2).");
  const ratioNum = BigInt(rec.action.multiplier_after_wad) * 10n ** 18n / BigInt(rec.action.multiplier_before_wad);
  c("multiplier_increased_consistent_with_reinvestment", ratioNum > 10n ** 18n, `ratio ${rec.action.ratio}`);

  // Reference value just before the action (Chainlink NAV feed, total-return semantics)
  let reference: Reconciliation["reference"] = null;
  let interpretation: Reconciliation["interpretation"] = null;
  const feeds = await navFeeds();
  const feed = feeds.data.nav_feeds.find((x) => getAddress(x.contract_address) === getAddress(rec.asset.contract_address));
  if (feed) {
    const rd = (await read(feed.nav_feed_address, "latestRoundData", [], B - 1n)) as readonly bigint[] | null;
    const desc = (await read(feed.nav_feed_address, "description", [], B - 1n)) as string | null;
    const dec = Number((await read(feed.nav_feed_address, "decimals", [], B - 1n)) as number | null ?? 8);
    if (rd) {
      reference = { feed: getAddress(feed.nav_feed_address), description: desc, answer_raw: rd[1].toString(), decimals: dec, value_usd: formatUnits(rd[1], dec), updated_at: new Date(Number(rd[3]) * 1000).toISOString(), read_at_block: (B - 1n).toString() };
      // implied net per share = (ratio - 1) × reference; exact integer math in feed decimals
      const implied = ((ratioNum - 10n ** 18n) * rd[1]) / 10n ** 18n;
      if (f) {
        const declared = BigInt(Math.round(f.val * 10 ** dec));
        const toDeclared = (implied * 10n ** 6n) / declared;
        interpretation = {
          implied_net_reinvested_per_share_usd: formatUnits(implied, dec),
          ratio_to_declared: formatUnits(toDeclared, 6),
          caveat: "Interpretation, not fact: assumes reinvestment at the feed's total-return reference just before the action. The issuer does not publish its per-action tax/fee breakdown, so the gap to the declared amount is unexplained, not an error.",
        };
        c("implied_net_not_above_declared", implied > 0n && implied <= declared, `implied ${formatUnits(implied, dec)} vs declared ${f.val}`);
      }
    }
  } else c("reference_feed_available", false, "no NAV feed listed for this token");

  const failed = checks.some((x) => x.result === "fail");
  const status = failed ? "inconsistent" : unknown.length ? "partially_reconciled" : "consistent";
  const body = shape({
    reconciliation_id: `${rec.record_id}:sec-dividend`,
    issuer_action: { record_id: rec.record_id, payload_sha256: recHash },
    company: { cik: opts.cik, name: sub.data.name, sec_tickers: sub.data.tickers },
    company_event: f ? { type: "cash_dividend_declared_per_share", per_share_usd: String(f.val), period_start: f.start!, period_end: f.end, accession: f.accn, form: f.form, filed: f.filed, source_url: con.meta.url, source_sha256: con.meta.sha256 } : null,
    reference,
    interpretation,
    checks,
    unknown,
    status,
    generated_at: new Date().toISOString(),
  });
  return body;
}

export const hashReconciliation = (r: Reconciliation) => payloadHash({ ...r, generated_at: undefined } as Record<string, unknown>);
