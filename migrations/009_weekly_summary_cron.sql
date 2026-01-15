-- Migration: Weekly Portfolio Summary Cron
-- This job triggers the weekly performance report email for all opted-in users

-- Schedule the Weekly Summary (Every Sunday at 00:00 UTC)
SELECT cron.schedule (
    'weekly-portfolio-summary',
    '0 0 * * 0', 
    $$
    SELECT net.http_get(
        url := 'https://your-app-url.vercel.app/api/cron/weekly-summary',
        headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'
    );
    $$
);

-- Note: 
-- 1. Replace 'https://your-app-url.vercel.app' with your actual NEXT_PUBLIC_APP_URL.
-- 2. Replace 'YOUR_CRON_SECRET' with the CRON_SECRET defined in your environment variables.
-- 3. You can run this SQL in the Supabase SQL Editor.
