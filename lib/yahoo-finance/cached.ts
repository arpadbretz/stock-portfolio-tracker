import { unstable_cache } from 'next/cache';
import { getCurrentPrice, getBatchPrices } from '../yahoo-finance';
import { PriceData } from '@/types/portfolio';

/**
 * Cached version of getCurrentPrice
 * Revalidates every 15 minutes (900 seconds)
 */
export const getCachedPrice = unstable_cache(
    async (ticker: string): Promise<PriceData | null> => {
        return await getCurrentPrice(ticker);
    },
    ['stock-prices'],
    {
        revalidate: 900, // 15 minutes
        tags: ['prices']
    }
);

/**
 * Internal worker for batch prices caching
 */
const getBatchPricesInternal = unstable_cache(
    async (tickers: string[]): Promise<Record<string, PriceData>> => {
        const resultMap = await getBatchPrices(tickers);
        return Object.fromEntries(resultMap.entries());
    },
    ['batch-stock-prices'],
    {
        revalidate: 900,
        tags: ['prices']
    }
);

/**
 * Cached version of getBatchPrices
 */
export const getCachedBatchPrices = async (tickers: string[]): Promise<Map<string, PriceData>> => {
    const resultObject = await getBatchPricesInternal(tickers);
    return new Map(Object.entries(resultObject));
};

