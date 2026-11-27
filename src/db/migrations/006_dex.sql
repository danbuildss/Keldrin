-- Phase 8: DEX pools of tokenized stocks on Base, discovered onchain (canonical factories and Uniswap v4
-- Initialize events). Prices are never stored here: they are read live at one pinned block when served.
CREATE TABLE IF NOT EXISTS dex_pools (
  chain_id integer NOT NULL,
  token_address text NOT NULL,
  venue text NOT NULL CHECK (venue IN ('uniswap_v3', 'aerodrome_v2', 'aerodrome_cl', 'uniswap_v4')),
  pool_ref text NOT NULL,
  currency0 text NOT NULL,
  currency1 text NOT NULL,
  quote text NOT NULL CHECK (quote IN ('USDC', 'WETH', 'ETH')),
  fee integer,
  tick_spacing integer,
  hooks text,
  stable boolean,
  source text NOT NULL,
  discovered_block bigint NOT NULL,
  discovered_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, token_address, venue, pool_ref)
);
CREATE TABLE IF NOT EXISTS dex_reviews (
  review_id text PRIMARY KEY,
  chain_id integer NOT NULL,
  token_address text NOT NULL,
  verdict text NOT NULL CHECK (verdict IN ('CONFIRMED', 'REJECTED', 'UNSURE')),
  pools_checked integer NOT NULL,
  detail jsonb NOT NULL,
  checked_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS dex_reviews_token_time ON dex_reviews (token_address, checked_at);
DROP TRIGGER IF EXISTS dex_pools_append_only ON dex_pools;
CREATE TRIGGER dex_pools_append_only BEFORE UPDATE OR DELETE ON dex_pools FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
DROP TRIGGER IF EXISTS dex_reviews_append_only ON dex_reviews;
CREATE TRIGGER dex_reviews_append_only BEFORE UPDATE OR DELETE ON dex_reviews FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
