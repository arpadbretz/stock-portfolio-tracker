-- Migration: Add TWR and Benchmark tracking to portfolio_history

ALTER TABLE public.portfolio_history 
ADD COLUMN IF NOT EXISTS daily_return NUMERIC, -- The return for just that day
ADD COLUMN IF NOT EXISTS cumulative_twr NUMERIC, -- Geometric linked return since inception
ADD COLUMN IF NOT EXISTS bench_return NUMERIC, -- Daily benchmark return
ADD COLUMN IF NOT EXISTS bench_cumulative NUMERIC; -- Benchmark cumulative return

COMMENT ON COLUMN public.portfolio_history.cumulative_twr IS 'Time-Weighted Return since inception, adjusted for cash flows.';
