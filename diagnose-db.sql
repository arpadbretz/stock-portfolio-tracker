-- Run this in Supabase SQL Editor to diagnose the issue
-- Copy the entire script and run it all at once

-- 1. Check if trades table exists and what columns it has
SELECT 
    'trades table columns' as check_type,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'trades'
ORDER BY ordinal_position;

-- 2. Check RLS policies on trades table
SELECT 
    'RLS policies' as check_type,
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as check_expression
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'trades';

-- 3. Check if RLS is enabled
SELECT 
    'RLS enabled' as check_type,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'trades';

-- 4. Check your portfolios
SELECT 
    'your portfolios' as check_type,
    id,
    name,
    is_default,
    created_at
FROM portfolios 
WHERE user_id = auth.uid();

-- 5. Check your trades (if any)
SELECT 
    'your trades' as check_type,
    id,
    ticker,
    action,
    quantity,
    price_per_share,
    fees,
    total_cost,
    date_traded,
    created_at
FROM trades 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 6. Count total trades in system (to see if insert worked at all)
SELECT 
    'total trades count' as check_type,
    COUNT(*) as total_trades
FROM trades;
