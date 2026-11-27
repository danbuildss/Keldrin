# Ordered backlog | updated 2026-11-27
| ID | Priority | Task | Status | Acceptance / dependency |
|---|---|---|---|---|
| T000 | P0 | Read workspace and confirm isolation | VERIFIED | Baseline commit 18eb2c0; secret scan clean; separate environment "Keldrin research" |
| T001 | P0 | Inspect Orric/Aeon, pin commits and licenses | VERIFIED | docs/REUSE_MATRIX.md (pinned SHAs, licenses, decisions) |
| T002 | P0 | Validate primary source access and rights | IN_PROGRESS | research/phase0/evidence/ledger.md. Remaining: SEC Archives UA (D2), Coinbase terms, Chainlink feed terms |
| T003 | P0 | Verify one B20 asset mapping | IN_PROGRESS | GOOGLc / NVDAc registry + onchain match. Remaining: share-class evidence (SEC cover page or ADGM prospectus) |
| T004 | P0 | Fetch one historical or current official event | PROPOSED | Candidate: GOOGLc dividend e82812a6 ↔ Alphabet Q3 2026 dividend (PHASE0_PLAN.md §5) |
| T005 | P0 | Independent review and schema tests | OPEN | Phase 1 P1-06 |
| T006 | P0 | Build schema/store/migrations | OPEN | Phase 1 subset P1-07; full in Phase 2 |
| T007 | P0 | Implement adapters and job state | OPEN | Phase 1 P1-03; job state in Phase 2 |
| T008 | P0 | Expand coverage to five approved assets | OPEN | Phase 2; needs log indexer + RPC decision (D9) |
| T009 | P0 | REST feed + sample consumer | OPEN | Localhost subset in Phase 1 P1-08; full Phase 3 |
| T010 | P1 | Native Actions scheduling + health (Aeon pack later) | OPEN | Manual runs proven; separate credentials; founder enable |
| T011 | P1 | x402 one paid route | OPEN | Entitlement and cost approvals, testnet proof, replay/outage handling |
| T012 | P1 | Public evidence UI and docs | OPEN | Only after backend gate |
| T013 | P1 | Founder-led builder integrations / interviews | OPEN | Validates differentiation hypothesis |
| T014 | P1 | Demo and final submission | OPEN | Honest evidence, current rules, founder submits |
| T015 | P2 | MCP read-only adapter | OPEN | REST parity |
| T016 | P2 | Telegram and webhook delivery | OPEN | Demand validated |
| T017 | P3 | Additional market/sector analytics | OPEN | Separate licenses |
| T018 | P1 | Investigate multiplier anomalies SNDKc (8) and PMc (1.5588) | OPEN | Needs log indexer; leads, not claims |
| T019 | P1 | Earnings calendar events (second event class) | OPEN | After corporate actions (D5) |

Phase 1 sub-tasks P1-01..P1-09 are in PHASE0_PLAN.md §10 and become APPROVED only after D1.

Status vocabulary: OPEN, PROPOSED, APPROVED, IN_PROGRESS, BLOCKED, VERIFIED. VERIFIED requires reproducible evidence linked in BACKEND_PROOF.md or FINDINGS_INDEX.md. Do not silently promote tasks. Work on one approved phase at a time.
