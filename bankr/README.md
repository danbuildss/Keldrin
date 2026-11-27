# Keldrin on Bankr x402 Cloud (Phase 11)

Deployed by the founder, from Bankr (chat or CLI). The code must be deployed exactly as written: after deploying, one paid call per service is compared with the free routes to prove the deployed code is unchanged (Bankr's agent once shortened a Breakra file).

- `bankr.x402.json`: service config (price, description).
- `x402/keldrin-snapshot/index.ts` ($0.05): all stocks with a verified NAV feed in one call → `GET /v1/paid/snapshot`.
- `x402/keldrin-report/index.ts` ($0.05): everything about one token (`token` = symbol or address) → `GET /v1/paid/report`.
- Both forward with `Authorization: Bearer $KELDRIN_API_KEY` (a Bankr x402 env var). The same value is `KELDRIN_PAID_KEY` in Vercel. Bankr settles only on a 2xx; Keldrin errors pass through and are free.

Facts checked in @bankr/cli 0.3.49 (npm, read 2026-11-27): `bankr x402 env set KEY=VALUE` stores an encrypted env var that handlers read via `process.env`; deploy uploads each service's `x402/<name>/index.ts` source; `BANKR_API_KEY` and `BANKR_NOT_INTERACTIVE=1` allow non-interactive use.
