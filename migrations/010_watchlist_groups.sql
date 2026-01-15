-- Migration: Watchlist Groups
-- Adds support for categorizing watchlist items into groups

CREATE TABLE IF NOT EXISTS public.watchlist_groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add group_id to watchlists
ALTER TABLE public.watchlists ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.watchlist_groups(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.watchlist_groups ENABLE ROW LEVEL SECURITY;

-- Policies for watchlist_groups
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'watchlist_groups' AND policyname = 'Users can manage their own watchlist groups'
    ) THEN
        CREATE POLICY "Users can manage their own watchlist groups"
            ON public.watchlist_groups
            FOR ALL
            TO authenticated
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Add comment
COMMENT ON TABLE public.watchlist_groups IS 'Custom groups/folders for categorizing stocks in a watchlist';
