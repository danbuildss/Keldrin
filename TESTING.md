# Test plan and quality gates
No production tests have been run yet. Starter check validates package structure and synthetic example only.

## Phase 1 — real manual proof
- Fetch primary official filing or IR release and verify issuer mapping against actual registry/chain evidence.
- Typed schema validation; every material claim links to an evidence ID and precise locator; separate reviewer opens original source.
- Reproduce from clean checkout; record commands, timestamps, hashes, actual output and limitations.

## Automated regression cases
Identity: wrong chain, ticker collision, Alphabet share classes, unverified contract, missing ISIN, mapping revision. Events: duplicate source, amended filing, scheduled vs effective, missing effective time, disagreement, source outage, cancelled event. Numeric: decimal precision, scaled multiplier, total-return vs raw price, absent/stale NAV, market holiday, missing feed. Storage: concurrent ingestion, idempotency, append-only correction, transaction rollback, unauthorized public record, cursor consistency. Security: injection in source text, redirect to private host, malformed JSON, excessive payload, secret redaction, rate limit. Payment: valid challenge/settlement, wrong amount/network/resource, expiration, duplicate/replay, timeout, unavailable record, ambiguous settlement/reconcile. API: OpenAPI and response schema parity, 400/404/409/429/503, invalid address, free sample, MCP parity if built.

Gold set: aim for 10+ independently annotated real cases with source URLs and expected fields. Synthetic edge cases separate. Report pass/fail counts, denominator, exact commands and fixture dates. No accuracy % inferred from tiny sample. Quality gate: zero known critical identity/unit errors, all published material facts cited and approved, three controlled successful end-to-end runs before schedule. Production gate includes rights, least privilege, logs, cost caps and rollback proof. Independent reviewer cannot be original author; another model is optional and not a substitute for primary-source checks.

## Phase 1 actual results (2026-11-27)
`npm test`: 47/47 pass, offline, on recorded real responses (fixtures/recorded, labelled RECORDED, not synthetic). Covers:
- identity: ISIN, symbol collision, mismatch gate
- numeric: WAD exactness, double tolerance, ratio
- logs: bracket pairing, unbracketed and omitted events, scheduled path
- storage: append-only, idempotency under jsonb key reordering, revisions
- API: confirmed-only serving, pagination, 400/404/405/409
- reconciliation: reporting lag is unknown, amendments
- security: host allowlist

Live: 3/3 controlled runs ok (research/phase1/runs). Not yet covered: payment, MCP, outage/reorg simulation, gold set of 10 annotated SEC events.
