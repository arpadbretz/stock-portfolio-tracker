import { NextRequest, NextResponse } from 'next/server';
import { getCachedQuoteSummary, getCachedFundamentals } from '@/lib/yahoo-finance';

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
        ];

        // 1. Fetch Metadata (Price, Quote, Profile)
        // 2. Fetch High-Fidelity 10-Year Fundamentals
        const [summaryAndQuote, annualData] = await Promise.all([
            getCachedQuoteSummary(ticker, [...modules, 'price']),
            getCachedFundamentals(ticker, 'annual')
        ]);

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

        const cleanAnnual = Array.isArray(annualData) ? annualData : [];

        // Helper to extract value (handles both fundamentalsTimeSeries direct props and quoteSummary raw objects)
        const extractValue = (item: any, key: string) => {
            if (!item) return null;
            const val = item[key];
            if (val === null || val === undefined) return null;
            if (typeof val === 'number') return val;
            if (typeof val === 'object' && 'raw' in val) return val.raw;
            return null;
        };

        const processIncomeStatement = (item: any) => {
            const date = item.date || item.endDate;
            if (!date) return null;
            return {
                endDate: date,
                totalRevenue: extractValue(item, 'totalRevenue'),
                costOfRevenue: extractValue(item, 'costOfRevenue'),
                grossProfit: extractValue(item, 'grossProfit'),
                researchDevelopment: extractValue(item, 'researchAndDevelopment') || extractValue(item, 'researchDevelopment'),
                sellingGeneralAdministrative: extractValue(item, 'sellingGeneralAndAdministration') || extractValue(item, 'sellingGeneralAdministrative'),
                operatingExpenses: extractValue(item, 'operatingExpense') || extractValue(item, 'operatingExpenses'),
                operatingIncome: extractValue(item, 'operatingIncome') || extractValue(item, 'ebit'),
                ebit: extractValue(item, 'ebit') || extractValue(item, 'operatingIncome'),
                ebitda: extractValue(item, 'ebitda'),
                interestExpense: extractValue(item, 'interestExpense'),
                incomeBeforeTax: extractValue(item, 'pretaxIncome') || extractValue(item, 'incomeBeforeTax'),
                incomeTaxExpense: extractValue(item, 'taxProvision') || extractValue(item, 'incomeTaxExpense'),
                netIncome: extractValue(item, 'netIncome') || extractValue(item, 'netIncomeCommonStockholders'),
                eps: extractValue(item, 'dilutedEPS') || extractValue(item, 'basicEPS') || extractValue(item, 'eps'),
            };
        };

        const processBalanceSheet = (item: any) => {
            const date = item.date || item.endDate;
            if (!date) return null;
            return {
                endDate: date,
                totalAssets: extractValue(item, 'totalAssets'),
                totalCurrentAssets: extractValue(item, 'currentAssets') || extractValue(item, 'totalCurrentAssets'),
                cash: extractValue(item, 'cashAndCashEquivalents') || extractValue(item, 'cash'),
                shortTermInvestments: extractValue(item, 'otherShortTermInvestments') || extractValue(item, 'shortTermInvestments'),
                netReceivables: extractValue(item, 'receivables') || extractValue(item, 'accountsReceivable') || extractValue(item, 'netReceivables'),
                inventory: extractValue(item, 'inventory'),
                totalNonCurrentAssets: extractValue(item, 'totalNonCurrentAssets'),
                propertyPlantEquipment: extractValue(item, 'netPPE') || extractValue(item, 'grossPPE') || extractValue(item, 'propertyPlantEquipment'),
                goodwill: extractValue(item, 'goodwill'),
                intangibleAssets: extractValue(item, 'intangibleAssets'),
                totalLiabilities: extractValue(item, 'totalLiabilitiesNetMinorityInterest') || extractValue(item, 'totalLiabilities'),
                totalCurrentLiabilities: extractValue(item, 'currentLiabilities') || extractValue(item, 'totalCurrentLiabilities'),
                accountsPayable: extractValue(item, 'accountsPayable'),
                shortTermDebt: extractValue(item, 'currentDebt') || extractValue(item, 'shortTermDebt'),
                longTermDebt: extractValue(item, 'longTermDebt'),
                totalDebt: extractValue(item, 'totalDebt'),
                totalStockholderEquity: extractValue(item, 'stockholdersEquity') || extractValue(item, 'commonStockEquity') || extractValue(item, 'totalStockholderEquity'),
                retainedEarnings: extractValue(item, 'retainedEarnings'),
            };
        };

        const processCashFlow = (item: any) => {
            const date = item.date || item.endDate;
            if (!date) return null;
            return {
                endDate: date,
                netIncome: extractValue(item, 'netIncome'),
                depreciation: extractValue(item, 'depreciationAndAmortization') || extractValue(item, 'depreciation'),
                operatingCashflow: extractValue(item, 'operatingCashFlow') || extractValue(item, 'operatingCashflow'),
                changeInWorkingCapital: extractValue(item, 'changeInWorkingCapital'),
                capitalExpenditures: extractValue(item, 'capitalExpenditure') || extractValue(item, 'capitalExpenditures'),
                investingCashflow: extractValue(item, 'investingCashFlow') || extractValue(item, 'investingCashflow'),
                financingCashflow: extractValue(item, 'financingCashFlow') || extractValue(item, 'financingCashflow'),
                dividendsPaid: extractValue(item, 'cashDividendsPaid') || extractValue(item, 'dividendsPaid'),
                stockRepurchases: extractValue(item, 'repurchaseOfCapitalStock') || extractValue(item, 'stockRepurchases'),
                debtRepayment: extractValue(item, 'repaymentOfDebt') || extractValue(item, 'debtRepayment'),
                freeCashflow: extractValue(item, 'freeCashFlow') || extractValue(item, 'freeCashflow'),
                netChangeInCash: extractValue(item, 'changesInCash') || extractValue(item, 'netChangeInCash'),
            };
        };

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
            incomeStatement: cleanAnnual.map(processIncomeStatement).filter(Boolean).sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),
            balanceSheet: cleanAnnual.map(processBalanceSheet).filter(Boolean).sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),
            cashFlow: cleanAnnual.map(processCashFlow).filter(Boolean).sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime()),
            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: stockData });
    } catch (error: any) {
        console.error(`Error fetching stock data for ${symbol}:`, error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
