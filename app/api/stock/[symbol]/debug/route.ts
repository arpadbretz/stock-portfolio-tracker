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

        // Fetch with detailed logging
        const summary = await yf.quoteSummary(ticker, {
            modules: [
                'incomeStatementHistory',
                'balanceSheetHistory',
                'cashflowStatementHistory',
            ]
        }).catch((e: any) => {
            console.error('Yahoo Finance error:', e);
            return null;
        });

        if (!summary) {
            return NextResponse.json({ error: 'No data from Yahoo Finance' }, { status: 404 });
        }

        // Log raw data structure for debugging
        console.log('Income statement raw:', JSON.stringify(summary.incomeStatementHistory, null, 2));
        console.log('Balance sheet raw:', JSON.stringify(summary.balanceSheetHistory, null, 2));
        console.log('Cash flow raw:', JSON.stringify(summary.cashflowStatementHistory, null, 2));

        // Return raw data for inspection
        return NextResponse.json({
            symbol: ticker,
            raw: {
                income: summary.incomeStatementHistory,
                balance: summary.balanceSheetHistory,
                cashflow: summary.cashflowStatementHistory,
            }
        });
    } catch (error) {
        console.error(`Error fetching debug data for ${symbol}:`, error);
        return NextResponse.json({ error: 'Failed to fetch data', details: String(error) }, { status: 500 });
    }
}
