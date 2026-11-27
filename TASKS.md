# Ordered backlog | updated 2026-11-27
| ID | Priority | Task | Status | Acceptance / dependency |
|---|---|---|---|---|
| T000 | P0 | Read workspace and confirm isolation | VERIFIED | Baseline commit 18eb2c0; secret scan clean; separate environment "Keldrin research" |
| T001 | P0 | Inspect Orric/Aeon, pin commits and licenses | VERIFIED | docs/REUSE_MATRIX.md (pinned SHAs, licenses, decisions) |
| T002 | P0 | Validate primary source access and rights | IN_PROGRESS (access VERIFIED; rights + SEC UA pending) | research/phase0/evidence/ledger.md. Remaining: SEC Archives UA (D2), Coinbase terms, Chainlink feed terms |
| T003 | P0 | Verify one B20 asset mapping | VERIFIED (token identity 435/435; share class pending) | GOOGLc / NVDAc registry + onchain match. Remaining: share-class evidence (SEC cover page or ADGM prospectus) |
| T004 | P0 | Fetch one historical or current official event | VERIFIED (13 real actions; BACKEND_PROOF.md) | Candidate: GOOGLc dividend e82812a6 ↔ Alphabet Q3 2026 dividend (PHASE0_PLAN.md §5) |
| T005 | P0 | Independent review and schema tests | VERIFIED (independent verifier; schema v0.2; 47 tests) | Phase 1 P1-06 |
| T006 | P0 | Build schema/store/migrations | VERIFIED locally (PGlite; Supabase in Phase 2) | Phase 1 subset P1-07; full in Phase 2 |
| T007 | P0 | Implement adapters and job state | IN_PROGRESS (adapters done; job leases/dead letter in Phase 2) | Phase 1 P1-03; job state in Phase 2 |
| T008 | P0 | Expand coverage to five approved assets | VERIFIED beyond scope (all 435 tokens; gold set pending) | Phase 2; needs log indexer + RPC decision (D9) |
| T009 | P0 | REST feed + sample consumer | VERIFIED locally (OpenAPI spec pending Phase 3) | Localhost subset in Phase 1 P1-08; full Phase 3 |
| T010 | P1 | Native Actions scheduling + health (Aeon pack later) | VERIFIED (Phase 4: GitHub Actions run #3 succeeded; BACKEND_PROOF.md) | Manual runs proven; separate credentials; founder enable |
| T011 | P1 | x402 one paid route | OPEN | Entitlement and cost approvals, testnet proof, replay/outage handling |
| T012 | P1 | Public evidence UI and docs | OPEN | Only after backend gate |
| T013 | P1 | Founder-led builder integrations / interviews | IN_PROGRESS (CD-001, CD-002; CUSTOMER_DISCOVERY.md) | Validates differentiation hypothesis |
| T014 | P1 | Demo and final submission | OPEN | Honest evidence, current rules, founder submits |
| T015 | P2 | MCP read-only adapter | OPEN | REST parity |
| T016 | P2 | Telegram and webhook delivery | OPEN | Demand validated |
| T017 | P3 | Additional market/sector analytics | OPEN | Separate licenses |
| T018 | P1 | Investigate multiplier anomalies SNDKc (8) and PMc (1.5588) | IN_PROGRESS (SNDKc = verified 8-for-1 split; PMc unexplained lead) | Needs log indexer; leads, not claims |
| T019 | P1 | Earnings calendar events (second event class) | PROPOSED (split into T020–T022) | After corporate actions (D5) |
| T020 | P0 (proposed) | Earnings release events: detect 8-K item 2.02, exact filing time, link press release | PROPOSED | CD-001; SEC submissions (keyless); gold set of real releases; independent verifier |
| T021 | P0 (proposed) | Upcoming earnings dates, only when announced in a filing or release | PROPOSED | Unknown when not announced; no licensed calendars |
| T022 | P1 (proposed) | Headline results (revenue, EPS) quoted from release text; XBRL after 10-Q | PROPOSED | No interpretation; results vs expectations EXCLUDED (licensed consensus) |
| T023 | P0 (proposed) | Derived ex-dividend date (T+1 rule), labelled derived with the rule | PROPOSED | CD-001 implied; field `ex_date_basis` |
| T024 | P1 (proposed) | Dividend history endpoint per company | PROPOSED | SEC XBRL + 8-Ks |
| T025 | P1 (proposed) | `/v1/assets/{contract}/context`: Chainlink reference value + freshness | PROPOSED | Reference, not a price; market-hours caveat |
| T026 | P1 (proposed) | DEX liquidity/volume (own indexing or partner) and XBRL fundamentals | PROPOSED | Partner terms; sizeable |
| T027 | P2 | Token research (exploratory, no build) | OPEN (research only) | docs/TOKEN_RESEARCH.md; legal advice; founder approval before anything |

Phase 1 (approved 2026-11-27, re-sequenced): DONE locally, see BACKEND_PROOF.md. Proposed Phase 2 (needs approval):

| ID | Priority | Task | Acceptance / dependency |
|---|---|---|---|
| P2-01 | P0 | SEC company-event adapter: declared dividends/splits with record/pay dates (needs D2) + leading calendar | Gold set of 10+ real events |
| P2-02 | P0 | Log-capable RPC indexer for notice-only announcements (needs D9) | Coverage vs bisection compared |
| P2-03 | P0 | Supabase project + RLS + read-only API role | Migrations replayed; rollback test |
| P2-04 | P1 | Serve reconciliations via API; OpenAPI 3.1 spec | Consumer validates both |
| P2-05 | P1 | Pin GitHub Actions SHAs; manual-dispatch research workflow | No secrets in logs |
| P2-06 | P1 | Earnings dates (second event class) | After P2-01 |

Status vocabulary: OPEN, PROPOSED, APPROVED, IN_PROGRESS, BLOCKED, VERIFIED. VERIFIED requires reproducible evidence linked in BACKEND_PROOF.md or FINDINGS_INDEX.md. Do not silently promote tasks. Work on one approved phase at a time.

Phase 2 (2026-11-27): DONE — gate passed (BACKEND_PROOF.md). P2-01 SEC calendar VERIFIED; P2-02 Alchemy indexer VERIFIED; P2-03 Supabase VERIFIED; P2-04 reconciliations + OpenAPI VERIFIED; P2-05 pinned Actions + manual workflow VERIFIED; P2-06 earnings dates OPEN (deferred). Gold set: template ready, annotation OPEN (founder).
| T028 | P1 (proposed) | SKILL.md at /skill.md (agent guide, as in Breakra) | PROPOSED | docs/BREAKRA_STUDY.md lesson 4 |
| T029 | P1 (proposed) | Remote read-only MCP endpoint /mcp + MCP Registry listing | PROPOSED | Replaces the T015 shape; founder submits listings |
| T030 | P1 (proposed) | Public self-verification of records | PROPOSED | Lesson 6 |
| T031 | P1 | Decide the x402 host (Bankr x402 Cloud vs Vercel + facilitator) | OPEN (research) | Does Bankr support secrets? Phase 5 |
| T032 | P0 (proposed) | NAV history indexer + `…/nav/history` (NVDAc first, then 14 feeds) — first MAXXAGENT test milestone | BUILT (Phase 5; verified locally; switched off pending the rights decision) | docs/research/FEASIBILITY_CD003.md; Chainlink rights decision |
| T033 | P0 | Per-asset `…/corporate-actions` route | BUILT (Phase 6; not deployed) | Existing verified data |
| T034 | P1 (proposed) | `…/risk` NAV-based volatility and drawdown | PROPOSED | docs/research/RISK_METHODOLOGY.md |
| T035 | P0 | `…/market-context` + sessions calendar — first MAXXAGENT test milestone | BUILT (Phase 6; not deployed) | docs/research/MARKET_SESSIONS.md |
| T036 | P1 (proposed) | `…/transfer-policy` snapshot | PROPOSED | docs/research/B20_POLICIES.md |
| T037 | P0 | DEX price + depth + NAV gap (Phase 8) | BUILT + independently reviewed (not deployed) | BACKEND_PROOF Phase 8 |
| T038 | P0 | Developer testing package (docs/developers/*, real examples) | BUILT (examples from the local verified store; re-capture from production after deploy) | docs/PLAN_DEVELOPER_RELEASE.md |
| T039 | P1 (proposed) | Edge rate limit (Vercel Firewall) + documented limits | PROPOSED | Founder sets the rule |
| T041 | P0 | Remote MCP server /mcp (Phase 9) | BUILT (not deployed) | BACKEND_PROOF Phase 9 |
| T042 | P0 | CLI npx keldrin (Phase 10) | DONE: keldrin@0.6.0 published by the founder 2026-11-27 | npm/README.md |
| T043 | P0 | x402 paid API (Phase 11) | WAITING (payout address, facilitator route, price) | docs/BREAKRA_STUDY.md |
| T044 | P1 | Open-source the product: new public repo with code, tests, developer docs and a license; this repo stays private | DEFERRED by the founder (2026-11-27): build and prove the product first | Founder, 2026-11-27 |
| T040 | P1 | Separate verifier database role (nav_reviews / reviews not writable by the indexer) | OPEN (needs a founder-created login) | Independent review 2026-11-27 finding 6 |
