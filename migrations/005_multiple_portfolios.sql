-- Phase 5: Multiple Portfolios Support
-- This migration adds support for multiple portfolios per user

-- 1. Update portfolios table to remove is_default (we'll use a separate user preference)
-- The portfolios table already has user_id, so we just need to ensure proper constraints

-- 2. Add a user_preferences table to store default portfolio
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    default_portfolio_id UUID REFERENCES portfolios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for user_preferences
CREATE POLICY "Users can view own preferences"
    ON user_preferences
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON user_preferences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON user_preferences
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
    ON user_preferences
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Update portfolios table to add description and color fields
ALTER TABLE portfolios 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#10b981'; -- emerald-500

-- 6. Create index for faster portfolio lookups
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- 7. Create a function to get or create default portfolio
CREATE OR REPLACE FUNCTION get_or_create_default_portfolio(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_portfolio_id UUID;
    v_pref_portfolio_id UUID;
BEGIN
    -- Check if user has a preference set
    SELECT default_portfolio_id INTO v_pref_portfolio_id
    FROM user_preferences
    WHERE user_id = p_user_id;

    -- If preference exists and portfolio exists, return it
    IF v_pref_portfolio_id IS NOT NULL THEN
        SELECT id INTO v_portfolio_id
        FROM portfolios
        WHERE id = v_pref_portfolio_id AND user_id = p_user_id;
        
        IF v_portfolio_id IS NOT NULL THEN
            RETURN v_portfolio_id;
        END IF;
    END IF;

    -- Otherwise, get the first portfolio for the user
    SELECT id INTO v_portfolio_id
    FROM portfolios
    WHERE user_id = p_user_id
    ORDER BY created_at ASC
    LIMIT 1;

    -- If no portfolio exists, create one
    IF v_portfolio_id IS NULL THEN
        INSERT INTO portfolios (user_id, name, description, color)
        VALUES (p_user_id, 'My Portfolio', 'Default portfolio', '#10b981')
        RETURNING id INTO v_portfolio_id;

        -- Set as default
        INSERT INTO user_preferences (user_id, default_portfolio_id)
        VALUES (p_user_id, v_portfolio_id)
        ON CONFLICT (user_id) 
        DO UPDATE SET default_portfolio_id = v_portfolio_id;
    END IF;

    RETURN v_portfolio_id;
END;
$$;

-- 8. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_or_create_default_portfolio(UUID) TO authenticated;

COMMENT ON TABLE user_preferences IS 'Stores user preferences including default portfolio selection';
COMMENT ON FUNCTION get_or_create_default_portfolio IS 'Gets the default portfolio for a user or creates one if none exists';
