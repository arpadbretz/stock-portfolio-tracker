// Yahoo Finance API Service for fetching live stock prices
import YahooFinance from 'yahoo-finance2';
import { PriceData } from '@/types/portfolio';

/**
 * In yahoo-finance2 v3+, the default export is a CLASS that must be instantiated.
 * The class contains all modules (quote, search, etc.) on its prototype.
 */
const yf = new (YahooFinance as any)();

/**
 * Fetch current price for a single ticker
 */
export async function getCurrentPrice(ticker: string): Promise<PriceData | null> {
    if (!ticker) return null;

    try {
        const symbol = ticker.trim().toUpperCase();

        // Fetch both quote and summary to get price and asset details
        const [quote, summary] = await Promise.all([
            yf.quote(symbol),
            yf.quoteSummary(symbol, { modules: ['assetProfile'] }).catch(() => null)
        ]);

        if (!quote || !quote.regularMarketPrice) {
            console.warn(`No price data found for ${symbol}`);
            return null;
        }

        return {
            ticker: symbol,
            currentPrice: quote.regularMarketPrice,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            lastUpdated: new Date().toISOString(),
            sector: summary?.assetProfile?.sector,
            industry: summary?.assetProfile?.industry,
        };
    } catch (error) {
        console.error(`Error fetching price for ${ticker}:`, error);
        return null;
    }
}

/**
 * Fetch current prices for multiple tickers
 */
export async function getBatchPrices(tickers: string[]): Promise<Map<string, PriceData>> {
    const priceMap = new Map<string, PriceData>();

    if (!tickers || tickers.length === 0) {
        return priceMap;
    }

    const uniqueTickers = [...new Set(tickers.map(t => t?.trim().toUpperCase()).filter(Boolean))];

    const promises = uniqueTickers.map(async (ticker) => {
        const priceData = await getCurrentPrice(ticker);
        if (priceData) {
            priceMap.set(ticker, priceData);
        }
    });

    await Promise.all(promises);

    return priceMap;
}

import { createAdminClient } from './supabase/admin';

/**
 * Get historical prices for a ticker, checking the global database cache first.
 */
export async function getHistoricalPrices(ticker: string, from: Date, to: Date = new Date()) {
    if (!ticker) return [];

    try {
        const symbol = ticker.trim().toUpperCase();
        const fromStr = from.toISOString().split('T')[0];
        const toStr = to.toISOString().split('T')[0];

        // 1. Try to fetch from Supabase cache first
        const adminClient = createAdminClient();
        const { data: cachedData, error: cacheError } = await adminClient
            .from('daily_stock_prices')
            .select('date, price')
            .eq('symbol', symbol)
            .gte('date', fromStr)
            .lte('date', toStr)
            .order('date', { ascending: true });

        if (!cacheError && cachedData && cachedData.length > 0) {
            // Check if we have most of the requested range (rough heuristic)
            // If the start date in cache is close to requested from date, use it
            const firstCachedDate = new Date(cachedData[0].date);
            const daysDiff = Math.abs((firstCachedDate.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));

            // Also check if we have the latest data (yesterday or today)
            const lastCachedDate = new Date(cachedData[cachedData.length - 1].date);
            const isUpToDate = lastCachedDate.getTime() >= new Date().setHours(0, 0, 0, 0) - (24 * 60 * 60 * 1000);

            if (daysDiff < 5 && isUpToDate) {
                console.log(`Using DB cache for ${symbol} history (${cachedData.length} days)`);
                return cachedData.map(item => ({
                    date: new Date(item.date),
                    close: Number(item.price)
                }));
            }
        }

        // 2. Fetch from Yahoo Finance if cache is missing or stale
        console.log(`Fetching ${symbol} history from Yahoo Finance...`);
        const queryOptions = {
            period1: from,
            period2: to,
            interval: '1d' as any,
        };

        const result = await yf.historical(symbol, queryOptions);
        const prices = result.map((item: any) => ({
            date: item.date,
            close: item.close || item.adjClose || 0,
        }));

        // 3. Save to cache asynchronously (fire and forget)
        if (prices.length > 0) {
            const cacheEntries = prices.map((p: any) => ({
                symbol,
                date: p.date.toISOString().split('T')[0],
                price: p.close
            }));

            adminClient
                .from('daily_stock_prices')
                .upsert(cacheEntries, { onConflict: 'symbol,date' })
                .then(({ error }) => {
                    if (error) console.error(`Failed to cache prices for ${symbol}:`, error);
                    else console.log(`Cached ${cacheEntries.length} prices for ${symbol}`);
                });
        }

        return prices;
    } catch (error) {
        console.error(`Error fetching historical prices for ${ticker}:`, error);
        return [];
    }
}

/**
 * Get historical benchmark data (S&P 500)
 */
export async function getHistoricalBenchmark(from: Date, to: Date = new Date()) {
    // ^GSPC is the symbol for S&P 500
    const data = await getHistoricalPrices('^GSPC', from, to);

    if (data.length === 0) return [];

    // Normalize data: First entry = 100%
    const startValue = data[0].close;
    return data.map((item: any) => ({
        date: item.date,
        performance: (item.close / startValue) - 1,
        value: item.close
    }));
}

/**
 * Get quote summary with more details
 */
export async function getQuoteSummary(ticker: string) {
    if (!ticker) return null;

    try {
        const symbol = ticker.trim().toUpperCase();
        const quote = await yf.quote(symbol);
        return {
            ticker: symbol,
            name: quote.shortName || quote.longName || symbol,
            price: quote.regularMarketPrice || 0,
            previousClose: quote.regularMarketPreviousClose || 0,
            open: quote.regularMarketOpen || 0,
            dayHigh: quote.regularMarketDayHigh || 0,
            dayLow: quote.regularMarketDayLow || 0,
            volume: quote.regularMarketVolume || 0,
            marketCap: quote.marketCap || 0,
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
        };
    } catch (error) {
        console.error(`Error fetching quote summary for ${ticker}:`, error);
        return null;
    }
}
