-- CREATE OR REPLACE resets SECURITY DEFINER and the fixed search_path; re-apply them (grants are kept).
ALTER FUNCTION keldrin.trial_consume(text, date) SECURITY DEFINER SET search_path = keldrin, pg_temp;
REVOKE ALL ON FUNCTION keldrin.trial_consume(text, date) FROM PUBLIC, anon, authenticated, keldrin_writer;
GRANT EXECUTE ON FUNCTION keldrin.trial_consume(text, date) TO keldrin_reader;
