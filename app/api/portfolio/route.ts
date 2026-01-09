// API Route: GET /api/portfolio - Fetch all trades and calculate holdings

import { NextResponse } from 'next/server';
import { getAllTrades } from '@/lib/sheets';
import { getBatchPrices } from '@/lib/yahoo-finance';
import { aggregateHoldings, calculatePortfolioSummary } from '@/lib/portfolio';

export async function GET() {
    try {
        // Fetch all trades from Google Sheets
        const trades = await getAllTrades();

        // Get unique tickers
        const tickers = [...new Set(trades.map(t => t.ticker.toUpperCase()))];

        // Fetch current prices for all tickers
        const prices = await getBatchPrices(tickers);

        // Fetch real-time exchange rates
        const ratesData = await getBatchPrices(['USDEUR=X', 'USDHUF=X']);
        const exchangeRates = {
            USD: 1,
            EUR: ratesData.get('USDEUR=X')?.currentPrice || 0.92,
            HUF: ratesData.get('USDHUF=X')?.currentPrice || 350,
        };

        // Aggregate trades into holdings
        const holdings = aggregateHoldings(trades, prices);

        // Calculate portfolio summary
        const summary = calculatePortfolioSummary(holdings, exchangeRates);

        return NextResponse.json({
            success: true,
            data: {
                trades,
                holdings,
                summary,
                lastUpdated: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            { status: 500 }
        );
    }
}
