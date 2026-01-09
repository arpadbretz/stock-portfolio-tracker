// API Route: GET /api/portfolio - Fetch all trades and calculate holdings

import { NextResponse } from 'next/server';
import { getAllTrades } from '@/lib/db';
import { getCachedBatchPrices } from '@/lib/yahoo-finance/cached';
import { aggregateHoldings, calculatePortfolioSummary } from '@/lib/portfolio';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all trades filtered by user (handled by RLS if supabase client passed)
        const trades = await getAllTrades(supabase);

        // Get unique tickers
        const tickers = [...new Set(trades.map(t => t.ticker.toUpperCase()))];

        // Fetch current prices for all tickers (cached for 15m)
        const prices = await getCachedBatchPrices(tickers);

        // Fetch real-time exchange rates (cached)
        const ratesData = await getCachedBatchPrices(['USDEUR=X', 'USDHUF=X']);
        const exchangeRates = {
            USD: 1,
            EUR: ratesData.get('USDEUR=X')?.currentPrice || 0.92,
            HUF: ratesData.get('USDHUF=X')?.currentPrice || 350,
        };

        // Aggregate trades into holdings
        const holdings = aggregateHoldings(trades, prices);

        // Calculate portfolio summary
        const summary = calculatePortfolioSummary(holdings, exchangeRates);

        return NextResponse.json({
            success: true,
            data: {
                trades,
                holdings,
                summary,
                lastUpdated: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            { status: 500 }
        );
    }
}
