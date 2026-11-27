# Ordered backlog | all OPEN unless noted
| ID | Priority | Task | Acceptance / dependency |
|---|---|---|---|
| T000 | P0 | Read workspace and confirm isolation | Baseline commit; no secrets; founder approves plan |
| T001 | P0 | Inspect Orric/Aeon, pin commits and licenses | Reuse matrix and runnable harness decision |
| T002 | P0 | Validate primary source access and rights | Source ledger; live response shapes; rate limits; rights for API reuse |
| T003 | P0 | Verify one B20 asset mapping | Issuer, underlying class/ISIN/CIK, chain and contract evidence |
| T004 | P0 | Fetch one historical or current official event | Source ID, timestamps, claim evidence and typed record |
| T005 | P0 | Independent review and schema tests | No unsupported claims; BACKEND_PROOF.md gate |
| T006 | P0 | Build schema/store/migrations | Revisions, idempotency, constraints and access policies |
| T007 | P0 | Implement adapters and job state | Retries, freshness, dead letter, budget and tests |
| T008 | P0 | Expand coverage to five approved assets | Three controlled runs, measured errors, ten gold events target |
| T009 | P0 | REST feed + sample consumer | OpenAPI, contract validation, real response and errors |
| T010 | P1 | Aeon scheduling + health | Manual runs proven; separate credentials; founder enable |
| T011 | P1 | x402 one paid route | Entitlement and cost approvals, testnet proof, replay/outage handling |
| T012 | P1 | Public evidence UI and docs | Only after backend gate; source links, limitations, status |
| T013 | P1 | Founder-led builder integrations | Actual feedback and external request metrics |
| T014 | P1 | Demo and final submission | Honest evidence, current rules, founder submits |
| T015 | P2 | MCP read-only adapter | REST parity, no arbitrary tool access |
| T016 | P2 | Telegram and webhook delivery | Demand validated; opt-in and retry policy |
| T017 | P3 | Additional market/sector analytics | Separate data licenses and accuracy evaluation |

Status vocabulary: OPEN, PROPOSED, APPROVED, IN_PROGRESS, BLOCKED, VERIFIED. VERIFIED requires reproducible evidence linked in BACKEND_PROOF.md or FINDINGS_INDEX.md. Do not silently promote tasks. Work on one approved phase at a time.
