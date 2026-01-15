import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWeeklySummaryEmail } from '@/lib/email';
import { getBatchPrices } from '@/lib/yahoo-finance';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting weekly portfolio summary generation...');

    try {
        // 1. Get all users who want weekly summaries
        const { data: users, error: usersError } = await supabase
            .from('profiles')
            .select('id, display_name, weekly_summary_enabled, preferred_currency')
            .eq('weekly_summary_enabled', true);

        if (usersError) throw usersError;
        if (!users || users.length === 0) {
            return NextResponse.json({ message: 'No users subscribed to weekly summaries' });
        }

        const results = [];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        for (const user of users) {
            try {
                // Get user's default or primary portfolio
                const { data: portfolios } = await supabase
                    .from('portfolios')
                    .select('id, name')
                    .eq('user_id', user.id)
                    .order('is_default', { ascending: false })
                    .limit(1);

                if (!portfolios || portfolios.length === 0) continue;
                const portfolio = portfolios[0];

                // Get current value vs 7 days ago value
                const { data: history } = await supabase
                    .from('portfolio_history')
                    .select('total_value, cost_basis, date')
                    .eq('portfolio_id', portfolio.id)
                    .gte('date', sevenDaysAgoStr)
                    .order('date', { ascending: true });

                if (!history || history.length < 2) {
                    console.log(`Insufficient history for user ${user.id}`);
                    continue;
                }

                const currentVal = history[history.length - 1].total_value;
                const prevVal = history[0].total_value;
                const weekGain = currentVal - prevVal;
                const weekGainPercent = prevVal > 0 ? (weekGain / prevVal) * 100 : 0;

                // Get Top Movers (using current holdings and their 24h change as a proxy if we don't have stock history)
                // For a true weekly summary, we'd need history for each stock.
                // For now, let's use the holdings and focus on performance.
                const { data: holdings } = await supabase
                    .from('trades')
                    .select('ticker, quantity, action')
                    .eq('portfolio_id', portfolio.id);

                // Simple top movers logic: fetch current holdings' day changes
                // Better than nothing for the summary
                const uniqueTickers = [...new Set(holdings?.map(h => h.ticker) || [])];
                const prices = await getBatchPrices(uniqueTickers);

                const movers = Array.from(prices.values())
                    .map(p => ({
                        ticker: p.ticker,
                        changePercent: p.changePercent
                    }))
                    .sort((a, b) => b.changePercent - a.changePercent)
                    .slice(0, 3);

                // Get user email from auth
                const { data: authUser } = await supabase.auth.admin.getUserById(user.id);
                if (!authUser?.user?.email) continue;

                // Send Email
                const emailResult = await sendWeeklySummaryEmail({
                    to: authUser.user.email,
                    userName: user.display_name || authUser.user.email.split('@')[0],
                    totalValue: currentVal,
                    weekGain: weekGain,
                    weekGainPercent: weekGainPercent,
                    topMovers: movers,
                    portfolioId: portfolio.id,
                    currency: user.preferred_currency || 'USD'
                });

                results.push({ userId: user.id, success: emailResult.success });
            } catch (err) {
                console.error(`Error processing weekly summary for ${user.id}:`, err);
                results.push({ userId: user.id, success: false, error: String(err) });
            }
        }

        return NextResponse.json({
            success: true,
            processed: results.length,
            details: results
        });

    } catch (error: any) {
        console.error('Weekly summary cron error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
