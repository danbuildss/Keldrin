# Phase 0 findings and Phase 1 plan — FOR FOUNDER APPROVAL

Date: 2026-11-27. Author: Claude (research session). Status: **PROPOSED, nothing below is approved** until it appears in DECISIONS.md.
Evidence: `research/phase0/` (source ledger, onchain outputs, scripts). Reuse detail: `docs/REUSE_MATRIX.md`.

## 1. Understanding of Keldrin

Keldrin is a research engine and a delivery API, kept separate. The engine reads official sources (SEC filings, the Base chain, the issuer registry), builds typed event records with evidence pointers, has them independently re-verified, and stores immutable revisions. The API serves only approved revisions, and paid requests never trigger fresh research. Customers are builders (lending agents, perps, options, index vaults, portfolio tools, research agents) who would otherwise each run the same scans and reconciliations. Keldrin is not a trading agent, oracle, adviser or chatbot.

## 2. What Phase 0 established (verified in this session)

1. **All five proposed targets exist** as Coinbase Tokenized Stocks on Base in the live registry (435 tokens, 5 pages). Each has a `0xb200…` B20 address and a US ISIN. NVDAc was additionally checked onchain: B20 factory `isB20 = true`, onchain `extraMetadata("isin")` matches the registry, and supply matches.
   - NVDAc `0xb20000000000000000000078ee7ce2fE4908108C`, US67066G1040
   - AAPLc `0xb200000000000000000000C2e324d24d7eEcd1fb`, US0378331005
   - TSLAc `0xb2000000000000000000001e800a7f5189430cD0`, US88160R1014
   - GOOGLc `0xb2000000000000000000002D0BA3164cc74f58B7`, US02079K3059
   - METAc `0xb2000000000000000000008bC8786B856E61707C`, US30303M1027
2. **Corporate actions are machine-visible onchain.** B20 Asset emits `Announcement(caller, id, description, uri)`, with state changes bracketed until `EndAnnouncement`. The `uri` resolves to `GET /v1/tokenized-stocks/corporate-actions/{uuid}`. There is **no list endpoint for corporate actions**: discovering them requires scanning chain logs.
3. **A real, applied corporate action was independently reproduced from the chain:** GOOGLc "Cash Dividend" `e82812a6-…`. Notice at block 51305497 (2026-09-14T15:39:01Z); multiplier 1.0 → `1000377118676784179` WAD at block 51310619 (18:29:45Z). Confirmed by receipt decode and by `multiplier()` read at blocks N-1 and N.
4. **SEC structured data works keylessly:** XBRL company facts show Alphabet declared **$0.22/share** for Q3 2026 (10-Q accession 0001652044-26-000084). The submissions API lists four Alphabet tickers (GOOGL, GOOG, GOOGM, GOOGN), so share-class resolution is a real problem.
5. **BStocks** (closest public competitor) offers prices, Chainlink reference, liquidity, wallet positions, trade-call building, headlines and two x402 endpoints at $0.10. Its OpenAPI has **no corporate-action, dividend, split, filing or announcement fields**.

### Assumptions this research overturns or corrects

| Kit assumption | What the evidence says |
|---|---|
| The Coinbase registry provides chain ID and corporate actions | Records have no `chain_id` (chain-level only via `/chains`). Corporate actions are fetchable only by the UUID found in onchain Announcement events. |
| Registry numbers are usable as-is | `multiplier`, `total_supply` and `nav_price` are JSON doubles. Exact values (WAD) must come from the chain. |
| Announcement `id` identifies the action | The GOOGLc action has two announcements: id `2097` (notice) and the UUID (applied). Group by the URI's UUID, never by the `id` argument. |
| Issuers use the documented "canonical" scheduled path | The GOOGLc dividend used the deprecated instant `updateMultiplier`, and emitted only legacy `MultiplierUpdated`, not `UIMultiplierUpdated`. Indexers must watch both topics. |
| Chainlink NAV is a price | It is a total-return reference that stops outside market hours. 13 of 435 tokens currently show a NAV. |
| Earnings releases are a good first event type | Earnings calendars are widely available for free and don't touch token mechanics. Dividends and splits change the token's share ratio and are where builders get hurt. Recommend corporate actions first, earnings second. |
| Public RPC is enough | `eth_call` and historical state worked, but log scans hit `-32011 request limit reached`. Production needs a provider RPC or an incremental indexer. |
| SEC works with any UA | `data.sec.gov` accepted our generic UA; `www.sec.gov` (filing documents) returned **403** until a declared contact UA is set. |

Unexplained anomalies, recorded as leads rather than claims: SNDKc multiplier = 8; PMc = 1.5588 within ~2 months of first mint; GOOGLc's implied net reinvestment ≈ 59.5% of the declared dividend.

## 3. Differentiation: why Keldrin is more than aggregation

Raw pieces exist: SEC (official, but not linked to tokens), the Coinbase registry (token-side, doubles, no history list), the chain (exact, but scanning is costly and rate-limited), and BStocks (market data, no events). Keldrin's proposed value is the **join and its proof**:

1. **Reconciliation.** Each issuer-side token action (announcement + multiplier change) is linked to the underlying company's official disclosure, with deterministic checks:
   - announced vs applied
   - undisclosed multiplier changes (outside an announcement bracket)
   - announcement with no effect
   - multiplier vs declared dividend consistency
   - mismatched identity
2. **Leading calendar.** SEC dividend and split declarations precede issuer action by weeks (record and pay dates). Lending and options builders get "expected token adjustment pending" before the token moves. Nobody we found offers this.
3. **Exact, point-in-time values.** WAD integers, block number and hash, and feed `updatedAt`, so a consumer can reproduce any number with one `eth_call`.
4. **Identity resolution.** Ticker → share class → ISIN/CUSIP → CIK → contract, failing closed on ambiguity (e.g. GOOGL vs GOOG vs GOOGM/GOOGN).
5. **Audit trail.** Append-only revisions, corrections and review verdicts bound to payload hashes.

Unproven until builders confirm it: whether they want this enough to integrate or pay. PLAN.md's builder interviews remain the validating step; differentiation is a hypothesis until then.

## 4. Data sources — status

| Source | Verified access | Use | Gaps / rights |
|---|---|---|---|
| Base RPC (mainnet.base.org) | yes: eth_call, receipts, archive reads | source of record for token state and actions | rate-limited log scans; production provider needed (cost decision) |
| B20 factory precompile `0xB20f…0000` | yes, `isB20` | asset authenticity | — |
| Coinbase Tokenized Stocks API | yes: list, chains, nav-feeds, metadata, prospectuses, corporate-actions/{uuid} | identity candidates, action metadata | no terms of use found → rights **unknown**; serve our derived facts + pointers, not their payloads |
| SEC data.sec.gov (submissions, companyfacts) | yes | filings index, typed dividend facts | fair-access UA policy; must declare contact for production |
| SEC www.sec.gov Archives (filing text) | **403** | record/pay dates, declaration text | needs founder-approved contact UA |
| Chainlink NAV feeds (onchain) | yes, historical | reference context only | feed terms not reviewed; stale outside market hours |
| ADGM prospectus PDFs | not fetched | underlying class/ISIN identity evidence | host not allowlisted (decision) |
| BStocks API | yes | competitor benchmark; not a source of record | no redistribution terms seen |
| Company IR | not fetched | earnings releases (Phase 2+) | per-site terms |
| Grok / news | not tested | discovery only, optional | key + cost |

## 5. Smallest credible Phase 1 backend proof (proposed)

**Event:** GOOGLc Cash Dividend `e82812a6-0b24-41c4-8ed1-322d1b466d33` ↔ Alphabet Q3 2026 quarterly dividend ($0.22 declared).
It is already applied, so the record status will be `effective`, not a forecast.

Sequence, all deterministic code:
1. **Asset identity:**
   - registry record → onchain `isB20`, `symbol`, `decimals`, `extraMetadata("isin")` → ISIN US02079K3059 → CUSIP 02079K305, with the check digit verified. That CUSIP is believed to be Class A, but this is not yet verified from a source.
   - Class A ↔ GOOGL from the SEC filing cover page. Needs the SEC UA, or the prospectus (needs adgm.com).
2. **Issuer action:** fetch corporate action by UUID; decode both tx receipts from RPC; confirm the bracket structure, the multiplier at N-1 and N, and `hasRole(OPERATOR_ROLE, caller)` at the block.
3. **Company event:** SEC XBRL fact (value, period, accession) plus the declaring filing text for declaration, record and payment dates.
4. **Reconcile:** applied_at within [record date, payment date + tolerance]; multiplier delta > 0; implied net amount stored as a labelled interpretation, never as fact.
5. **Record:** canonical JSON (schema v0.2: separate `company_event`, `issuer_action`, `reconciliation`), sha256 over a canonicalised payload.
6. **Independent review:** a separate verifier process with a different code path (raw JSON-RPC via `fetch`, not viem; its own SEC parsing). It re-fetches every locator and emits per-claim CONFIRMED / UNSURE / REJECTED bound to the payload hash. Plus a fresh-context Claude reviewer that sees only the record and source URLs. Founder approval follows.
7. **Store:** Postgres schema subset (migrations run on PGlite in-process for tests and local, same SQL later on Supabase).
8. **Serve:** read-only `GET /v1/events/{id}`, `GET /v1/events?chain_id=8453&contract=…`, `GET /health` on localhost; a sample consumer script validates schema, evidence and freshness.

Phase 1 acceptance:
- clean-checkout reproduction (`npm ci && npm test && npm run proof`)
- every material claim linked to a locator
- reviewer CONFIRMED on the exact hash
- negative tests: wrong chain, ticker GOOG ≠ GOOGL, a tampered payload fails review, a missing SEC source gives `unsure`
- BACKEND_PROOF rows 1–4 filled with real outputs

Not deployed, not public.

## 6. Architecture and stack (proposed)

```
           ┌────────── research worker (GitHub Actions, manual dispatch first) ──────────┐
SEC ──┐    │ adapters → normalizer/identity registry → candidate record → verifier (separate │
Base ─┼──► │ job, separate token, re-fetch) → founder/policy release → immutable revision  │
CB API┘    └────────────────────────────────────────────────────────────────────────────────┘
                                            │ Postgres (PGlite local → Supabase)
                                            ▼
                        read-only API (approved views only) → REST / later x402 / MCP wrapper
```

- **Language:** TypeScript on Node 22+. This matches Orric (native type stripping, `node --test`) and avoids a build step.
- **Libraries:**
  - `viem`, pinned, for the researcher's chain reads
  - `zod` or Ajv against the JSON Schema
  - `@electric-sql/pglite` for tests
  - a minimal HTTP framework (Hono or `node:http`) for the API
- **Orchestration:** native GitHub Actions workflows (Orric's proven pattern), pinned action SHAs, `workflow_dispatch` only, GitHub environments per role (research / review / release). **Not an Aeon fork** (reasons in REUSE_MATRIX). An Aeon-compatible `keldrin-aeon` skill pack can be published later for distribution, as Orric did.
- **LLM role:** narrative explanation and the adversarial second review only. Never the source of a value.

## 7. Database (proposed changes to DATABASE.md)

Keep the 12 tables and add three. The distinction between "company event" and "token action" is the core model:
- `issuer_actions` (asset_id, action_uuid, status, announced_at, applied_at, multiplier_before_wad, multiplier_after_wad, path: scheduled|instant|none, source ids)
- `chain_logs` (chain_id, block_number, block_hash, tx_hash, log_index, address, topic0, decoded JSON; unique on chain_id + tx_hash + log_index; reorg-checked)
- `reconciliations` (event_id, revision, issuer_action_id, checks JSON, verdict)

`events` become company-level events (e.g. "Alphabet Q3 2026 dividend"); `event_assets` links them to issuer actions per token. All WAD values are `numeric(78,0)`. See DATABASE.md.

## 8. Skills and workflows

Phase 1–4 active set, as deterministic CLI commands wrapped by SKILL.md files: `guard`, `asset-mapping`, `corporate-action` (B20/issuer side), `corporate-events` (SEC side), `onchain-context`, `verify`, `release-gate`, `source-health`, `corrections`.
Deferred until there is real usage (files kept, marked deferred): `daily-brief`, `distribution`, `opportunity-finder`, `integration-research`, `shiplog`, `learn`, `self-improve`, `skill-health`, `operator-scorecard`.
Workflows: `research.yml` (collect → candidate artifact) → `review.yml` (separate job, no researcher reasoning, re-fetch) → `release.yml` (manual, protected environment). Orric's `guard.ts` path-allowlist is applied after every agent step.

## 9. Security and verification requirements

The kit's SECURITY.md stands, plus the following Phase 0 additions:
- host allowlist (the environment created today allows only the source hosts)
- exact-integer handling (no doubles in the value path)
- reorg check via stored block hash
- group announcements by URI UUID and flag direct (unbracketed) multiplier calls
- treat announcement `description` and `uri` as operator-supplied untrusted text
- the reviewer must use an independent code path
- no wallet keys anywhere in Phase 1–4

## 10. Tasks and dependencies (Phase 1, ordered)

| ID | Task | Depends on |
|---|---|---|
| P1-01 | Repo scaffold: package.json (Node 22, pinned deps, lockfile), `node --test`, CI running `check_kit.py` + tests | approval |
| P1-02 | Schema v0.2 (company_event / issuer_action / reconciliation) + synthetic fixtures + validators | P1-01 |
| P1-03 | Adapters: base-rpc (calls, receipts, historical reads), coinbase-registry, sec (data.sec.gov; www.sec.gov once the UA is approved); response caps, host allowlist, retries | P1-01, D2 |
| P1-04 | Identity resolver: ISIN↔CUSIP check digit, share class, factory check, ambiguity → 409 | P1-03 |
| P1-05 | GOOGLc proof pipeline → candidate record + hash | P1-02..04 |
| P1-06 | Independent verifier (separate code path) + Claude fresh-context review procedure | P1-05 |
| P1-07 | Migrations (subset) on PGlite; insert / revision / idempotency tests | P1-02 |
| P1-08 | Read-only localhost API + sample consumer | P1-07 |
| P1-09 | BACKEND_PROOF evidence, STATUS/TASKS/journal | all |

Estimated effort: 2–3 working sessions. Phase 2 (five assets, log indexer, gold set) follows only after approval.

## 11. Testing and acceptance

Unit (`node --test`) cases:
- identity: wrong chain, GOOG/GOOGL, bad checksum, non-B20 address
- numeric: WAD exactness, double rejection
- logs: bracket pairing, duplicate announcements, unbracketed multiplier change
- freshness: stale feed
- tampering: hash mismatch blocks release

Integration: a recorded-fixture mode (real responses captured with hashes, clearly not synthetic) plus a live mode. Gold set target unchanged (10+ real events) in Phase 2. Pass/fail counts are reported with denominators; no accuracy percentage from tiny samples.

## 12. Estimated operating costs (unverified estimates; confirm pricing before committing)

| Item | Phase 1–2 | Production (Phase 4–5) |
|---|---|---|
| SEC, Coinbase API, public RPC reads, Chainlink reads | $0 | $0 |
| RPC provider for log indexing | $0 (public, slow) | free tier to ~$50/mo depending on provider |
| Postgres | $0 (PGlite / local) | Supabase Pro, likely ~$25/mo |
| API hosting | $0 (localhost) | Vercel Pro, likely ~$20/mo (Hobby is non-commercial) |
| GitHub Actions (private repo) | within free minutes | hourly 5-min runs ≈ 3,600 min/mo exceeds the 2,000 free; keep deterministic polls ~1 min, or accept overage (~$0.008/min) |
| LLM (explanations, second review) | measure in Phase 1 | bounded by `DAILY_BUDGET_USD`; Orric uses a Claude Code OAuth token in Actions |
| Domain | — | ~$10–20/yr |

Rough total: ~$0 through Phase 3; on the order of $50–100/mo in production. To be replaced with measured numbers.

## 13. Risks, limitations, unresolved decisions

**Risks:**
- Coinbase API rights unknown: we may be unable to redistribute registry-derived fields commercially. Mitigation: chain + SEC as source of record; registry used as an index only.
- Single issuer today (all 435 tokens are Coinbase B20), so a dependency on its conventions.
- Public RPC limits.
- 9 working days to the internal Dec 5 target, 15 to the Dec 12 deadline.
- The demand hypothesis is untested.
- Brand clearance is pending.

**Decisions needed from you:**

| # | Decision | Recommendation |
|---|---|---|
| D1 | Approve Phase 1 scope as §5 (GOOGLc dividend proof, local only) | approve |
| D2 | SEC User-Agent contact (name + email) for www.sec.gov filing text | provide a dedicated Keldrin contact address; I will not use your personal email unless you say so |
| D3 | Stack: TypeScript/Node 22, viem, PGlite → Supabase, Hono | approve |
| D4 | Orchestrator: native GitHub Actions (Orric pattern), Aeon pack later; no Aeon fork | approve |
| D5 | First event class: corporate actions (dividends/splits) before earnings | approve |
| D6 | Allow adgm.com in the Keldrin environment (prospectus identity evidence) | approve if D2 is slow |
| D7 | Defer 9 non-core skills | approve |
| D8 | Budget cap for Phase 1 (LLM + any paid service) | suggest $0 paid services, LLM via your existing Claude plan |
| D9 | RPC provider choice for Phase 2 indexing | decide at Phase 2 |
