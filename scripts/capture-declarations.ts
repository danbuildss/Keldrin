// Capture RECORDED excerpts of real SEC dividend declarations (public filings) for offline extractor tests.
// Normalised text windows around each extracted declaration, plus one raw-HTML window that exercises
// inline-tag word splitting. Run with SEC_USER_AGENT set to the approved contact.
import { readFileSync, writeFileSync } from "node:fs";
import { SEC_USER_AGENT } from "../src/config.ts";
import { fetchText } from "../src/lib/http.ts";
import { htmlToText } from "../src/pipeline/declarations.ts";

const cal = JSON.parse(readFileSync("records/calendar-latest.json", "utf8"));
const cases: { symbol: string; url: string; sha256: string; text: string; expected: { per_share: string; payable_date: string | null; record_date: string | null } }[] = [];
let rawHtml: { url: string; html: string } | null = null;
for (const { entry: e } of cal.entries) {
  const d = e.declaration;
  const f = await fetchText(d.document_url, { headers: { "user-agent": SEC_USER_AGENT, accept: "*/*" }, minIntervalMs: 300 });
  const text = htmlToText(f.body);
  const at = text.indexOf(d.quote.split(" … ")[0]);
  cases.push({ symbol: e.token.symbol, url: d.document_url, sha256: f.sha256, text: text.slice(Math.max(0, at - 400), at + 1200), expected: { per_share: d.per_share, payable_date: d.payable_date, record_date: d.record_date } });
  if (!rawHtml && /t\s*<[^>]+>\s*he common stock dividend/i.test(f.body)) {
    const i = f.body.search(/Dividend Programs/);
    rawHtml = { url: d.document_url, html: f.body.slice(i, i + 6000) };
  }
}
writeFileSync("fixtures/recorded/sec-declarations.json", JSON.stringify({ note: "RECORDED excerpts of public SEC filings (normalised text windows), not synthetic. Used for offline extractor tests only.", recorded_at: new Date().toISOString(), cases, raw_html: rawHtml }, null, 1) + "\n");
console.log("captured", cases.length, "cases; raw html window:", !!rawHtml);
