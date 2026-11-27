-- Phase 13 (independent review): trial_consume refuses past the daily limit of 3 instead of counting on.
-- Returns the new count, or NULL when the limit was already reached (nothing stored).
CREATE OR REPLACE FUNCTION trial_consume(p_client text, p_day date) RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE v integer;
BEGIN
  DELETE FROM trial_usage WHERE day < p_day - 2;
  INSERT INTO trial_usage (client_hash, day, n) VALUES (p_client, p_day, 1)
  ON CONFLICT (client_hash, day) DO UPDATE SET n = trial_usage.n + 1 WHERE trial_usage.n < 3
  RETURNING n INTO v;
  RETURN v;
END $$;
