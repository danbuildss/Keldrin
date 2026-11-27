# Keldrin developer quickstart

Legend: ✅ live now · 🔒 built and verified, switched on at launch (Phase 7) · 🛠 planned.

Base URL: `https://keldrin.vercel.app`. No key, no sign-up. JSON only; read-only (non-GET → 405). Responses carry `meta.as_of` and `meta.schema_version`.

## 1. Corporate actions ✅
```bash
curl -s "https://keldrin.vercel.app/v1/events?ticker=GOOGLc"                       # all tokens, applied + upcoming
curl -s "https://keldrin.vercel.app/v1/changes?since=2026-11-27T00:00:00Z"        # what changed (poll this)
curl -s "https://keldrin.vercel.app/v1/assets/0xb2000000000000000000002d0ba3164cc74f58b7/corporate-actions"   # one token, with multiplier/uiMultiplier detail (🔒 deploys with Phase 7)
```
Balances never change for a dividend or split; the multiplier (WAD, 1e18) does. Shares per token = multiplier / 1e18.

## 2. NAV history with proof 🔒
```bash
# daily closes (last official round in each NYSE session)
curl -s "https://keldrin.vercel.app/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/nav/history?interval=daily&from=2026-10-01"
# every official round, time-ordered, paged
curl -s "https://keldrin.vercel.app/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/nav/history?interval=round&from=2026-11-25&limit=500"
# audit view: every stored round with official / proxy_live / decimals_ok flags
curl -s "https://keldrin.vercel.app/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/nav/history?interval=round&include=all&from=2026-08-01"
```
Each point: `feed`, `phase_id`, `aggregator`, `round_id`, `answer_raw`, `decimals`, `nav`, `updated_at`, `retrieved_at`, `retrieved_block`. Re-check any point yourself: `getRoundData(round_id)` on the feed.

## 3. Market context 🔒
```bash
curl -s "https://keldrin.vercel.app/v1/market/session"                                                    # ✅ after deploy, no switch
curl -s "https://keldrin.vercel.app/v1/assets/0xb20000000000000000000078ee7ce2fE4908108C/market-context"
```

## Real example responses
Captured on 2026-11-27 from a local Keldrin instance serving the independently verified store, with live Base reads: `docs/developers/examples/`. They are real outputs, not hand-written. The local store had no calendar snapshot, so upcoming (predicted) events appear in production but not in `corporate-actions-GOOGLc.json`.

## Coverage
- Corporate actions: all Coinbase tokenized stocks on Base (435 registry entries; applied actions independently verified).
- NAV history: the 13 tokens whose Chainlink NAV feed is listed by Coinbase and passed verification (AAPLc, AMZNc, ANTc, CRCLc, GOOGLc, INTCc, METAc, MSFTc, MSTRc, NVDAc, SNDKc, SPCXc, TSLAc), from their first official round (2026-08-07 for most; ANTc from 2026-11-19).

## Errors
`{"error":{"code","message","hint"}}`: 400 bad input · 404 `UNKNOWN_ASSET` / `NO_NAV_FEED` · 405 non-GET · 429 rate limited · 503 `NAV_NOT_ENABLED` / `NAV_NOT_VERIFIED` / `DB_UNAVAILABLE`.

## Feedback
Tell the founder directly (channel set at launch). For a wrong value, send the URL, the time and what you expected.
