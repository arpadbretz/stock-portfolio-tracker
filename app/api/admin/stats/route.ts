import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get tracked tickers from trades
        const { data: tradeSymbols } = await supabase
            .from('trades')
            .select('ticker')
            .order('created_at', { ascending: false });

        // Get watchlist symbols
        const { data: watchlistSymbols } = await supabase
            .from('watchlist_items')
            .select('symbol, user_id');

        // Get alert symbols
        const { data: alertSymbols } = await supabase
            .from('price_alerts')
            .select('symbol, user_id, is_triggered');

        // Get user count
        const { count: userCount } = await supabase
            .from('portfolios')
            .select('user_id', { count: 'exact', head: true });

        // Get portfolio count
        const { count: portfolioCount } = await supabase
            .from('portfolios')
            .select('id', { count: 'exact', head: true });

        // Get total trades count
        const { count: tradeCount } = await supabase
            .from('trades')
            .select('id', { count: 'exact', head: true });

        // Get DCF analyses count
        const { data: dcfAnalyses } = await supabase
            .from('dcf_analyses')
            .select('symbol');

        // Process ticker counts
        const tickerCounts: Record<string, { trades: number; watchlist: number; alerts: number; total: number }> = {};

        tradeSymbols?.forEach((t: any) => {
            const sym = t.ticker?.toUpperCase();
            if (sym) {
                if (!tickerCounts[sym]) tickerCounts[sym] = { trades: 0, watchlist: 0, alerts: 0, total: 0 };
                tickerCounts[sym].trades++;
                tickerCounts[sym].total++;
            }
        });

        watchlistSymbols?.forEach((w: any) => {
            const sym = w.symbol?.toUpperCase();
            if (sym) {
                if (!tickerCounts[sym]) tickerCounts[sym] = { trades: 0, watchlist: 0, alerts: 0, total: 0 };
                tickerCounts[sym].watchlist++;
                tickerCounts[sym].total++;
            }
        });

        alertSymbols?.forEach((a: any) => {
            const sym = a.symbol?.toUpperCase();
            if (sym) {
                if (!tickerCounts[sym]) tickerCounts[sym] = { trades: 0, watchlist: 0, alerts: 0, total: 0 };
                tickerCounts[sym].alerts++;
                tickerCounts[sym].total++;
            }
        });

        // Sort tickers by total count
        const sortedTickers = Object.entries(tickerCounts)
            .map(([symbol, counts]) => ({ symbol, ...counts }))
            .sort((a, b) => b.total - a.total);

        // Get unique user count from watchlist
        const uniqueWatchlistUsers = new Set(watchlistSymbols?.map((w: any) => w.user_id) || []).size;
        const uniqueAlertUsers = new Set(alertSymbols?.map((a: any) => a.user_id) || []).size;
        const triggeredAlerts = alertSymbols?.filter((a: any) => a.is_triggered).length || 0;

        return NextResponse.json({
            success: true,
            data: {
                stats: {
                    totalUsers: userCount || 0,
                    totalPortfolios: portfolioCount || 0,
                    totalTrades: tradeCount || 0,
                    totalWatchlistItems: watchlistSymbols?.length || 0,
                    totalAlerts: alertSymbols?.length || 0,
                    triggeredAlerts,
                    totalDcfAnalyses: dcfAnalyses?.length || 0,
                    uniqueTickers: sortedTickers.length,
                    usersWithWatchlist: uniqueWatchlistUsers,
                    usersWithAlerts: uniqueAlertUsers,
                },
                tickers: sortedTickers.slice(0, 50), // Top 50 tickers
            }
        });
    } catch (error) {
        console.error('Admin API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
