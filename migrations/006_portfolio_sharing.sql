-- Phase 5: Portfolio Sharing
-- Enables public read-only access to portfolios via share tokens

-- 1. Update portfolios table
ALTER TABLE portfolios 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT custom_access_token_hook.gen_random_uuid(); -- or just uuid_generate_v4()

-- Ensure share_token is unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_portfolios_share_token ON portfolios(share_token);

-- 2. Create RLS policies for PUBLIC access
-- We need to allow specialized access to trades and portfolios if the token matches
-- NOTE: Standard RLS is based on AUTH.UID(). Public access is anonymous.
-- We can create a "security definer" function to fetch public data safely without exposing the tables directly to anonymous users via indiscriminate policies.

-- OR we can enable a policy for 'anon' role if the share_token exists?
-- Better approach: Use a dedicated API endpoint that uses a Service Role client (or specific query) to fetch data for shared portfolios,
-- avoiding complex RLS changes for anonymous users. The frontend 'shared' page will use a specific API route.

-- However, if we want to use Supabase Client directly on frontend for public pages, we need RLS.
-- Let's stick to a specific public API route (`/api/shared/[token]`) which verifies the token and returns data.
-- This keeps RLS strict (User only) for the main app.

-- 3. Function to regenerate share token
CREATE OR REPLACE FUNCTION regenerate_share_token(p_portfolio_id UUID, p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_token UUID;
BEGIN
    v_new_token := uuid_generate_v4();
    
    UPDATE portfolios
    SET share_token = v_new_token
    WHERE id = p_portfolio_id AND user_id = p_user_id
    RETURNING share_token INTO v_new_token;
    
    RETURN v_new_token;
END;
$$;

GRANT EXECUTE ON FUNCTION regenerate_share_token(UUID, UUID) TO authenticated;

COMMENT ON COLUMN portfolios.is_public IS 'If true, portfolio can be accessed via share_token';
COMMENT ON COLUMN portfolios.share_token IS 'Unique token for public access';
