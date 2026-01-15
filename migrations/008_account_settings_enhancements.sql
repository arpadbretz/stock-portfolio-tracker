-- Add new settings columns to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_alerts_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_summary_enabled BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stealth_mode_enabled BOOLEAN DEFAULT false;

-- Add description for what these are
COMMENT ON COLUMN public.profiles.email_alerts_enabled IS 'Whether the user receives real-time price alert emails';
COMMENT ON COLUMN public.profiles.weekly_summary_enabled IS 'Whether the user receives a weekly portfolio performance summary';
COMMENT ON COLUMN public.profiles.stealth_mode_enabled IS 'Whether monetary values are blurred/hidden by default in the UI';
