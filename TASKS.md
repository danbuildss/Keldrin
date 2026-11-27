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
| T010 | P1 | Native Actions scheduling + health (Aeon pack later) | OPEN | Manual runs proven; separate credentials; founder enable |
| T011 | P1 | x402 one paid route | OPEN | Entitlement and cost approvals, testnet proof, replay/outage handling |
| T012 | P1 | Public evidence UI and docs | OPEN | Only after backend gate |
| T013 | P1 | Founder-led builder integrations / interviews | OPEN | Validates differentiation hypothesis |
| T014 | P1 | Demo and final submission | OPEN | Honest evidence, current rules, founder submits |
| T015 | P2 | MCP read-only adapter | OPEN | REST parity |
| T016 | P2 | Telegram and webhook delivery | OPEN | Demand validated |
| T017 | P3 | Additional market/sector analytics | OPEN | Separate licenses |
| T018 | P1 | Investigate multiplier anomalies SNDKc (8) and PMc (1.5588) | IN_PROGRESS (SNDKc = verified 8-for-1 split; PMc unexplained lead) | Needs log indexer; leads, not claims |
| T019 | P1 | Earnings calendar events (second event class) | OPEN | After corporate actions (D5) |

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
