# Proposed PostgreSQL/Supabase model (not migrated)
Use UUID/internal stable IDs, UTC timestamptz, exact numeric/decimal values, explicit currency and units, append-only evidence and event revisions. Never use floats for currency math. Initial tables:
- companies(id, cik, underlying_isin, ticker, share_class, name, source_id); uniqueness by verified identity, not ticker.
- assets(id, chain_id, contract_address_normalized, company_id, issuer, token_symbol, status, valid_from, valid_to, evidence_id); unique active (chain_id, contract). Mapping revisions preserve historical identity.
- sources(id, url, provider, document_id, retrieved_at, content_hash, locator, rights_state); immutable evidence pointers and permitted extracts, private where required.
- events(id, company_id, event_type, stable_source_key, created_at); unique dedup key with source-aware reconciliation.
- event_revisions(event_id, revision, payload_json, payload_hash, event_status, verification_state, published_at, supersedes_revision); composite primary key; immutable historical revisions.
- event_assets(event_id, revision, asset_id); links one company event to one or more verified token assets without duplicating event identity.
- reviews(id, event_id, revision, payload_hash, reviewer_run_id, verdict, limitations, checked_at); bind approval to exact revision hash.
- observations(id, asset_id, metric, value_numeric, unit, semantics, observed_at, source_updated_at, block_number, block_hash, source_id, freshness_state); never overwrite historical observation.
- jobs(id, run_id, kind, idempotency_key, state, attempts, lease_until, started_at, finished_at, cost, error_code); unique idempotency key; no secret payloads.
- provider_health(provider, checked_at, lag, status, error_code); track gaps; no misleading green state.
- usage(id, request_id, route, client_class, served_revision, result, timestamp); privacy-minimized; separate external vs internal vs demo.
- payment_receipts(id, payment_id, network, asset, amount_atomic, tx_hash, state, resource_hash, fulfilled_at); unique authorization identity; settlement reconciler; private.

Transactional release: validate schema + rights + active mapping + independently confirmed exact payload hash; create public projection atomically; otherwise reject. Corrections insert new revision; current view excludes withdrawn/superseded. Use worker-specific least privilege, API read-only approved views, separate private tables and RLS. Test service-role bypass risk, pagination and concurrent writes. Do not expose Supabase service key in UI. Migrations and rollback test required before release.
