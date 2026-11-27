# Phase 4: scheduled research (runbook)

Approved by the founder on 2026-11-27 ("approve Phase 4"). Goal: the live API stays fresh without anyone running research by hand.

## How it works
- `.github/workflows/research.yml` runs **every 6 hours** (01:23, 07:23, 13:23 and 19:23 UTC) and on manual dispatch. GitHub cron can be delayed or skipped, so freshness is shown by `/health`, not promised.
- Each run: tests → discover (all 435 tokens) → independent verification → reconcile with the SEC → calendar. Every write goes to Supabase through **`keldrin_writer`**.
- `keldrin_writer` can read the research tables, append rows and upsert the asset snapshot. It **cannot** delete, truncate, update records or reviews, create or drop tables, or read `schema_migrations`. This is checked on the live database by `node src/cli.ts supabase check` and against a real Postgres by `test/pg-writer.test.ts`.
- The API keeps serving only independently CONFIRMED records through the read-only `keldrin_reader`.
- Nothing is committed, published or deployed by a run. Its evidence files are a 14-day private artifact.
- Cost: a full run took about 2 minutes for discovery, plus reconciliation and the calendar. That's roughly 4 runs a day × ~5 minutes ≈ 600 GitHub Actions minutes a month, within the 2,000 free minutes for private repositories (check your plan). Alchemy usage per run is about 430 calls plus log scans.

## Founder setup (once)
1. **Supabase → SQL Editor.** Give the writer a login, using a long password that **you** generate (letters and numbers only avoids URL-encoding problems). Never paste it into chat.
   ```sql
   ALTER ROLE keldrin_writer WITH LOGIN PASSWORD 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
   ```
2. Build the connection string. It's the same pooler host as the reader, with a different user:
   ```
   postgresql://keldrin_writer.ozrihkoekkadskgyrrtm:YOUR_PASSWORD@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
   ```
3. **GitHub → danbuildss/Keldrin → Settings → Environments → `keldrin-research`** (create it if missing). Add these:
   - Secret `KELDRIN_WRITER_URL`: the string from step 2.
   - Secret `BASE_RPC_URL`: your full Alchemy Base URL (`https://base-mainnet.g.alchemy.com/v2/…`). It contains the key, so it must be a secret.
   - Secret `DATABASE_CA_CERT`: the same Supabase root CA PEM you gave Vercel.
   - Variable `SEC_USER_AGENT`: `Keldrin hello.danbuilds@gmail.com`.
4. **Settings → Secrets and variables → Actions → Variables → New repository variable:** `RESEARCH_ENABLED` = `true`.
5. **Actions → Keldrin research (scheduled) → Run workflow** once by hand. Tell Claude when it finishes; Claude checks the run and `/health`.

## Turn it off or revoke
- Pause: set `RESEARCH_ENABLED` to `false` (runs are skipped).
- Revoke database access: `ALTER ROLE keldrin_writer NOLOGIN;`
- Neither affects the live API, which keeps serving the last confirmed data.

## Failure handling
- A failed run fails the workflow, and GitHub emails you. Partial writes are safe: tables are append-only and every step is idempotent, so the next run continues.
- `/health` shows the age of the last run. If it's older than about 12 hours, check Actions.
