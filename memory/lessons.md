# Lessons
Append dated lesson with evidence, failure mode, proposed action and reviewer verdict. No unapproved safety-policy changes. No lessons yet.

2026-11-27 — Lesson: do not trust community or issuer docs for event semantics without checking a real transaction. base-std docs say the instant multiplier setter emits both MultiplierUpdated and UIMultiplierUpdated; the live GOOGLc tx emitted only MultiplierUpdated. Failure mode: an indexer watching only the documented "canonical" topic would miss applied actions. Proposed action: index both topics and add a regression fixture from the real tx. Reviewer verdict: pending (not yet independently reviewed).
