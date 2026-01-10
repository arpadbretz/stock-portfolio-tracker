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
                    'incomeStatementHistoryQuarterly',
                    'balanceSheetHistory',
                    'balanceSheetHistoryQuarterly',
                    'cashflowStatementHistory',
                    'cashflowStatementHistoryQuarterly',
                ]
            }).catch((e: any) => {
                console.warn('quoteSummary partial failure:', e.message);
                return null;
            })
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

        // Get annual statements
        const incomeAnnual = summary?.incomeStatementHistory?.incomeStatementHistory || [];
        const balanceAnnual = summary?.balanceSheetHistory?.balanceSheetStatements || [];
        const cashflowAnnual = summary?.cashflowStatementHistory?.cashflowStatements || [];

        // Get next earnings date from calendar
        const earningsDate = calendar?.earnings?.earningsDate?.[0] || earnings?.earningsDate?.[0] || null;

        // Process income statements with correct field names
        const processIncomeStatement = (item: any) => {
            if (!item) return null;
            return {
                endDate: item.endDate,
                totalRevenue: extractValue(item.totalRevenue),
                costOfRevenue: extractValue(item.costOfRevenue),
                grossProfit: extractValue(item.grossProfit),
                researchDevelopment: extractValue(item.researchDevelopment),
                sellingGeneralAdministrative: extractValue(item.sellingGeneralAdministrative),
                operatingExpenses: extractValue(item.totalOperatingExpenses),
                operatingIncome: extractValue(item.operatingIncome),
                interestExpense: extractValue(item.interestExpense),
                incomeBeforeTax: extractValue(item.incomeBeforeTax),
                incomeTaxExpense: extractValue(item.incomeTaxExpense),
                netIncome: extractValue(item.netIncome),
                ebit: extractValue(item.ebit),
                ebitda: extractValue(item.ebitda),
            };
        };

        // Process balance sheet with correct field names
        const processBalanceSheet = (item: any) => {
            if (!item) return null;
            return {
                endDate: item.endDate,
                totalAssets: extractValue(item.totalAssets),
                totalCurrentAssets: extractValue(item.totalCurrentAssets),
                cash: extractValue(item.cash),
                shortTermInvestments: extractValue(item.shortTermInvestments),
                netReceivables: extractValue(item.netReceivables),
                inventory: extractValue(item.inventory),
                totalLiabilities: extractValue(item.totalLiab),
                totalCurrentLiabilities: extractValue(item.totalCurrentLiabilities),
                accountsPayable: extractValue(item.accountsPayable),
                longTermDebt: extractValue(item.longTermDebt),
                totalStockholderEquity: extractValue(item.totalStockholderEquity),
                commonStock: extractValue(item.commonStock),
                retainedEarnings: extractValue(item.retainedEarnings),
            };
        };

        // Process cash flow with correct field names
        const processCashFlow = (item: any) => {
            if (!item) return null;
            const opCashflow = extractValue(item.totalCashFromOperatingActivities);
            const capex = extractValue(item.capitalExpenditures);
            return {
                endDate: item.endDate,
                operatingCashflow: opCashflow,
                capitalExpenditures: capex,
                freeCashflow: opCashflow && capex ? opCashflow + capex : null,
                depreciation: extractValue(item.depreciation),
                changeInCash: extractValue(item.changeInCash),
                dividendsPaid: extractValue(item.dividendsPaid),
                netBorrowings: extractValue(item.netBorrowings),
                stockRepurchased: extractValue(item.repurchaseOfStock),
                issuanceOfStock: extractValue(item.issuanceOfStock),
            };
        };

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
            sharesOutstanding: keyStats.sharesOutstanding || quote.sharesOutstanding || null,

            // 52 Week Range
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
            fiftyTwoWeekChange: keyStats.fiftyTwoWeekChange || null,

            // Valuation
            trailingPE: details.trailingPE || quote.trailingPE || null,
            forwardPE: details.forwardPE || quote.forwardPE || null,
            priceToBook: keyStats.priceToBook || null,
            pegRatio: keyStats.pegRatio || details.pegRatio || financials.pegRatio || null,
            priceToSales: keyStats.priceToSalesTrailing12Months || null,
            enterpriseValue: keyStats.enterpriseValue || null,
            evToRevenue: keyStats.enterpriseToRevenue || null,
            evToEbitda: keyStats.enterpriseToEbitda || null,

            // Dividends
            dividendYield: details.dividendYield || null,
            dividendRate: details.dividendRate || null,
            exDividendDate: details.exDividendDate || null,
            payoutRatio: details.payoutRatio || null,

            // Financials
            beta: keyStats.beta || details.beta || null,
            eps: quote.epsTrailingTwelveMonths || null,
            forwardEps: keyStats.forwardEps || null,
            revenueGrowth: financials.revenueGrowth || null,
            earningsGrowth: financials.earningsGrowth || null,
            profitMargin: financials.profitMargins || null,
            grossMargin: financials.grossMargins || null,
            operatingMargin: financials.operatingMargins || null,
            returnOnAssets: financials.returnOnAssets || null,
            returnOnEquity: financials.returnOnEquity || null,
            debtToEquity: financials.debtToEquity || null,
            currentRatio: financials.currentRatio || null,
            quickRatio: financials.quickRatio || null,
            freeCashflow: financials.freeCashflow || null,
            operatingCashflow: financials.operatingCashflow || null,
            totalRevenue: financials.totalRevenue || null,
            totalDebt: financials.totalDebt || null,
            totalCash: financials.totalCash || null,

            // Company Profile
            sector: profile.sector || null,
            industry: profile.industry || null,
            employees: profile.fullTimeEmployees || null,
            website: profile.website || null,
            description: profile.longBusinessSummary || null,
            country: profile.country || null,
            city: profile.city || null,

            // Earnings
            earningsDate: earningsDate,
            earningsQuarterlyGrowth: keyStats.earningsQuarterlyGrowth || null,

            // Financial Statements (Annual)
            incomeStatement: incomeAnnual.map(processIncomeStatement).filter(Boolean),
            balanceSheet: balanceAnnual.map(processBalanceSheet).filter(Boolean),
            cashFlow: cashflowAnnual.map(processCashFlow).filter(Boolean),

            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json(stockData);
    } catch (error) {
        console.error(`Error fetching stock data for ${symbol}:`, error);
        return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
    }
}

// Helper to extract numeric values from Yahoo Finance's nested structure
function extractValue(field: any): number | null {
    if (field === null || field === undefined) return null;
    if (typeof field === 'number') return field;
    if (typeof field === 'object' && field.raw !== undefined) return field.raw;
    if (typeof field === 'object' && field.value !== undefined) return field.value;
    return null;
}
