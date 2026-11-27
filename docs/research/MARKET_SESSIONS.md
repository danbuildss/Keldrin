# Market session intelligence

Research only (2026-11-27, CD-003). Not approved scope. Main report: docs/research/FEASIBILITY_CD003.md.

## Facts
- Regular session 09:30–16:00 New York, Monday–Friday, minus NYSE holidays; early closes at 13:00 (MAXXAGENT encodes 2026-11-27, 2026-12-24 and 2027-11-26).
- Chainlink stock feeds stop updating outside market hours (BaseHub, Base B20 blog: "price-feed behavior outside US market hours" isn't enforced by B20). DEX pools trade 24/7.
- Observed: NVDAc median 11 min between rounds in session; ~25 h gaps over a holiday.

## Proposed `market-context`
- `session`: open / pre / after / closed / weekend / holiday / early_close, computed deterministically. **Holiday source to decide:** a maintained NYSE calendar file with an expiry check that fails closed when the year isn't covered.
- `nav`: last `updated_at`, `age_seconds`, and `staleness` = `expected_closed` | `fresh` | `unexpectedly_stale` (in session and older than a threshold calibrated from observed in-session gaps, e.g. the 99th percentile per feed).
- Never present the last NAV as a live equity price; label it "last published total-return reference".
- NAV/DEX premium: needs a DEX price source (terms pending). Out of scope until then.
