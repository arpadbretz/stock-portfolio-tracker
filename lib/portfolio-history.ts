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
    const startDate = new Date(trades[0].date_traded);
    const endDate = new Date();

    // 3. Get all unique tickers
    const uniqueTickers = [...new Set(trades.map(t => t.ticker))];

    // 4. Fetch historical prices for all involved tickers
    const priceCache = new Map<string, Map<string, number>>();

    for (const ticker of uniqueTickers) {
        const prices = await getHistoricalPrices(ticker, startDate, endDate);
        const tickerPriceMap = new Map<string, number>();
        prices.forEach((p: any) => {
            const dateStr = new Date(p.date).toISOString().split('T')[0];
            tickerPriceMap.set(dateStr, p.close);
        });
        priceCache.set(ticker, tickerPriceMap);
    }

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
    const { error: upsertError } = await supabase
        .from('portfolio_history')
        .upsert(historyEntries, { onConflict: 'portfolio_id,date' });

    if (upsertError) throw upsertError;

    return {
        success: true,
        message: `Synced ${historyEntries.length} days of history`,
        daysSynced: historyEntries.length
    };
}
