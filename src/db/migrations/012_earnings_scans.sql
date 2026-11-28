-- ROADMAP 6.2 cost fix (2026-11-28): one row per company read, so each company's SEC index is re-read at most once
-- every ~20 hours instead of on every robot run (a full read of 435 companies takes ~14 min of Actions time).
CREATE TABLE IF NOT EXISTS earnings_scans (
  scan_id text PRIMARY KEY,
  chain_id integer NOT NULL,
  contract_address text NOT NULL,
  releases_found integer NOT NULL,
  note text,
  scanned_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS earnings_scans_token ON earnings_scans (contract_address, scanned_at);
DROP TRIGGER IF EXISTS earnings_scans_append_only ON earnings_scans;
CREATE TRIGGER earnings_scans_append_only BEFORE UPDATE OR DELETE ON earnings_scans FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
