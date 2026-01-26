-- Migration 012: Cash Balance Tracking System
-- Enables tracking of cash positions, deposits, withdrawals for accurate P&L calculations

-- 1. CASH TRANSACTIONS TABLE
-- Tracks all cash movements: deposits, withdrawals, dividends, interest, fees
CREATE TABLE IF NOT EXISTS public.cash_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
    portfolio_id UUID REFERENCES public.portfolios ON DELETE CASCADE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN (
        'DEPOSIT',      -- Cash added to portfolio
        'WITHDRAWAL',   -- Cash removed from portfolio
        'DIVIDEND',     -- Dividend received
        'INTEREST',     -- Interest earned
        'FEE',          -- Fees charged (negative impact)
        'TAX',          -- Tax withholding (negative impact)
        'ADJUSTMENT'    -- Manual balance adjustment
    )),
    amount DECIMAL NOT NULL,  -- Positive for inflows, negative for outflows
    currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'HUF', 'GBP')),
    ticker TEXT,  -- Optional: for dividend/interest related to specific stock
    description TEXT,
    transaction_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PORTFOLIO CASH BALANCE VIEW
-- Provides current cash balance per portfolio
CREATE OR REPLACE VIEW public.portfolio_cash_balance AS
SELECT 
    portfolio_id,
    user_id,
    COALESCE(SUM(
        CASE 
            WHEN transaction_type IN ('DEPOSIT', 'DIVIDEND', 'INTEREST', 'ADJUSTMENT') THEN amount
            WHEN transaction_type IN ('WITHDRAWAL', 'FEE', 'TAX') THEN -ABS(amount)
            ELSE 0
        END
    ), 0) AS cash_balance,
    COUNT(*) AS transaction_count,
    MAX(transaction_date) AS last_transaction_date
FROM public.cash_transactions
GROUP BY portfolio_id, user_id;

-- 3. ENABLE RLS
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR CASH TRANSACTIONS
-- Users can only see their own cash transactions
CREATE POLICY "Users can select their own cash transactions"
    ON public.cash_transactions
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cash transactions"
    ON public.cash_transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash transactions"
    ON public.cash_transactions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash transactions"
    ON public.cash_transactions
    FOR DELETE
    USING (auth.uid() = user_id);

-- 5. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_id 
    ON public.cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_portfolio_id 
    ON public.cash_transactions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date 
    ON public.cash_transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type 
    ON public.cash_transactions(transaction_type);

-- 6. UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_cash_transaction_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_cash_transactions_timestamp ON public.cash_transactions;
CREATE TRIGGER update_cash_transactions_timestamp
    BEFORE UPDATE ON public.cash_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_cash_transaction_timestamp();

-- 7. FUNCTION TO GET PORTFOLIO CASH BALANCE
CREATE OR REPLACE FUNCTION get_portfolio_cash_balance(p_portfolio_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance DECIMAL;
BEGIN
    SELECT COALESCE(SUM(
        CASE 
            WHEN transaction_type IN ('DEPOSIT', 'DIVIDEND', 'INTEREST', 'ADJUSTMENT') THEN amount
            WHEN transaction_type IN ('WITHDRAWAL', 'FEE', 'TAX') THEN -ABS(amount)
            ELSE 0
        END
    ), 0) INTO v_balance
    FROM public.cash_transactions
    WHERE portfolio_id = p_portfolio_id;
    
    RETURN v_balance;
END;
$$;

-- 8. FUNCTION TO GET CASH FLOW SUMMARY BY PERIOD
CREATE OR REPLACE FUNCTION get_cash_flow_summary(
    p_portfolio_id UUID,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    transaction_type TEXT,
    total_amount DECIMAL,
    transaction_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ct.transaction_type,
        SUM(ct.amount) AS total_amount,
        COUNT(*) AS transaction_count
    FROM public.cash_transactions ct
    WHERE ct.portfolio_id = p_portfolio_id
        AND (p_start_date IS NULL OR ct.transaction_date >= p_start_date)
        AND (p_end_date IS NULL OR ct.transaction_date <= p_end_date)
    GROUP BY ct.transaction_type
    ORDER BY total_amount DESC;
END;
$$;

-- 9. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_portfolio_cash_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cash_flow_summary(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;

-- 10. COMMENTS
COMMENT ON TABLE public.cash_transactions IS 'Tracks all cash movements in portfolios including deposits, withdrawals, dividends, and fees';
COMMENT ON FUNCTION get_portfolio_cash_balance IS 'Returns the current cash balance for a portfolio';
COMMENT ON FUNCTION get_cash_flow_summary IS 'Returns aggregated cash flow by transaction type for a portfolio and optional date range';
