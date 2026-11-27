-- Phase 11: free-try counter for /v1/snapshot and /v1/report (3 complete answers per client per UTC day).
-- One row per (hashed client, day); the raw IP is never stored. Rows older than 2 days are deleted on write.
-- Access only through the two functions (on Supabase: SECURITY DEFINER, EXECUTE granted to keldrin_reader only;
-- see supabase/010_trial_grants.sql). The table itself has no grants.
CREATE TABLE IF NOT EXISTS trial_usage (
  client_hash text NOT NULL CHECK (client_hash ~ '^[0-9a-f]{32}$'),
  day date NOT NULL,
  n integer NOT NULL DEFAULT 0,
  PRIMARY KEY (client_hash, day)
);

CREATE OR REPLACE FUNCTION trial_used(p_client text, p_day date) RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT coalesce((SELECT n FROM trial_usage WHERE client_hash = p_client AND day = p_day), 0)
$$;

CREATE OR REPLACE FUNCTION trial_consume(p_client text, p_day date) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE v integer;
BEGIN
  DELETE FROM trial_usage WHERE day < p_day - 2;
  INSERT INTO trial_usage (client_hash, day, n) VALUES (p_client, p_day, 1)
  ON CONFLICT (client_hash, day) DO UPDATE SET n = trial_usage.n + 1
  RETURNING n INTO v;
  RETURN v;
END $$;
