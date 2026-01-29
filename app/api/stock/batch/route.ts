import { NextRequest, NextResponse } from 'next/server';
import { getCachedBatchPrices } from '@/lib/yahoo-finance/cached';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const symbolsParam = searchParams.get('symbols');

        if (!symbolsParam) {
            return NextResponse.json({ success: false, error: 'Symbols parameter is required' }, { status: 400 });
        }

        const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

        if (symbols.length === 0) {
            return NextResponse.json({ success: false, error: 'No valid symbols provided' }, { status: 400 });
        }

        // Limit batch size to prevent abuse
        const limitedSymbols = symbols.slice(0, 20);

        const priceMap = await getCachedBatchPrices(limitedSymbols);
        const results = Object.fromEntries(priceMap.entries());

        return NextResponse.json({
            success: true,
            data: results,
            lastUpdated: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Batch stock API error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
