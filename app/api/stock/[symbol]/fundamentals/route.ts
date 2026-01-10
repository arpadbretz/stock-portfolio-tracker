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

        const summary = await yf.quoteSummary(ticker, {
            modules: [
                'incomeStatementHistory',
                'balanceSheetHistory',
                'cashflowStatementHistory',
                'earnings',
                'earningsHistory',
            ]
        }).catch(() => null);

        if (!summary) {
            return NextResponse.json({ error: 'No fundamentals data' }, { status: 404 });
        }

        const incomeAnnual = summary?.incomeStatementHistory?.incomeStatementHistory || [];
        const balanceAnnual = summary?.balanceSheetHistory?.balanceSheetStatements || [];
        const cashflowAnnual = summary?.cashflowStatementHistory?.cashflowStatements || [];
        const earningsHistory = summary?.earningsHistory?.history || [];

        // Build time series data for charts
        const revenueData = incomeAnnual.map((item: any) => ({
            date: item.endDate,
            year: new Date(item.endDate).getFullYear(),
            value: extractValue(item.totalRevenue),
        })).filter((d: any) => d.value !== null).reverse();

        const netIncomeData = incomeAnnual.map((item: any) => ({
            date: item.endDate,
            year: new Date(item.endDate).getFullYear(),
            value: extractValue(item.netIncome),
        })).filter((d: any) => d.value !== null).reverse();

        const grossProfitData = incomeAnnual.map((item: any) => ({
            date: item.endDate,
            year: new Date(item.endDate).getFullYear(),
            value: extractValue(item.grossProfit),
        })).filter((d: any) => d.value !== null).reverse();

        const operatingIncomeData = incomeAnnual.map((item: any) => ({
            date: item.endDate,
            year: new Date(item.endDate).getFullYear(),
            value: extractValue(item.operatingIncome),
        })).filter((d: any) => d.value !== null).reverse();

        const freeCashflowData = cashflowAnnual.map((item: any) => {
            const opCf = extractValue(item.totalCashFromOperatingActivities);
            const capex = extractValue(item.capitalExpenditures);
            return {
                date: item.endDate,
                year: new Date(item.endDate).getFullYear(),
                value: opCf && capex ? opCf + capex : null,
            };
        }).filter((d: any) => d.value !== null).reverse();

        const operatingCashflowData = cashflowAnnual.map((item: any) => ({
            date: item.endDate,
            year: new Date(item.endDate).getFullYear(),
            value: extractValue(item.totalCashFromOperatingActivities),
        })).filter((d: any) => d.value !== null).reverse();

        const totalAssetsData = balanceAnnual.map((item: any) => ({
            date: item.endDate,
            year: new Date(item.endDate).getFullYear(),
            value: extractValue(item.totalAssets),
        })).filter((d: any) => d.value !== null).reverse();

        const totalDebtData = balanceAnnual.map((item: any) => ({
            date: item.endDate,
            year: new Date(item.endDate).getFullYear(),
            value: extractValue(item.longTermDebt) || 0,
        })).filter((d: any) => d.value !== null).reverse();

        const shareholderEquityData = balanceAnnual.map((item: any) => ({
            date: item.endDate,
            year: new Date(item.endDate).getFullYear(),
            value: extractValue(item.totalStockholderEquity),
        })).filter((d: any) => d.value !== null).reverse();

        // Historical EPS from earnings
        const epsData = earningsHistory.map((item: any) => ({
            date: item.quarter,
            quarter: item.quarter ? new Date(item.quarter).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : null,
            actual: extractValue(item.epsActual),
            estimate: extractValue(item.epsEstimate),
        })).filter((d: any) => d.actual !== null).reverse();

        return NextResponse.json({
            symbol: ticker,
            revenue: revenueData,
            netIncome: netIncomeData,
            grossProfit: grossProfitData,
            operatingIncome: operatingIncomeData,
            freeCashflow: freeCashflowData,
            operatingCashflow: operatingCashflowData,
            totalAssets: totalAssetsData,
            totalDebt: totalDebtData,
            shareholderEquity: shareholderEquityData,
            eps: epsData,
        });
    } catch (error) {
        console.error(`Error fetching fundamentals for ${symbol}:`, error);
        return NextResponse.json({ error: 'Failed to fetch fundamentals' }, { status: 500 });
    }
}

function extractValue(field: any): number | null {
    if (field === null || field === undefined) return null;
    if (typeof field === 'number') return field;
    if (typeof field === 'object' && field.raw !== undefined) return field.raw;
    if (typeof field === 'object' && field.value !== undefined) return field.value;
    return null;
}
