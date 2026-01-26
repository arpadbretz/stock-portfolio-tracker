import { NextResponse } from 'next/server';
import { getBatchPrices, getHistoricalPrices } from '@/lib/yahoo-finance';

export async function GET() {
    try {
        const macroTickers = [
            '^GSPC', // S&P 500
            '^NDX',  // Nasdaq 100
            '^RUT',  // Russell 2000
            'BTC-USD',// Bitcoin
            'GC=F',  // Gold
            '^TNX',  // 10Y Yield
            'CL=F',  // Oil
            'EURUSD=X', // EUR/USD
        ];

        const prices = await getBatchPrices(macroTickers);

        // Fetch 30 days of history for each
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const historyPromises = macroTickers.map(ticker =>
            getHistoricalPrices(ticker, thirtyDaysAgo).then((h: any[]) => ({ ticker, history: h }))
        );
        const allHistory = await Promise.all(historyPromises);
        const historyMap = new Map<string, any[]>(allHistory.map(h => [h.ticker, h.history]));

        const data = macroTickers.map(ticker => {
            const price = prices.get(ticker);
            const history = historyMap.get(ticker) || [];
            return {
                ticker,
                name: getMacroName(ticker),
                price: price?.currentPrice || 0,
                change: price?.change || 0,
                changePercent: price?.changePercent || 0,
                history: history.map((h: any) => ({ date: h.date, price: h.close })),
            };
        });

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Market pulse error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

function getMacroName(ticker: string): string {
    const names: Record<string, string> = {
        '^GSPC': 'S&P 500',
        '^NDX': 'Nasdaq 100',
        '^RUT': 'Russell 2000',
        'BTC-USD': 'Bitcoin',
        'GC=F': 'Gold',
        '^TNX': 'US 10Y Yield',
        'CL=F': 'Crude Oil',
        'EURUSD=X': 'EUR/USD',
    };
    return names[ticker] || ticker;
}
