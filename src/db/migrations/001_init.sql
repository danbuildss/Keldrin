-- Keldrin Phase 1 schema (Postgres; runs on PGlite locally and on Supabase later).
-- Records and reviews are append-only: corrections are new revisions, never updates.

CREATE TABLE IF NOT EXISTS schema_migrations (version text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());

CREATE TABLE IF NOT EXISTS assets (
  chain_id integer NOT NULL,
  contract_address text NOT NULL CHECK (contract_address ~ '^0x[0-9A-Fa-f]{40}$'),
  symbol text NOT NULL,
  name text NOT NULL,
  isin text,
  identity_state text NOT NULL CHECK (identity_state IN ('verified','mismatch','incomplete')),
  multiplier_wad numeric(78,0),
  observed_block bigint NOT NULL,
  identity jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, contract_address)
);

CREATE TABLE IF NOT EXISTS sources (
  sha256 text PRIMARY KEY,
  url text NOT NULL,
  kind text NOT NULL,
  http_status integer NOT NULL,
  bytes integer NOT NULL,
  retrieved_at timestamptz NOT NULL,
  rights_state text NOT NULL CHECK (rights_state IN ('public','unknown','approved','restricted','denied'))
);

CREATE TABLE IF NOT EXISTS records (
  record_id text NOT NULL,
  revision integer NOT NULL CHECK (revision >= 1),
  record_type text NOT NULL,
  chain_id integer NOT NULL,
  contract_address text NOT NULL,
  effective_block bigint,
  payload jsonb NOT NULL,
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (record_id, revision),
  UNIQUE (payload_sha256)
);
CREATE INDEX IF NOT EXISTS records_contract_idx ON records (chain_id, lower(contract_address), effective_block);

CREATE TABLE IF NOT EXISTS reviews (
  review_id text PRIMARY KEY,
  record_id text NOT NULL,
  revision integer NOT NULL,
  payload_sha256 text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('CONFIRMED','REJECTED','UNSURE')),
  reviewer text NOT NULL,
  claims jsonb NOT NULL,
  checked_at timestamptz NOT NULL,
  FOREIGN KEY (record_id, revision) REFERENCES records (record_id, revision)
);

CREATE TABLE IF NOT EXISTS runs (
  run_id text PRIMARY KEY,
  kind text NOT NULL,
  started_at timestamptz NOT NULL,
  finished_at timestamptz,
  head_block bigint,
  rpc_calls integer,
  outcome text,
  summary jsonb
);

CREATE OR REPLACE FUNCTION keldrin_append_only() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'table % is append-only', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS records_append_only ON records;
CREATE TRIGGER records_append_only BEFORE UPDATE OR DELETE ON records FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
DROP TRIGGER IF EXISTS reviews_append_only ON reviews;
CREATE TRIGGER reviews_append_only BEFORE UPDATE OR DELETE ON reviews FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();

-- Servable view: the latest revision of each record whose latest review CONFIRMED that exact payload hash.
CREATE OR REPLACE VIEW confirmed_records AS
SELECT r.*, rv.review_id, rv.checked_at AS reviewed_at
FROM records r
JOIN LATERAL (
  SELECT * FROM reviews x WHERE x.record_id = r.record_id AND x.revision = r.revision ORDER BY x.checked_at DESC LIMIT 1
) rv ON rv.payload_sha256 = r.payload_sha256 AND rv.verdict = 'CONFIRMED'
WHERE r.revision = (SELECT max(revision) FROM records m WHERE m.record_id = r.record_id);

CREATE TABLE IF NOT EXISTS reconciliations (
  reconciliation_id text PRIMARY KEY,
  record_id text NOT NULL,
  record_payload_sha256 text NOT NULL,
  status text NOT NULL CHECK (status IN ('consistent','partially_reconciled','inconsistent','unsure')),
  payload jsonb NOT NULL,
  payload_sha256 text NOT NULL,
  review_verdict text CHECK (review_verdict IN ('CONFIRMED','REJECTED','UNSURE')),
  review jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
