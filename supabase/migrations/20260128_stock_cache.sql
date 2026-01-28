-- Migration to create stock_cache for real-time price caching
CREATE TABLE IF NOT EXISTS public.stock_cache (
    symbol TEXT NOT NULL,
    cache_key TEXT NOT NULL DEFAULT 'price', -- 'price', 'fundamentals', 'institutions', etc.
    price DECIMAL,
    price_change DECIMAL,
    price_change_percent DECIMAL,
    sector TEXT,
    industry TEXT,
    last_updated TIMESTAMPTZ DEFAULT now(),
    data JSONB,
    PRIMARY KEY (symbol, cache_key)
);

-- Enable RLS
ALTER TABLE public.stock_cache ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users
CREATE POLICY "Authenticated users can read stock cache" ON public.stock_cache
    FOR SELECT TO authenticated USING (true);

-- Allow service role to manage
CREATE POLICY "Service role can manage stock cache" ON public.stock_cache
    FOR ALL TO service_role USING (true);
