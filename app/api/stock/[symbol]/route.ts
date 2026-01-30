import { NextRequest, NextResponse } from 'next/server';
import { getCachedQuoteSummary } from '@/lib/yahoo-finance';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;
    if (!symbol) return NextResponse.json({ success: false, error: 'Symbol required' }, { status: 400 });
    const ticker = symbol.toUpperCase();

    try {
        // 1. USE CENTRAL CACHED HELPER
        // This handles: DB-first, Dynamic Import, Timeout, 7-day Cache
        const modules = [
            'assetProfile',
            'summaryDetail',
            'financialData',
            'defaultKeyStatistics',
            'earnings',
            'calendarEvents',
            'incomeStatementHistory',
            'balanceSheetHistory',
            'cashflowStatementHistory',
        ];

        // We also need quote for the real-time price, but getCachedQuoteSummary can handle that if we add 'price'
        const summaryAndQuote = await getCachedQuoteSummary(ticker, [...modules, 'price']);

        if (!summaryAndQuote) {
            return NextResponse.json({ success: false, error: 'Stock not found' }, { status: 404 });
        }

        // --- PROCESSING LOGIC (SAME AS BEFORE) ---
        const profile = summaryAndQuote.assetProfile || {};
        const details = summaryAndQuote.summaryDetail || {};
        const financials = summaryAndQuote.financialData || {};
        const keyStats = summaryAndQuote.defaultKeyStatistics || {};
        const earnings = summaryAndQuote.earnings || {};
        const calendar = summaryAndQuote.calendarEvents || {};
        const price = summaryAndQuote.price || {};

        // Helper to extract value from Yahoo's object format ({raw, fmt})
        const extractYahooValue = (field: any): number | null => {
            if (field === null || field === undefined) return null;
            if (typeof field === 'number') return field;
            if (typeof field === 'object') {
                if ('raw' in field) return field.raw;
                if ('value' in field) return field.value;
            }
            return null;
        };

        const processIncomeStatement = (item: any) => {
            if (!item || !item.endDate) return null;
            return {
                endDate: item.endDate,
                totalRevenue: extractYahooValue(item.totalRevenue),
                costOfRevenue: extractYahooValue(item.costOfRevenue),
                grossProfit: extractYahooValue(item.grossProfit),
                researchDevelopment: extractYahooValue(item.researchDevelopment),
                sellingGeneralAdministrative: extractYahooValue(item.sellingGeneralAdministrative),
                operatingExpenses: extractYahooValue(item.operatingExpenses),
                operatingIncome: extractYahooValue(item.operatingIncome),
                ebit: extractYahooValue(item.ebit),
                ebitda: extractYahooValue(item.ebitda),
                interestExpense: extractYahooValue(item.interestExpense),
                incomeBeforeTax: extractYahooValue(item.incomeBeforeTax),
                incomeTaxExpense: extractYahooValue(item.incomeTaxExpense),
                netIncome: extractYahooValue(item.netIncome),
                eps: extractYahooValue(item.dilutedEPS) || extractYahooValue(item.basicEPS),
            };
        };

        const processBalanceSheet = (item: any) => {
            if (!item || !item.endDate) return null;
            return {
                endDate: item.endDate,
                totalAssets: extractYahooValue(item.totalAssets),
                totalCurrentAssets: extractYahooValue(item.totalCurrentAssets),
                cash: extractYahooValue(item.cash) || extractYahooValue(item.cashAndCashEquivalents),
                shortTermInvestments: extractYahooValue(item.shortTermInvestments),
                netReceivables: extractYahooValue(item.netReceivables),
                inventory: extractYahooValue(item.inventory),
                totalNonCurrentAssets: extractYahooValue(item.totalNonCurrentAssets),
                propertyPlantEquipment: extractYahooValue(item.propertyPlantEquipment) || extractYahooValue(item.netPPE),
                goodwill: extractYahooValue(item.goodwill),
                intangibleAssets: extractYahooValue(item.intangibleAssets),
                totalLiabilities: extractYahooValue(item.totalLiabilitiesNetMinorityInterest) || extractYahooValue(item.totalLiabilities),
                totalCurrentLiabilities: extractYahooValue(item.totalCurrentLiabilities),
                accountsPayable: extractYahooValue(item.accountsPayable),
                shortTermDebt: extractYahooValue(item.shortTermDebt) || extractYahooValue(item.currentDebt),
                longTermDebt: extractYahooValue(item.longTermDebt),
                totalDebt: extractYahooValue(item.totalDebt),
                totalStockholderEquity: extractYahooValue(item.totalStockholderEquity),
                retainedEarnings: extractYahooValue(item.retainedEarnings),
            };
        };

        const processCashFlow = (item: any) => {
            if (!item || !item.endDate) return null;
            return {
                endDate: item.endDate,
                netIncome: extractYahooValue(item.netIncome),
                depreciation: extractYahooValue(item.depreciation) || extractYahooValue(item.depreciationAndAmortization),
                operatingCashflow: extractYahooValue(item.totalCashFromOperatingActivities) || extractYahooValue(item.operatingCashflow),
                changeInWorkingCapital: extractYahooValue(item.changeInWorkingCapital),
                capitalExpenditures: extractYahooValue(item.capitalExpenditures),
                investingCashflow: extractYahooValue(item.totalCashflowsFromInvestingActivities) || extractYahooValue(item.investingCashflow),
                financingCashflow: extractYahooValue(item.totalCashFromFinancingActivities) || extractYahooValue(item.financingCashflow),
                dividendsPaid: extractYahooValue(item.dividendsPaid),
                stockRepurchases: extractYahooValue(item.repurchaseOfStock),
                debtRepayment: extractYahooValue(item.repurchaseOfDebt),
                freeCashflow: extractYahooValue(item.freeCashflow),
                netChangeInCash: extractYahooValue(item.netChangeInCash),
            };
        };

        const incomeAnnual = summaryAndQuote.incomeStatementHistory?.incomeStatementHistory || [];
        const balanceAnnual = summaryAndQuote.balanceSheetHistory?.balanceSheetStatements || [];
        const cashflowAnnual = summaryAndQuote.cashflowStatementHistory?.cashflowStatements || [];

        const stockData = {
            symbol: ticker,
            name: price.shortName || price.longName || ticker,
            exchange: price.fullExchangeName || price.exchange,
            currency: price.currency || 'USD',
            price: price.regularMarketPrice || 0,
            previousClose: price.regularMarketPreviousClose || 0,
            open: price.regularMarketOpen || 0,
            dayHigh: price.regularMarketDayHigh || 0,
            dayLow: price.regularMarketDayLow || 0,
            change: price.regularMarketChange || 0,
            changePercent: price.regularMarketChangePercent || 0,
            volume: price.regularMarketVolume || 0,
            avgVolume: price.averageDailyVolume3Month || 0,
            marketCap: price.marketCap || 0,
            sharesOutstanding: keyStats.sharesOutstanding || price.sharesOutstanding || null,
            fiftyTwoWeekHigh: price.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: price.fiftyTwoWeekLow || 0,
            fiftyTwoWeekChange: keyStats.fiftyTwoWeekChange || null,
            trailingPE: details.trailingPE || price.trailingPE || null,
            forwardPE: details.forwardPE || price.forwardPE || null,
            priceToBook: keyStats.priceToBook || null,
            pegRatio: keyStats.pegRatio || details.pegRatio || financials.pegRatio || null,
            priceToSales: keyStats.priceToSalesTrailing12Months || null,
            enterpriseValue: keyStats.enterpriseValue || null,
            evToRevenue: keyStats.enterpriseToRevenue || null,
            evToEbitda: keyStats.enterpriseToEbitda || null,
            dividendYield: details.dividendYield || null,
            dividendRate: details.dividendRate || null,
            exDividendDate: details.exDividendDate || null,
            payoutRatio: details.payoutRatio || null,
            beta: keyStats.beta || details.beta || null,
            eps: price.epsTrailingTwelveMonths || null,
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
            shortRatio: keyStats.shortRatio || null,
            shortPercentOfFloat: keyStats.shortPercentOfFloat || null,
            sharesShort: keyStats.sharesShort || null,
            sharesShortPriorMonth: keyStats.sharesShortPriorMonth || null,
            sector: profile.sector || null,
            industry: profile.industry || null,
            employees: profile.fullTimeEmployees || null,
            website: profile.website || null,
            description: profile.longBusinessSummary || null,
            country: profile.country || null,
            city: profile.city || null,
            earningsDate: calendar?.earnings?.earningsDate?.[0] || earnings?.earningsDate?.[0] || null,
            earningsQuarterlyGrowth: keyStats.earningsQuarterlyGrowth || null,
            incomeStatement: incomeAnnual.map(processIncomeStatement).filter(Boolean),
            balanceSheet: balanceAnnual.map(processBalanceSheet).filter(Boolean),
            cashFlow: cashflowAnnual.map(processCashFlow).filter(Boolean),
            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: stockData });
    } catch (error: any) {
        console.error(`Error fetching stock data for ${symbol}:`, error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
