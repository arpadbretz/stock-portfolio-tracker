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

        const filterNullValues = (obj: any) => {
            if (!obj) return null;
            const filtered: any = {};
            for (const [key, value] of Object.entries(obj)) {
                if (value !== null) filtered[key] = value;
            }
            return Object.keys(filtered).length > 1 ? filtered : null;
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
            // For now, we don't have annualData here, we need to fetch fundamentals separately or add them
            incomeStatement: [],
            balanceSheet: [],
            cashFlow: [],
            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: stockData });
    } catch (error: any) {
        console.error(`Error fetching stock data for ${symbol}:`, error);
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
