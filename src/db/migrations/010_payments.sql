-- ROADMAP Phase 1.4 (approved 2026-11-28): keldrin's x402 payments, counted onchain by the research robot (Alchemy)
-- and read by /v1/stats. Append-only like every research table. A payment = a 50000-unit USDC transfer into Bankr's
-- fee router, forwarded to keldrin's payout wallet in the same transaction.
CREATE TABLE IF NOT EXISTS x402_payments (
  chain_id integer NOT NULL,
  tx_hash text NOT NULL,
  block_number bigint NOT NULL,
  payer text NOT NULL,
  amount_raw numeric NOT NULL,
  router text NOT NULL,
  payout text NOT NULL,
  found_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (chain_id, tx_hash)
);
-- one row per completed scan: the cursor is the highest to_block
CREATE TABLE IF NOT EXISTS x402_payment_scans (
  scan_id text PRIMARY KEY,
  chain_id integer NOT NULL,
  from_block bigint NOT NULL,
  to_block bigint NOT NULL,
  payments_found integer NOT NULL,
  rpc_host text NOT NULL,
  scanned_at timestamptz NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS x402_payments_append_only ON x402_payments;
CREATE TRIGGER x402_payments_append_only BEFORE UPDATE OR DELETE ON x402_payments FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
DROP TRIGGER IF EXISTS x402_payment_scans_append_only ON x402_payment_scans;
CREATE TRIGGER x402_payment_scans_append_only BEFORE UPDATE OR DELETE ON x402_payment_scans FOR EACH ROW EXECUTE FUNCTION keldrin_append_only();
