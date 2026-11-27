-- Phase 5b: when each Chainlink aggregator (phase) was the one the proxy served, and its own decimals.
-- Aggregators overlap in time; only rounds inside their phase's live window are official history.
CREATE TABLE IF NOT EXISTS nav_phases (
  chain_id integer NOT NULL,
  feed_address text NOT NULL,
  phase_id integer NOT NULL,
  aggregator_address text NOT NULL,
  aggregator_decimals integer,
  proxy_decimals integer NOT NULL,
  live_from_block bigint,
  live_from_time timestamptz,
  live_to_block bigint,
  live_to_time timestamptz,
  observed_block bigint NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, feed_address, phase_id, observed_block)
);
DROP TRIGGER IF EXISTS nav_phases_append_only ON nav_phases;
CREATE TRIGGER nav_phases_append_only BEFORE UPDATE OR DELETE ON nav_phases FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
