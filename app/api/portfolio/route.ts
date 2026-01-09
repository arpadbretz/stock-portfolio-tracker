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
        let { data: portfolio, error: portfolioError } = await supabase
            .from('portfolios')
            .select('id, name')
            .eq('user_id', user.id)
            .single();

        if (portfolioError && portfolioError.code !== 'PGRST116') {
            // PGRST116 is "no rows returned", which is fine - we'll create one
            console.error('Error fetching portfolio:', portfolioError);
            throw portfolioError;
        }

        if (!portfolio) {
            console.log('No portfolio found, creating one for user:', user.id);
            const { data: newPortfolio, error: createError } = await supabase
                .from('portfolios')
                .insert({
                    user_id: user.id,
                    name: 'My Portfolio',
                    is_default: true
                })
                .select('id, name')
                .single();

            if (createError) {
                console.error('Error creating portfolio:', createError);
                console.error('Create error details:', {
                    message: createError.message,
                    details: createError.details,
                    hint: createError.hint,
                    code: createError.code
                });
                throw createError;
            }

            console.log('Portfolio created successfully:', newPortfolio);
            portfolio = newPortfolio;
        }


        console.log('Step 2: Fetching trades for portfolio:', portfolio.id);
        // 2. FETCH TRADES DIRECTLY
        // We fetch directly here to ensure we get trades for THIS specific portfolio
        const { data: dbTrades, error: tradesError } = await supabase
            .from('trades')
            .select('*')
            .eq('portfolio_id', portfolio.id)
            .order('date_traded', { ascending: false });

        if (tradesError) {
            console.error('Trades fetch error:', tradesError);
            throw tradesError;
        }
        console.log('Trades fetched:', dbTrades?.length || 0, 'trades');

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
            totalCost: Number(t.total_cost || 0),
            notes: t.notes,
            timestamp: t.date_traded,
            date: t.date_traded,
        }));

        // 4. YOUR EXISTING LOGIC (Unchanged)
        const tickers = [...new Set(trades.map(t => t.ticker.toUpperCase()))];
        console.log('Step 4: Fetching prices for tickers:', tickers);

        // Fetch current prices 
        const prices = await getCachedBatchPrices(tickers);
        console.log('Prices fetched for', prices.size, 'tickers');

        // Fetch exchange rates
        console.log('Step 5: Fetching exchange rates');
        const ratesData = await getCachedBatchPrices(['USDEUR=X', 'USDHUF=X']);
        const exchangeRates = {
            USD: 1,
            EUR: ratesData.get('USDEUR=X')?.currentPrice || 0.92,
            HUF: ratesData.get('USDHUF=X')?.currentPrice || 350,
        };
        console.log('Exchange rates:', exchangeRates);

        // Aggregate trades into holdings (using your existing function)
        console.log('Step 6: Aggregating holdings');
        const holdings = aggregateHoldings(trades, prices);
        console.log('Holdings aggregated:', holdings.length);

        // Calculate portfolio summary (using your existing function)
        console.log('Step 7: Calculating portfolio summary');
        const summary = calculatePortfolioSummary(holdings, exchangeRates);
        console.log('Summary calculated successfully');

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
        console.error('=== PORTFOLIO API ERROR ===');
        console.error('Error details:', error);
        console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
        if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
        }
        console.error('========================');

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                errorType: error instanceof Error ? error.constructor.name : typeof error,
                details: error instanceof Error ? error.stack : String(error)
            },
            { status: 500 }
        );
    }
}