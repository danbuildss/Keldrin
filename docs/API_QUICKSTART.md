# Keldrin API quickstart

Keldrin serves **verified corporate actions** (dividends, splits) for Coinbase tokenized stocks (B20) on Base, plus a **forward calendar** of announced and declared actions. It needs no key or signup. It is read-only and informational: not an oracle, and not investment advice.

The base URL is set at deployment (see `docs/DEPLOY_VERCEL.md`). The examples use `$KELDRIN`.

## First call

```bash
curl -s "$KELDRIN/v1/events?status=predicted"
```

Each event:

| Field | Meaning |
|---|---|
| `ticker`, `contract_address` | B20 token (store the address, not the ticker) |
| `event_type` | `dividend`, `split`, `reverse_split` or `other` |
| `status` | `predicted` (not applied yet), `confirmed_onchain` (applied, no dated declaration matched), `verified_matched` (applied on the declared payable date), `late` (more than 1 day after it), `unknown` |
| `confidence` | `high` (SEC declaration and onchain agree), `medium` (one source), `unknown`; never guessed |
| `expected_adjustment_date` | the declared payable date (an observed issuer pattern, not a guarantee); `null` when none is evidenced |
| `multiplier_delta` | after/before multiplier as an exact decimal string (applied events) |
| `sec_filing_url`, `quoted_text` | the SEC document and the exact clause the dates came from |
| `onchain_tx` | the Base transaction that announced or applied the action |
| `warnings` | anything that does not add up beyond timing (for example `multiplier_change_unusually_large_for_cash_dividend`); any warning lowers `confidence` |

## Stay in sync cheaply

Poll changes since your last call, using `meta.as_of` from the previous response:

```bash
curl -s "$KELDRIN/v1/changes?since=2026-11-27T00:00:00Z"
```

## TypeScript: handle an upcoming adjustment

```ts
const KELDRIN = process.env.KELDRIN_URL!;
const res = await fetch(`${KELDRIN}/v1/events?contract=${token}&status=predicted`);
if (!res.ok) throw new Error(`Keldrin ${res.status}: ${(await res.json()).error?.message}`);
const { data, meta } = await res.json();
for (const e of data) {
  if (e.confidence !== "high" || !e.expected_adjustment_date) continue; // do not act on single-source data
  // e.g. pause new borrows / re-mark collateral around the adjustment date
  schedule(e.expected_adjustment_date, () => recheckMultiplier(token));
}
// Missing or stale data is not "no event": check /health before treating an empty list as safe.
```

## Other endpoints

| Endpoint | Returns |
|---|---|
| `/v1/calendar?state=upcoming\|announced\|applied` | the raw calendar entries with both evidence sides and their review |
| `/v1/actions?contract=…` | full issuer_action records (exact WAD values, announcement logs, checks, review) |
| `/v1/actions/{record_id}` | one record, its independent review, revisions and `company_context` (SEC reconciliation) |
| `/v1/assets` | the 435 tracked tokens with identity checks |
| `/health` | coverage and data age |
| `/openapi.json` | the OpenAPI 3.1 contract |
| `/llms.txt` | the agent index |

**Errors** have the form `{"error":{"code","message","hint"}}`: 400 bad input, 404 unknown, 409 ambiguous symbol, 429 rate limited (see `retry-after`), 500 degraded.
