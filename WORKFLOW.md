# Investigation workflow
1. Select approved company/contract and event scope. Validate mapping and source rights.
2. Fetch authorized primary sources; timestamp retrieval; preserve reference IDs and permitted evidence.
3. Extract typed facts deterministically where possible; identify event time vs announcement vs effective time; deduplicate by issuer/source/event identity.
4. Link event to verified B20 asset. Separately fetch reference value and liquidity only when permitted; save observation time, block and feed semantics. Do not imply causal impact from simultaneous moves.
5. Construct canonical event record; run schema, mapping, arithmetic, freshness, source and duplication checks.
6. Independent reviewer tries to falsify each material claim using original evidence, checks conflicting reports and unit/multiplier handling. Verdict CONFIRMED, UNSURE or REJECTED. UNSURE blocks publication.
7. Archive evidence and record revision. Generate one human brief and machine JSON from the same canonical record. Owner approves release; approved API serves only permitted records.
8. Update findings index and status. Record corrections and owner feedback; score actual performance; propose bounded improvements for review.

Recovery: retries with bounded backoff, no unbounded agent loops, previous records clearly marked stale if data source fails. Idempotent writes; no duplicate x402 fulfillment. Separate public and private storage.
