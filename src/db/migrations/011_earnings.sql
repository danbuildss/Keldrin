-- ROADMAP Phase 6.2 (approved 2026-11-28): earnings releases = SEC 8-K filings that include item 2.02 (Results of
-- Operations and Financial Condition), read from SEC's submissions index. Announced facts only: no estimates, no
-- consensus, no upcoming dates unless a filing states them (not in this table). Append-only like every research table.
CREATE TABLE IF NOT EXISTS sec_companies (
  chain_id integer NOT NULL,
  contract_address text NOT NULL,
  cik text NOT NULL CHECK (cik ~ '^[0-9]{10}$'),
  company_name text NOT NULL,
  ticker text NOT NULL,
  evidence jsonb NOT NULL,
  resolved_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, contract_address, cik)
);
CREATE TABLE IF NOT EXISTS earnings_releases (
  chain_id integer NOT NULL,
  contract_address text NOT NULL,
  cik text NOT NULL,
  accession text NOT NULL CHECK (accession ~ '^[0-9]{10}-[0-9]{2}-[0-9]{6}$'),
  form text NOT NULL,
  items text NOT NULL,
  filed_date date NOT NULL,
  accepted_at timestamptz NOT NULL,
  report_date date,
  primary_document_url text NOT NULL,
  source_url text NOT NULL,
  source_sha256 text NOT NULL,
  found_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, contract_address, accession)
);
-- independent check of each release from a different SEC host (www.sec.gov filing headers)
CREATE TABLE IF NOT EXISTS earnings_reviews (
  review_id text PRIMARY KEY,
  chain_id integer NOT NULL,
  contract_address text NOT NULL,
  accession text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('CONFIRMED', 'REJECTED', 'UNSURE')),
  detail jsonb NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS earnings_releases_token ON earnings_releases (contract_address, accepted_at);
CREATE INDEX IF NOT EXISTS earnings_reviews_acc ON earnings_reviews (accession, checked_at);
DROP TRIGGER IF EXISTS sec_companies_append_only ON sec_companies;
CREATE TRIGGER sec_companies_append_only BEFORE UPDATE OR DELETE ON sec_companies FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
DROP TRIGGER IF EXISTS earnings_releases_append_only ON earnings_releases;
CREATE TRIGGER earnings_releases_append_only BEFORE UPDATE OR DELETE ON earnings_releases FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
DROP TRIGGER IF EXISTS earnings_reviews_append_only ON earnings_reviews;
CREATE TRIGGER earnings_reviews_append_only BEFORE UPDATE OR DELETE ON earnings_reviews FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
