-- Phase 5b: same boundaries as the other NAV tables.
REVOKE ALL ON keldrin.nav_phases FROM PUBLIC, anon, authenticated;
ALTER TABLE keldrin.nav_phases ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON keldrin.nav_phases TO keldrin_reader;
GRANT SELECT, INSERT ON keldrin.nav_phases TO keldrin_writer;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename='nav_phases' AND policyname='reader_select') THEN
    CREATE POLICY reader_select ON keldrin.nav_phases FOR SELECT TO keldrin_reader USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename='nav_phases' AND policyname='writer_select') THEN
    CREATE POLICY writer_select ON keldrin.nav_phases FOR SELECT TO keldrin_writer USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename='nav_phases' AND policyname='writer_insert') THEN
    CREATE POLICY writer_insert ON keldrin.nav_phases FOR INSERT TO keldrin_writer WITH CHECK (true);
  END IF;
END $$;
