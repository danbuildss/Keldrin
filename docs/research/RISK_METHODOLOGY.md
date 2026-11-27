# Risk methodology (deterministic; no LLM)

Research only (2026-11-27, CD-003). Not approved scope. Main report: docs/research/FEASIBILITY_CD003.md.

## Proposed definitions
- **Input:** daily NY-session closes of the total-return NAV (see HISTORICAL_NAV.md). NAV-based risk only; DEX-based risk is out of scope until a licensed DEX source exists.
- **Returns:** daily log returns r_t = ln(C_t / C_{t-1}) over consecutive trading days (weekend and holiday heartbeats excluded, as MAXXAGENT does).
- **Realized volatility:** sample standard deviation × √252, reported in percent; the window (default 60 trading days) and n are returned.
- **Max drawdown:** min over t of C_t / max_{s≤t} C_s − 1 within the window.
- **Returns:** simple returns over 1d/5d/20d/since-inception when history allows.
- **Minimum history:** `insufficient_data` when fewer than 20 return observations (MAXXAGENT uses 15); thresholds are documented in the response.
- **Quality flags:** missing trading days in the window, a feed phase change inside the window, rounds rejected.
- **Exactness:** compute from integer answers with decimals applied once; report the method version.
- **Limits:** history starts 2026-08-03, so no long-horizon statistics yet; total-return series include reinvested dividends (state this).
