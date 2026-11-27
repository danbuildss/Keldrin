# Phase 1 backend: corporate-action feed (local)

What it does, end to end, with no API keys:

1. **Registry.** Lists every Coinbase tokenized stock from the issuer API (an index only: doubles, unknown rights).
2. **Identity.** Cross-checks each token against Base at one block, via Multicall3: factory `isB20`, symbol, decimals, onchain ISIN and multiplier. Any mismatch fails closed.
3. **Discovery.** The public RPC refuses `eth_getLogs`, so the pipeline samples `multiplier()` at 10 blocks per token and bisects to the exact change block.
4. **Evidence.** For each change it decodes that block's receipts, pairs Announcement/EndAnnouncement by id, and finds scheduling blocks for scheduled updates by bisecting `effectiveAt()`. It then resolves the issuer's corporate-action UUID and confirms every issuer-listed tx onchain.
5. **Records.** Builds a canonical `issuer_action` record (schema v0.2) with exact WAD integers, checks, flags, sources and a sha256 over the canonical payload.
6. **Independent review.** `src/verify/verify.ts` shares no code with the pipeline: its own JSON-RPC client, ABI decoding, arithmetic and hash. It re-fetches every source and returns per-claim CONFIRMED / REJECTED / UNSURE, bound to the payload hash.
7. **Storage.** Postgres (PGlite locally, the same SQL later on Supabase). Records and reviews are append-only (enforced by triggers); corrections become new revisions.
8. **API.** Read-only, localhost. Serves only the latest revision whose latest review CONFIRMED that exact hash.

Deep proof: `proof-googl` links the GOOGLc dividend action to Alphabet's SEC XBRL dividend fact and the Chainlink reference, and the verifier re-checks each claim. Status stays `partially_reconciled` until the share class and the record/pay dates are evidenced (needs decision D2).

## Commands

```bash
npm ci
```

```bash
npm test
```

```bash
npm run discover
```

```bash
npm run discover -- --symbols=GOOGLc,NVDAc
```

```bash
npm run proof:googl
```

```bash
npm run serve
```

```bash
curl -s http://127.0.0.1:8787/v1/actions?symbol=GOOGLc
```

```bash
node src/cli.ts verify-file records/<file>.json
```

Behind an HTTPS proxy (like this cloud session), prefix Node commands with `NODE_USE_ENV_PROXY=1`. Set `BASE_RPC_URL` to use another RPC; its host is added to the allowlist automatically.

## Endpoints

| Route | Returns |
|---|---|
| `GET /v1/assets` | tracked tokens with identity state and current multiplier (WAD) |
| `GET /v1/assets/{contract}` | one token, with every identity check |
| `GET /v1/actions?contract=…&limit=…&cursor=…` | confirmed actions, newest first (`symbol=` exact token symbol also accepted; 409 if ambiguous) |
| `GET /v1/actions/{record_id}` | record, review claims, revision history |
| `GET /health` | coverage counts, last run, limitations |
| `GET /llms.txt` | agent-readable index |

## Known limitations (Phase 1)

- **Completeness.** Announcements that change nothing (pure notices) are only included when the issuer's record for an action lists them. Full coverage needs a log-capable RPC (decision D9).
- **Missed reversals.** A multiplier that changes and changes back between two sample points would be missed (10 samples per token reduce this risk).
- **Not exposed yet.** The SEC reconciliation exists only for GOOGLc and is not yet served by the API.
- **Verifier completeness.** The verifier re-scans every block an action touched for all multiplier logs, so an omitted change in those blocks is caught. Changes in other blocks rely on bisection.
- **Mutable issuer record.** The issuer record is re-fetched live by the verifier; if Coinbase edits it, the review becomes UNSURE or REJECTED until a new revision is reviewed.
