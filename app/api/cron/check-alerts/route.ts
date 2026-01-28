import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPriceAlertEmail } from '@/lib/email';
import { getCurrentPrice } from '@/lib/yahoo-finance';

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// It checks all active price alerts and sends emails when triggered

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    // Verify the request is from a trusted source (cron job)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.log('Unauthorized cron request');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting price alert check...');

    try {
        // 1. Get all active (untriggered) price alerts
        const { data: alerts, error: alertsError } = await supabase
            .from('price_alerts')
            .select(`
                id,
                user_id,
                symbol,
                target_price,
                condition,
                is_triggered,
                created_at
            `)
            .eq('is_triggered', false);

        if (alertsError) {
            console.error('Error fetching alerts:', alertsError);
            return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
        }

        if (!alerts || alerts.length === 0) {
            console.log('No active alerts to check');
            return NextResponse.json({ message: 'No active alerts', checked: 0, triggered: 0 });
        }

        console.log(`Found ${alerts.length} active alerts to check`);

        // 2. Get unique tickers and fetch current prices in batch
        const uniqueTickers = [...new Set(alerts.map(a => a.symbol))];
        const { getBatchPrices } = await import('@/lib/yahoo-finance');
        const priceMap = await getBatchPrices(uniqueTickers);

        // Convert to a simpler map for the logic below
        const priceValueMap = new Map<string, number>();
        priceMap.forEach((data, ticker) => {
            if (data?.currentPrice) priceValueMap.set(ticker, data.currentPrice);
        });

        console.log(`Fetched prices for ${priceValueMap.size} tickers`);

        // 3. Check each alert and trigger if conditions are met
        const triggeredAlerts: string[] = [];
        const emailsSent: string[] = [];

        for (const alert of alerts) {
            const currentPrice = priceValueMap.get(alert.symbol);
            if (!currentPrice) continue;

            const shouldTrigger = alert.condition === 'above'
                ? currentPrice >= alert.target_price
                : currentPrice <= alert.target_price;

            if (shouldTrigger) {
                console.log(`Alert triggered: ${alert.symbol} at $${currentPrice} (target: $${alert.target_price})`);

                // Mark alert as triggered
                const { error: updateError } = await supabase
                    .from('price_alerts')
                    .update({ is_triggered: true, triggered_at: new Date().toISOString() })
                    .eq('id', alert.id);

                if (updateError) {
                    console.error(`Failed to update alert ${alert.id}:`, updateError);
                    continue;
                }

                triggeredAlerts.push(alert.id);

                // Get user email
                const { data: userData, error: userError } = await supabase.auth.admin.getUserById(alert.user_id);

                if (userError || !userData?.user?.email) {
                    console.error(`Failed to get user email for ${alert.user_id}:`, userError);
                    continue;
                }

                // Check user email preferences
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email_alerts_enabled, display_name')
                    .eq('id', alert.user_id)
                    .single();

                // Skip if user has disabled email alerts
                if (profile?.email_alerts_enabled === false) {
                    console.log(`User ${alert.user_id} has disabled email alerts`);
                    continue;
                }

                // Send email notification
                const result = await sendPriceAlertEmail({
                    to: userData.user.email,
                    userName: profile?.display_name || userData.user.email.split('@')[0],
                    ticker: alert.symbol,
                    currentPrice,
                    targetPrice: alert.target_price,
                    alertType: alert.condition as 'above' | 'below',
                });

                if (result.success) {
                    emailsSent.push(alert.id);
                    console.log(`Email sent for alert ${alert.id}`);
                } else {
                    console.error(`Failed to send email for alert ${alert.id}:`, result.error);
                }
            }
        }

        console.log(`Check complete: ${alerts.length} checked, ${triggeredAlerts.length} triggered, ${emailsSent.length} emails sent`);

        return NextResponse.json({
            success: true,
            checked: alerts.length,
            triggered: triggeredAlerts.length,
            emailsSent: emailsSent.length,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Price alert check error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Allow POST for manual triggering (with auth)
export async function POST(request: Request) {
    // This would require authentication in production
    return GET(request);
}
