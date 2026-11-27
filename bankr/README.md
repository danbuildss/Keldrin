# Keldrin on Bankr x402 Cloud (Phase 11)

Deployed only by the founder with the Bankr CLI, from this folder. Never paste the handler into Bankr's agent.

- `bankr.x402.json`: service config (price, description).
- `x402/keldrin-probe/index.ts`: temporary $0.001 probe. Answers: can a Bankr handler call Keldrin's API, and can it read an env var (`KELDRIN_PROBE`)? Pause it after the test: `bankr x402 pause keldrin-probe`.

Facts checked in @bankr/cli 0.3.49 (npm, read 2026-11-27): `bankr x402 env set KEY=VALUE` stores an encrypted env var that handlers read via `process.env`; deploy uploads each service's `x402/<name>/index.ts` source; `BANKR_API_KEY` and `BANKR_NOT_INTERACTIVE=1` allow non-interactive use.
