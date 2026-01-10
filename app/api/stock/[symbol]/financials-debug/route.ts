import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)();

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;
    const searchParams = request.nextUrl.searchParams;
    const manualCookie = searchParams.get('cookie');

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    try {
        const ticker = symbol.toUpperCase();

        if (manualCookie) {
            console.log('Applying manual cookie...');
            yf._opts.cookie = manualCookie;
            console.log('Manual cookie applied.');
        }

        // Enable verbose searching
        // yf._opts.logger = console; // Uncomment if you want NOISY logs

        console.log(`\n=== FETCHING FINANCIAL DATA FOR ${ticker} (Cookie: ${manualCookie ? 'YES' : 'NO'}) ===\n`);

        const results = await yf.quoteSummary(ticker, {
            modules: [
                "incomeStatementHistory",
                "incomeStatementHistoryQuarterly",
                "balanceSheetHistory",
                "balanceSheetHistoryQuarterly",
                "cashflowStatementHistory",
                "cashflowStatementHistoryQuarterly",
                "financialData"
            ]
        });

        // Log the EXACT structure
        console.log('\n=== FULL RAW RESPONSE ===');
        console.log(JSON.stringify(results, null, 2));

        // Return the raw structure for inspection
        return NextResponse.json({
            symbol: ticker,
            annual: {
                income: results.incomeStatementHistory,
                balance: results.balanceSheetHistory,
                cashflow: results.cashflowStatementHistory,
            },
            quarterly: {
                income: results.incomeStatementHistoryQuarterly,
                balance: results.balanceSheetHistoryQuarterly,
                cashflow: results.cashflowStatementHistoryQuarterly,
            },
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
