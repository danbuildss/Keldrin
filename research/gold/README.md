# Gold set: independent annotation protocol

**Purpose:** measure the pipeline's accuracy against answers produced *without* looking at its output. EVALUATION.md asks for at least 10 real events, including edge cases. Pipeline output must never be copied into an annotation; that would make the score circular.

## Who annotates
The founder, or a reviewer who is not the pipeline's author. A fresh LLM context may help draft, but a person signs off on every row (`annotated_by`).

## How
For each event in `events.json`:
1. Open only the listed primary sources: the Base transaction or block in an explorer or via RPC, the SEC filing URL, and the issuer record URL.
2. Fill in every `expected` field from those sources, using exact values as printed: per-share amount, record date, payable date, and multiplier before and after as WAD integer strings from the chain.
3. Use `null` when the source does not say, and explain in `notes`.
4. Set `annotated_by` and `annotated_at`.

## Scoring
`node src/cli.ts gold` compares each annotated event with the pipeline's confirmed records and reconciliations. It prints per-field match counts with denominators. Unannotated events are reported as unannotated, not as passes. A single identity or unit mismatch fails the Phase 2 gate.

## Coverage required by EVALUATION.md
| Case | Events in `events.json` |
|---|---|
| Ordinary cash dividend, adjusted on payable date | GOOGLc, NVDAc, ORCLc, MUc, AAPLc, CAKEc |
| Late adjustment | MRVLc |
| Scheduled-path stock split | SNDKc |
| Mixed preferred and common declaration (class ambiguity) | GOOGLc (both quarters) |
| Unexplained magnitude | PMc |
| Foreign filer (no us-gaap XBRL; 6-K) | SANc, NOKc, INFYc |
| Not yet applied (upcoming) | GOOGLc Dec 14, NVDAc Dec 23 |
| No dividend (negative case) | TSLAc |
