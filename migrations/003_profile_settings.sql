-- Migration: Add user settings to profiles table
-- Adds display_name and email_alerts to the profiles table for use in alerts and emails

-- Add display_name if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT NULL;

-- Add email_alerts toggle
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN DEFAULT TRUE;

-- Add welcome_email_sent flag
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS welcome_email_sent BOOLEAN DEFAULT FALSE;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.display_name IS 'User preferred display name';
COMMENT ON COLUMN public.profiles.email_alerts IS 'Toggle for receiving email alerts';
COMMENT ON COLUMN public.profiles.welcome_email_sent IS 'Tracks if welcome email has been sent';
