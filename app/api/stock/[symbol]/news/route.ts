import { NextRequest, NextResponse } from 'next/server';
import { getCachedSearch } from '@/lib/yahoo-finance';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;
    if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    const ticker = symbol.toUpperCase();

    try {
        const news = await getCachedSearch(ticker, { newsCount: 15 });

        const newsItems = (news?.news || []).map((item: any) => ({
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
            success: true,
            data: { symbol: ticker, news: newsItems }
        });
    } catch (error) {
        console.error(`Error fetching news for ${symbol}:`, error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
