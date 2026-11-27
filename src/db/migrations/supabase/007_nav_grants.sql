-- Phase 5: same boundaries as the other research tables. Reader: SELECT. Writer: SELECT + INSERT (append-only).
REVOKE ALL ON keldrin.nav_feeds, keldrin.nav_rounds, keldrin.nav_reviews FROM PUBLIC, anon, authenticated;
ALTER TABLE keldrin.nav_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE keldrin.nav_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE keldrin.nav_reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON keldrin.nav_feeds, keldrin.nav_rounds, keldrin.nav_reviews TO keldrin_reader;
GRANT SELECT, INSERT ON keldrin.nav_feeds, keldrin.nav_rounds, keldrin.nav_reviews TO keldrin_writer;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['nav_feeds','nav_rounds','nav_reviews'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename=t AND policyname='reader_select') THEN
      EXECUTE format('CREATE POLICY reader_select ON keldrin.%I FOR SELECT TO keldrin_reader USING (true)', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename=t AND policyname='writer_select') THEN
      EXECUTE format('CREATE POLICY writer_select ON keldrin.%I FOR SELECT TO keldrin_writer USING (true)', t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename=t AND policyname='writer_insert') THEN
      EXECUTE format('CREATE POLICY writer_insert ON keldrin.%I FOR INSERT TO keldrin_writer WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;
