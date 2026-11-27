# Lessons
Append dated lesson with evidence, failure mode, proposed action and reviewer verdict. No unapproved safety-policy changes. No lessons yet.

2026-11-27 — Lesson: do not trust community or issuer docs for event semantics without checking a real transaction. base-std docs say the instant multiplier setter emits both MultiplierUpdated and UIMultiplierUpdated; the live GOOGLc tx emitted only MultiplierUpdated. Failure mode: an indexer watching only the documented "canonical" topic would miss applied actions. Proposed action: index both topics and add a regression fixture from the real tx. Reviewer verdict: pending (not yet independently reviewed).

2026-11-27 — Lesson: Postgres jsonb does not preserve key order. Comparing stored and fresh records with JSON.stringify made every rerun create a spurious revision of all 13 records. Fix: compare canonical (sorted-key) JSON; regression test reverses key order. Reviewer verdict: fixed and tested.
2026-11-27 — Lesson: "not yet reported" is not "contradicted". The first PMc reconciliation said inconsistent only because the Q4 XBRL fact and a NAV feed did not exist yet. Missing data must be unknown; a fail needs positive contrary evidence. Fixed with a pure classifier + tests.
2026-11-27 — Lesson: a verifier that only re-checks what a record lists cannot catch omissions. It must re-scan the source (all multiplier logs in the action blocks) and recompute every flag. Found by independent code review; fixed.

2026-11-27 — Lesson: two independent HTML normalisers must agree on semantics, or the verifier rejects true quotes. AAPL was REJECTED when one side mapped “ to " and the other to a space. Fix: both decode entities to real Unicode (each with its own code). Correct fail-closed behaviour; regression covered by recorded fixtures.
2026-11-27 — Lesson: SEC HTML splits words across inline tags ("t</font><font>he"). Inline tags must be removed without inserting a space, block tags with one. Missed Alphabet's December dividend until fixed; recorded raw-HTML test added.

2026-11-27 — Lesson: never keep two stores that number revisions independently and then sync them; the primary store must compute revisions. Gate run 1 showed 0 servable records in Supabase (fail-closed). Fix: Supabase is the primary store.
2026-11-27 — Lesson: placeholder substitution must be a single pass over the original SQL; inserted literals ($kld$2026…) can contain text that looks like a placeholder ($2). Regression test added.
2026-11-27 — Lesson: "payable date passed, no adjustment" usually meant the token did not exist yet on the record date (9 of 9 cases). Check token issuance before calling anything late.
