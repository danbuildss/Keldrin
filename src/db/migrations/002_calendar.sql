-- Leading-calendar snapshots (append-only). Each entry carries its own independent review verdict;
-- the API serves only CONFIRMED entries from the latest snapshot.
CREATE TABLE IF NOT EXISTS calendar_entries (
  snapshot_id text NOT NULL,
  entry_id text NOT NULL,
  as_of timestamptz NOT NULL,
  contract_address text NOT NULL,
  state text NOT NULL CHECK (state IN ('upcoming','applied','not_observed')),
  payable_date date,
  payload jsonb NOT NULL,
  review_verdict text NOT NULL CHECK (review_verdict IN ('CONFIRMED','REJECTED','UNSURE')),
  review jsonb NOT NULL,
  PRIMARY KEY (snapshot_id, entry_id)
);
DROP TRIGGER IF EXISTS calendar_append_only ON calendar_entries;
CREATE TRIGGER calendar_append_only BEFORE UPDATE OR DELETE ON calendar_entries FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
