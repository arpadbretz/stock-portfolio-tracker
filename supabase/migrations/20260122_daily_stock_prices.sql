-- Create Global Historical Price Cache table
-- This table stores daily close prices for tickers to avoid redundant Yahoo Finance API calls

CREATE TABLE IF NOT EXISTS daily_stock_prices (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  date DATE NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(symbol, date)
);

-- Index for faster symbol-based history retrieval
CREATE INDEX IF NOT EXISTS idx_daily_stock_prices_symbol_date ON daily_stock_prices(symbol, date DESC);

-- RLS: Service role can update, authenticated can read
ALTER TABLE daily_stock_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read global prices" 
ON daily_stock_prices FOR SELECT 
TO authenticated 
USING (true);

-- Grant permissions
GRANT SELECT ON daily_stock_prices TO authenticated;
GRANT ALL ON daily_stock_prices TO service_role;

COMMENT ON TABLE daily_stock_prices IS 'Global cache for daily stock close prices to optimize Yahoo Finance usage.';
