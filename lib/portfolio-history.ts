import { createClient } from '@/lib/supabase/server';
import { getHistoricalPrices, getHistoricalBenchmark } from '@/lib/yahoo-finance';
import { Trade } from '@/types/portfolio';

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
    if (isNaN(startTradeDate.getTime())) {
        startTradeDate = trades[0].created_at ? new Date(trades[0].created_at) : new Date();
    }

    const startDate = startTradeDate;
    const endDate = new Date();

    // 3. Get all unique tickers + Benchmark
    const uniqueTickers = [...new Set(trades.map(t => t.ticker))];

    // 4. Fetch historical prices for all involved tickers + Benchmark in parallel
    const priceCache = new Map<string, Map<string, number>>();
    const benchCache = new Map<string, number>();

    await Promise.all([
        ...uniqueTickers.map(async (ticker) => {
            try {
                const prices = await getHistoricalPrices(ticker, startDate, endDate);
                const tickerPriceMap = new Map<string, number>();
                prices.forEach((p: any) => {
                    const dateStr = new Date(p.date).toISOString().split('T')[0];
                    tickerPriceMap.set(dateStr, p.close);
                });
                priceCache.set(ticker, tickerPriceMap);
            } catch (err) {
                console.error(`Failed to fetch history for ${ticker}:`, err);
            }
        }),
        (async () => {
            try {
                const benchData = await getHistoricalBenchmark(startDate, endDate);
                benchData.forEach((p: any) => {
                    const dateStr = new Date(p.date).toISOString().split('T')[0];
                    benchCache.set(dateStr, p.value);
                });
            } catch (err) {
                console.error(`Failed to fetch benchmark history:`, err);
            }
        })()
    ]);

    // 5. Iterate day by day and calculate portfolio value + TWR
    const historyEntries = [];
    let currentHoldings = new Map<string, number>();
    let realizedPnl = 0;
    let totalSpent = 0;
    let prevTotalValue = 0;
    let cumulativeTwr = 1;
    let initialBenchValue = benchmarkValueAtDate(startDate, benchCache);
    let cumulativeBench = 1;

    const iterDate = new Date(startDate);

    while (iterDate <= endDate) {
        const dateStr = iterDate.toISOString().split('T')[0];
        const dayTrades = trades.filter(t => new Date(t.date_traded).toISOString().split('T')[0] === dateStr);

        let dailyCashFlow = 0;
        for (const trade of dayTrades) {
            const qty = Number(trade.quantity);
            const price = Number(trade.price_per_share);
            const fees = Number(trade.fees || 0);

            if (trade.action === 'BUY') {
                const existingQty = currentHoldings.get(trade.ticker) || 0;
                currentHoldings.set(trade.ticker, existingQty + qty);
                totalSpent += (qty * price) + fees;
                dailyCashFlow += (qty * price) + fees;
            } else {
                const existingQty = currentHoldings.get(trade.ticker) || 0;
                currentHoldings.set(trade.ticker, Math.max(0, existingQty - qty));
                realizedPnl += (qty * price) - fees;
                dailyCashFlow -= (qty * price) - fees;
            }
        }

        // Calculate total market value
        let dailyMarketValue = 0;
        for (const [ticker, quantity] of currentHoldings.entries()) {
            if (quantity <= 0) continue;
            const price = getPriceAtDate(ticker, iterDate, priceCache);
            if (price !== undefined) dailyMarketValue += quantity * price;
        }

        // TWR Calculation
        // R = (EV - (BV + CF)) / (BV + CF)
        let dailyReturn = 0;
        const denominator = prevTotalValue + dailyCashFlow;
        if (denominator > 0) {
            dailyReturn = (dailyMarketValue - denominator) / denominator;
            cumulativeTwr *= (1 + dailyReturn);
        }

        // Benchmark Calculation
        const currentBenchValue = benchmarkValueAtDate(iterDate, benchCache);
        if (initialBenchValue && currentBenchValue) {
            cumulativeBench = currentBenchValue / initialBenchValue;
        }

        historyEntries.push({
            portfolio_id: portfolioId,
            user_id: userId,
            date: dateStr,
            total_value: dailyMarketValue,
            cost_basis: totalSpent,
            realized_pnl: realizedPnl,
            daily_return: dailyReturn,
            cumulative_twr: cumulativeTwr - 1,
            bench_return: 0, // Not strictly needed if we have cumulative
            bench_cumulative: cumulativeBench - 1
        });

        prevTotalValue = dailyMarketValue;
        iterDate.setDate(iterDate.getDate() + 1);
    }

    // 6. Upsert into database
    if (historyEntries.length === 0) return { success: true, message: 'No history to sync' };

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

function getPriceAtDate(ticker: string, date: Date, cache: Map<string, Map<string, number>>): number | undefined {
    const tickerPrices = cache.get(ticker);
    if (!tickerPrices) return undefined;

    const dateStr = date.toISOString().split('T')[0];
    let price = tickerPrices.get(dateStr);

    if (price === undefined) {
        for (let i = 1; i <= 7; i++) {
            const prevDate = new Date(date);
            prevDate.setDate(prevDate.getDate() - i);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            price = tickerPrices.get(prevDateStr);
            if (price !== undefined) break;
        }
    }
    return price;
}

function benchmarkValueAtDate(date: Date, cache: Map<string, number>): number | undefined {
    const dateStr = date.toISOString().split('T')[0];
    let price = cache.get(dateStr);

    if (price === undefined) {
        for (let i = 1; i <= 7; i++) {
            const prevDate = new Date(date);
            prevDate.setDate(prevDate.getDate() - i);
            const prevDateStr = prevDate.toISOString().split('T')[0];
            price = cache.get(prevDateStr);
            if (price !== undefined) break;
        }
    }
    return price;
}
