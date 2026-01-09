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
