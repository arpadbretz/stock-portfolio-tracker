-- Add stage column to watchlists for Kanban functionality
-- Stages: 'researching', 'ready', 'holding', 'sold'

ALTER TABLE watchlists
ADD COLUMN IF NOT EXISTS stage text DEFAULT 'researching';

-- Add index for faster stage-based queries
CREATE INDEX IF NOT EXISTS idx_watchlists_stage ON watchlists(stage);

-- Update existing items to default stage
UPDATE watchlists SET stage = 'researching' WHERE stage IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN watchlists.stage IS 'Kanban stage: researching, ready, holding, sold';

