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
 */
export const getCachedBatchPrices = unstable_cache(
    async (tickers: string[]): Promise<Map<string, PriceData>> => {
        return await getBatchPrices(tickers);
    },
    ['batch-stock-prices'],
    {
        revalidate: 900,
        tags: ['prices']
    }
);
