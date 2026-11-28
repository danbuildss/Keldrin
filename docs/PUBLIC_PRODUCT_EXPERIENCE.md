# Public product experience: plan for approval (2026-11-28)

Status: **proposal, not approved.** Nothing here is built until the founder approves it.

Goal: let a first-time visitor, a developer or an agent operator *experience* keldrin (explore, test, verify) without an
account, wallet or payment. Keldrin stays an infrastructure company; the website becomes living proof that the
infrastructure works.

Brand: unchanged. The approved identity stays (Base blue #0000FF, near-black #111111, white and greys, keystone logo,
lowercase "keldrin"; DECISIONS 2026-11-27). The "Amber Terminal / Modular K" identity in the proposal is **not**
adopted (founder, 2026-11-28: keep the brand we have).

## 1. What already exists (checked 2026-11-28)

Real numbers from production; the proposal's mockup numbers (10 assets, 48,250 observations, 99.98% uptime, 3
integrations) were illustrative and must not be used.

| Need | Already live | Real figure |
|---|---|---|
| Assets | `/v1/assets`, MCP `list_assets` | 435 tokens; 13 with Chainlink NAV |
| Historical NAV with round ids | `/v1/assets/{c}/nav/history` (daily, round) | 36,696 rounds indexed (2026-08-03 → now), official closes from Aug 2026 |
| DEX price, depth, pools | `/v1/assets/{c}/dex` | 416 verified pools |
| NAV/DEX divergence, session, freshness | `/v1/assets/{c}/market-context`, `/v1/market/session` | live |
| Corporate actions, multipliers | `/v1/assets/{c}/corporate-actions`, `/v1/events`, `/v1/calendar`, `/v1/changes` | 13 confirmed records, 54 calendar entries |
| Research runs | `/health` (last run) | 12 runs recorded, 12 ok |
| x402 payments | `scripts/payers.ts` (onchain) | 3 payments, all the founder's tests; 0 external |
| External integrations | none confirmed | 0 (MAXXAGENT testing) |
| Uptime / monitoring | status check every 6 h (GitHub Actions logs only) | no stored history yet |
| Volatility / drawdown | **not built** (T034 proposed) | — |
| Autonomous research reports | **not running** (AI skills inactive) | — |

## 2. My view

- **Yes to the direction.** Explorer, API Playground and a Transparency page turn "read about it" into "try and check
  it", which is the core of keldrin's promise (proof behind every value). They also make the Stocks Maxxing demo much
  stronger.
- **Mostly front-end over APIs we already have.** Only a small amount of backend is new (a stats route, risk figures,
  stored status history). No new data sources, no accounts, no wallet.
- **Honesty rules are the product.** The Transparency page must show the real, small numbers (0 external payers,
  0 confirmed integrations) rather than impressive placeholders. That is our differentiator, and it protects the
  hackathon submission (rules forbid misrepresentation).
- **Intelligence feed: not now as "autonomous research".** No AI research runs today, so there is nothing verified to
  publish. A real alternative now: a **verified events feed** (applied and upcoming corporate actions with evidence)
  from `/v1/events` and `/v1/changes`, which is already true and shareable. Autonomous reports come later, after the
  AI skills are approved and have a review gate.
- **Ask Keldrin, accounts, portfolios, trading, mobile, token: postpone** (agree with the proposal).

## 3. Proposed information architecture (same site, same brand)

```
keldrin.vercel.app
├── /            Home (exists): what keldrin is, live numbers, pricing, feedback
├── /explorer    Explorer: list of 13 NAV stocks (+ search across 435 for corporate actions)
│   └── /explorer?token=NVDAc   one stock: NAV chart, DEX vs NAV, session/freshness, corporate actions, pools, proof
├── /playground  API Playground: pick an endpoint, fill params, run it live, see JSON/status/time, copy cURL/TS/Python
├── /transparency Proof of Intelligence: coverage, records, runs, payments, integrations, methodology, limitations
├── /status      Status (P1): last research run, last status check, provider health, freshness
└── /start.md, /skill.md, /llms.txt, /openapi.json (exist)
```

## 4. Page details, reuse and new backend

**Explorer (P0).** Reuses nav/history (daily, 30/90 days and all), market-context, dex, corporate-actions. NAV chart
drawn in the browser (inline SVG, no chart library). Each value links to its proof (round id → feed address on a block
explorer; filing URL; onchain tx; pool and block). Risk figures (P0b): 30-day volatility and max drawdown computed
deterministically from official daily closes, with the method stated and the number of closes used; shown as
"unknown" when there are too few points. New backend: none required; risk can be computed client-side from
nav/history (or a small `/v1/assets/{c}/risk` route later, T034).

**API Playground (P0).** Runs requests **from the visitor's browser** to our own free endpoints only (fixed allowlist:
assets, events, calendar, corporate-actions, nav/history, market-context, dex, market/session, MCP tools/list). No
server-side proxy, so no SSRF risk and no secrets involved. Shows HTTP status, response time, pretty JSON, copyable
cURL, TypeScript and Python snippets, and the rate limits. Snapshot/report are listed with a note that they use the
3 free tries (not run automatically). New backend: none.

**Transparency (P0).** New read-only route `GET /v1/stats` (CDN-cached 5 min) returning counts from real tables:
assets, NAV feeds and verification verdicts, NAV rounds and coverage dates, confirmed records, calendar entries, DEX
pools, research runs (total, ok, last), last status check result. x402 payments and paying wallets come from the
onchain counter: run by the status workflow and stored, or computed live with a cache (decision below). External
integrations: a manually maintained list that only includes confirmed integrations (currently none). Methodology
section links the verifiers, staleness rule, DEX depth rule and limitations. Never exposes feedback, IPs, secrets or
infrastructure details.

**Status (P1).** Needs stored history: the status workflow writes each run's result (8 checks, pass/fail, timings) to a
new append-only `status_checks` table via the writer role; the page shows the last 30 days. Until then the page shows
only "last research run" and "last check" from `/health`, and no uptime percentage.

**Verified events feed (P1, instead of autonomous research now).** A page listing applied and upcoming corporate
actions with evidence and status, each with a permanent URL (`/events/{event_id}`), from existing data.

## 5. Security
Browser-only playground against an allowlist; no new write paths except `status_checks` (writer role, append-only);
`/v1/stats` read-only and aggregate; CSP stays self-only; rate limits already at the edge (300/min/IP) and in the app;
no personal data shown.

## 6. Performance and cost
Static pages on Vercel; data from existing routes (CDN-cached where not live). Explorer's live reads
(market-context, dex) are the same calls the API already serves; one stock page ≈ 4–5 requests. `/v1/stats` cached.
Extra GitHub minutes: the status workflow writing a row adds seconds per run. No new paid services.

## 7. Acceptance criteria
- Every number on Explorer, Playground and Transparency comes from a live API response or a stored record; a test fails
  if any page contains hard-coded financial values.
- Explorer: all 13 NAV stocks open; each value shows its proof link; unknown/withheld states are shown with reasons.
- Playground: every allowlisted endpoint runs from the browser and shows status, time, JSON and correct snippets.
- Transparency: shows 0 external payers and 0 confirmed integrations while that is true.
- Works on phone and desktop with no horizontal scroll; reduced-motion respected; outside tests extended to the new
  pages; independent review before go-live.

## 8. Order and timing
1. Finish Phase 13 founder actions (CLI 0.7.0, listings, submission prep).
2. Explorer + Playground (front-end only) — about one working session.
3. `/v1/stats` + Transparency — about half a session.
4. Status history + Status page, verified events feed — after the above.
Target: Explorer, Playground and Transparency live before the Stocks Maxxing deadline (2026-12-12), ideally before the
demo recording.

## 9. Decisions needed
1. Approve Explorer + Playground + Transparency (P0), with risk figures computed from official daily closes.
2. Approve the verified events feed instead of autonomous research for now.
3. Status history in Supabase (`status_checks`, writer role append-only): yes/no.
