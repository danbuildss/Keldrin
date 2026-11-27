-- Phase 5: Chainlink NAV history (verbatim onchain rounds; never interpolated or filled).
CREATE TABLE IF NOT EXISTS nav_feeds (
  chain_id integer NOT NULL,
  token_address text NOT NULL,
  feed_address text NOT NULL,
  symbol text NOT NULL,
  description text NOT NULL,
  decimals integer NOT NULL,
  source text NOT NULL,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, token_address, feed_address)
);
CREATE TABLE IF NOT EXISTS nav_rounds (
  chain_id integer NOT NULL,
  feed_address text NOT NULL,
  round_id numeric(30,0) NOT NULL,
  phase_id integer NOT NULL,
  aggregator_round_id bigint NOT NULL,
  aggregator_address text NOT NULL,
  answer numeric(78,0) NOT NULL,
  decimals integer NOT NULL,
  started_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  answered_in_round numeric(30,0) NOT NULL,
  retrieved_at timestamptz NOT NULL,
  retrieved_block bigint NOT NULL,
  PRIMARY KEY (chain_id, feed_address, round_id)
);
CREATE INDEX IF NOT EXISTS nav_rounds_feed_time ON nav_rounds (feed_address, updated_at);
CREATE TABLE IF NOT EXISTS nav_reviews (
  review_id text PRIMARY KEY,
  chain_id integer NOT NULL,
  feed_address text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('CONFIRMED', 'REJECTED', 'UNSURE')),
  sampled integer NOT NULL,
  mismatches integer NOT NULL,
  rounds_indexed integer NOT NULL,
  detail jsonb NOT NULL,
  checked_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS nav_reviews_feed_time ON nav_reviews (feed_address, checked_at);
DROP TRIGGER IF EXISTS nav_rounds_append_only ON nav_rounds;
CREATE TRIGGER nav_rounds_append_only BEFORE UPDATE OR DELETE ON nav_rounds FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
DROP TRIGGER IF EXISTS nav_reviews_append_only ON nav_reviews;
CREATE TRIGGER nav_reviews_append_only BEFORE UPDATE OR DELETE ON nav_reviews FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
