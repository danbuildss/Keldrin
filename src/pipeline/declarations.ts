import { LIMITS, SEC_USER_AGENT } from "../config.ts";
import { fetchJson, fetchText } from "../lib/http.ts";

// Deterministic extraction of common-stock cash dividend declarations from SEC filing text (8-K / 6-K
// and their exhibits). No LLM. Every extracted value carries the exact quoted clause, document URL,
// document sha256 and character offset so an independent reviewer can re-find and re-parse it.

const opts = { headers: { "user-agent": SEC_USER_AGENT, accept: "*/*" }, minIntervalMs: LIMITS.secMinIntervalMs };

const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const DATE_RE = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})\b/g;

export function isoDate(m: string, d: string, y: string): string | null {
  const mi = MONTHS.indexOf(m.toLowerCase());
  const day = Number(d);
  if (mi < 0 || day < 1 || day > 31) return null;
  const iso = `${y}-${String(mi + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return new Date(`${iso}T00:00:00Z`).toISOString().slice(0, 10) === iso ? iso : null;
}

/** HTML → normalised plain text (entities decoded, tags/scripts removed, whitespace collapsed). */
const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "\u2019", lsquo: "\u2018", rdquo: "\u201d", ldquo: "\u201c", ndash: "\u2013", mdash: "\u2014" };

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    // Inline formatting tags can split a word ("t<span>he</span>"): drop them without a space.
    .replace(/<\/?(?:a|abbr|b|bdi|bdo|big|cite|code|em|font|i|ins|kbd|mark|q|s|samp|small|span|strike|strong|sub|sup|tt|u|var)\b[^>]*>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => NAMED[n.toLowerCase()] ?? " ")
    .replace(/[\s\u00a0]+/g, " ")
    .trim();
}

export type Declaration = {
  per_share: string; // exact decimal string as printed, e.g. "0.22"
  currency: "USD";
  payable_date: string | null;
  record_date: string | null;
  declared_on: string | null; // exact date when the text gives one ("On July 22, 2026, ... declared")
  declared_month: string | null; // e.g. "2026-07" when only "In July 2026" is given
  quote: string; // the exact text span the values were parsed from
  offset: number; // character offset of `quote` in the normalised document text
};

// "including preferred stock on an as-converted to common stock basis" is a common-stock dividend.
const isPreferred = (s: string) => /preferred|depositary/i.test(s) && !/as[- ]converted/i.test(s);

/**
 * Find common-stock cash dividend declarations. Works clause by clause: a sentence that mixes preferred
 * and common dividends is split on ";" and ", and the" so preferred amounts/dates are never attributed
 * to common stock. Returns [] when nothing unambiguous is found (never guesses).
 */
export function extractDividendDeclarations(text: string): Declaration[] {
  const out: Declaration[] = [];
  const sentenceRe = /[^.]*?\bdividend\b[^.]*?\$\s?(\d+(?:\.\d+)?)\s+per\s+(?:share|ordinary share|common share|ADS)[^]*?(?=\.\s+[A-Z]|$)/gi;
  for (const m of text.matchAll(sentenceRe)) {
    const start = m.index ?? 0;
    // Take this sentence plus the following two (dates often follow the amount in the next sentence).
    const window = text.slice(start, start + 1200);
    const sentences = window.split(/(?<=\.)\s+(?=[A-Z])/).slice(0, 3);
    const joined = sentences.join(" ");
    const clauses = joined.split(/;|,?\s+and\s+(?=(?:a|the)\s)|\.\s+/);
    const amountClause = clauses.find((c) => /\$\s?\d/.test(c) && /dividend/i.test(c) && !isPreferred(c) && /(common|class [a-c]|ordinary|per share)/i.test(c));
    if (!amountClause) continue;
    const per = amountClause.match(/\$\s?(\d+(?:\.\d+)?)\s+per\s+/i)?.[1];
    if (!per) continue;
    // Dates: prefer a clause that mentions common stock / classes; never one that mentions preferred.
    const dateClauses = clauses.filter((c) => /payable|record/i.test(c) && !isPreferred(c));
    const pick = dateClauses.find((c) => /common|class [a-c]/i.test(c)) ?? (dateClauses.length === 1 ? dateClauses[0] : undefined);
    let payable: string | null = null;
    let record: string | null = null;
    const D = "(January|February|March|April|May|June|July|August|September|October|November|December)\\s+(\\d{1,2}),\\s*(\\d{4})";
    const PAY = new RegExp(`(?:payable(?:\\s+in\\s+cash)?\\s+on|(?:to\\s+be\\s+)?paid\\s+on|payment\\s+date\\s+of|will\\s+pay[^$]*?\\$\\s?[\\d.]+\\s+per\\s+share\\s+on)\\s+${D}`, "i");
    const REC = new RegExp(`record[^$]*?(?:as of|on|at)\\s+(?:the\\s+close\\s+of\\s+business\\s+on\\s+)?${D}`, "i");
    for (const c of [pick, amountClause].filter((x): x is string => !!x)) {
      const p = payable ? null : c.match(PAY);
      const r = record ? null : c.match(REC);
      if (p) payable = isoDate(p[1], p[2], p[3]);
      if (r) record = isoDate(r[1], r[2], r[3]);
    }
    if (!payable && !record) continue; // a dividend mention without dates (e.g. a guidance table) is not a declaration
    const lead = text.slice(Math.max(0, start - 200), start + joined.length);
    const on = lead.match(/\bOn\s+(\w+)\s+(\d{1,2}),\s*(\d{4}),[^.]*declared/i);
    const inMonth = lead.match(/\bIn\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4}),[^.]*declared/i);
    const declaredOn = on ? isoDate(on[1], on[2], on[3]) : null;
    const declaredMonth = !declaredOn && inMonth ? `${inMonth[2]}-${String(MONTHS.indexOf(inMonth[1].toLowerCase()) + 1).padStart(2, "0")}` : null;
    const quoteText = [amountClause.trim(), pick?.trim()].filter((x, i, a) => x && a.indexOf(x) === i).join(" … ");
    const key = `${per}|${payable}|${record}`;
    if (out.some((d) => `${d.per_share}|${d.payable_date}|${d.record_date}` === key)) continue;
    out.push({ per_share: per, currency: "USD", payable_date: payable, record_date: record, declared_on: declaredOn, declared_month: declaredMonth, quote: quoteText, offset: text.indexOf(amountClause.trim(), start) });
  }
  return out;
}

export type FilingDoc = { url: string; sha256: string; text: string; bytes: number };

/** Primary document and press-release exhibits (EX-99*) of one filing, via its EDGAR index. */
export async function filingDocuments(cik: string, accession: string): Promise<FilingDoc[]> {
  const base = `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replace(/-/g, "")}`;
  const { data } = await fetchJson<{ directory: { item: { name: string }[] } }>(`${base}/index.json`, opts);
  const names = data.directory.item.map((i) => i.name).filter((n) => /\.html?$/i.test(n) && !/index|^R\d+\.htm$/i.test(n));
  const pick = names.filter((n) => /ex-?99|exhibit-?99|ex99|99[._-]?1|991/i.test(n));
  const docs: FilingDoc[] = [];
  for (const n of pick.length ? pick : names.slice(0, 3)) {
    const f = await fetchText(`${base}/${n}`, opts);
    if (f.status !== 200) continue;
    docs.push({ url: f.url, sha256: f.sha256, text: htmlToText(f.body), bytes: f.bytes });
  }
  return docs;
}

/** Collect every date mentioned in a quote (used by tests and the reviewer). */
export function datesIn(s: string): string[] {
  return [...s.matchAll(DATE_RE)].map((m) => isoDate(m[1], m[2], m[3])).filter((x): x is string => !!x);
}
