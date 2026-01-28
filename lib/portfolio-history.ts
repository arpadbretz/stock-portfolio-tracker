import { createClient } from '@/lib/supabase/server';
import { getHistoricalPrices, getHistoricalBenchmark } from '@/lib/yahoo-finance';
import { Trade } from '@/types/portfolio';

export async function syncPortfolioHistory(portfolioId: string, userId: string) {
    const supabase = await createClient();

    // 1. Get the latest sync point to see if we can do incremental sync
    const { data: latestHistory } = await supabase
        .from('portfolio_history')
        .select('*')
        .eq('portfolio_id', portfolioId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle();

    // 2. Get all trades and cash transactions (internal data, cheap to fetch all)
    const [{ data: trades, error: tradesError }, { data: cashTransactions, error: cashError }] = await Promise.all([
        supabase
            .from('trades')
            .select('*')
            .eq('portfolio_id', portfolioId)
            .order('date_traded', { ascending: true }),
        supabase
            .from('cash_transactions')
            .select('*')
            .eq('portfolio_id', portfolioId)
            .order('transaction_date', { ascending: true })
    ]);

    if (tradesError) throw tradesError;
    if (cashError) throw cashError;

    // 3. Identify timeframe and initial state
    let startTradeDate = trades && trades.length > 0 ? new Date(trades[0].date_traded) : null;
    let startCashDate = cashTransactions && cashTransactions.length > 0 ? new Date(cashTransactions[0].transaction_date) : null;

    let inceptionDate = startTradeDate;
    if (!inceptionDate || (startCashDate && startCashDate < inceptionDate)) {
        inceptionDate = startCashDate;
    }

    if (!inceptionDate) return { success: true, message: 'No activity found' };

    let startDate = inceptionDate;
    let currentStockHoldings = new Map<string, number>();
    let currentCashBalances = { USD: 0, EUR: 0, HUF: 0 } as Record<string, number>;
    let totalInvested = 0;
    let cumulativeTwr = 1;
    let cumulativeBench = 1;
    let prevTotalValue = 0;
    let realizedPnl = 0;

    // If we have history, recover state as of the last entry
    if (latestHistory) {
        startDate = new Date(latestHistory.date);

        // Short-circuit if already synced today
        const todayStr = new Date().toISOString().split('T')[0];
        if (latestHistory.date === todayStr) {
            // Check if any trades/cash were added/updated since this history entry was created
            const lastSyncTime = new Date(latestHistory.created_at);
            const hasNewActivity = [...(trades || []), ...(cashTransactions || [])].some(
                t => new Date(t.created_at || t.updated_at) > lastSyncTime
            );
            if (!hasNewActivity) {
                return { success: true, message: 'Already up to date', incremental: true };
            }
        }

        // Fast-forward balances to the start date
        for (const ct of (cashTransactions || [])) {
            if (new Date(ct.transaction_date) > startDate) break;
            currentCashBalances[ct.currency] = (currentCashBalances[ct.currency] || 0) + Number(ct.amount);
            if (ct.transaction_type === 'DEPOSIT' || ct.transaction_type === 'WITHDRAWAL') {
                // Approximate cost basis recovery if we didn't store it perfectly (though we do have it in history)
                // but for simplicity we rely on history table values for metrics
            }
        }
        for (const t of (trades || [])) {
            if (new Date(t.date_traded) > startDate) break;
            const qty = Number(t.quantity);
            const current = currentStockHoldings.get(t.ticker) || 0;
            currentStockHoldings.set(t.ticker, t.action === 'BUY' ? current + qty : Math.max(0, current - qty));
        }

        // Load metrics from history
        totalInvested = Number(latestHistory.cost_basis);
        realizedPnl = Number(latestHistory.realized_pnl || 0);
        prevTotalValue = Number(latestHistory.total_value);
        cumulativeTwr = Number(latestHistory.cumulative_twr) + 1;
        cumulativeBench = Number(latestHistory.bench_cumulative) + 1;
    }

    const endDate = new Date();

    // 4. Get unique tickers + FX pairs
    const uniqueTickers = [...new Set((trades || []).map((t: any) => t.ticker))];
    const fxPairs = ['USDEUR=X', 'USDHUF=X'];

    // 5. Fetch historical prices for the gap
    // Use startDate - 1 day to ensure we have the closing price for the previous day for TWR denominator
    const fetchStart = new Date(startDate);
    fetchStart.setDate(fetchStart.getDate() - 1);

    const priceCache = new Map<string, Map<string, number>>();
    const benchCache = new Map<string, number>();

    await Promise.all([
        ...uniqueTickers.map(async (ticker) => {
            try {
                const prices = await getHistoricalPrices(ticker, fetchStart, endDate);
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
        ...fxPairs.map(async (pair) => {
            try {
                const prices = await getHistoricalPrices(pair, fetchStart, endDate);
                const fxMap = new Map<string, number>();
                prices.forEach((p: any) => {
                    const dateStr = new Date(p.date).toISOString().split('T')[0];
                    fxMap.set(dateStr, p.close);
                });
                priceCache.set(pair, fxMap);
            } catch (err) {
                console.error(`Failed to fetch FX for ${pair}:`, err);
            }
        }),
        (async () => {
            try {
                const benchData = await getHistoricalBenchmark(fetchStart, endDate);
                benchData.forEach((p: any) => {
                    const dateStr = new Date(p.date).toISOString().split('T')[0];
                    benchCache.set(dateStr, p.value);
                });
            } catch (err) {
                console.error(`Failed to fetch benchmark history:`, err);
            }
        })()
    ]);

    // 6. Iterate and calculate
    const historyEntries = [];
    const iterDate = new Date(startDate);

    // If we're incremental, we move to the next day immediately
    if (latestHistory) {
        iterDate.setDate(iterDate.getDate() + 1);
    }

    const initialBenchValue = benchmarkValueAtDate(inceptionDate, benchCache);

    while (iterDate <= endDate) {
        const dateStr = iterDate.toISOString().split('T')[0];

        // Process Cash
        const dayCashFlows = (cashTransactions || []).filter(t => new Date(t.transaction_date).toISOString().split('T')[0] === dateStr);
        let externalCashFlowUSD = 0;

        for (const ct of dayCashFlows) {
            const amount = Number(ct.amount);
            currentCashBalances[ct.currency] = (currentCashBalances[ct.currency] || 0) + amount;
            if (ct.transaction_type === 'DEPOSIT' || ct.transaction_type === 'WITHDRAWAL') {
                const rate = getPriceAtDate(ct.currency === 'USD' ? 'USD' : `USD${ct.currency}=X`, iterDate, priceCache) || 1;
                const usdValue = ct.currency === 'USD' ? amount : amount / rate;
                externalCashFlowUSD += usdValue;
                totalInvested += usdValue;
            }
        }

        // Process Trades
        const dayTrades = (trades || []).filter(t => new Date(t.date_traded).toISOString().split('T')[0] === dateStr);
        for (const trade of dayTrades) {
            const qty = Number(trade.quantity);
            const ticker = trade.ticker;
            const current = currentStockHoldings.get(ticker) || 0;
            currentStockHoldings.set(ticker, trade.action === 'BUY' ? current + qty : Math.max(0, current - qty));
        }

        // Values
        let dailyMarketValueUSD = 0;
        for (const [ticker, quantity] of currentStockHoldings.entries()) {
            if (quantity <= 0) continue;
            const price = getPriceAtDate(ticker, iterDate, priceCache);
            if (price !== undefined) dailyMarketValueUSD += quantity * price;
        }

        let dailyCashValueUSD = 0;
        for (const [curr, bal] of Object.entries(currentCashBalances)) {
            if (bal === 0) continue;
            const rate = getPriceAtDate(curr === 'USD' ? 'USD' : `USD${curr}=X`, iterDate, priceCache) || 1;
            dailyCashValueUSD += curr === 'USD' ? bal : bal / rate;
        }

        const totalValueUSD = dailyMarketValueUSD + dailyCashValueUSD;

        // TWR
        let dailyReturn = 0;
        const denominator = prevTotalValue + externalCashFlowUSD;
        if (denominator > 0) {
            dailyReturn = (totalValueUSD - denominator) / denominator;
            cumulativeTwr *= (1 + dailyReturn);
        }

        // Benchmark
        const currentBenchValue = benchmarkValueAtDate(iterDate, benchCache);
        if (initialBenchValue && currentBenchValue) {
            cumulativeBench = currentBenchValue / initialBenchValue;
        }

        historyEntries.push({
            portfolio_id: portfolioId,
            user_id: userId,
            date: dateStr,
            total_value: totalValueUSD,
            cost_basis: totalInvested,
            realized_pnl: realizedPnl,
            daily_return: dailyReturn,
            cumulative_twr: cumulativeTwr - 1,
            bench_return: 0,
            bench_cumulative: cumulativeBench - 1
        });

        prevTotalValue = totalValueUSD;
        iterDate.setDate(iterDate.getDate() + 1);
    }

    if (historyEntries.length === 0) return { success: true, message: 'No new gaps to sync' };

    const { error: upsertError } = await supabase
        .from('portfolio_history')
        .upsert(historyEntries, { onConflict: 'portfolio_id,date' });

    if (upsertError) throw upsertError;

    return {
        success: true,
        message: `Incremental sync complete: ${historyEntries.length} days added.`,
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
