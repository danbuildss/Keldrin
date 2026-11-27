# Agent responsibilities
All agents inherit CLAUDE.md, RESEARCH_POLICY.md and SECURITY.md. No agent has trade or unrestricted repository permissions.
- Founder: owns product, scope, budget, secrets, deployment and publication approvals.
- Claude Code / orchestrator: planning, implementation, deterministic adapters, state, synthesis and tests. May draft reports; cannot waive gates.
- Discovery researcher (Grok optional): surfaces candidates from news, X, company calendars; never authoritative solely on its own. Optional provider, not required to ship.
- Evidence researcher: retrieves approved primary evidence, maps issuer/contract, produces typed claim ledger.
- Independent reviewer: separate context and evidence access; challenges each claim; cannot review own work; outputs verdict and review IDs.
- Release worker: validates signed-off policy, schema, source rights and review state; no auto-post. May publish approved machine records only after deployment policy approved.
- Operator: tracks health, cost, retries and queue backlog; kill switch and alerts. Proposes improvements, no self-approved permission or code changes.
Use deterministic checks for schema, units, hashes, identity and dedup. Agent output remains untrusted until validated.
