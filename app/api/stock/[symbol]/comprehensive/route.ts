import { NextRequest, NextResponse } from 'next/server';
import { getComprehensiveTickerData } from '@/lib/yahoo-finance';
import { transformStockSummary } from '@/lib/transformers';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;
    if (!symbol) return NextResponse.json({ success: false, error: 'Symbol required' }, { status: 400 });
    const ticker = symbol.toUpperCase();

    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';

    try {
        const data = await getComprehensiveTickerData(ticker, refresh);

        if (!data || !data.summary) {
            return NextResponse.json({ success: false, error: 'Stock not found' }, { status: 404 });
        }

        // Transform the main summary
        const stockData = transformStockSummary(ticker, data.summary);

        // Add extra modules that aren't in the main summary transformer yet
        const extendedData = {
            ...stockData,
            analysts: {
                recommendationTrend: data.summary.recommendationTrend,
                upgradeDowngradeHistory: data.summary.upgradeDowngradeHistory,
                financialData: data.summary.financialData,
            },
            insiders: {
                insiderTransactions: data.summary.insiderTransactions,
                insiderHolders: data.summary.insiderHolders,
            },
            news: data.news,
        };

        return NextResponse.json({ success: true, data: extendedData });
    } catch (error: any) {
        console.error(`Error fetching comprehensive data for ${symbol}:`, error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
