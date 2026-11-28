-- Phase 1.4 (payment count): same boundaries as the other research tables. Reader: SELECT. Writer: SELECT + INSERT (append-only).
REVOKE ALL ON keldrin.x402_payments, keldrin.x402_payment_scans FROM PUBLIC, anon, authenticated;
ALTER TABLE keldrin.x402_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE keldrin.x402_payment_scans ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON keldrin.x402_payments, keldrin.x402_payment_scans TO keldrin_reader;
GRANT SELECT, INSERT ON keldrin.x402_payments, keldrin.x402_payment_scans TO keldrin_writer;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['x402_payments','x402_payment_scans'] LOOP
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
