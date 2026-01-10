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

        console.log(`\n=== FETCHING FINANCIAL DATA FOR ${ticker} ===\n`);

        // Fetch using the EXACT pattern you specified
        const results = await yf.quoteSummary(ticker, {
            modules: [
                "incomeStatementHistory",
                "balanceSheetHistory",
                "cashflowStatementHistory",
                "financialData"
            ]
        });

        // Log the EXACT structure
        console.log('\n=== INCOME STATEMENT HISTORY ===');
        console.log(JSON.stringify(results.incomeStatementHistory, null, 2));

        console.log('\n=== BALANCE SHEET HISTORY ===');
        console.log(JSON.stringify(results.balanceSheetHistory, null, 2));

        console.log('\n=== CASHFLOW STATEMENT HISTORY ===');
        console.log(JSON.stringify(results.cashflowStatementHistory, null, 2));

        console.log('\n=== FINANCIAL DATA ===');
        console.log(JSON.stringify(results.financialData, null, 2));

        // Return the raw structure for inspection
        return NextResponse.json({
            symbol: ticker,
            incomeStatementHistory: results.incomeStatementHistory,
            balanceSheetHistory: results.balanceSheetHistory,
            cashflowStatementHistory: results.cashflowStatementHistory,
            financialData: results.financialData,
        }, { status: 200 });

    } catch (error) {
        console.error(`Error fetching financial data for ${symbol}:`, error);
        return NextResponse.json({
            error: 'Failed to fetch financial data',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
