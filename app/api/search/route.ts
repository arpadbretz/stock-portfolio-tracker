import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)();

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.length < 1) {
        return NextResponse.json({ results: [] });
    }

    try {
        const results = await yf.search(query, {
            quotesCount: 10,
            newsCount: 0,
        });

        const quotes = results.quotes
            .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
            .map((q: any) => ({
                symbol: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchDisp || q.exchange,
                type: q.quoteType,
            }))
            .slice(0, 8);

        return NextResponse.json({ results: quotes });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 });
    }
}
