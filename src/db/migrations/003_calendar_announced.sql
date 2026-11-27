-- Calendar entries can also come from issuer announcements onchain (announced, not yet applied).
ALTER TABLE calendar_entries DROP CONSTRAINT IF EXISTS calendar_entries_state_check;
ALTER TABLE calendar_entries ADD CONSTRAINT calendar_entries_state_check CHECK (state IN ('upcoming','applied','not_observed','announced'));
