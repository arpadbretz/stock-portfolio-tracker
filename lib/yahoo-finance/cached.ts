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
 * Cached version of getBatchPrices
 * Note: Next.js unstable_cache serializes to JSON, so Map becomes plain object
 * We need to convert back to Map after caching
 */
export const getCachedBatchPrices = async (tickers: string[]): Promise<Map<string, PriceData>> => {
    // Use unstable_cache but convert Map to object for JSON serialization
    const cachedFn = unstable_cache(
        async (tickers: string[]): Promise<Record<string, PriceData>> => {
            const resultMap = await getBatchPrices(tickers);
            // Convert Map to plain object for JSON serialization
            return Object.fromEntries(resultMap.entries());
        },
        ['batch-stock-prices'],
        {
            revalidate: 900,
            tags: ['prices']
        }
    );

    const resultObject = await cachedFn(tickers);
    // Convert plain object back to Map
    return new Map(Object.entries(resultObject));
};

