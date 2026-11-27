---
name: release-gate
description: Validate candidate record for release
---
# Validate candidate record for release
Read Notes.MD, CLAUDE.md, DECISIONS.md, RESEARCH_POLICY.md and SECURITY.md. Inputs: approved scope, run ID, source/record IDs and current status. Permitted actions: bounded read-only research and private artifact writes only, unless separately approved.

Validate exact revision hash, mapping, rights, schema, independent review and approved release policy. Block otherwise; never post externally.

Validation: record sources, timestamps, IDs, outcome, cost and errors; ensure facts/decisions are distinguished. Output: structured result and journal entry. Failure: stop on missing permission, unresolved identity, budget or evidence; mark BLOCKED and notify founder through approved channels. Manual only until approved. Adapt frontmatter to pinned Aeon version before registration.
