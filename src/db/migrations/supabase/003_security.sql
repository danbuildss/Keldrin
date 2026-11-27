-- Supabase-only hardening (applied after 001/002 inside the private `keldrin` schema).
-- PostgREST exposes only `public` by default, so `keldrin` is not reachable through the Data API.
-- Defence in depth: RLS on every table with NO policies for anon/authenticated (deny all),
-- and no schema/table privileges for them. A read-only role is created for the Phase 3 API.

REVOKE ALL ON SCHEMA keldrin FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA keldrin FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA keldrin REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated;

ALTER TABLE keldrin.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE keldrin.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE keldrin.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE keldrin.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE keldrin.runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE keldrin.reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE keldrin.calendar_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE keldrin.schema_migrations ENABLE ROW LEVEL SECURITY;

-- Read-only role for the Phase 3 API (NOLOGIN until the founder approves deployment and a login is issued).
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'keldrin_reader') THEN CREATE ROLE keldrin_reader NOLOGIN; END IF;
END $$;
GRANT USAGE ON SCHEMA keldrin TO keldrin_reader;
GRANT SELECT ON keldrin.assets, keldrin.records, keldrin.reviews, keldrin.reconciliations, keldrin.calendar_entries, keldrin.runs, keldrin.confirmed_records TO keldrin_reader;
-- Reader sees rows through RLS policies (SELECT only); it has no INSERT/UPDATE/DELETE privilege at all.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['assets','records','reviews','reconciliations','calendar_entries','runs'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename=t AND policyname='reader_select') THEN
      EXECUTE format('CREATE POLICY reader_select ON keldrin.%I FOR SELECT TO keldrin_reader USING (true)', t);
    END IF;
  END LOOP;
END $$;
