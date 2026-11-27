# B20 transfer-policy intelligence

Research only (2026-11-27, CD-003). Not approved scope. Main report: docs/research/FEASIBILITY_CD003.md.

## Facts
- Policies: TRANSFER_SENDER_POLICY, TRANSFER_RECEIVER_POLICY, TRANSFER_EXECUTOR_POLICY (scope ids = keccak256 of the names), read via the token's `policyId(scope)`. Authorization via the PolicyRegistry `0x8453…0002` `isAuthorized(policyId, account)`. Pause via `pausedFeatures()` (TRANSFER = 0). Source: MAXXAGENT `src/lib/b20Guard.ts` (MIT), referencing docs.base.org B20 constants.
- Denim (2026-11-05): the executor policy is now checked on `msg.sender` for every transfer path; `invertedPolicyId` adds NOT to policies; transfers to the token's own address revert. "The token interface gains no new functions, events or errors."

## Proposed (read-only)
- `/v1/assets/{chain}/{contract}/transfer-policy`: policy ids per scope; paused features; `isAuthorized` for an ordinary probe address and for known routers or pool managers (named, with addresses); `observed_at` and block.
- Store observations append-only, so changes are visible over time; alerting later.
- **Never** claim a transaction will succeed; this is an observation at a block, not a guarantee. Never attempt to bypass a restriction.
- Reuse MAXXAGENT's approach with MIT attribution, or reimplement from the Base docs.
