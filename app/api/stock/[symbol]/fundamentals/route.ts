import { NextRequest, NextResponse } from 'next/server';
import { getCachedQuoteSummary } from '@/lib/yahoo-finance';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;
    if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    const ticker = symbol.toUpperCase();

    try {
        const summary = await getCachedQuoteSummary(ticker, [
            'incomeStatementHistory',
            'balanceSheetHistory',
            'cashflowStatementHistory',
            'earnings',
            'earningsHistory',
        ]);

        if (!summary) throw new Error('No data');

        const extractValue = (field: any): number | null => {
            if (field === null || field === undefined) return null;
            if (typeof field === 'number') return field;
            if (typeof field === 'object') {
                if ('raw' in field) return field.raw;
                if ('value' in field) return field.value;
            }
            return null;
        };

        const incomeAnnual = summary?.incomeStatementHistory?.incomeStatementHistory || [];
        const balanceAnnual = summary?.balanceSheetHistory?.balanceSheetStatements || [];
        const cashflowAnnual = summary?.cashflowStatementHistory?.cashflowStatements || [];
        const earningsHistory = summary?.earningsHistory?.history || [];

        const processTimeSeries = (arr: any[], field: string) => {
            return arr.map((item: any) => {
                const val = extractValue(item[field]);
                let endDate = item.endDate;
                if (typeof endDate === 'object' && endDate?.raw) endDate = new Date(endDate.raw * 1000);
                else if (typeof endDate === 'string') endDate = new Date(endDate);
                return {
                    date: endDate,
                    year: endDate instanceof Date ? endDate.getFullYear() : null,
                    value: val,
                };
            }).filter((d: any) => d.value !== null && d.year).reverse();
        };

        return NextResponse.json({
            symbol: ticker,
            revenue: processTimeSeries(incomeAnnual, 'totalRevenue'),
            netIncome: processTimeSeries(incomeAnnual, 'netIncome'),
            grossProfit: processTimeSeries(incomeAnnual, 'grossProfit'),
            operatingIncome: processTimeSeries(incomeAnnual, 'operatingIncome'),
            freeCashflow: cashflowAnnual.map((item: any) => {
                const opCf = extractValue(item.totalCashFromOperatingActivities) || extractValue(item.operatingCashflow);
                const capex = extractValue(item.capitalExpenditures);
                const fcf = opCf && capex ? opCf + capex : null;
                let endDate = item.endDate;
                if (typeof endDate === 'object' && endDate?.raw) endDate = new Date(endDate.raw * 1000);
                return { date: endDate, year: endDate instanceof Date ? endDate.getFullYear() : null, value: fcf };
            }).filter((d: any) => d.value !== null && d.year).reverse(),
            operatingCashflow: processTimeSeries(cashflowAnnual, 'totalCashFromOperatingActivities'),
            totalAssets: processTimeSeries(balanceAnnual, 'totalAssets'),
            totalDebt: processTimeSeries(balanceAnnual, 'longTermDebt'),
            shareholderEquity: processTimeSeries(balanceAnnual, 'totalStockholderEquity'),
            eps: earningsHistory.map((item: any) => ({
                date: item.quarter?.raw ? new Date(item.quarter.raw * 1000) : null,
                quarter: item.quarter?.raw ? new Date(item.quarter.raw * 1000).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : null,
                actual: extractValue(item.epsActual),
                estimate: extractValue(item.epsEstimate),
            })).filter((d: any) => d.actual !== null).reverse(),
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
