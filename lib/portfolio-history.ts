import { createClient } from '@/lib/supabase/server';
import { getHistoricalPrices, getHistoricalBenchmark } from '@/lib/yahoo-finance';
import { Trade } from '@/types/portfolio';

export async function syncPortfolioHistory(portfolioId: string, userId: string) {
    const supabase = await createClient();

    // 1. Get all trades and cash transactions for this portfolio
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

    // 2. Identify timeframe
    let startTradeDate = trades && trades.length > 0 ? new Date(trades[0].date_traded) : null;
    let startCashDate = cashTransactions && cashTransactions.length > 0 ? new Date(cashTransactions[0].transaction_date) : null;

    let startDate = startTradeDate;
    if (!startDate || (startCashDate && startCashDate < startDate)) {
        startDate = startCashDate;
    }

    if (!startDate) return { success: true, message: 'No activity found' };

    const endDate = new Date();

    // 3. Get all unique tickers + FX pairs
    const uniqueTickers = [...new Set((trades || []).map((t: any) => t.ticker))];
    const fxPairs = ['USDEUR=X', 'USDHUF=X'];

    // 4. Fetch historical prices + FX in parallel
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
        ...fxPairs.map(async (pair) => {
            try {
                const prices = await getHistoricalPrices(pair, startDate, endDate);
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
    let currentStockHoldings = new Map<string, number>();
    let currentCashBalances = { USD: 0, EUR: 0, HUF: 0 } as Record<string, number>;

    let totalInvested = 0; // Cumulative net cash in (Deposits - Withdrawals)
    let realizedPnl = 0;
    let prevTotalValue = 0;
    let cumulativeTwr = 1;
    let initialBenchValue = benchmarkValueAtDate(startDate, benchCache);
    let cumulativeBench = 1;

    const iterDate = new Date(startDate);

    while (iterDate <= endDate) {
        const dateStr = iterDate.toISOString().split('T')[0];

        // --- Process Cash Transactions (Direct Flows) ---
        const dayCashFlows = (cashTransactions || []).filter((t: any) => new Date(t.transaction_date).toISOString().split('T')[0] === dateStr);
        let externalCashFlowUSD = 0;

        for (const ct of dayCashFlows) {
            const amount = Number(ct.amount);
            const curr = ct.currency;

            // Update currency-specific balance
            currentCashBalances[curr as 'USD' | 'EUR' | 'HUF'] = (currentCashBalances[curr as 'USD' | 'EUR' | 'HUF'] || 0) + amount;

            // External flows (capital injection/withdrawal) affect TWR denominator
            if (ct.transaction_type === 'DEPOSIT' || ct.transaction_type === 'WITHDRAWAL') {
                const rate = getPriceAtDate(curr === 'USD' ? 'USD' : `USD${curr}=X`, iterDate, priceCache) || 1;
                const usdValue = curr === 'USD' ? amount : amount / rate;
                externalCashFlowUSD += usdValue;
                totalInvested += usdValue;
            }
        }

        // --- Process Trades (Internal Flows + Stock Adjustments) ---
        const dayTrades = (trades || []).filter((t: any) => new Date(t.date_traded).toISOString().split('T')[0] === dateStr);
        for (const trade of dayTrades) {
            const qty = Number(trade.quantity);
            const price = Number(trade.price_per_share);
            const fees = Number(trade.fees || 0);
            const ticker = trade.ticker;

            // Note: We don't adjust currentCashBalances here because we assume the cash_transaction 
            // table already has matching entries for trades if the user has auto-sync enabled.
            // If they DON'T have matching entries, then their cash history will be inaccurate, 
            // but we can't double-count flows. 
            // TODO: In future, if cash_transaction_id is missing on trade, we could simulate it.

            if (trade.action === 'BUY') {
                const existingQty = currentStockHoldings.get(ticker) || 0;
                currentStockHoldings.set(ticker, existingQty + qty);
            } else {
                const existingQty = currentStockHoldings.get(ticker) || 0;
                currentStockHoldings.set(ticker, Math.max(0, existingQty - qty));
            }
        }

        // --- Calculate Total Portfolio Value (Stocks + Cash) ---
        let dailyMarketValueUSD = 0;
        for (const [ticker, quantity] of currentStockHoldings.entries()) {
            if (quantity <= 0) continue;
            const price = getPriceAtDate(ticker, iterDate, priceCache);
            if (price !== undefined) dailyMarketValueUSD += quantity * price;
        }

        // Calculate Cash Value in USD
        let dailyCashValueUSD = 0;
        for (const [curr, bal] of Object.entries(currentCashBalances)) {
            if (bal === 0) continue;
            const rate = getPriceAtDate(curr === 'USD' ? 'USD' : `USD${curr}=X`, iterDate, priceCache) || 1;
            dailyCashValueUSD += curr === 'USD' ? bal : bal / rate;
        }

        const totalValueUSD = dailyMarketValueUSD + dailyCashValueUSD;

        // --- TWR Calculation ---
        // R = (EV - (BV + CF)) / (BV + CF)
        // CF here is ONLY external cash flows (Deposits/Withdrawals)
        let dailyReturn = 0;
        const denominator = prevTotalValue + externalCashFlowUSD;
        if (denominator > 0) {
            dailyReturn = (totalValueUSD - denominator) / denominator;
            cumulativeTwr *= (1 + dailyReturn);
        }

        // --- Benchmark Calculation ---
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
            realized_pnl: realizedPnl, // Still rough, need better tracking
            daily_return: dailyReturn,
            cumulative_twr: cumulativeTwr - 1,
            bench_return: 0,
            bench_cumulative: cumulativeBench - 1
        });

        prevTotalValue = totalValueUSD;
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
        message: `Synced ${historyEntries.length} days of history (Stocks + Cash)`,
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
