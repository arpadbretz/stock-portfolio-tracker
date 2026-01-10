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

        // Helper to safely extract value
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

        // Build time series data for charts
        const revenueData = incomeAnnual.map((item: any) => {
            const val = extractValue(item.totalRevenue);
            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000);
            } else if (typeof endDate === 'string') {
                endDate = new Date(endDate);
            }
            return {
                date: endDate,
                year: endDate instanceof Date ? endDate.getFullYear() : null,
                value: val,
            };
        }).filter((d: any) => d.value !== null && d.year).reverse();

        const netIncomeData = incomeAnnual.map((item: any) => {
            const val = extractValue(item.netIncome);
            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000);
            } else if (typeof endDate === 'string') {
                endDate = new Date(endDate);
            }
            return {
                date: endDate,
                year: endDate instanceof Date ? endDate.getFullYear() : null,
                value: val,
            };
        }).filter((d: any) => d.value !== null && d.year).reverse();

        const grossProfitData = incomeAnnual.map((item: any) => {
            const val = extractValue(item.grossProfit);
            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000);
            } else if (typeof endDate === 'string') {
                endDate = new Date(endDate);
            }
            return {
                date: endDate,
                year: endDate instanceof Date ? endDate.getFullYear() : null,
                value: val,
            };
        }).filter((d: any) => d.value !== null && d.year).reverse();

        const operatingIncomeData = incomeAnnual.map((item: any) => {
            const val = extractValue(item.operatingIncome);
            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000);
            } else if (typeof endDate === 'string') {
                endDate = new Date(endDate);
            }
            return {
                date: endDate,
                year: endDate instanceof Date ? endDate.getFullYear() : null,
                value: val,
            };
        }).filter((d: any) => d.value !== null && d.year).reverse();

        const freeCashflowData = cashflowAnnual.map((item: any) => {
            const opCf = extractValue(item.totalCashFromOperatingActivities) || extractValue(item.operatingCashflow);
            const capex = extractValue(item.capitalExpenditures);
            const fcf = opCf && capex ? opCf + capex : null;
            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000);
            } else if (typeof endDate === 'string') {
                endDate = new Date(endDate);
            }
            return {
                date: endDate,
                year: endDate instanceof Date ? endDate.getFullYear() : null,
                value: fcf,
            };
        }).filter((d: any) => d.value !== null && d.year).reverse();

        const operatingCashflowData = cashflowAnnual.map((item: any) => {
            const val = extractValue(item.totalCashFromOperatingActivities) || extractValue(item.operatingCashflow);
            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000);
            } else if (typeof endDate === 'string') {
                endDate = new Date(endDate);
            }
            return {
                date: endDate,
                year: endDate instanceof Date ? endDate.getFullYear() : null,
                value: val,
            };
        }).filter((d: any) => d.value !== null && d.year).reverse();

        const totalAssetsData = balanceAnnual.map((item: any) => {
            const val = extractValue(item.totalAssets);
            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000);
            } else if (typeof endDate === 'string') {
                endDate = new Date(endDate);
            }
            return {
                date: endDate,
                year: endDate instanceof Date ? endDate.getFullYear() : null,
                value: val,
            };
        }).filter((d: any) => d.value !== null && d.year).reverse();

        const totalDebtData = balanceAnnual.map((item: any) => {
            const val = extractValue(item.longTermDebt) || 0;
            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000);
            } else if (typeof endDate === 'string') {
                endDate = new Date(endDate);
            }
            return {
                date: endDate,
                year: endDate instanceof Date ? endDate.getFullYear() : null,
                value: val,
            };
        }).filter((d: any) => d.value !== null && d.year).reverse();

        const shareholderEquityData = balanceAnnual.map((item: any) => {
            const val = extractValue(item.totalStockholderEquity) || extractValue(item.totalShareholderEquity);
            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000);
            } else if (typeof endDate === 'string') {
                endDate = new Date(endDate);
            }
            return {
                date: endDate,
                year: endDate instanceof Date ? endDate.getFullYear() : null,
                value: val,
            };
        }).filter((d: any) => d.value !== null && d.year).reverse();

        // Historical EPS from earnings
        const epsData = earningsHistory.map((item: any) => {
            const actual = extractValue(item.epsActual);
            let quarter = item.quarter;
            if (typeof quarter === 'object' && quarter?.raw) {
                quarter = new Date(quarter.raw * 1000);
            }
            return {
                date: quarter,
                quarter: quarter instanceof Date ? quarter.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : null,
                actual: actual,
                estimate: extractValue(item.epsEstimate),
            };
        }).filter((d: any) => d.actual !== null).reverse();

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
