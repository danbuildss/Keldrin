# Architecture proposal
Source adapters (SEC, IR, issuer, Base RPC / authorized market provider) → deterministic normalizer and mapping registry → evidence store → event extraction/synthesis → independent verifier → versioned event store → REST / public evidence UI / optional MCP & x402. Research worker is separate from API request serving; cache approved records and never run arbitrary web searches on paid requests by default.

Suggested stack: TypeScript/Node; Zod or JSON Schema; Postgres/Supabase for events, assets, sources, observations, reviews, revisions, usage; GitHub Actions/Aeon for orchestration; Vercel API/UI if compatible. Confirm current provider APIs and versions. Store secrets in managed secret store; least privileges; separate x402 facilitator/receiving address from research agent. No research wallet signing. Use official x402 verification/settlement flow, verify amount/network/resource, avoid replay, return service only per settlement policy. Do not charge for unsupported/stale-as-current data.

Reuse Orric guard, verification, memory, scorecard, content drafts and scoped improvement patterns only after reviewing actual source. Inspect Aeon skill runner and scheduling format rather than inventing configuration. Proposed schedules: manual first; approved 30–60 minute event polling during suitable windows, daily digest, weekly evaluation; actual cadence subject to rate limits, freshness goals and cost. Use exchange timezone/calendar, UTC storage, locks, retry/backoff, budget caps and failure notification. Disabled until owner approval.

v0.2: DATABASE.md, SECURITY.md and AUTOMATION.md expand the proposed stack. Use one orchestrator, not duplicate native cron and Aeon; no schedule until gate.

v0.3 (Phase 0, proposed): see PHASE0_PLAN.md §6.
- **Source of record:** chain + SEC. The Coinbase registry is an index (doubles, unknown rights).
- **Orchestrator:** native GitHub Actions following Orric (not an Aeon fork); `keldrin-aeon` pack later.
- **Data model:** separate company events (SEC), issuer actions (B20 announcement brackets and multiplier changes) and reconciliations.
- **Verifier:** independent code path (raw JSON-RPC, separate SEC parser), bound to the payload sha256.
- **Storage and API:** PGlite for local/tests with the same SQL on Supabase later; localhost read-only API in Phase 1.

## Proposed changes (CD-003, 2026-11-27): NOT approved
- New deterministic workers in the scheduled run: `nav-index` (feed discovery + phase-aware rounds), `risk` (pure functions over daily closes), `policy-snapshot` (onchain reads). No LLM in these paths.
- The agent layer (Aeon/Orric patterns) stays for research, explanation and evaluation only.
- Optional separate hourly NAV-only job if fresher data is required (cost decision).

- CD-003 follow-up: market context reads the latest NAV live from the public Base RPC at request time (no new secret); history comes from the indexed `nav_rounds`. A shared deterministic NYSE calendar module fails closed beyond its coverage. (Proposed.)
