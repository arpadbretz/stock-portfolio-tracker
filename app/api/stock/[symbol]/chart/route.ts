import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;
    const searchParams = request.nextUrl.searchParams;
    const range = searchParams.get('range') || '1mo';

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    try {
        const ticker = symbol.toUpperCase();

        // Map range to interval
        const intervalMap: Record<string, string> = {
            '1d': '5m',
            '5d': '15m',
            '1mo': '1d',
            '3mo': '1d',
            '6mo': '1d',
            '1y': '1wk',
            '5y': '1mo',
            'max': '1mo',
        };

        const interval = intervalMap[range] || '1d';

        const historical = await yf.chart(ticker, {
            period1: getStartDate(range),
            period2: new Date(),
            interval,
        });

        if (!historical || !historical.quotes) {
            return NextResponse.json({ error: 'No historical data' }, { status: 404 });
        }

        const data = historical.quotes
            .filter((q: any) => q.close !== null)
            .map((q: any) => ({
                date: q.date,
                open: q.open,
                high: q.high,
                low: q.low,
                close: q.close,
                volume: q.volume,
            }));

        return NextResponse.json({
            symbol: ticker,
            range,
            interval,
            data,
        });
    } catch (error) {
        console.error(`Error fetching chart for ${symbol}:`, error);
        return NextResponse.json({ error: 'Failed to fetch chart data' }, { status: 500 });
    }
}

function getStartDate(range: string): Date {
    const now = new Date();
    switch (range) {
        case '1d': return new Date(now.setDate(now.getDate() - 1));
        case '5d': return new Date(now.setDate(now.getDate() - 5));
        case '1mo': return new Date(now.setMonth(now.getMonth() - 1));
        case '3mo': return new Date(now.setMonth(now.getMonth() - 3));
        case '6mo': return new Date(now.setMonth(now.getMonth() - 6));
        case '1y': return new Date(now.setFullYear(now.getFullYear() - 1));
        case '5y': return new Date(now.setFullYear(now.getFullYear() - 5));
        case 'max': return new Date('1970-01-01');
        default: return new Date(now.setMonth(now.getMonth() - 1));
    }
}
