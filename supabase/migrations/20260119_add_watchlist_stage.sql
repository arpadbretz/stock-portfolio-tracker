-- Add stage column to watchlist for Kanban functionality
-- Stages: 'researching', 'ready', 'holding', 'sold'

ALTER TABLE watchlist
ADD COLUMN IF NOT EXISTS stage text DEFAULT 'researching';

-- Add index for faster stage-based queries
CREATE INDEX IF NOT EXISTS idx_watchlist_stage ON watchlist(stage);

-- Update existing items to default stage
UPDATE watchlist SET stage = 'researching' WHERE stage IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN watchlist.stage IS 'Kanban stage: researching, ready, holding, sold';
