-- Migration: Portfolio Value over Time Tracking
-- This table stores daily snapshots of portfolio performance

CREATE TABLE IF NOT EXISTS public.portfolio_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Performance Metrics
    total_value DECIMAL(15,2) NOT NULL, -- Current market value of all holdings
    cost_basis DECIMAL(15,2) NOT NULL,   -- Total amount invested (cost of active holdings)
    cash_balance DECIMAL(15,2) DEFAULT 0, -- Liquid cash in portfolio
    realized_pnl DECIMAL(15,2) DEFAULT 0, -- P&L from sold positions
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure one snapshot per day per portfolio
    UNIQUE(portfolio_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_portfolio_history_portfolio_id ON public.portfolio_history(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_user_id ON public.portfolio_history(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_history_date ON public.portfolio_history(date);

-- Enable RLS
ALTER TABLE public.portfolio_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own portfolio history') THEN
        CREATE POLICY "Users can view their own portfolio history" ON public.portfolio_history 
        FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

COMMENT ON TABLE public.portfolio_history IS 'Stores daily snapshots of portfolio value for charting and benchmarking';
