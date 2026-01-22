import { NextResponse } from 'next/server';
import { getCachedBatchPrices } from '@/lib/yahoo-finance/cached';
import { aggregateHoldings, calculatePortfolioSummary } from '@/lib/portfolio';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const requestedPortfolioId = searchParams.get('id');

        // 1. DETERMINE WHICH PORTFOLIO TO FETCH
        let portfolioId = requestedPortfolioId;
        let portfolioName = 'My Portfolio';

        if (!portfolioId) {
            // First, try to find a portfolio marked as default
            const { data: defaultPortfolio } = await supabase
                .from('portfolios')
                .select('id')
                .eq('user_id', user.id)
                .eq('is_default', true)
                .limit(1)
                .single();

            if (defaultPortfolio) {
                portfolioId = defaultPortfolio.id;
            } else {
                // If no explicit default, get the first created one
                const { data: firstPortfolio } = await supabase
                    .from('portfolios')
                    .select('id')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: true })
                    .limit(1)
                    .single();

                if (firstPortfolio) {
                    portfolioId = firstPortfolio.id;
                }
            }
        }

        // If we still don't have a portfolio ID, or if we need to verify the requested one
        // and get its details (name, color, etc.)
        let portfolio;

        if (portfolioId) {
            const { data: existingPortfolio, error: fetchError } = await supabase
                .from('portfolios')
                .select('*')
                .eq('id', portfolioId)
                .eq('user_id', user.id)
                .single();

            if (!fetchError && existingPortfolio) {
                portfolio = existingPortfolio;
            }
        }

        // If still no portfolio (either didn't exist, invalid ID, or user has none), create one
        if (!portfolio) {
            // Only create if we weren't just looking for a specific invalid ID
            // If user explicitly asked for ID X and it doesn't exist, return 404
            if (requestedPortfolioId) {
                return NextResponse.json({ success: false, error: 'Portfolio not found' }, { status: 404 });
            }

            console.log('No portfolio found, creating one for user:', user.id);
            const { data: newPortfolio, error: createError } = await supabase
                .from('portfolios')
                .insert({
                    user_id: user.id,
                    name: 'My Portfolio',
                    color: '#10b981'
                })
                .select()
                .single();

            if (createError) {
                console.error('Error creating portfolio:', createError);
                throw createError;
            }

            // Set as default since it's the only one
            await supabase
                .from('user_preferences')
                .upsert({ user_id: user.id, default_portfolio_id: newPortfolio.id });

            portfolio = newPortfolio;
        }

        console.log('Step 2: Fetching trades for portfolio:', portfolio.id);

        // 2. FETCH TRADES DIRECTLY
        const { data: dbTrades, error: tradesError } = await supabase
            .from('trades')
            .select('*')
            .eq('portfolio_id', portfolio.id)
            .order('date_traded', { ascending: false });

        if (tradesError) {
            console.error('Trades fetch error:', tradesError);
            throw tradesError;
        }

        // 3. MAP DATABASE TRADES TO APP FORMAT
        const trades = (dbTrades || []).map((t) => ({
            id: t.id,
            portfolioId: t.portfolio_id,
            ticker: t.ticker,
            action: t.action,
            quantity: Number(t.quantity),
            pricePerShare: Number(t.price_per_share),
            fees: Number(t.fees),
            totalCost: Number(t.total_cost || 0),
            notes: t.notes,
            timestamp: t.date_traded,
            date: t.date_traded,
        }));

        // 4. FETCH PRICES AND CALCULATE SUMMARY
        const tickers = [...new Set(trades.map(t => t.ticker.toUpperCase()))];
        console.log('Fetching prices for tickers:', tickers);

        const refresh = searchParams.get('refresh') === 'true';
        let prices: Map<string, any>;

        if (refresh) {
            const { getBatchPrices } = await import('@/lib/yahoo-finance');
            prices = await getBatchPrices(tickers);
        } else {
            prices = await getCachedBatchPrices(tickers);
        }

        const sets = ['USDEUR=X', 'USDHUF=X', 'USDGBP=X'];
        const ratesData = await getCachedBatchPrices(sets);
        const exchangeRates = {
            USD: 1,
            EUR: ratesData.get('USDEUR=X')?.currentPrice || 0.92,
            HUF: ratesData.get('USDHUF=X')?.currentPrice || 350,
            GBP: ratesData.get('USDGBP=X')?.currentPrice || 0.79,
        };

        // Aggregate and calculate
        const holdings = aggregateHoldings(trades, prices);
        const summary = calculatePortfolioSummary(holdings, exchangeRates);

        return NextResponse.json({
            success: true,
            data: {
                id: portfolio.id,
                name: portfolio.name,
                description: portfolio.description,
                color: portfolio.color,
                trades,
                holdings: summary.holdings,
                summary,
                lastUpdated: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('=== PORTFOLIO API ERROR ===', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                details: error instanceof Error ? error.stack : String(error)
            },
            { status: 500 }
        );
    }
}