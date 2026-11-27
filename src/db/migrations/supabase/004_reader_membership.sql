-- Let the admin role assume keldrin_reader so its read-only boundary can be tested (SET ROLE).
-- Grants no data access to anyone new.
GRANT keldrin_reader TO postgres;
