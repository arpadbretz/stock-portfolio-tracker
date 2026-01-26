-- Migration 013: Trade-Cash Integration & Realized P/L Tracking
-- Automatically links stock trades to cash transactions and tracks realized gains/losses

-- 1. REALIZED P/L TABLE
-- Tracks profit/loss when positions are sold
CREATE TABLE IF NOT EXISTS public.realized_pnl (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    portfolio_id UUID REFERENCES public.portfolios ON DELETE CASCADE NOT NULL,
    trade_id UUID REFERENCES public.trades ON DELETE SET NULL,  -- The SELL trade that realized the P/L
    ticker TEXT NOT NULL,
    quantity DECIMAL NOT NULL,
    cost_basis DECIMAL NOT NULL,           -- What we paid (per share avg)
    sale_price DECIMAL NOT NULL,           -- What we sold for (per share)
    realized_gain DECIMAL NOT NULL,        -- Total profit/loss
    realized_gain_percent DECIMAL NOT NULL,
    holding_period_days INTEGER,           -- Days held before sale
    closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ADD LINKED CASH TRANSACTION COLUMN TO TRADES
-- Links each trade to its corresponding cash transaction
ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS cash_transaction_id UUID REFERENCES public.cash_transactions ON DELETE SET NULL;

-- 3. ENABLE RLS ON REALIZED_PNL
ALTER TABLE public.realized_pnl ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR REALIZED_PNL
CREATE POLICY "Users can select their own realized pnl"
    ON public.realized_pnl
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own realized pnl"
    ON public.realized_pnl
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own realized pnl"
    ON public.realized_pnl
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_realized_pnl_portfolio_id 
    ON public.realized_pnl(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_realized_pnl_ticker 
    ON public.realized_pnl(ticker);
CREATE INDEX IF NOT EXISTS idx_realized_pnl_closed_at 
    ON public.realized_pnl(closed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_cash_transaction 
    ON public.trades(cash_transaction_id);

-- 6. FUNCTION: Get realized P/L summary for a portfolio
CREATE OR REPLACE FUNCTION get_realized_pnl_summary(
    p_portfolio_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    total_realized_gain DECIMAL,
    total_trades BIGINT,
    winning_trades BIGINT,
    losing_trades BIGINT,
    win_rate DECIMAL,
    avg_gain DECIMAL,
    avg_loss DECIMAL,
    biggest_win DECIMAL,
    biggest_loss DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH pnl_data AS (
        SELECT 
            r.realized_gain,
            CASE WHEN r.realized_gain >= 0 THEN 1 ELSE 0 END as is_win
        FROM public.realized_pnl r
        WHERE r.portfolio_id = p_portfolio_id
            AND (p_start_date IS NULL OR r.closed_at >= p_start_date)
            AND (p_end_date IS NULL OR r.closed_at <= p_end_date)
    )
    SELECT 
        COALESCE(SUM(realized_gain), 0) as total_realized_gain,
        COUNT(*) as total_trades,
        SUM(is_win) as winning_trades,
        COUNT(*) - SUM(is_win) as losing_trades,
        CASE WHEN COUNT(*) > 0 
            THEN ROUND((SUM(is_win)::DECIMAL / COUNT(*)) * 100, 2) 
            ELSE 0 
        END as win_rate,
        COALESCE(AVG(CASE WHEN realized_gain >= 0 THEN realized_gain END), 0) as avg_gain,
        COALESCE(AVG(CASE WHEN realized_gain < 0 THEN realized_gain END), 0) as avg_loss,
        COALESCE(MAX(realized_gain), 0) as biggest_win,
        COALESCE(MIN(realized_gain), 0) as biggest_loss
    FROM pnl_data;
END;
$$;

-- 7. FUNCTION: Calculate cost basis for a ticker (FIFO method)
CREATE OR REPLACE FUNCTION calculate_cost_basis_fifo(
    p_portfolio_id UUID,
    p_ticker TEXT,
    p_sell_quantity DECIMAL
)
RETURNS TABLE (
    total_cost_basis DECIMAL,
    avg_cost_per_share DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_remaining DECIMAL := p_sell_quantity;
    v_total_cost DECIMAL := 0;
    v_buy_record RECORD;
BEGIN
    -- Get BUY trades for this ticker, ordered by date (FIFO)
    FOR v_buy_record IN
        SELECT 
            t.id,
            t.quantity,
            t.price_per_share,
            COALESCE(
                (SELECT SUM(rp.quantity) FROM public.realized_pnl rp 
                 WHERE rp.trade_id = t.id),
                0
            ) as already_sold
        FROM public.trades t
        WHERE t.portfolio_id = p_portfolio_id
            AND t.ticker = UPPER(p_ticker)
            AND t.action = 'BUY'
        ORDER BY t.date_traded ASC
    LOOP
        -- Calculate available shares from this buy lot
        DECLARE
            v_available DECIMAL := v_buy_record.quantity - v_buy_record.already_sold;
            v_use_qty DECIMAL;
        BEGIN
            IF v_remaining <= 0 OR v_available <= 0 THEN
                CONTINUE;
            END IF;
            
            -- Use minimum of available and remaining
            v_use_qty := LEAST(v_available, v_remaining);
            v_total_cost := v_total_cost + (v_use_qty * v_buy_record.price_per_share);
            v_remaining := v_remaining - v_use_qty;
        END;
    END LOOP;
    
    -- Return results
    RETURN QUERY SELECT 
        v_total_cost,
        CASE WHEN (p_sell_quantity - v_remaining) > 0 
            THEN v_total_cost / (p_sell_quantity - v_remaining)
            ELSE 0
        END;
END;
$$;

-- 8. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_realized_pnl_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_cost_basis_fifo(UUID, TEXT, DECIMAL) TO authenticated;

-- 9. COMMENTS
COMMENT ON TABLE public.realized_pnl IS 'Tracks realized profit/loss when stock positions are sold';
COMMENT ON FUNCTION get_realized_pnl_summary IS 'Returns summary statistics of realized P/L for a portfolio';
COMMENT ON FUNCTION calculate_cost_basis_fifo IS 'Calculates cost basis using FIFO method for selling shares';
