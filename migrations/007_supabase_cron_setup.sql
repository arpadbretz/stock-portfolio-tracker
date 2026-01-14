-- SUPABASE CRON JOBS (Workaround for Vercel Hobby Limits)
-- This setup allows you to run cron jobs at ANY frequency (e.g. every 15 mins)
-- directly from your Supabase database.

-- 1. Enable the required extensions
CREATE EXTENSION IF NOT EXISTS "pg_net";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- 2. Create a vault or table to store your CRON_SECRET if you don't want it in plain text
-- For now, we'll use a variable in the job logic.

-- 3. Schedule the Price Alerts check (Every 15 minutes)
SELECT cron.schedule (
    'check-price-alerts',
    '*/15 * * * *',
    $$
    SELECT net.http_get(
        url := 'https://your-app-url.vercel.app/api/cron/check-alerts',
        headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'
    );
    $$
);

-- 4. Schedule the Portfolio History Sync (Every hour or daily)
-- This ensures the "Performance Line" is always fresh.
SELECT cron.schedule (
    'sync-portfolio-history',
    '0 * * * *', -- Every hour
    $$
    SELECT net.http_get(
        url := 'https://your-app-url.vercel.app/api/cron/sync-history',
        headers := '{"Authorization": "Bearer YOUR_CRON_SECRET"}'
    );
    $$
);

-- Note: Replace 'https://your-app-url.vercel.app' with your actual Vercel URL
-- and 'YOUR_CRON_SECRET' with the CRON_SECRET from your .env.local
