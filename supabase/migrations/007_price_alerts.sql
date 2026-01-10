-- Price Alerts table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    target_price DECIMAL(15,4) NOT NULL,
    condition VARCHAR(10) NOT NULL CHECK (condition IN ('above', 'below')),
    is_triggered BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own alerts"
ON price_alerts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
ON price_alerts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
ON price_alerts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
ON price_alerts FOR DELETE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_symbol ON price_alerts(symbol);
CREATE INDEX idx_price_alerts_not_triggered ON price_alerts(is_triggered) WHERE is_triggered = FALSE;
