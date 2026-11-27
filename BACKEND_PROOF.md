# Backend proof register — PENDING
No live event or implementation verified. This file is the frontend gate.

| Gate | Required evidence | State |
|---|---|---|
| Source access | live request and response shape, rights ledger | PARTIAL: shapes verified 2026-11-27 (research/phase0/evidence/ledger.md); rights unknown for Coinbase API; SEC Archives 403 |
| Asset identity | issuer record, chain/contract and underlying class | PARTIAL: registry ↔ onchain match for NVDAc/GOOGLc; share class not yet evidenced |
| Real event | source document, typed record, facts and locators | PENDING |
| Independent verification | reviewer context/run, claim verdicts and payload hash | PENDING |
| Storage and correction | migration, duplicate/revision tests | PENDING |
| REST | reproducible request, response and errors | PENDING |
| Controlled runs | 3 successful runs, latency and failures | PENDING |
| Release | founder approves scope, entitlement, data policy and deploy | PENDING |

For each proof append date, commit, command, actual exit code, output path, source URL/retrieval time, review verdict, known limitations and next action. Do not use synthetic fixture as real proof. No polished frontend before the backend gate is accepted. A minimal local evidence page may be planned, not treated as product proof.

## 2026-11-27 Phase 0 observations (research probes, not backend proof)
- Commit: this session's Phase 0 commit. Commands: research/phase0/README.md. Outputs: research/phase0/evidence/onchain-observations-2026-11-27.md.
- Exit codes: onchain/receipt/nav scripts 0. Log-scan script failed (`-32011 request limit reached`, exit 2). SEC Archives HTTP 403.
- Review verdict: none (no independent review has run). These are probes by the plan's author, so they do not satisfy the "Real event" or "Independent verification" gates.
- Next action: Phase 1 after founder approval (PHASE0_PLAN.md).
