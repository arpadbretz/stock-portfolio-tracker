import { NextRequest, NextResponse } from 'next/server';
import { getCachedChart } from '@/lib/yahoo-finance';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '1mo';

    if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    const ticker = symbol.toUpperCase();

    try {
        const intervalMap: Record<string, string> = {
            '1d': '5m', '5d': '15m', '1mo': '1d', '3mo': '1d', '6mo': '1d', '1y': '1wk', '5y': '1mo', 'max': '1mo',
        };
        const interval = intervalMap[range] || '1d';

        // getCachedChart handles range -> startDate logic and revalidation TTLs
        const chartData = await getCachedChart(ticker, range, interval);

        if (!chartData) return NextResponse.json({ error: 'No data' }, { status: 404 });

        return NextResponse.json({
            symbol: ticker,
            range,
            interval,
            data: chartData
        });
    } catch (error) {
        console.error(`Chart fetch error for ${ticker}:`, error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
