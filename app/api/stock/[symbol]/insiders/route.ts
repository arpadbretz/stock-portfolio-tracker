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

        console.log(`Fetching insider data for ${ticker}...`);

        const summary = await yf.quoteSummary(ticker, {
            modules: ['insiderTransactions', 'insiderHolders']
        }).catch((e: any) => {
            console.error('Yahoo Finance insider error:', e);
            return null;
        });

        if (!summary) {
            console.log('No summary data returned for insiders');
            return NextResponse.json({
                symbol: ticker,
                transactions: [],
                holders: [],
                message: 'No insider data available'
            });
        }

        console.log('Insider data keys:', Object.keys(summary));

        const transactions = summary?.insiderTransactions?.transactions || [];
        const holders = summary?.insiderHolders?.holders || [];

        console.log(`Found ${transactions.length} transactions, ${holders.length} holders`);

        // Process transactions
        const recentTransactions = transactions.slice(0, 20).map((txn: any) => ({
            filerName: txn.filerName,
            filerRelation: txn.filerRelation,
            transactionText: txn.transactionText,
            moneyText: txn.moneyText,
            ownership: txn.ownership,
            startDate: txn.startDate ? new Date(txn.startDate.raw * 1000).toISOString() : null,
            value: txn.value?.raw || null,
            shares: txn.shares?.raw || null,
        }));

        // Process holders
        const insiderHolders = holders.map((holder: any) => ({
            name: holder.name,
            relation: holder.relation,
            url: holder.url,
            transactionDescription: holder.transactionDescription,
            latestTransDate: holder.latestTransDate ? new Date(holder.latestTransDate.raw * 1000).toISOString() : null,
            positionDirect: holder.positionDirect?.raw || null,
            positionDirectDate: holder.positionDirectDate ? new Date(holder.positionDirectDate.raw * 1000).toISOString() : null,
        }));

        return NextResponse.json({
            symbol: ticker,
            transactions: recentTransactions,
            holders: insiderHolders,
        });
    } catch (error) {
        console.error(`Error fetching insider data for ${symbol}:`, error);
        return NextResponse.json({
            error: 'Failed to fetch insider data',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
