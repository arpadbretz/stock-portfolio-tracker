// Yahoo Finance API Service for fetching live stock prices
import { PriceData } from '@/types/portfolio';
import { createAdminClient } from './supabase/admin';

// CONFIG: How long real-time prices are valid (in minutes)
const PRICE_CACHE_REVALIDATE_MINS = 15;
// CONFIG: How long metadata (fundamentals, etc) is valid (in days)
const METADATA_CACHE_REVALIDATE_DAYS = 7;

/**
 * Generic helper to fetch with patterns: Dynamic Import + Timeout
 */
async function fetchWithYahooPattern<T>(fetcher: (yf: any) => Promise<T>, timeoutMs = 3000): Promise<T> {
    const { default: YahooFinance } = await import('yahoo-finance2');
    const yf = new (YahooFinance as any)({
        suppressNotices: ['yahooSurvey'],
        validation: { logErrors: false }
    });

    return await Promise.race([
        fetcher(yf),
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Yahoo API Timeout')), timeoutMs)
        )
    ]);
}

/**
 * Fetch current price for a single ticker with "Fail-Fast" cache logic
 */
export async function getCurrentPrice(ticker: string, force = false): Promise<PriceData | null> {
    if (!ticker) return null;
    const symbol = ticker.trim().toUpperCase();
    const adminClient = createAdminClient();

    try {
        // 1. GUARD CLAUSE: CHECK CACHE BEFORE IMPORTING LIBRARY
        const { data: cached } = await adminClient
            .from('stock_cache')
            .select('*')
            .eq('symbol', symbol)
            .eq('cache_key', 'price')
            .maybeSingle();

        if (cached) {
            const lastUpdated = new Date(cached.last_updated);
            const now = new Date();
            const ageInMins = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

            if (!force && ageInMins < PRICE_CACHE_REVALIDATE_MINS) {
                return {
                    ticker: symbol,
                    currentPrice: Number(cached.price),
                    change: Number(cached.price_change || 0),
                    changePercent: Number(cached.price_change_percent || 0),
                    lastUpdated: cached.last_updated,
                    sector: cached.sector,
                    industry: cached.industry,
                    currency: cached.currency,
                };
            }
        }

        // 2. FETCH FROM YAHOO
        const [quote, summary] = await fetchWithYahooPattern(async (yf) => {
            return await Promise.all([
                yf.quote(symbol),
                yf.quoteSummary(symbol, { modules: ['assetProfile'] }).catch(() => null)
            ]);
        });

        if (!quote || !quote.regularMarketPrice) {
            throw new Error('No price data found');
        }

        const priceData: PriceData = {
            ticker: symbol,
            currentPrice: quote.regularMarketPrice,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            lastUpdated: new Date().toISOString(),
            sector: summary?.assetProfile?.sector,
            industry: summary?.assetProfile?.industry,
            currency: quote.currency || quote.financialCurrency || 'USD',
        };

        // 3. ASYNC CACHE UPDATE (fire and forget)
        adminClient.from('stock_cache').upsert({
            symbol: symbol,
            cache_key: 'price',
            price: priceData.currentPrice,
            price_change: priceData.change,
            price_change_percent: priceData.changePercent,
            sector: priceData.sector,
            industry: priceData.industry,
            currency: priceData.currency,
            last_updated: priceData.lastUpdated
        }).then(({ error }) => {
            if (error) console.error(`Error caching ${symbol}:`, error);
        });

        return priceData;
    } catch (error: any) {
        console.error(`Fetch failed for ${symbol}:`, error.message || error);

        // FINAL FALLBACK: return STALE CACHE if available
        try {
            const { data: staleCache } = await adminClient
                .from('stock_cache')
                .select('*')
                .eq('symbol', symbol)
                .eq('cache_key', 'price')
                .maybeSingle();

            if (staleCache) {
                return {
                    ticker: symbol,
                    currentPrice: Number(staleCache.price),
                    change: Number(staleCache.price_change || 0),
                    changePercent: Number(staleCache.price_change_percent || 0),
                    lastUpdated: staleCache.last_updated,
                    sector: staleCache.sector,
                    industry: staleCache.industry,
                    currency: staleCache.currency,
                };
            }
        } catch (fallbackError) {
            console.error('Final fallback also failed:', fallbackError);
        }
        return null;
    }
}

/**
 * Generic Fetcher with Caching (Fundamentals, QuoteSummary, etc.)
 */
export async function getCachedData<T>(
    symbol: string,
    cacheKey: string,
    revalidateDays: number,
    fetcher: (yf: any) => Promise<T>, // fetcher now expects yf instance
    force = false
): Promise<T | null> {
    const adminClient = createAdminClient();
    try {
        // 1. Check Cache
        if (!force) {
            const { data: cached } = await adminClient
                .from('stock_cache')
                .select('*')
                .eq('symbol', symbol)
                .eq('cache_key', cacheKey)
                .maybeSingle();

            if (cached) {
                const lastUpdated = new Date(cached.last_updated);
                const now = new Date();
                const ageInDays = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

                if (ageInDays < revalidateDays) {
                    return cached.data;
                }
            }
        }

        // 2. Fetch with Pattern
        const result = await fetchWithYahooPattern(fetcher, 10000); // 10s for heavy data

        if (result) {
            // 3. Cache it
            adminClient.from('stock_cache').upsert({
                symbol: symbol,
                cache_key: cacheKey,
                data: result,
                last_updated: new Date().toISOString()
            }).then(({ error }) => {
                if (error) console.error('Cache save error:', error);
            });
        }

        return result;
    } catch (error: any) {
        console.error(`Fetch failed for ${symbol} (${cacheKey}):`, error.message || error);
        const { data: stale } = await adminClient
            .from('stock_cache')
            .select('data')
            .eq('symbol', symbol)
            .eq('cache_key', cacheKey)
            .maybeSingle();
        return stale?.data || null;
    }
}

/**
 * Get quote summary with caching
 */
export async function getCachedQuoteSummary(ticker: string, modules: string[], force = false) {
    if (!ticker) return null;
    const symbol = ticker.trim().toUpperCase();
    const modulesKey = modules.sort().join(',');

    // If modules include 'price', we should revalidate MUCH more often (15 mins = 0.01 days approx)
    const revalidate = modules.includes('price')
        ? (PRICE_CACHE_REVALIDATE_MINS / 1440)
        : METADATA_CACHE_REVALIDATE_DAYS;

    return getCachedData(symbol, `summary:${modulesKey}`, revalidate, async (yf) => {
        return await yf.quoteSummary(symbol, { modules });
    }, force);
}

/**
 * Search/News with caching
 */
export async function getCachedSearch(query: string, options: any) {
    const cacheKey = `search:${JSON.stringify(options)}:${query.toLowerCase()}`;
    const adminClient = createAdminClient();

    try {
        const { data: cached } = await adminClient
            .from('stock_cache')
            .select('*')
            .eq('symbol', '_SEARCH_')
            .eq('cache_key', cacheKey)
            .maybeSingle();

        if (cached) {
            const ageInMins = (new Date().getTime() - new Date(cached.last_updated).getTime()) / 60000;
            // News/Search cache for 2 hours
            if (ageInMins < 120) return cached.data;
        }

        const result = await fetchWithYahooPattern(async (yf) => yf.search(query, options), 3000);

        if (result) {
            adminClient.from('stock_cache').upsert({
                symbol: '_SEARCH_',
                cache_key: cacheKey,
                data: result,
                last_updated: new Date().toISOString()
            }).then(({ error }) => {
                if (error) console.error('Search cache error:', error);
            });
        }

        return result;
    } catch (error: any) {
        console.error('Search failed:', error.message || error);
        return null;
    }
}

/**
 * Get insider data with caching
 */
export async function getCachedInsiders(ticker: string) {
    if (!ticker) return null;
    const symbol = ticker.trim().toUpperCase();
    return getCachedQuoteSummary(symbol, ['insiderTransactions', 'insiderHolders']);
}

/**
 * Get analyst data with caching
 */
export async function getCachedAnalysts(ticker: string) {
    if (!ticker) return null;
    const symbol = ticker.trim().toUpperCase();
    return getCachedQuoteSummary(symbol, [
        'recommendationTrend',
        'upgradeDowngradeHistory',
        'financialData'
    ]);
}

/**
 * Get chart data with caching
 */
export async function getCachedChart(ticker: string, range: string, interval: string) {
    if (!ticker) return null;
    const symbol = ticker.trim().toUpperCase();
    const cacheKey = `chart:${range}:${interval}`;

    // Intraday (1d, 5d) - cache for 15 mins (shared with price cache)
    // Daily/Weekly - cache for 24 hours
    const revalidateDays = (range === '1d' || range === '5d') ? (15 / 1440) : 1;

    return getCachedData(symbol, cacheKey, revalidateDays, async (yf) => {
        const now = new Date();
        let startDate: Date;

        switch (range) {
            case '1d': startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
            case '5d': startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); break;
            case '1mo': startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
            case '3mo': startDate = new Date(now.setMonth(now.getMonth() - 3)); break;
            case '6mo': startDate = new Date(now.setMonth(now.getMonth() - 6)); break;
            case '1y': startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
            case '5y': startDate = new Date(now.setFullYear(now.getFullYear() - 5)); break;
            case 'max': startDate = new Date('1970-01-01'); break;
            default: startDate = new Date(now.setMonth(now.getMonth() - 1));
        }

        const result = await yf.chart(symbol, {
            period1: startDate,
            period2: new Date(),
            interval
        });

        return result?.quotes?.filter((q: any) => q.close !== null).map((q: any) => ({
            date: q.date,
            open: q.open,
            high: q.high,
            low: q.low,
            close: q.close,
            volume: q.volume,
        })) || [];
    });
}

export async function getBatchPrices(tickers: string[], force = false): Promise<Map<string, PriceData>> {
    const priceMap = new Map<string, PriceData>();
    if (!tickers || tickers.length === 0) return priceMap;

    const uniqueTickers = [...new Set(tickers.map(t => t?.trim().toUpperCase()).filter(Boolean))];
    const adminClient = createAdminClient();

    // 1. Check cache for all tickers first
    const missingTickers: string[] = [];

    if (!force) {
        const { data: cachedItems } = await adminClient
            .from('stock_cache')
            .select('*')
            .in('symbol', uniqueTickers)
            .eq('cache_key', 'price');

        if (cachedItems) {
            const now = new Date();
            for (const symbol of uniqueTickers) {
                const cached = cachedItems.find(item => item.symbol === symbol);
                if (cached) {
                    const lastUpdated = new Date(cached.last_updated);
                    const ageInMins = (now.getTime() - lastUpdated.getTime()) / (1000 * 60);

                    if (ageInMins < PRICE_CACHE_REVALIDATE_MINS) {
                        priceMap.set(symbol, {
                            ticker: symbol,
                            currentPrice: Number(cached.price),
                            change: Number(cached.price_change || 0),
                            changePercent: Number(cached.price_change_percent || 0),
                            lastUpdated: cached.last_updated,
                            sector: cached.sector,
                            industry: cached.industry,
                            currency: cached.currency,
                        });
                        continue;
                    }
                }
                missingTickers.push(symbol);
            }
        } else {
            missingTickers.push(...uniqueTickers);
        }
    } else {
        missingTickers.push(...uniqueTickers);
    }

    if (missingTickers.length === 0) return priceMap;

    // 2. Fetch missing tickers from Yahoo in batch
    try {
        const results = await fetchWithYahooPattern(async (yf) => {
            // yf.quote can take an array of symbols
            // Also fetch assetProfile for metadata if missing
            const [quotes, summaries] = await Promise.all([
                yf.quote(missingTickers),
                Promise.all(missingTickers.map(s =>
                    yf.quoteSummary(s, { modules: ['assetProfile'] }).catch(() => null)
                ))
            ]);

            const quoteArray = Array.isArray(quotes) ? quotes : [quotes];
            return quoteArray.map((q, i) => ({
                quote: q,
                summary: summaries[i]
            }));
        }, 10000); // Increased timeout for metadata

        if (results && results.length > 0) {
            const cacheUpdates: any[] = [];

            for (const item of results) {
                const quote = item.quote;
                const summary = item.summary;
                if (!quote || !quote.symbol) continue;

                const symbol = quote.symbol.toUpperCase();
                const priceData: PriceData = {
                    ticker: symbol,
                    currentPrice: quote.regularMarketPrice || 0,
                    change: quote.regularMarketChange || 0,
                    changePercent: quote.regularMarketChangePercent || 0,
                    lastUpdated: new Date().toISOString(),
                    currency: quote.currency || quote.financialCurrency || 'USD',
                    sector: summary?.assetProfile?.sector,
                    industry: summary?.assetProfile?.industry,
                };

                priceMap.set(symbol, priceData);

                cacheUpdates.push({
                    symbol: symbol,
                    cache_key: 'price',
                    price: priceData.currentPrice,
                    price_change: priceData.change,
                    price_change_percent: priceData.changePercent,
                    currency: priceData.currency,
                    sector: priceData.sector,
                    industry: priceData.industry,
                    last_updated: priceData.lastUpdated
                });
            }

            // 3. Update cache in bulk
            if (cacheUpdates.length > 0) {
                adminClient.from('stock_cache').upsert(cacheUpdates).then(({ error }) => {
                    if (error) console.error(`Error batch caching:`, error);
                });
            }
        }
    } catch (error: any) {
        console.error(`Batch fetch failed:`, error.message || error);

        // Fallback: Use stale cache for all missing tickers
        const { data: staleItems } = await adminClient
            .from('stock_cache')
            .select('*')
            .in('symbol', missingTickers)
            .eq('cache_key', 'price');

        if (staleItems) {
            for (const cached of staleItems) {
                if (!priceMap.has(cached.symbol)) {
                    priceMap.set(cached.symbol, {
                        ticker: cached.symbol,
                        currentPrice: Number(cached.price),
                        change: Number(cached.price_change || 0),
                        changePercent: Number(cached.price_change_percent || 0),
                        lastUpdated: cached.last_updated,
                        sector: cached.sector,
                        industry: cached.industry,
                        currency: cached.currency,
                    });
                }
            }
        }
    }

    return priceMap;
}

export async function getBatchDetails(tickers: string[], force = false) {
    if (!tickers || tickers.length === 0) return new Map();
    const uniqueTickers = [...new Set(tickers.map(t => t?.trim().toUpperCase()).filter(Boolean))];
    const adminClient = createAdminClient();
    const detailMap = new Map();

    // 1. Concurrent Fetch: Batch Prices + Batch Sparklines (last 30 days)
    try {
        const results = await fetchWithYahooPattern(async (yf) => {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 30);

            // Fetch Quotes and historical charts in parallel
            const [quotes, charts] = await Promise.all([
                yf.quote(uniqueTickers),
                Promise.all(uniqueTickers.map(s =>
                    yf.chart(s, { period1: startDate, period2: endDate, interval: '1d' }).catch(() => null)
                ))
            ]);

            const quoteArray = Array.isArray(quotes) ? quotes : [quotes];
            return uniqueTickers.map((symbol, i) => {
                const quote = quoteArray.find(q => q.symbol.toUpperCase() === symbol);
                const chart = charts[i];
                return {
                    symbol,
                    quote,
                    sparkline: chart?.quotes?.filter((q: any) => q.close !== null).map((q: any) => ({
                        date: q.date,
                        value: q.close
                    })) || []
                };
            });
        }, 15000);

        if (results) {
            const cacheUpdates: any[] = [];
            for (const item of results) {
                const { symbol, quote, sparkline } = item;
                if (!quote) continue;

                const data = {
                    symbol,
                    name: quote.shortName || quote.longName || symbol,
                    price: quote.regularMarketPrice || 0,
                    change: quote.regularMarketChange || 0,
                    changePercent: quote.regularMarketChangePercent || 0,
                    currency: quote.currency || 'USD',
                    sparkline,
                    lastUpdated: new Date().toISOString()
                };

                detailMap.set(symbol, data);

                // Update standard price cache
                cacheUpdates.push({
                    symbol: symbol,
                    cache_key: 'price',
                    price: data.price,
                    price_change: data.change,
                    price_change_percent: data.changePercent,
                    currency: data.currency,
                    last_updated: data.lastUpdated
                });
            }

            if (cacheUpdates.length > 0) {
                adminClient.from('stock_cache').upsert(cacheUpdates).then(({ error }) => {
                    if (error) console.error(`Error batch caching details:`, error);
                });
            }
        }
    } catch (error: any) {
        console.error(`Batch details fetch failed:`, error.message);
    }

    return detailMap;
}

export async function getHistoricalPrices(ticker: string, from: Date, to: Date = new Date()) {
    if (!ticker) return [];
    try {
        const symbol = ticker.trim().toUpperCase();
        const fromStr = from.toISOString().split('T')[0];
        const toStr = to.toISOString().split('T')[0];
        const adminClient = createAdminClient();

        const { data: cachedData, error: cacheError } = await adminClient
            .from('daily_stock_prices')
            .select('date, price')
            .eq('symbol', symbol)
            .gte('date', fromStr)
            .lte('date', toStr)
            .order('date', { ascending: true });

        if (!cacheError && cachedData && cachedData.length > 0) {
            const lastCachedDate = new Date(cachedData[cachedData.length - 1].date);
            const isUpToDate = lastCachedDate.getTime() >= new Date().setHours(0, 0, 0, 0) - (24 * 60 * 60 * 1000);
            if (isUpToDate) {
                return cachedData.map(item => ({ date: new Date(item.date), close: Number(item.price) }));
            }
        }

        const result = await fetchWithYahooPattern(async (yf) =>
            yf.historical(symbol, { period1: from, period2: to, interval: '1d' as any }), 5000);

        const prices = result.map((item: any) => ({ date: item.date, close: item.close || item.adjClose || 0 }));

        if (prices.length > 0) {
            const cacheEntries = prices.map((p: any) => ({
                symbol,
                date: p.date.toISOString().split('T')[0],
                price: p.close
            }));
            adminClient.from('daily_stock_prices').upsert(cacheEntries, { onConflict: 'symbol,date' }).then(({ error }) => {
                if (error) console.error('Price cache error:', error);
            });
        }
        return prices;
    } catch (error: any) {
        console.error(`Historical fetch error for ${ticker}:`, error.message || error);
        return [];
    }
}

export async function getHistoricalBenchmark(from: Date, to: Date = new Date()) {
    const data = await getHistoricalPrices('^GSPC', from, to);
    if (data.length === 0) return [];
    const startValue = data[0].close;
    return data.map((item: any) => ({
        date: item.date,
        performance: (item.close / startValue) - 1,
        value: item.close
    }));
}

export async function getQuoteSummary(ticker: string) {
    return getCachedQuoteSummary(ticker, ['price', 'summaryDetail']);
}
