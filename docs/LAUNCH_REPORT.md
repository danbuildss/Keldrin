# keldrin launch report (Phase 13, 2026-11-28)

Evidence-first summary. Every "live" claim below was checked from outside on production (docs/EXTERNAL_TESTS.md).

## 1. What has been built
The verified record for Coinbase tokenized stocks on Base, served to apps and agents with proof:
- **Corporate actions** for 435 tokens: dividends, splits and multiplier changes, matched to SEC filings and onchain
  multiplier events, independently re-verified before serving.
- **Chainlink NAV history** for 13 tokens with feed, phase, aggregator and round id per point (official rounds only).
- **Market context**: NYSE session (2026–2027 calendar), live NAV with age, staleness in trading time, main DEX
  price and NAV/DEX gap.
- **DEX prices** read onchain at one block from independently verified pools, with depth capped by pool balances.
- **Access**: website, free REST API, remote MCP (8 tools), CLI `npx keldrin`, agent guide `/skill.md`, developer
  quick start `/start.md`, one-call snapshot/report with 3 free tries a day, then $0.05 USDC via x402 on Bankr.
- **Operations**: research robot (GitHub Actions, every 8 h), status checks every 6 h, CI with a real Postgres,
  onchain paying-wallet counter, feedback form stored in Supabase.

## 2. Operational and independently verified
| Item | Evidence |
|---|---|
| 30/30 public routes, guide, MCP, x402 terms | External test run 2026-11-28T00:12Z (docs/EXTERNAL_TESTS.md) |
| Status check | 8/8 on production after the Phase 13 merge |
| Paid x402 end to end | Tx 0x5c3665fc…ab05 (block 63,173,420), $0.05 via keldrin.vercel.app/api/snapshot, HTTP 200, 13 stocks |
| NAV values vs chain | CLI verify-nav: 3/3 rounds match getRoundData on a second provider |
| DEX prices vs chain | verify-dex on a second provider matched NVDAc, GOOGLc, MSTRc (2026-11-27) |
| NAV feeds and pools | 13/13 feeds and 13/13 pool sets CONFIRMED by independent verifiers |
| Security review | Independent reviewer, 10 findings; all fixed or accepted with reasons (BACKEND_PROOF) |
| Supabase permissions | Per-role checks: reader can only count tries and insert feedback through functions; nobody but the owner reads feedback; writer cannot touch either |
| Feedback privacy | GET /v1/feedback → 404; only a salted client hash is stored, never the IP |

## 3. Incomplete or not verified
- **Founder actions**: Vercel edge rate-limit rule (docs/RATE_LIMIT_SETUP.md); redeploy `keldrin-snapshot` 1.0.1 on
  Bankr (one filter line); publish CLI 0.7.0 (snapshot/report commands); send the MAXXAGENT message; submit listings.
- **Listings**: none submitted. MCP Registry, x402scan, Bankr skills PR, Base ecosystem form and awesome-x402 are ready;
  Glama, skills.sh and Tessl appear to need a public repo (deferred open-source split, T044). Several directory pages
  could not be read from this session (docs/LISTINGS.md).
- **Demand**: 0 external paying wallets (3 payments, all the founder's tests). No external integration confirmed yet
  (MAXXAGENT agreed to test; not yet sent the package).
- **AI skills**: defined in `skills/` but not running; production is deterministic workers only.
- **Costs**: billed amounts not visible from here (GitHub, Vercel, Supabase, Alchemy dashboards).

## 4. Supported assets and endpoints
- 435 tracked tokens (identity, multiplier, corporate actions). 13 with NAV/market context/DEX: AAPLc, AMZNc, ANTc,
  CRCLc, GOOGLc, INTCc, METAc, MSFTc, MSTRc, NVDAc, SNDKc, SPCXc, TSLAc (no usable DEX pool: INTCc, TSLAc).
- Endpoints: `/v1/assets`, `/v1/events`, `/v1/calendar`, `/v1/actions`, `/v1/changes`,
  `/v1/assets/{c}/corporate-actions|nav/history|market-context|dex`, `/v1/market/session`, `/v1/snapshot`,
  `/v1/report`, `/api/snapshot`, `/api/report` (x402), `/mcp`, `/health`, `/llms.txt`, `/openapi.json`, `/skill.md`,
  `/start.md`, `POST /v1/feedback`.

## 5. Infrastructure costs (known)
GitHub Free (≈1,800 of 2,000 Actions min/month after moving research to every 8 h); Vercel Pro (founder); Supabase,
Alchemy free tiers; Base public RPC free; npm and MCP Registry free; test payments $0.15 (3 × $0.05). Details and
unknowns: docs/OPERATIONS_AUDIT.md.

## 6. Security findings
See BACKEND_PROOF "Phase 13: independent launch review": counter fail-closed with a database limit, secret salt,
accurate provenance wording, snapshot excludes decimals-conflict feeds, docs/schema fixes. Accepted: parallel last-try
race (bounded by rate limits); paid report's two DEX reads (documented); paid snapshot fan-out vs rate limits.
Earlier phases: append-only writer role, read-only reader sessions, fail-closed NAV serving, verifier on a separate
provider, x402 settles only on 2xx and handlers never 2xx on incomplete data.

## 7. Known limitations
NAV history starts at each feed's first official round (Aug 2026; ANTc Nov 2026). Live NAV/DEX from one public RPC at
request time (null with a reason on failure). NAV is a published reference, not a live equity price. NYSE calendar
covers 2026–2027. Free-try limit is per client IP (a trial allowance, not access control). Research every 8 h; GitHub
may delay runs. Not advice; not affiliated with Base, Coinbase or Chainlink.

## 8. Developer onboarding
`https://keldrin.vercel.app/start.md` (5 minutes, cURL), `/skill.md` (agents), MCP:
`claude mcp add --transport http keldrin https://keldrin.vercel.app/mcp`, CLI: `npx -y keldrin context NVDAc`.

## 9. Launch checklist
- [x] Production deployed; external tests 30/30; status check 8/8
- [x] Independent security review; critical findings fixed
- [x] Paid x402 verified with a real transaction
- [x] Agent guide, developer quick start, OpenAPI, llms.txt consistent (drift tests)
- [x] Vercel edge rate-limit rule (founder, 2026-11-28: /v1 or /mcp, fixed window 60 s, 300 per IP, 429; status check 8/8 afterwards)
- [x] Bankr snapshot 1.0.1 redeploy (founder, 2026-11-28, Bankr version 2; terms re-checked: 402, $0.05, payTo router)
- [ ] CLI 0.7.0 published (founder)
- [ ] MAXXAGENT package sent (founder)
- [ ] Listings submitted (founder, after approval)
- [ ] Stocks Maxxing: X post with demo video tagging @buildonbase + official form, before 2026-12-12 23:59 UTC (founder)

## 10. Stocks Maxxing readiness (rules re-read 2026-11-28)
Requirements: public X post with a video demo tagging @buildonbase; the official submission form; original work, with
the form clearly describing what was built during the Quest Period (Nov 5 – Dec 12; keldrin's repository and all
phases date from that period); no implied relationship with or endorsement by Base, partners, issuers or the
companies referenced. Track: Agentic Stock Finance. Ready to demo now: a live API with proof, MCP for agents, the CLI
re-checking values onchain, and a real x402 payment on Base. Honest gaps to state: no external users or payers yet;
AI skills are not running (the product is a verified data layer that agents use).
