-- Analytics Tables for GDPR-Compliant Tracking
-- Run this in your Supabase SQL Editor

-- 1. Analytics Events Table (anonymized)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(50) NOT NULL,
  session_hash VARCHAR(64) NOT NULL, -- One-way hash, cannot be reversed
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session ON analytics_events(session_hash);

-- 2. Trending Tickers Table (aggregated, no PII)
CREATE TABLE IF NOT EXISTS trending_tickers (
  ticker VARCHAR(10) PRIMARY KEY,
  view_count_24h INTEGER DEFAULT 0,
  view_count_7d INTEGER DEFAULT 0,
  search_count_24h INTEGER DEFAULT 0,
  search_count_7d INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Daily Active Users Table (aggregated)
CREATE TABLE IF NOT EXISTS daily_active_users (
  date DATE PRIMARY KEY,
  unique_sessions INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Helper function to increment ticker counts
CREATE OR REPLACE FUNCTION increment_ticker_count(
  p_ticker VARCHAR(10),
  p_column VARCHAR(50)
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO trending_tickers (ticker, view_count_24h, search_count_24h)
  VALUES (p_ticker, 
    CASE WHEN p_column = 'view_count_24h' THEN 1 ELSE 0 END,
    CASE WHEN p_column = 'search_count_24h' THEN 1 ELSE 0 END
  )
  ON CONFLICT (ticker) DO UPDATE SET
    view_count_24h = CASE 
      WHEN p_column = 'view_count_24h' THEN trending_tickers.view_count_24h + 1 
      ELSE trending_tickers.view_count_24h 
    END,
    search_count_24h = CASE 
      WHEN p_column = 'search_count_24h' THEN trending_tickers.search_count_24h + 1 
      ELSE trending_tickers.search_count_24h 
    END,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- 5. Helper function to increment DAU
CREATE OR REPLACE FUNCTION increment_dau(p_date DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_active_users (date, total_events)
  VALUES (p_date, 1)
  ON CONFLICT (date) DO UPDATE SET
    total_events = daily_active_users.total_events + 1;
END;
$$ LANGUAGE plpgsql;

-- 6. Cleanup function to remove old analytics data (GDPR compliance - data minimization)
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS VOID AS $$
BEGIN
  -- Delete events older than 90 days
  DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Reset 24h counts for tickers not updated in last 24 hours
  UPDATE trending_tickers 
  SET view_count_24h = 0, search_count_24h = 0
  WHERE last_updated < NOW() - INTERVAL '24 hours';
  
  -- Reset 7d counts for tickers not updated in last 7 days
  UPDATE trending_tickers 
  SET view_count_7d = 0, search_count_7d = 0
  WHERE last_updated < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 7. Schedule cleanup (run daily via cron job or Supabase Edge Functions)
-- You can set this up in Supabase Dashboard > Database > Cron Jobs
-- SELECT cron.schedule('cleanup-analytics', '0 2 * * *', 'SELECT cleanup_old_analytics()');

-- 8. Enable Row Level Security (RLS) - No user access to analytics tables
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_tickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_active_users ENABLE ROW LEVEL SECURITY;

-- Only service role can access (no policies = no user access)
-- Analytics data is completely anonymized and aggregated

-- 9. Grant permissions to service role
GRANT ALL ON analytics_events TO service_role;
GRANT ALL ON trending_tickers TO service_role;
GRANT ALL ON daily_active_users TO service_role;

-- 10. Create view for trending tickers (public, read-only)
CREATE OR REPLACE VIEW public_trending_tickers AS
SELECT 
  ticker,
  view_count_24h,
  view_count_7d,
  search_count_24h + view_count_24h as total_interest_24h,
  last_updated
FROM trending_tickers
WHERE view_count_24h > 0 OR search_count_24h > 0
ORDER BY (search_count_24h + view_count_24h) DESC
LIMIT 50;

-- Allow authenticated users to read trending tickers
GRANT SELECT ON public_trending_tickers TO authenticated;
GRANT SELECT ON public_trending_tickers TO anon;

COMMENT ON TABLE analytics_events IS 'GDPR-compliant analytics events with anonymized session hashes';
COMMENT ON TABLE trending_tickers IS 'Aggregated ticker popularity metrics (no PII)';
COMMENT ON TABLE daily_active_users IS 'Daily active user counts (aggregated, no PII)';
