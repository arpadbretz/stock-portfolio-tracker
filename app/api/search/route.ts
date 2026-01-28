import { NextRequest, NextResponse } from 'next/server';
import { getCachedSearch } from '@/lib/yahoo-finance';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    try {
        const results = await getCachedSearch(query, {
            quotesCount: 5,
            newsCount: 0,
            enableFuzzyQuery: true
        });

        const quotes = (results?.quotes || [])
            .filter((quote: any) => quote.isYahooFinance !== false && (quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF'))
            .map((quote: any) => ({
                symbol: quote.symbol,
                name: quote.shortname || quote.longname || quote.symbol,
                exchange: quote.exchange,
                type: quote.quoteType,
            }));

        return NextResponse.json(quotes);
    } catch (error: any) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Failed to search' }, { status: 500 });
    }
}
