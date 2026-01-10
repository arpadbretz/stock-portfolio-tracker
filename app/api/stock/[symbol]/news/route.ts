import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    try {
        const ticker = symbol.toUpperCase();

        // Yahoo Finance news
        const news = await yf.search(ticker, {
            newsCount: 15,
        }).catch(() => ({ news: [] }));

        const newsItems = (news.news || []).map((item: any) => ({
            uuid: item.uuid,
            title: item.title,
            publisher: item.publisher,
            link: item.link,
            providerPublishTime: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toISOString() : null,
            type: item.type,
            thumbnail: item.thumbnail?.resolutions?.[0]?.url || null,
            relatedTickers: item.relatedTickers || [],
        }));

        return NextResponse.json({
            symbol: ticker,
            news: newsItems,
        });
    } catch (error) {
        console.error(`Error fetching news for ${symbol}:`, error);
        return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
    }
}
