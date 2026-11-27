# Deploying the Keldrin read-only API on Vercel (Phase 3)

The API is one Vercel function, `api/[...path].mjs`: a committed esbuild bundle of `src/api/vercel.ts`. It reads Supabase through the **read-only** role `keldrin_reader` and can never write. Production deployment needs founder approval; start with a preview.

## 1. Give the read-only role a login (founder, Supabase SQL editor)
Supabase → your project → **SQL Editor**. Run this, replacing the password with a long random one that **you** generate. Never paste it into chat.

```sql
ALTER ROLE keldrin_reader WITH LOGIN PASSWORD 'REPLACE_WITH_A_LONG_RANDOM_PASSWORD';
```

The role can only SELECT from the `keldrin` schema. Every session is read-only and has an 8-second statement timeout, enforced on the role itself.

## 2. Build the connection string
Supabase → **Connect** → **Transaction pooler**. Copy the host and port shown (for example `aws-0-eu-central-1.pooler.supabase.com:6543`). The user name is `keldrin_reader.<project-ref>`:

```
postgresql://keldrin_reader.ozrihkoekkadskgyrrtm:YOUR_PASSWORD@<pooler-host>:6543/postgres
```

## 3. Create the Vercel project
1. Vercel → **Add New → Project** → import `danbuildss/Keldrin`.
2. **Framework Preset:** Other. Leave the build and output settings as they are (`vercel.json` sets them).
3. **Environment Variables** (Production and Preview):
   - `DATABASE_URL`: the string from step 2.
   - Optional: `RATE_LIMIT_PER_MIN` (default 120).
   - Optional: `DATABASE_CA_CERT` (PEM). Only needed if TLS verification fails: download the certificate from Supabase → Settings → Database → SSL.
4. Deploy. Vercel gives a **preview URL**. Send it to Claude.

## 4. Verification before production (Claude)
Claude allowlists the preview host and runs the outside consumer against it. Checks:
- `/health`, `/v1/events`, `/v1/changes?since=…` and `/v1/calendar` return 200
- bad input returns 400
- `/openapi.json` and `/llms.txt` are served
- cache headers are present
- no write path exists (any non-GET returns 405)

## 5. Production
Only after the founder approves: promote the deployment, and optionally add a custom domain once brand clearance is done.

## Plan and limits
Vercel **Hobby is for non-commercial use**. A paid API, or x402 in Phase 5, needs **Pro** (about $20/month; check current pricing). The per-instance rate limit is basic; for real abuse protection add Vercel Firewall rules (Pro). Data freshness depends on research runs: the API serves what the last confirmed run wrote, and `/health` shows its age.

## Rollback
In Vercel → Deployments, promote the previous deployment. To revoke database access entirely:

```sql
ALTER ROLE keldrin_reader NOLOGIN;
```
