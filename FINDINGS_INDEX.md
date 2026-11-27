# Findings index
No records yet. Log all investigations, including rejected and unavailable cases.
| Event ID | Asset | Source | Review state | Revision | Location | Limitation |
|---|---|---|---|---|---|---|
| (superseded by Phase 1 record) googlc-div-e82812a6 | GOOGLc 0xb200…58B7 | Coinbase corporate action e82812a6 + Base txs 0xb5aa…/0xcd45… + SEC XBRL accn 0001652044-26-000084 | not reviewed (Phase 0 probe) | — | research/phase0/evidence/onchain-observations-2026-11-27.md | record/pay dates not yet fetched (SEC 403); share class unevidenced |
| (lead) sndkc-multiplier-8 | SNDKc | Coinbase registry multiplier = 8 | not investigated | — | research/phase0/evidence/coinbase-registry-targets-2026-11-27.json | needs onchain log scan |
| (lead) pmc-multiplier-1.5588 | PMc | Coinbase registry multiplier = 1.558821201905387 | not investigated | — | same | needs onchain log scan |
| 13 issuer_action records (2026-11-27) | 13 Coinbase B20 tokens | Base RPC + Coinbase corporate actions | CONFIRMED ×3 runs (independent verifier) | 1 | records/ | local only; not released |
| googlc-sec-reconciliation | GOOGLc | SEC XBRL + Chainlink NAV | CONFIRMED (claims), status partially_reconciled | 1 | records/googlc-sec-reconciliation.json | share class + dates unknown (D2) |
| (lead) pmc-cash-dividend-55.9pct | PMc 0xb200…(see record) | onchain multiplier ×1.558821201905386994 labelled "Cash Dividend" (issuer text) | chain facts CONFIRMED; label/magnitude NOT explained | — | records/ (PMc file) | no NAV feed; Q4 2026 SEC fact not yet filed; do not claim error without issuer or SEC evidence |
| sndkc-split-8for1 | SNDKc | scheduled path, effectiveAt 1795150800 | CONFIRMED | 1 | fixtures/recorded/sndkc-split.json | — |
| sec-declarations-9 (2026-11-27) | GOOGLc NVDAc ORCLc PMc MUc MRVLc AAPLc CAKEc | SEC 8-K text (quote + sha256) | reconciliation reviews CONFIRMED | 1 | records/reconciliations/ | 8 of 9 tokens adjusted on the declared payable date |
| (finding) mrvlc-late-adjustment | MRVLc | Marvell 8-K 2026-09-25: $0.06, record 2026-10-09, payable 2026-10-29; token adjusted 2026-11-06 | CONFIRMED (chain + SEC text) | — | records/reconciliations/MRVLc-*.json | late by 8 days vs payable date; cause unknown (issuer process) |
| (lead) pmc-cash-dividend-55.9pct, updated | PMc | PM 8-K 2026-09-18: $1.60, record 2026-10-02, payable 2026-10-26; token ×1.558821201905386994 on 2026-10-26 | CONFIRMED (chain + SEC text) | — | records/reconciliations/PMc-*.json | for $1.60 alone to explain ×1.5588 the share price would have to be ≤ ~$2.86; no reference feed; not an accusation |
| calendar-upcoming (2026-11-27) | GOOGLc, NVDAc | SEC 8-K text | CONFIRMED | — | records/calendar-latest.json | GOOGLc expected 2026-12-14; NVDAc expected 2026-12-23 (observed pattern, not a guarantee) |
