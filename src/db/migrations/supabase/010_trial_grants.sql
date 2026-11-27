-- Phase 11: the API's read-only login (keldrin_reader) may call exactly two functions to count free tries.
-- It gets no grant on the table itself. The functions run as their owner with a fixed search_path.
-- keldrin_writer and every other role get nothing.
REVOKE ALL ON keldrin.trial_usage FROM PUBLIC, anon, authenticated, keldrin_reader, keldrin_writer;
ALTER TABLE keldrin.trial_usage ENABLE ROW LEVEL SECURITY;
ALTER FUNCTION keldrin.trial_used(text, date) SECURITY DEFINER SET search_path = keldrin, pg_temp;
ALTER FUNCTION keldrin.trial_consume(text, date) SECURITY DEFINER SET search_path = keldrin, pg_temp;
REVOKE ALL ON FUNCTION keldrin.trial_used(text, date) FROM PUBLIC, anon, authenticated, keldrin_writer;
REVOKE ALL ON FUNCTION keldrin.trial_consume(text, date) FROM PUBLIC, anon, authenticated, keldrin_writer;
GRANT EXECUTE ON FUNCTION keldrin.trial_used(text, date) TO keldrin_reader;
GRANT EXECUTE ON FUNCTION keldrin.trial_consume(text, date) TO keldrin_reader;
