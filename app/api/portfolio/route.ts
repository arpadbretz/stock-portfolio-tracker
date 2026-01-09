import { NextResponse } from 'next/server';
// We remove getAllTrades because we need to fetch by Portfolio ID explicitly now
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

        // 1. GET OR CREATE PORTFOLIO ID
        // We need this ID to filter trades and to send it to the frontend for the "Add" button
        let { data: portfolio } = await supabase
            .from('portfolios')
            .select('id, name')
            .eq('user_id', user.id)
            .single();

        if (!portfolio) {
            const { data: newPortfolio, error: createError } = await supabase
                .from('portfolios')
                .insert({ user_id: user.id, name: 'My Portfolio' })
                .select('id, name')
                .single();

            if (createError) throw createError;
            portfolio = newPortfolio;
        }

        // 2. FETCH TRADES DIRECTLY
        // We fetch directly here to ensure we get trades for THIS specific portfolio
        const { data: dbTrades, error: tradesError } = await supabase
            .from('trades')
            .select('*')
            .eq('portfolio_id', portfolio.id)
            .order('date_traded', { ascending: false });

        if (tradesError) throw tradesError;

        // 3. MAP DATABASE TRADES TO YOUR APP'S FORMAT
        // Your helper functions expect camelCase (pricePerShare), DB returns snake_case (price_per_share)
        const trades = (dbTrades || []).map((t) => ({
            id: t.id,
            portfolioId: t.portfolio_id,
            ticker: t.ticker,
            action: t.action, // 'BUY' or 'SELL'
            quantity: Number(t.quantity),
            pricePerShare: Number(t.price_per_share),
            fees: Number(t.fees),
            notes: t.notes,
            date: t.date_traded,
        }));

        // 4. YOUR EXISTING LOGIC (Unchanged)
        const tickers = [...new Set(trades.map(t => t.ticker.toUpperCase()))];

        // Fetch current prices 
        const prices = await getCachedBatchPrices(tickers);

        // Fetch exchange rates
        const ratesData = await getCachedBatchPrices(['USDEUR=X', 'USDHUF=X']);
        const exchangeRates = {
            USD: 1,
            EUR: ratesData.get('USDEUR=X')?.currentPrice || 0.92,
            HUF: ratesData.get('USDHUF=X')?.currentPrice || 350,
        };

        // Aggregate trades into holdings (using your existing function)
        const holdings = aggregateHoldings(trades, prices);

        // Calculate portfolio summary (using your existing function)
        const summary = calculatePortfolioSummary(holdings, exchangeRates);

        return NextResponse.json({
            success: true,
            data: {
                id: portfolio.id, // <--- VITAL: This allows the frontend to Add Trades
                name: portfolio.name,
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