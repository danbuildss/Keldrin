-- ROADMAP 1.5 (independent review finding 6, 2026-11-27): the independent verifier gets its own least-privilege
-- login, separate from the indexer's keldrin_writer. It can READ the research tables and APPEND only to the review
-- tables (nav_reviews, dex_reviews, earnings_reviews). No update, delete, truncate or DDL. NOLOGIN until the founder
-- sets a password (Supabase SQL editor: ALTER ROLE keldrin_verifier WITH LOGIN PASSWORD '...').
-- Step 2, after the verifier has run on its own login: revoke INSERT on those review tables from keldrin_writer.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'keldrin_verifier') THEN CREATE ROLE keldrin_verifier NOLOGIN; END IF;
END $$;
GRANT USAGE ON SCHEMA keldrin TO keldrin_verifier;
GRANT SELECT ON keldrin.assets, keldrin.nav_feeds, keldrin.nav_rounds, keldrin.nav_phases, keldrin.nav_reviews, keldrin.dex_pools, keldrin.dex_reviews,
  keldrin.sec_companies, keldrin.earnings_releases, keldrin.earnings_reviews TO keldrin_verifier;
GRANT INSERT ON keldrin.nav_reviews, keldrin.dex_reviews, keldrin.earnings_reviews TO keldrin_verifier;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['assets','nav_feeds','nav_rounds','nav_phases','nav_reviews','dex_pools','dex_reviews','sec_companies','earnings_releases','earnings_reviews'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename=t AND policyname='verifier_select') THEN
      EXECUTE format('CREATE POLICY verifier_select ON keldrin.%I FOR SELECT TO keldrin_verifier USING (true)', t);
    END IF;
  END LOOP;
  FOREACH t IN ARRAY ARRAY['nav_reviews','dex_reviews','earnings_reviews'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='keldrin' AND tablename=t AND policyname='verifier_insert') THEN
      EXECUTE format('CREATE POLICY verifier_insert ON keldrin.%I FOR INSERT TO keldrin_verifier WITH CHECK (true)', t);
    END IF;
  END LOOP;
END $$;
ALTER ROLE keldrin_verifier SET search_path = keldrin, public;
ALTER ROLE keldrin_verifier SET statement_timeout = '60s';
ALTER ROLE keldrin_verifier SET idle_in_transaction_session_timeout = '60s';
GRANT keldrin_verifier TO postgres;
