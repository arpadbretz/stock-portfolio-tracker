import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

// Suppress validation errors - Yahoo's quarterly data often has schema issues
const yf = new (YahooFinance as any)({
    suppressNotices: ['yahooSurvey'],
    validation: { logErrors: false }
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;

    if (!symbol) {
        return NextResponse.json({ success: false, error: 'Symbol required' }, { status: 400 });
    }

    try {
        const ticker = symbol.toUpperCase();

        // Fetch quote and summary data
        const [quote, summary, annualData, quarterlyData] = await Promise.all([
            yf.quote(ticker),
            yf.quoteSummary(ticker, {
                modules: [
                    'assetProfile',
                    'summaryDetail',
                    'financialData',
                    'defaultKeyStatistics',
                    'earnings',
                    'calendarEvents',
                ]
            }).catch((e: any) => {
                console.warn('quoteSummary partial failure:', e.message);
                return null;
            }),
            // Use fundamentalsTimeSeries for annual financial data (past 10 years)
            yf.fundamentalsTimeSeries(ticker, {
                period1: new Date(new Date().getFullYear() - 10, 0, 1),
                period2: new Date(),
                type: 'annual',
                module: 'all'
            }).catch((e: any) => {
                console.warn('fundamentalsTimeSeries annual failure:', e.message);
                return [];
            }),
            // Use fundamentalsTimeSeries for quarterly financial data (past 3 years)
            yf.fundamentalsTimeSeries(ticker, {
                period1: new Date(new Date().getFullYear() - 3, 0, 1),
                period2: new Date(),
                type: 'quarterly',
                module: 'all'
            }).catch((e: any) => {
                console.warn('fundamentalsTimeSeries quarterly failure:', e.message);
                return [];
            })
        ]);

        if (!quote) {
            return NextResponse.json({ success: false, error: 'Stock not found' }, { status: 404 });
        }

        const profile = summary?.assetProfile || {};
        const details = summary?.summaryDetail || {};
        const financials = summary?.financialData || {};
        const keyStats = summary?.defaultKeyStatistics || {};
        const earnings = summary?.earnings || {};
        const calendar = summary?.calendarEvents || {};

        console.log(`[${ticker}] fundamentalsTimeSeries data: annual=${annualData.length}, quarterly=${quarterlyData.length}`);

        // Get next earnings date from calendar
        const earningsDate = calendar?.earnings?.earningsDate?.[0] || earnings?.earningsDate?.[0] || null;

        // Process fundamentalsTimeSeries data into income statement format
        const processIncomeStatement = (item: any) => {
            if (!item || !item.date) return null;

            return {
                endDate: item.date,
                totalRevenue: item.totalRevenue || null,
                costOfRevenue: item.costOfRevenue || null,
                grossProfit: item.grossProfit || null,
                researchDevelopment: item.researchAndDevelopment || null,
                sellingGeneralAdministrative: item.sellingGeneralAndAdministration || null,
                operatingExpenses: item.operatingExpense || null,
                operatingIncome: item.operatingIncome || item.EBIT || null,
                ebit: item.EBIT || null,
                ebitda: item.EBITDA || null,
                interestExpense: item.interestExpense || null,
                incomeBeforeTax: item.pretaxIncome || null,
                incomeTaxExpense: item.taxProvision || null,
                netIncome: item.netIncome || item.netIncomeCommonStockholders || null,
                eps: item.dilutedEPS || item.basicEPS || null,
            };
        };

        // Process fundamentalsTimeSeries data into balance sheet format
        const processBalanceSheet = (item: any) => {
            if (!item || !item.date) return null;

            return {
                endDate: item.date,
                totalAssets: item.totalAssets || null,
                totalCurrentAssets: item.currentAssets || null,
                cash: item.cashAndCashEquivalents || item.cashCashEquivalentsAndShortTermInvestments || null,
                shortTermInvestments: item.otherShortTermInvestments || null,
                netReceivables: item.receivables || item.accountsReceivable || null,
                inventory: item.inventory || null,
                totalNonCurrentAssets: item.totalNonCurrentAssets || null,
                propertyPlantEquipment: item.netPPE || item.grossPPE || null,
                goodwill: item.goodwill || null,
                intangibleAssets: item.intangibleAssets || null,
                totalLiabilities: item.totalLiabilitiesNetMinorityInterest || null,
                totalCurrentLiabilities: item.currentLiabilities || null,
                accountsPayable: item.accountsPayable || null,
                shortTermDebt: item.currentDebt || item.otherCurrentBorrowings || null,
                longTermDebt: item.longTermDebt || null,
                totalDebt: item.totalDebt || null,
                totalStockholderEquity: item.stockholdersEquity || item.commonStockEquity || null,
                retainedEarnings: item.retainedEarnings || null,
                commonStock: item.commonStock || item.capitalStock || null,
            };
        };

        // Process fundamentalsTimeSeries data into cash flow format
        const processCashFlow = (item: any) => {
            if (!item || !item.date) return null;

            return {
                endDate: item.date,
                netIncome: item.netIncome || null,
                depreciation: item.depreciationAndAmortization || item.depreciationAmortizationDepletion || null,
                operatingCashflow: item.operatingCashFlow || item.cashFlowFromContinuingOperatingActivities || null,
                changeInWorkingCapital: item.changeInWorkingCapital || null,
                capitalExpenditures: item.capitalExpenditure || item.purchaseOfPPE || null,
                investingCashflow: item.investingCashFlow || item.cashFlowFromContinuingInvestingActivities || null,
                financingCashflow: item.financingCashFlow || item.cashFlowFromContinuingFinancingActivities || null,
                dividendsPaid: item.cashDividendsPaid || item.commonStockDividendPaid || null,
                stockRepurchases: item.repurchaseOfCapitalStock || item.commonStockPayments || null,
                debtRepayment: item.repaymentOfDebt || null,
                freeCashflow: item.freeCashFlow || null,
                netChangeInCash: item.changesInCash || null,
            };
        };

        // Filter out null entries
        const filterNullValues = (obj: any) => {
            if (!obj) return null;
            const filtered: any = {};
            for (const [key, value] of Object.entries(obj)) {
                if (value !== null) {
                    filtered[key] = value;
                }
            }
            return Object.keys(filtered).length > 1 ? filtered : null; // Must have more than just endDate
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

            // Short Interest
            shortRatio: keyStats.shortRatio || null,
            shortPercentOfFloat: keyStats.shortPercentOfFloat || null,
            sharesShort: keyStats.sharesShort || null,
            sharesShortPriorMonth: keyStats.sharesShortPriorMonth || null,

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

            // Financial Statements - ANNUAL (from fundamentalsTimeSeries)
            incomeStatement: annualData
                .map(processIncomeStatement)
                .map(filterNullValues)
                .filter(Boolean)
                .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),
            balanceSheet: annualData
                .map(processBalanceSheet)
                .map(filterNullValues)
                .filter(Boolean)
                .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),
            cashFlow: annualData
                .map(processCashFlow)
                .map(filterNullValues)
                .filter(Boolean)
                .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),

            // Financial Statements - QUARTERLY (from fundamentalsTimeSeries)
            incomeStatementQuarterly: quarterlyData
                .map(processIncomeStatement)
                .map(filterNullValues)
                .filter(Boolean)
                .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),
            balanceSheetQuarterly: quarterlyData
                .map(processBalanceSheet)
                .map(filterNullValues)
                .filter(Boolean)
                .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),
            cashFlowQuarterly: quarterlyData
                .map(processCashFlow)
                .map(filterNullValues)
                .filter(Boolean)
                .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),

            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: stockData });
    } catch (error) {
        console.error(`Error fetching stock data for ${symbol}:`, error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stock data' }, { status: 500 });
    }
}
