# Operations audit (Phase 13, 2026-11-28)

What actually runs, with evidence. Nothing here is projected or assumed.

## Deterministic backend workers (running)

| Worker | Where | Schedule | Evidence |
|---|---|---|---|
| Research run: discover (identity, multipliers) → reconcile + calendar → NAV index + independent NAV verify → DEX pool index + independent pool verify → write to Supabase | `.github/workflows/research.yml` (GitHub Actions, keldrin_writer role) | cron `23 2,10,18 * * *` UTC since 2026-11-28 (was every 6 h; GitHub may delay; run #7 started 22:04 UTC) | Runs #3–#7 succeeded (2026-11-27): 9, 12, 13, 18 and 18 min. #1 skipped (switch saved as a secret), #2 failed (missing RPC key), both fixed. Run #7 was the first scheduled one. |
| Live reads at request time (NAV latestRoundData, DEX multicall at one block) | Vercel function (keldrin_reader role) | per request | Outside checks on production (BACKEND_PROOF). |
| Independent verifiers (NAV rounds via getRoundData on a second provider; pools re-derived from factories) | inside the research run | every run | 13/13 NAV feeds and 13/13 pool sets CONFIRMED. |
| Status check (site, API freshness, MCP, guide, live chain read, x402 terms) | `.github/workflows/status.yml` (added in PR #23) | every 6 h | Ran from this session 2026-11-27: all live parts pass; the 3 not-yet-deployed parts fail as expected. Not yet run on GitHub. |
| CI (tests incl. a real Postgres, bundle checks) | `.github/workflows/starter-ci.yml` | every PR | Green on PRs #16–#23. |
| CLI publish | `.github/workflows/npm-publish.yml` | manual | keldrin@0.6.0 published 2026-11-27. |

## Autonomous AI skills (defined, NOT running)

`skills/` holds Aeon/Orric-style skill definitions (daily-brief, learn, self-improve, opportunity-finder, guard, verify,
…). None is scheduled or wired into a workflow (no workflow references `skills/`), as AUTOMATION.md decided ("inactive";
one orchestrator, approval first). `memory/` (journal, lessons, knowledge) is updated by Claude in working sessions, not
by an automated agent. There is no autonomous AI process in production today: every served value comes from the
deterministic workers above. Turning any AI skill on would be a separate founder decision (cost, permissions,
no self-modification of safety policy).

## Operating costs (known facts only)

| Item | What we know | Unknown / to check |
|---|---|---|
| GitHub Actions | Founder is on GitHub Free (2,000 private-repo min/month). Research ≈ 18 min × 3/day ≈ 1,620 min/month (moved from 4/day on 2026-11-28); status check ≈ 1 min × 4/day ≈ 120; CI ≈ 1–2 min per PR. Total ≈ 1,800. | Actual billed minutes (GitHub → Settings → Billing). If still over: every 12 h, or a shorter run. |
| Vercel | Founder said "Vercel Pro". | Usage-based extras (function time, bandwidth) on the dashboard. |
| Supabase | Project in use; free-tier usage reported earlier. | Plan and usage on the dashboard. |
| Alchemy (indexer RPC) | Free-tier key. | Compute units used per month. |
| Base public RPC (live reads, verifiers) | Free, rate-limited. | — |
| Bankr x402 | Hosting free to deploy; test calls cost the founder $0.10 (2 × $0.05, onchain via scripts/payers.ts). | Bankr's fee share per payment (not documented to us). |
| npm, MCP Registry | Free. | — |
