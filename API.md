# API proposal (v1, not implemented)
Canonical lookup is chain ID + contract address; ticker lookup is convenience only and rejects ambiguity. OpenAPI 3.1 contract, documented versioning and JSON schema. Cursor pagination, bounded limits, event time filters and stable IDs. All responses indicate as_of, schema_version and availability. Unknown values null, never zero or fabricated.

- GET /v1/assets — approved asset identity mappings, source and status.
- GET /v1/events?chain_id=8453&contract=...&since=... — verified corporate-event feed, cursor and timestamps. Primary MVP.
- GET /v1/events/{event_id} — evidence and revision history.
- GET /v1/assets/{chain_id}/{contract}/context — optional observed reference/freshness and relevant event summary, only after quality gate.
- GET /health — source health, lag and coverage; no secrets.

Canonical event fields: event_id, revision, schema_version, underlying {ticker, cik, share_class}, asset {chain_id, contract_address, issuer, mapping_source}, event_type, status (scheduled/announced/effective/cancelled), announced_at, effective_at (nullable), observed_at, facts (typed values, units, evidence IDs), interpretation (nullable), sources [{id,url,document_id,retrieved_at,locator}], verification {state,reviewed_at,limitations}, freshness {as_of,state}, supersedes (nullable). Observations separate from event facts. Reference semantics must distinguish total_return vs raw_equity; feed timestamp, currency and block when applicable.

Errors: 400 invalid request; 404 unknown asset/event; 409 ambiguous ticker; 429 rate limit; 503 unavailable critical source. Drafts never presented as verified. For x402 use documented 402 challenge and facilitator verification; quote fixed price only after cost/terms checks; demo target $0.02 per verified events request, proposed not committed. Free sample/health and approved paid endpoint. Do not represent x402 transfers as stock trading volume. MCP read-only tools mirror same REST results. API data is informational; not an oracle or order execution API.

v0.2: schemas/event-record.schema.json is an illustrative proposed contract, not an approved OpenAPI implementation. Keep schema, database projection and API response aligned. Payment is optional if blocked; no paid serving without rights and a tested settlement flow.

## Proposed endpoints (CD-003, 2026-11-27): NOT approved
Priority order by developer value ÷ effort:
1. `GET /v1/assets/{chain_id}/{contract}/nav/history?from&to&interval=round|daily`
2. `GET /v1/assets/{chain_id}/{contract}/corporate-actions`
3. `GET /v1/assets/{chain_id}/{contract}/risk`
4. `GET /v1/assets/{chain_id}/{contract}/market-context` (and `GET /v1/market/sessions`)
5. `GET /v1/assets/{chain_id}/{contract}/transfer-policy`
6. `GET /v1/assets/{chain_id}/{contract}/nav` (latest round with staleness classification)
Deferred: `…/liquidity` (third-party terms or own pool indexing).
Existing and unchanged: `/v1/assets`, `/v1/events`, `/v1/changes`, `/v1/calendar`, `/v1/actions`.
