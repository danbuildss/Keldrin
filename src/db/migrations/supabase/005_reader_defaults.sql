-- Role-level defaults for the read-only API login. Supabase's transaction pooler does not keep
-- per-connection SET commands, so search_path and read-only mode are pinned on the role itself.
ALTER ROLE keldrin_reader SET search_path = keldrin, public;
ALTER ROLE keldrin_reader SET default_transaction_read_only = on;
ALTER ROLE keldrin_reader SET statement_timeout = '8s';
