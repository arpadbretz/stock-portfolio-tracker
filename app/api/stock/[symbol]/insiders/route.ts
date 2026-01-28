import { NextRequest, NextResponse } from 'next/server';
import { getCachedInsiders } from '@/lib/yahoo-finance';

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
        console.log(`Fetching insider data for ${ticker} (Cached)...`);

        const summary = await getCachedInsiders(ticker);

        if (!summary) {
            return NextResponse.json({
                success: true,
                data: {
                    symbol: ticker,
                    transactions: [],
                    holders: [],
                    message: 'No insider data available'
                }
            });
        }

        const transactions = summary?.insiderTransactions?.transactions || [];
        const holders = summary?.insiderHolders?.holders || [];

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
            success: true,
            data: {
                symbol: ticker,
                transactions: recentTransactions,
                holders: insiderHolders,
            }
        });
    } catch (error) {
        console.error(`Error fetching insider data for ${symbol}:`, error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch insider data',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
