# Decisions — explicit approvals only
| Date | Decision | Scope |
|---|---|---|
| 2026-11-26 | Build stock intelligence for Stocks Maxxing | Keldrin, not the SME currency product |
| 2026-11-26 | Reuse Aeon and Orric approach | New isolated repo; no modifications to existing projects |
| 2026-11-26 | Keldrin name selected | Brand clearance remains pending |
| 2026-11-27 (recorded) | Application submitted | Initial application submitted by founder; acceptance not confirmed |
| 2026-11-27 | Start development with Claude | Backend first; prepare complete workspace and workflows |
| 2026-11-27 | Approve re-sequenced build order and start Phase 1 | Founder: "I approve the new order, start Phase 1". Phase 1 = keyless corporate-action feed for Coinbase tokenized stocks on Base (chain-derived, independently re-verified), with GOOGLc ↔ Alphabet SEC as the deep proof (docs/GSTACK_REVIEW.md §3, PHASE0_PLAN.md §5). Local only; no deployment, publishing, outreach or spend. D2 (SEC contact UA), D6, D8, D9 still pending. Stack per PHASE0_PLAN §6 used as proposed (reversible). |
| 2026-11-27 | Approve Phase 2 | Founder: "approve Phase 2". Scope as presented: SEC company-events calendar (declared/record/pay dates, pending/late detection), gold set of 10+ real events, log-capable RPC coverage, Supabase with RLS + read-only API role, reconciliations + OpenAPI in API, pinned Actions + manual research workflow, earnings dates if time allows. Not in scope: deployment, x402, MCP, frontend, schedules, posting/outreach. Pending inputs: D2 SEC contact, D9 RPC key, Supabase project. |
| 2026-11-27 | Approve Phase 3 | Founder: "approve Phase 3". Scope: read-only public API deployable on Vercel using the Supabase read-only role; /v1/events (consumer field shape incl. status late/confidence), /v1/changes?since=; rate limits, CORS, caching; OpenAPI + developer docs; tests; preview deploy, production only on founder approval. Not in scope: x402, MCP, dashboard, posting/outreach. |
| 2026-11-27 | keldrin.vercel.app is the production API | Founder: "my production API, yes". Public, read-only. |
| 2026-11-27 | Data rights handled for publicly served fields | Founder stated data rights are handled ("data rights. Field API as well"). Wording was brief; the founder holds the details. Recorded as the founder's decision, not independently reviewed. |
| 2026-11-27 | Vercel Pro plan; x402 payments later | Founder is on Vercel Pro; x402 to be added in a later phase (needs separate approval). |
| 2026-11-27 | Direction: Keldrin is the trusted, verifiable record for tokenized stocks (what happened, what's coming, what it's worth and how fresh, transfer rules, risk), served to apps and agents with proof | Founder: "approve the direction and Phase 5". Not a trading agent, adviser, execution oracle or token-gated product. Roadmap stages 1–5 as presented 2026-11-27 (docs/PLAN_DEVELOPER_RELEASE.md). Each later phase needs its own approval. |
| 2026-11-27 | Phase 5 approved: NAV history (`/v1/assets/{contract}/nav/history`), NVDAc first, then all feed-backed tokens | Acceptance criteria in docs/PLAN_DEVELOPER_RELEASE.md §2. Open founder decisions: Chainlink data-rights label, edge rate limit, DEX price timing. |

Pending: exact stack, source entitlements, watchlist, runtime cadence, budget, deployment, external publishing, outreach, payments, pricing and domain. Do not treat proposed files as approvals. Founder approves phase scope; record date, scope and reason here.
