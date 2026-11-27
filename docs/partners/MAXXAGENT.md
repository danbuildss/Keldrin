# MAXXAGENT (design partner candidate)

Status: **agreed to test endpoints and give feedback** (CD-003, 2026-11-27). Production integration not committed. Not a customer or commercial partner.

## What they'd replace
Chainlink round-history reads and caching for volatility/drawdown; session logic (market hours, holidays, NAV vs DEX gap). They keep their own onchain reads as a fallback.

## Their requirements → our plan
| Requirement | Plan | Status |
|---|---|---|
| Feed + round id behind every NAV point | `nav/history` fields: feed, phase, aggregator, round_id, answer_raw, decimals | 🛠 Phase 5 |
| Multipliers / corporate actions incl. uiMultiplier, with dates | `…/corporate-actions` over verified records | ✅ data / 🛠 route (Phase 6) |
| Freshness across weekends and holidays | `market-context` staleness classes | 🛠 Phase 6 |
| Free server-side tier, reasonable limits | Keyless; documented limits | ✅ / 🛠 edge limit |

## Timing
They're heads-down until Dec 12: test an endpoint or two now, integrate after. Send: the test URL, QUICKSTART, PROVENANCE and FRESHNESS docs once Phase 5 is deployed. The founder sends; Claude drafts.

## Their public code
github.com/0xAxelowETH/maxxagent @995c4a2, MIT. Read only; any reuse keeps their copyright notice.
