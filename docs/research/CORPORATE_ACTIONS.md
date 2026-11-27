# Corporate-action intelligence

Research only (2026-11-27, CD-003). Not approved scope. Main report: docs/research/FEASIBILITY_CD003.md.

## Sources compared
| Source | Gives | Limits |
|---|---|---|
| B20 onchain (Announcement, MultiplierUpdated, UIMultiplierUpdated; `multiplier()`, `effectiveAt()`) | Exact WAD multipliers, timing, announcement URIs | No dates in the company's terms (record, pay); no per-share amount |
| Coinbase `/corporate-actions/{uuid}` | Description, status (ANNOUNCED/APPLIED), applied_at, multiplier before/after (as doubles) | **By UUID only**: no list per token, no history query; values are doubles |
| Chainlink NAV feed | Total-return value that includes the multiplier | Not an event source |
| SEC 8-K/6-K/10-Q (XBRL) | Declared amount, record and payable dates, filing evidence | Ex-date not in filings; foreign filers are weaker |
| Company IR pages | Sometimes ex-dates | Not machine-standard; per-company terms |

## What Keldrin already does (live)
Verified actions for all 435 tokens, SEC-linked declarations, a forward calendar, a late flag, quoted evidence, independent verification (`/v1/events`, `/v1/actions`, `/v1/calendar`).

## What to add (proposed)
- A per-asset route `/v1/assets/{chain}/{contract}/corporate-actions` (announcement, effective, record, payment dates; derived ex-date labelled with its rule; provenance; verification status).
- **Double-adjustment guard:** documentation and fields that say NAV is total-return (already adjusted) while the token balance isn't. A `per_share_value` is offered so integrators don't apply the multiplier twice.
