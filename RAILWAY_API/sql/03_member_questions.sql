-- Execute once against the SAME Railway MySQL database as the API.
-- Existing anonymous questions are intentionally NOT automatically assigned to an account.
ALTER TABLE intakes ADD COLUMN member_id VARCHAR(36) NULL;
CREATE INDEX idx_intakes_member_created ON intakes (member_id, created_at);
