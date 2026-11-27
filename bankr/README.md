# Keldrin on Bankr x402 Cloud (Phase 11)

Deployed by the founder, from Bankr (chat or CLI). The code must be deployed exactly as written: after deploying, one paid call per service is compared with the free routes to prove the deployed code is unchanged (Bankr's agent once shortened a Breakra file).

- `bankr.x402.json`: service config (price, description).
- `x402/keldrin-snapshot/index.ts` ($0.05): every stock with a verified NAV feed in one answer (market context + next corporate action each), from the free API.
- `x402/keldrin-report/index.ts` ($0.05): everything about one token (`token` = exact symbol or address): corporate actions, market context, 30 daily NAV closes, DEX pools.
- Self-contained like Breakra: no imports, no secrets, no database. They read https://keldrin.vercel.app. Bankr settles only on a 2xx, so any incomplete answer (a failed live read, a rate limit, an unreachable API) is a 4xx/5xx and never charged. Note: they share the free API's per-IP rate limit (120/min); a snapshot uses about 28 requests.

Facts checked in @bankr/cli 0.3.49 (npm, read 2026-11-27): `bankr x402 env set KEY=VALUE` stores an encrypted env var that handlers read via `process.env`; deploy uploads each service's `x402/<name>/index.ts` source; `BANKR_API_KEY` and `BANKR_NOT_INTERACTIVE=1` allow non-interactive use.
