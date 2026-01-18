import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)();

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

        // Map common range formats to yahoo finance formats
        const rangeMap: Record<string, string> = {
            '1D': '1d',
            '5D': '5d',
            '1M': '1mo',
            '3M': '3mo',
            '6M': '6mo',
            '1Y': '1y',
            '5Y': '5y',
        };

        // Map range to interval for optimal data points
        const intervalMap: Record<string, string> = {
            '1D': '5m',
            '5D': '15m',
            '1M': '1d',
            '3M': '1d',
            '6M': '1d',
            '1Y': '1wk',
            '5Y': '1mo',
        };

        const yahooRange = rangeMap[range] || '1mo';
        const interval = intervalMap[range] || '1d';

        const historical = await yf.chart(ticker, {
            period1: getStartDate(range),
            period2: new Date(),
            interval,
        });

        if (!historical || !historical.quotes) {
            return NextResponse.json({ success: false, error: 'No historical data' }, { status: 404 });
        }

        const data = historical.quotes
            .filter((q: any) => q.close !== null)
            .map((q: any) => ({
                date: q.date,
                close: q.close,
                open: q.open,
                high: q.high,
                low: q.low,
                volume: q.volume,
            }));

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error(`Error fetching history for ${symbol}:`, error);
        return NextResponse.json({ success: false, error: 'Failed to fetch historical data' }, { status: 500 });
    }
}

function getStartDate(range: string): Date {
    const now = new Date();
    switch (range) {
        case '1D': return new Date(now.setDate(now.getDate() - 1));
        case '5D': return new Date(now.setDate(now.getDate() - 5));
        case '1M': return new Date(now.setMonth(now.getMonth() - 1));
        case '3M': return new Date(now.setMonth(now.getMonth() - 3));
        case '6M': return new Date(now.setMonth(now.getMonth() - 6));
        case '1Y': return new Date(now.setFullYear(now.getFullYear() - 1));
        case '5Y': return new Date(now.setFullYear(now.getFullYear() - 5));
        default: return new Date(now.setMonth(now.getMonth() - 1));
    }
}
