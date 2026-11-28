// Shared helpers for keldrin's product pages. Every number shown comes from a live API response; nothing is hard-coded.
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const $ = (s) => document.querySelector(s);
// Stock image: the company's logo where an open-source copy exists (public/logos, Simple Icons, CC0 data;
// trademarks of their owners, shown only to identify the company), otherwise a ticker badge on brand colours.
const LOGOS = new Set(["AAPL", "ANT", "CRCL", "GOOGL", "INTC", "META", "NVDA", "SPCX", "TSLA"]);
const TINTS = [["#0000FF", "#FFFFFF"], ["#D1D7FF", "#0000FF"], ["#111111", "#FFFFFF"], ["#E8EBFF", "#111111"]];
export function badge(symbol, size = 32) {
  const base = String(symbol ?? "").replace(/c$/, "").toUpperCase();
  if (LOGOS.has(base)) return `<span class="badge logo" aria-hidden="true" style="width:${size}px;height:${size}px"><img src="/logos/${base}.svg" alt="" width="${Math.round(size * 0.6)}" height="${Math.round(size * 0.6)}" loading="lazy"></span>`;
  const t = base.slice(0, 4);
  let h = 0; for (const ch of t) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const [bg, fg] = TINTS[h % TINTS.length];
  const fs = Math.round(size * (t.length > 3 ? 0.3 : 0.36));
  return `<span class="badge" aria-hidden="true" style="width:${size}px;height:${size}px;background:${bg};color:${fg};font-size:${fs}px">${esc(t)}</span>`;
}
export const short = (a) => (a ? a.slice(0, 6) + "…" + a.slice(-4) : "");
export const basescan = (kind, v) => `https://basescan.org/${kind}/${v}`;
export async function getJson(path, init) {
  const t0 = performance.now();
  const r = await fetch(path, init);
  const text = await r.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, ok: r.ok, ms: Math.round(performance.now() - t0), body };
}
export const money = (v, d = 2) => (v === null || v === undefined || v === "" ? "—" : "$" + Number(v).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d }));
export const pct = (v) => (typeof v === "number" ? `<span class="${v >= 0 ? "up" : "down"}">${v >= 0 ? "+" : ""}${v.toFixed(2)}%</span>` : "—");
export const ago = (iso) => { const s = (Date.now() - Date.parse(iso)) / 1000; return s < 3600 ? Math.round(s / 60) + " min ago" : s < 172800 ? Math.round(s / 3600) + " h ago" : Math.round(s / 86400) + " d ago"; };
export function stalePill(state) {
  const cls = { fresh: "good", expected_closed: "blue", unexpectedly_stale: "bad", unknown: "warn" }[state] || "warn";
  return `<span class="pill ${cls}">${esc(state || "unknown")}</span>`;
}
export function nav(active) {
  const items = [["/explorer", "Explorer"], ["/playground", "Playground"], ["/transparency", "Transparency"], ["/start.md", "Docs"], ["/#pricing", "Pricing"], ["/legal", "Privacy and terms", "only-sm"]];
  const el = document.querySelector("#nav");
  el.innerHTML = `<div class="wrap"><a class="brand" href="/"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M3 4h26l-5 24H8L3 4zm11 6v12h4V10h-4z"/></svg>keldrin</a><div class="links" id="navlinks">${items.map(([h, t, c]) => `<a href="${h}" class="${c || ""} ${active === t ? "on" : ""}">${t}</a>`).join("")}</div><button class="menu" type="button" aria-expanded="false" aria-controls="navlinks">Menu</button></div>`;
  const btn = el.querySelector(".menu");
  const set = (open) => { el.classList.toggle("open", open); btn.setAttribute("aria-expanded", String(open)); btn.textContent = open ? "Close" : "Menu"; };
  btn.addEventListener("click", () => set(!el.classList.contains("open")));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") set(false); });
  document.querySelector("#foot").innerHTML = `<div class="wrap"><span>keldrin, built by <a href="https://somehowinternet.app/" target="_blank" rel="noopener">SOMEHOW</a></span><span>Facts with provenance, not investment advice. Not affiliated with Base, Coinbase or Chainlink. <a href="/legal">Privacy and terms</a></span></div>`;
}
