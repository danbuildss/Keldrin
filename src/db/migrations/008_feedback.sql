-- Phase 12: website feedback (email, optional X handle, optional message). Written only through feedback_submit
-- (on Supabase: SECURITY DEFINER, EXECUTE granted to keldrin_reader only; see supabase/011_feedback_grants.sql).
-- Nobody but the database owner can read it. At most 5 submissions per hashed client per day; the IP is never stored.
CREATE TABLE IF NOT EXISTS feedback (
  id bigserial PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL CHECK (length(email) BETWEEN 3 AND 200 AND email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  x_handle text CHECK (x_handle IS NULL OR x_handle ~ '^[A-Za-z0-9_]{1,15}$'),
  message text CHECK (message IS NULL OR length(message) <= 1000),
  client_hash text NOT NULL CHECK (client_hash ~ '^[0-9a-f]{32}$')
);
CREATE INDEX IF NOT EXISTS feedback_client_day ON feedback (client_hash, created_at);

CREATE OR REPLACE FUNCTION feedback_submit(p_email text, p_x text, p_message text, p_client text) RETURNS text
LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT count(*) FROM feedback WHERE client_hash = p_client AND created_at > now() - interval '1 day') >= 5 THEN
    RETURN 'rate_limited';
  END IF;
  INSERT INTO feedback (email, x_handle, message, client_hash) VALUES (p_email, nullif(p_x, ''), nullif(p_message, ''), p_client);
  RETURN 'ok';
END $$;
