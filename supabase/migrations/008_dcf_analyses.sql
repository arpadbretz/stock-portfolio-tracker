-- Saved DCF Analyses table
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS dcf_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    
    -- Basic inputs
    current_price DECIMAL(15,4),
    free_cash_flow DECIMAL(20,4),
    shares_outstanding DECIMAL(20,4),
    
    -- Growth assumptions
    growth_rate_1_5 DECIMAL(5,2),
    growth_rate_6_10 DECIMAL(5,2),
    terminal_growth_rate DECIMAL(5,2),
    discount_rate DECIMAL(5,2),
    margin_of_safety DECIMAL(5,2),
    
    -- Advanced inputs (optional)
    is_advanced BOOLEAN DEFAULT FALSE,
    
    -- Advanced: Custom year-by-year growth rates (JSON array)
    custom_growth_rates JSONB,
    
    -- Advanced: WACC components
    cost_of_equity DECIMAL(5,2),
    cost_of_debt DECIMAL(5,2),
    tax_rate DECIMAL(5,2),
    debt_ratio DECIMAL(5,2),
    equity_ratio DECIMAL(5,2),
    risk_free_rate DECIMAL(5,2),
    beta DECIMAL(5,2),
    market_risk_premium DECIMAL(5,2),
    
    -- Advanced: Balance sheet adjustments
    cash_and_equivalents DECIMAL(20,4),
    total_debt DECIMAL(20,4),
    
    -- Advanced: Scenario analysis
    scenario_type VARCHAR(20) DEFAULT 'base', -- base, bull, bear
    
    -- Results (stored for quick display)
    intrinsic_value DECIMAL(15,4),
    fair_value DECIMAL(15,4),
    upside_percent DECIMAL(10,2),
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE dcf_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own DCF analyses"
ON dcf_analyses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own DCF analyses"
ON dcf_analyses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DCF analyses"
ON dcf_analyses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own DCF analyses"
ON dcf_analyses FOR DELETE
USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_dcf_analyses_user_id ON dcf_analyses(user_id);
CREATE INDEX idx_dcf_analyses_symbol ON dcf_analyses(symbol);
