# Aeon / Orric reuse matrix (inspected 2026-11-27, read-only clones)

Pinned revisions:
- aeonfun/aeon `d6c66c0dab2ea1ccebe91d9db631843def25b04d` (MIT, Aeon Inc)
- danbuildss/orric-aeon `449479e27d86d4bbb4a73d91ab4ae62d598a83f9` (MIT, danbuildss)
- danbuildss/breakra-research `3a3760fdc53bca430a6b52b0f28982b5468d1f28` (no LICENSE file; founder-owned private code, so reuse is the founder's call)

Nothing was modified in any of them. No secrets, findings, targets or schedules were copied.

## Key structural finding

Orric is **not** an Aeon installation. breakra-research runs:
- native GitHub Actions (`scan.yml`, `discover.yml` etc.)
- `anthropics/claude-code-action@v1` with `CLAUDE_CODE_OAUTH_TOKEN`
- deterministic Node 22 TypeScript scripts (`guard.ts`, `precheck.ts`, `gate.ts`, `verdicts.ts`, `scorecard.ts`)

It then publishes an Aeon-compatible skill pack (`orric-aeon`) for distribution. Aeon itself is a large framework (1,059 files; a 2,551-line runner workflow; 94 skills; LLM-driven skills via a coding-agent harness). Forking it would import a large, fast-moving surface (fleet control, dashboards, many harnesses) that Keldrin doesn't need. It would also invert Keldrin's rule that deterministic code, not the model, produces values.

**Recommendation:** follow Orric's architecture. Port specific Aeon mechanisms with MIT attribution, and publish a `keldrin-aeon` skill pack later.

| Source / file | Behaviour | License | Decision | Notes for Keldrin |
|---|---|---|---|---|
| orric-aeon README "deterministic verdict; Claude explains, never overrides"; "not assessed is never safe" | product principle | MIT | **adopt** | Same as Keldrin's: unknown ≠ no event |
| orric-aeon `skills-pack.json` format | pack manifest (slug, schedule, default_enabled false, secrets, capabilities) | MIT | **adapt later** | For a future `keldrin-aeon` pack |
| breakra-research `scripts/guard.ts` | after an agent step, diff working tree vs HEAD against a per-mode path allowlist; append-only checks; fail → discard | founder | **reimplement** (~60 lines) | Modes: research (candidates/**), review (reviews/**), learn (memory/lessons.md append-only) |
| breakra-research `scripts/precheck.ts` + `gate.ts` | deterministic pre-check PASS/BLOCK → independent review → OPEN only if PASS + CONFIRMED | founder | **adapt** | Becomes `release-gate`: schema + identity + rights + hash-bound CONFIRMED |
| breakra-research `skills/verify/SKILL.md` | adversarial reviewer: "assume it is wrong", hide the recommendation to avoid anchoring, UNSURE blocks | founder | **adapt** | Keldrin checklist: identity/class, timing, units/WAD, bracket integrity, source rights, conflicts |
| breakra-research `scripts/verdicts.ts` + learn loop | owner verdict harvest → jsonl → learn cursor | founder | **adapt (Phase 4)** | Owner verdicts on records feed `memory/lessons.md` |
| breakra-research `scripts/scorecard.ts`, `health.ts`, `notify.ts` | scorecard, health, Telegram notify | founder | **reimplement later** | Phase 4; no external notifications without approval |
| breakra-research workflow pattern (claude-code-action, scoped `permissions`, workflow token not the App) | runner | founder / action MIT | **adapt** | Pin action SHAs; separate environments per role |
| breakra-research governance files (Notes/DECISIONS/STATUS/RESEARCH_POLICY/WORKFLOW) | founder workflow | founder | **already adopted** by the kit | — |
| breakra-research memory/findings data | Orric domain data | founder | **exclude** | Unrelated domain |
| Aeon SKILL.md frontmatter (`name`, `description`, `metadata.requires`, `mode: read-only`, `scorable`) | skill metadata | MIT | **adapt** | Align Keldrin skill frontmatter so a pack is possible later |
| Aeon `scripts/breaker.sh` (3 consecutive failures → trip; half-open probe) | circuit breaker | MIT | **reimplement in TS** with attribution | Per-source breaker in `provider_health` |
| Aeon `scripts/cron-due.sh` (debt / catch-up scheduling) | scheduler | MIT | **exclude for now** | Manual dispatch first; a simple cron later |
| Aeon `scripts/verify-onchain-evidence.mjs` + onchain-monitor receipts (block hash recheck, replay window, sha256 receipt) | evidence receipts | MIT | **adapt** | Model for `chain_logs` reorg handling and evidence files |
| Aeon run guards (code paths restored on main, egress block of link-local/metadata, git config lock) | runner hardening | MIT | **adopt the ideas** | In Keldrin workflows: no write to `scripts/`/`.github/` by agent steps |
| Aeon read-only capability tier | sandboxed skills | MIT | **adopt the idea** | Research/review jobs get `contents: read` |
| Aeon attestation (Sigstore over output bytes) | provenance | MIT | **consider in Phase 5** | Proves bytes came from the workflow; does not prove correctness |
| Aeon dashboard, fleet, harness adapters, 94 skills | framework | MIT | **exclude** | Not needed |
