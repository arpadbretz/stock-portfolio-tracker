import { NextRequest, NextResponse } from 'next/server';
import { getComprehensiveTickerData } from '@/lib/yahoo-finance';
import { transformStockSummary, transformAnalysts, transformInsiders, transformNews, transformFundamentals, mergeFinancials } from '@/lib/transformers';

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

        // Transform everything using the centralized transformer
        const stockData = transformStockSummary(ticker, data.summary);
        const analystData = transformAnalysts(ticker, data.summary);
        const insiderData = transformInsiders(ticker, data.summary);
        const newsData = transformNews(data.news);
        const fundamentalData = transformFundamentals(ticker, data.fundamentals, data.summary);

        const extendedData = {
            ...stockData,
            // Merge Detailed (4yr) with Long-Range (10yr) data
            incomeStatement: mergeFinancials(stockData?.incomeStatement || [], fundamentalData?.statements || []),
            balanceSheet: mergeFinancials(stockData?.balanceSheet || [], fundamentalData?.statements || []),
            cashFlow: mergeFinancials(stockData?.cashFlow || [], fundamentalData?.statements || []),
            fundamentals: fundamentalData?.charts, // Keep for high-impact charts
            analysts: analystData,
            insiders: insiderData,
            news: newsData,
        };

        return NextResponse.json({ success: true, data: extendedData });
    } catch (error: any) {
        console.error(`Error fetching comprehensive data for ${symbol}:`, error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
