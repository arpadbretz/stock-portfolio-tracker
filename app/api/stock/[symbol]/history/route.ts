import { NextRequest, NextResponse } from 'next/server';
import { getCachedChart } from '@/lib/yahoo-finance';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '1M';

    if (!symbol) {
        return NextResponse.json({ success: false, error: 'Symbol required' }, { status: 400 });
    }

    try {
        const ticker = symbol.toUpperCase();

        // Map common range formats (case variations)
        const rangeMap: Record<string, string> = {
            '1D': '1d', '5D': '5d', '1M': '1mo', '3M': '3mo', '6M': '6mo', '1Y': '1y', '5Y': '5y',
            '1d': '1d', '5d': '5d', '1mo': '1mo', '3mo': '3mo', '6mo': '6mo', '1y': '1y', '5y': '5y',
        };

        const intervalMap: Record<string, string> = {
            '1d': '5m', '5d': '15m', '1mo': '1d', '3mo': '1d', '6mo': '1d', '1y': '1wk', '5y': '1mo',
        };

        const yahooRange = rangeMap[range] || '1mo';
        const interval = intervalMap[yahooRange] || '1d';

        const chartData = await getCachedChart(ticker, yahooRange, interval);

        if (!chartData) {
            return NextResponse.json({ success: false, error: 'No historical data' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            data: chartData,
        });
    } catch (error) {
        console.error(`Error fetching history for ${symbol}:`, error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
