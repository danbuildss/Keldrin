---
name: source-health
description: Check authorized source availability
---
# Check authorized source availability
Read Notes.MD, CLAUDE.md, DECISIONS.md, RESEARCH_POLICY.md and SECURITY.md. Inputs: approved scope, run ID, source/record IDs and current status. Permitted actions: bounded read-only research and private artifact writes only, unless separately approved.

Perform bounded read-only health checks for approved hosts; log response status, shape, lag and entitlement. Never bypass restrictions; mark unavailable on failure.

Validation: record sources, timestamps, IDs, outcome, cost and errors; ensure facts/decisions are distinguished. Output: structured result and journal entry. Failure: stop on missing permission, unresolved identity, budget or evidence; mark BLOCKED and notify founder through approved channels. Manual only until approved. Adapt frontmatter to pinned Aeon version before registration.
