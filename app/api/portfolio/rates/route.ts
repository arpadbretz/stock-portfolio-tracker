import { NextResponse } from 'next/server';
import { getCachedBatchPrices } from '@/lib/yahoo-finance/cached';

export async function GET() {
    try {
        // Fetch exchange rates
        const ratesData = await getCachedBatchPrices(['USDEUR=X', 'USDHUF=X']);
        const rates = {
            USD: 1,
            EUR: ratesData.get('USDEUR=X')?.currentPrice || 0.92,
            HUF: ratesData.get('USDHUF=X')?.currentPrice || 350,
        };

        return NextResponse.json({ success: true, rates });
    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch rates' },
            { status: 500 }
        );
    }
}
