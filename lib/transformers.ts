/**
 * Centralized Data Transformers for Yahoo Finance
 * Standardizes raw Yahoo Finance API responses into clean, UI-ready types.
 */

export interface StockPrice {
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    lastUpdated: string;
}

export interface SparklinePoint {
    date: string;
    value: number;
}

export interface BatchStockData extends StockPrice {
    symbol: string;
    name: string;
    sparkline: SparklinePoint[];
}

/**
 * Extracts a numeric value from various Yahoo Finance field formats
 */
export function extractYahooValue(field: any): number | null {
    if (field === null || field === undefined) return null;
    if (typeof field === 'number') return field;
    if (typeof field === 'object') {
        if ('raw' in field) return field.raw;
        if ('value' in field) return field.value;
    }
    return null;
}

/**
 * Formats a Date object or numeric timestamp to ISO string
 */
export function formatYahooDate(date: any): string | null {
    if (!date) return null;
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'object' && date.raw) return new Date(date.raw * 1000).toISOString();
    if (typeof date === 'number') return new Date(date).toISOString();
    if (typeof date === 'string') return new Date(date).toISOString();
    return null;
}

/**
 * Transforms a raw QuoteSummary into a standardized Stock Overview
 */
export function transformStockSummary(symbol: string, summary: any) {
    if (!summary) return null;

    const price = summary.price || {};
    const details = summary.summaryDetail || {};
    const financials = summary.financialData || {};
    const keyStats = summary.defaultKeyStatistics || {};
    const profile = summary.assetProfile || {};

    return {
        symbol: symbol.toUpperCase(),
        name: price.shortName || price.longName || symbol,
        exchange: price.fullExchangeName || price.exchange,
        currency: price.currency || 'USD',
        price: extractYahooValue(price.regularMarketPrice) || 0,
        previousClose: extractYahooValue(price.regularMarketPreviousClose) || 0,
        open: extractYahooValue(price.regularMarketOpen) || 0,
        dayHigh: extractYahooValue(price.regularMarketDayHigh) || 0,
        dayLow: extractYahooValue(price.regularMarketDayLow) || 0,
        change: extractYahooValue(price.regularMarketChange) || 0,
        changePercent: extractYahooValue(price.regularMarketChangePercent) || 0,
        volume: extractYahooValue(price.regularMarketVolume) || 0,
        avgVolume: extractYahooValue(price.averageDailyVolume3Month) || 0,
        marketCap: extractYahooValue(price.marketCap) || 0,
        sharesOutstanding: extractYahooValue(keyStats.sharesOutstanding) || null,
        fiftyTwoWeekHigh: extractYahooValue(price.fiftyTwoWeekHigh) || 0,
        fiftyTwoWeekLow: extractYahooValue(price.fiftyTwoWeekLow) || 0,
        trailingPE: extractYahooValue(details.trailingPE) || null,
        forwardPE: extractYahooValue(details.forwardPE) || null,
        dividendYield: extractYahooValue(details.dividendYield) || null,
        dividendRate: extractYahooValue(details.dividendRate) || null,
        beta: extractYahooValue(keyStats.beta) || null,
        sector: profile.sector || null,
        industry: profile.industry || null,
        description: profile.longBusinessSummary || null,
        lastUpdated: formatYahooDate(price.regularMarketTime) || new Date().toISOString(),
    };
}
