-- Migration 014: Multi-Currency Enhancements
-- Removes GBP and adds currency support to trades, ensures cash transactions are strictly multi-currency

-- 1. CLEANUP GBP FROM CASH_TRANSACTIONS
-- Update any existing GBP transactions to USD (fallback) or user's preferred
UPDATE public.cash_transactions SET currency = 'USD' WHERE currency = 'GBP';

-- Update the check constraint for currency in cash_transactions
ALTER TABLE public.cash_transactions DROP CONSTRAINT IF EXISTS cash_transactions_currency_check;
ALTER TABLE public.cash_transactions ADD CONSTRAINT cash_transactions_currency_check CHECK (currency IN ('USD', 'EUR', 'HUF'));

-- 2. ADD CURRENCY TO TRADES TABLE
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'HUF'));

-- 3. ADD CURRENCY TO REALIZED_PNL TABLE
ALTER TABLE public.realized_pnl ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'HUF'));

-- 4. UPDATE PROFILES CONSTRAINT
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_preferred_currency_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_preferred_currency_check CHECK (preferred_currency IN ('USD', 'EUR', 'HUF'));

-- 5. UPDATE FIFO FUNCTION TO MATCH CURRENCY
-- We need to drop the old one first because the signature changes
DROP FUNCTION IF EXISTS calculate_cost_basis_fifo(UUID, TEXT, DECIMAL);

CREATE OR REPLACE FUNCTION calculate_cost_basis_fifo(
    p_portfolio_id UUID,
    p_ticker TEXT,
    p_sell_quantity DECIMAL,
    p_currency TEXT DEFAULT 'USD'
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
    -- Get BUY trades for this ticker AND currency, ordered by date (FIFO)
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
            AND t.currency = p_currency
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

-- 6. UPDATE PORTFOLIO CASH BALANCE FUNCTION
DROP FUNCTION IF EXISTS get_portfolio_cash_balance_multi(UUID);

CREATE OR REPLACE FUNCTION get_portfolio_cash_balance_multi(p_portfolio_id UUID)
RETURNS TABLE (
    currency TEXT,
    balance DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ct.currency,
        COALESCE(SUM(
            CASE 
                WHEN transaction_type IN ('DEPOSIT', 'DIVIDEND', 'INTEREST', 'ADJUSTMENT') THEN amount
                WHEN transaction_type IN ('WITHDRAWAL', 'FEE', 'TAX') THEN -ABS(amount)
                ELSE 0
            END
        ), 0) AS balance
    FROM public.cash_transactions ct
    WHERE ct.portfolio_id = p_portfolio_id
    GROUP BY ct.currency;
END;
$$;

-- Provide a fallback scalar function that returns balance in USD (legacy support)
CREATE OR REPLACE FUNCTION get_portfolio_cash_balance(p_portfolio_id UUID)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_usd DECIMAL := 0;
BEGIN
    -- This is a simplification. Real conversion should happen in the API layer with current rates.
    -- For now, return the sum of USD, as a scalar return is expected by some parts of the code.
    SELECT COALESCE(SUM(
        CASE 
            WHEN transaction_type IN ('DEPOSIT', 'DIVIDEND', 'INTEREST', 'ADJUSTMENT') THEN amount
            WHEN transaction_type IN ('WITHDRAWAL', 'FEE', 'TAX') THEN -ABS(amount)
            ELSE 0
        END
    ), 0) INTO v_total_usd
    FROM public.cash_transactions
    WHERE portfolio_id = p_portfolio_id AND currency = 'USD';
    
    RETURN v_total_usd;
END;
$$;

-- 5. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION get_portfolio_cash_balance_multi(UUID) TO authenticated;

-- 6. COMMENTS
COMMENT ON FUNCTION get_portfolio_cash_balance_multi IS 'Returns the current cash balance for each currency in a portfolio';
