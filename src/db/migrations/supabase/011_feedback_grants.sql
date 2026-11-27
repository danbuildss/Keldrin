-- Phase 12: the API's read-only login may call feedback_submit (insert one row, rate limited) and nothing else on
-- this table. No role but the owner can read feedback.
REVOKE ALL ON keldrin.feedback FROM PUBLIC, anon, authenticated, keldrin_reader, keldrin_writer;
REVOKE ALL ON SEQUENCE keldrin.feedback_id_seq FROM PUBLIC, anon, authenticated, keldrin_reader, keldrin_writer;
ALTER TABLE keldrin.feedback ENABLE ROW LEVEL SECURITY;
ALTER FUNCTION keldrin.feedback_submit(text, text, text, text) SECURITY DEFINER SET search_path = keldrin, pg_temp;
REVOKE ALL ON FUNCTION keldrin.feedback_submit(text, text, text, text) FROM PUBLIC, anon, authenticated, keldrin_writer;
GRANT EXECUTE ON FUNCTION keldrin.feedback_submit(text, text, text, text) TO keldrin_reader;
