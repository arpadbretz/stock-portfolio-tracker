-- Migration: Setup Price Alerts and Extend Profiles
-- Optimized schema for stock price alerts and user notification preferences

-- 1. Price Alerts Table
CREATE TABLE IF NOT EXISTS public.price_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    target_price DECIMAL(15,4) NOT NULL,
    is_above BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE for "price goes above", FALSE for "price goes below"
    triggered BOOLEAN NOT NULL DEFAULT FALSE,
    triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments for clarity
COMMENT ON COLUMN public.price_alerts.is_above IS 'Alert type: true if price rises above target, false if it drops below';
COMMENT ON COLUMN public.price_alerts.triggered IS 'Whether the alert has been fired and email sent';

-- 2. Indexes (For fast cron job checks)
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_id ON public.price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_symbol ON public.price_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON public.price_alerts(triggered) WHERE triggered = FALSE;

-- 3. Row Level Security (RLS)
ALTER TABLE public.price_alerts ENABLE ROW LEVEL SECURITY;

-- Select policy
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own alerts') THEN
        CREATE POLICY "Users can view their own alerts" ON public.price_alerts FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- Insert policy
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create their own alerts') THEN
        CREATE POLICY "Users can create their own alerts" ON public.price_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Update policy
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own alerts') THEN
        CREATE POLICY "Users can update their own alerts" ON public.price_alerts FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Delete policy
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can delete their own alerts') THEN
        CREATE POLICY "Users can delete their own alerts" ON public.price_alerts FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4. Profile Extensions
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

-- Documentation for profiles
COMMENT ON COLUMN public.profiles.display_name IS 'User name used in notification greetings';
COMMENT ON COLUMN public.profiles.email_alerts IS 'Master switch for all email notifications';
COMMENT ON COLUMN public.profiles.welcome_email_sent IS 'Prevents duplicate welcome emails';

-- 5. Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_price_alerts_updated_at ON public.price_alerts;
CREATE TRIGGER tr_price_alerts_updated_at
    BEFORE UPDATE ON public.price_alerts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
