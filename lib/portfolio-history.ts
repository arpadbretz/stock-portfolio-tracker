import { createClient } from '@/lib/supabase/server';
import { getHistoricalPrices } from '@/lib/yahoo-finance';
import { Trade } from '@/types/portfolio';

interface DailyHolding {
    ticker: string;
    quantity: number;
}

export async function syncPortfolioHistory(portfolioId: string, userId: string) {
    const supabase = await createClient();

    // 1. Get all trades for this portfolio
    const { data: trades, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('date_traded', { ascending: true });

    if (tradesError) throw tradesError;
    if (!trades || trades.length === 0) return { success: true, message: 'No trades found' };

    // 2. Identify timeframe
    let startTradeDate = trades[0].date_traded ? new Date(trades[0].date_traded) : new Date();

    // Safety check for invalid dates
    if (isNaN(startTradeDate.getTime())) {
        console.warn('Invalid trade date found, defaulting to trade createdAt or now');
        startTradeDate = trades[0].created_at ? new Date(trades[0].created_at) : new Date();
    }

    const startDate = startTradeDate;
    const endDate = new Date();

    console.log(`Syncing from ${startDate.toISOString()} to ${endDate.toISOString()}`);

    // 3. Get all unique tickers
    const uniqueTickers = [...new Set(trades.map(t => t.ticker))];

    // 4. Fetch historical prices for all involved tickers in parallel
    console.log(`Syncing ${uniqueTickers.length} tickers for portfolio ${portfolioId}...`);
    const priceCache = new Map<string, Map<string, number>>();

    await Promise.all(uniqueTickers.map(async (ticker) => {
        try {
            const prices = await getHistoricalPrices(ticker, startDate, endDate);
            const tickerPriceMap = new Map<string, number>();
            prices.forEach((p: any) => {
                const dateStr = new Date(p.date).toISOString().split('T')[0];
                tickerPriceMap.set(dateStr, p.close);
            });
            priceCache.set(ticker, tickerPriceMap);
            console.log(`Fetched ${prices.length} days of data for ${ticker}`);
        } catch (err) {
            console.error(`Failed to fetch history for ${ticker}:`, err);
        }
    }));

    // 5. Iterate day by day and calculate portfolio value
    const historyEntries = [];
    let currentHoldings = new Map<string, number>();
    let realizedPnl = 0;
    let totalSpent = 0; // Cumulative cost basis

    const iterDate = new Date(startDate);
    const todayStr = new Date().toISOString().split('T')[0];

    while (iterDate <= endDate) {
        const dateStr = iterDate.toISOString().split('T')[0];

        // Update holdings based on trades that happened ON this day
        const dayTrades = trades.filter(t => new Date(t.date_traded).toISOString().split('T')[0] === dateStr);

        for (const trade of dayTrades) {
            const qty = Number(trade.quantity);
            const price = Number(trade.price_per_share);
            const fees = Number(trade.fees || 0);

            if (trade.action === 'BUY') {
                const existingQty = currentHoldings.get(trade.ticker) || 0;
                currentHoldings.set(trade.ticker, existingQty + qty);
                totalSpent += (qty * price) + fees;
            } else {
                const existingQty = currentHoldings.get(trade.ticker) || 0;
                currentHoldings.set(trade.ticker, Math.max(0, existingQty - qty));
                // Simplified realized P&L: (sale price - average cost)
                // For now, we'll just track total portfolio value effectively
                realizedPnl += (qty * price) - fees;
            }
        }

        // Calculate total market value of all holdings on this day
        let dailyMarketValue = 0;
        let dailyCostBasis = 0;

        for (const [ticker, quantity] of currentHoldings.entries()) {
            if (quantity <= 0) continue;

            const tickerPrices = priceCache.get(ticker);
            // If it's a weekend/holiday, try to find the last available price
            let price = tickerPrices?.get(dateStr);

            // Lookback for missing prices (weekends) up to 5 days
            if (price === undefined) {
                for (let i = 1; i <= 5; i++) {
                    const prevDate = new Date(iterDate);
                    prevDate.setDate(prevDate.getDate() - i);
                    const prevDateStr = prevDate.toISOString().split('T')[0];
                    price = tickerPrices?.get(prevDateStr);
                    if (price !== undefined) break;
                }
            }

            if (price !== undefined) {
                dailyMarketValue += quantity * price;
            }
        }

        historyEntries.push({
            portfolio_id: portfolioId,
            user_id: userId,
            date: dateStr,
            total_value: dailyMarketValue,
            cost_basis: totalSpent, // This is a bit simplified, but works for basic tracking
            realized_pnl: realizedPnl
        });

        // Increment day
        iterDate.setDate(iterDate.getDate() + 1);
    }

    // 6. Upsert into database
    console.log(`Upserting ${historyEntries.length} entries for ${portfolioId}...`);
    if (historyEntries.length === 0) {
        console.warn('No history entries generated. Check trade dates.');
        return { success: true, message: 'No history entries to sync', daysSynced: 0 };
    }

    const { error: upsertError } = await supabase
        .from('portfolio_history')
        .upsert(historyEntries, { onConflict: 'portfolio_id,date' });

    if (upsertError) {
        console.error('Upsert failed:', upsertError);
        throw upsertError;
    }

    console.log(`Successfully synced ${historyEntries.length} entries for ${portfolioId}`);
    return {
        success: true,
        message: `Synced ${historyEntries.length} days of history`,
        daysSynced: historyEntries.length
    };
}
