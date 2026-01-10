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

        // Fetch comprehensive stock data including financial statements
        const [quote, summary] = await Promise.all([
            yf.quote(ticker),
            yf.quoteSummary(ticker, {
                modules: [
                    'assetProfile',
                    'summaryDetail',
                    'financialData',
                    'defaultKeyStatistics',
                    'earnings',
                    'calendarEvents',
                    'incomeStatementHistory',
                    'balanceSheetHistory',
                    'cashflowStatementHistory',
                ]
            }).catch(() => null)
        ]);

        if (!quote) {
            return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
        }

        const profile = summary?.assetProfile || {};
        const details = summary?.summaryDetail || {};
        const financials = summary?.financialData || {};
        const keyStats = summary?.defaultKeyStatistics || {};
        const earnings = summary?.earnings || {};
        const calendar = summary?.calendarEvents || {};
        const incomeHistory = summary?.incomeStatementHistory?.incomeStatementHistory || [];
        const balanceHistory = summary?.balanceSheetHistory?.balanceSheetStatements || [];
        const cashflowHistory = summary?.cashflowStatementHistory?.cashflowStatements || [];

        // Get next earnings date from calendar
        const earningsDate = calendar?.earnings?.earningsDate?.[0] || earnings?.earningsDate?.[0] || null;

        const stockData = {
            // Basic Info
            symbol: ticker,
            name: quote.shortName || quote.longName || ticker,
            exchange: quote.fullExchangeName || quote.exchange,
            currency: quote.currency || 'USD',

            // Price Data
            price: quote.regularMarketPrice || 0,
            previousClose: quote.regularMarketPreviousClose || 0,
            open: quote.regularMarketOpen || 0,
            dayHigh: quote.regularMarketDayHigh || 0,
            dayLow: quote.regularMarketDayLow || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,

            // Volume & Market Cap
            volume: quote.regularMarketVolume || 0,
            avgVolume: quote.averageDailyVolume3Month || 0,
            marketCap: quote.marketCap || 0,

            // 52 Week Range
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
            fiftyTwoWeekChange: keyStats.fiftyTwoWeekChange || null,

            // Valuation
            trailingPE: details.trailingPE || quote.trailingPE || null,
            forwardPE: details.forwardPE || quote.forwardPE || null,
            priceToBook: keyStats.priceToBook || null,
            pegRatio: keyStats.pegRatio || details.pegRatio || null,

            // Dividends
            dividendYield: details.dividendYield || null,
            dividendRate: details.dividendRate || null,
            exDividendDate: details.exDividendDate || null,

            // Financials
            beta: keyStats.beta || details.beta || null,
            eps: quote.epsTrailingTwelveMonths || null,
            revenueGrowth: financials.revenueGrowth || null,
            profitMargin: financials.profitMargins || null,
            operatingMargin: financials.operatingMargins || null,
            returnOnEquity: financials.returnOnEquity || null,
            debtToEquity: financials.debtToEquity || null,
            currentRatio: financials.currentRatio || null,
            freeCashflow: financials.freeCashflow || null,

            // Company Profile
            sector: profile.sector || null,
            industry: profile.industry || null,
            employees: profile.fullTimeEmployees || null,
            website: profile.website || null,
            description: profile.longBusinessSummary || null,

            // Earnings
            earningsDate: earningsDate,
            earningsQuarterlyGrowth: keyStats.earningsQuarterlyGrowth || null,

            // Financial Statements
            incomeStatement: incomeHistory.map((item: any) => ({
                endDate: item.endDate,
                totalRevenue: item.totalRevenue,
                costOfRevenue: item.costOfRevenue,
                grossProfit: item.grossProfit,
                operatingExpenses: item.totalOperatingExpenses,
                operatingIncome: item.operatingIncome,
                netIncome: item.netIncome,
                ebit: item.ebit,
                interestExpense: item.interestExpense,
            })),

            balanceSheet: balanceHistory.map((item: any) => ({
                endDate: item.endDate,
                totalAssets: item.totalAssets,
                totalLiabilities: item.totalLiab,
                totalStockholderEquity: item.totalStockholderEquity,
                cash: item.cash,
                shortTermInvestments: item.shortTermInvestments,
                totalCurrentAssets: item.totalCurrentAssets,
                totalCurrentLiabilities: item.totalCurrentLiabilities,
                longTermDebt: item.longTermDebt,
                retainedEarnings: item.retainedEarnings,
            })),

            cashFlow: cashflowHistory.map((item: any) => ({
                endDate: item.endDate,
                operatingCashflow: item.totalCashFromOperatingActivities,
                capitalExpenditures: item.capitalExpenditures,
                freeCashflow: item.totalCashFromOperatingActivities && item.capitalExpenditures
                    ? item.totalCashFromOperatingActivities + item.capitalExpenditures
                    : null,
                dividendsPaid: item.dividendsPaid,
                netBorrowings: item.netBorrowings,
                stockRepurchased: item.repurchaseOfStock,
            })),

            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json(stockData);
    } catch (error) {
        console.error(`Error fetching stock data for ${symbol}:`, error);
        return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
    }
}
