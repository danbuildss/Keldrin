-- Phase 4: least-privilege role for scheduled research runs (GitHub Actions).
-- It can read and APPEND to the research tables, and update only the assets snapshot (upsert).
-- No DELETE, no TRUNCATE, no DDL, no access to schema_migrations; records/reviews/calendar stay
-- append-only through their triggers. NOLOGIN until the founder sets a password.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'keldrin_writer') THEN CREATE ROLE keldrin_writer NOLOGIN; END IF;
END $$;
GRANT USAGE ON SCHEMA keldrin TO keldrin_writer;
GRANT SELECT, INSERT ON keldrin.assets, keldrin.sources, keldrin.records, keldrin.reviews, keldrin.runs, keldrin.reconciliations, keldrin.calendar_entries TO keldrin_writer;
GRANT UPDATE ON keldrin.assets TO keldrin_writer;
GRANT SELECT ON keldrin.confirmed_records TO keldrin_writer;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['assets','sources','records','reviews','runs','reconciliations','calendar_entries'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename=t AND policyname='writer_select') THEN
      EXECUTE format('CREATE POLICY writer_select ON keldrin.%I FOR SELECT TO keldrin_writer USING (true)', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename=t AND policyname='writer_insert') THEN
      EXECUTE format('CREATE POLICY writer_insert ON keldrin.%I FOR INSERT TO keldrin_writer WITH CHECK (true)', t);
    END IF;
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename='assets' AND policyname='writer_update') THEN
    CREATE POLICY writer_update ON keldrin.assets FOR UPDATE TO keldrin_writer USING (true) WITH CHECK (true);
  END IF;
END $$;
-- The transaction pooler does not keep per-connection SETs, so pin defaults on the role.
ALTER ROLE keldrin_writer SET search_path = keldrin, public;
ALTER ROLE keldrin_writer SET statement_timeout = '60s';
ALTER ROLE keldrin_writer SET idle_in_transaction_session_timeout = '60s';
-- Let the admin role assume it so the boundary can be tested (SET ROLE). Grants no new data access.
GRANT keldrin_writer TO postgres;
