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

        // Get annual statements - handle both possible structures
        const incomeAnnual = summary?.incomeStatementHistory?.incomeStatementHistory || [];
        const balanceAnnual = summary?.balanceSheetHistory?.balanceSheetStatements || [];
        const cashflowAnnual = summary?.cashflowStatementHistory?.cashflowStatements || [];

        // Get next earnings date from calendar
        const earningsDate = calendar?.earnings?.earningsDate?.[0] || earnings?.earningsDate?.[0] || null;

        // Helper to safely extract numeric value from various Yahoo Finance formats
        const extractValue = (field: any): number | null => {
            if (field === null || field === undefined) return null;
            if (typeof field === 'number') return field;
            if (typeof field === 'object') {
                // Try all possible nested formats
                if ('raw' in field) return field.raw;
                if ('value' in field) return field.value;
                if ('fmt' in field && field.raw === undefined) {
                    // Parse formatted string like "$1.5B"
                    const str = field.fmt;
                    if (typeof str === 'string') {
                        const num = parseFloat(str.replace(/[$,]/g, ''));
                        if (!isNaN(num)) return num;
                    }
                }
            }
            return null;
        };

        // Process income statements - try all known field variations
        const processIncomeStatement = (item: any) => {
            if (!item) return null;

            // Extract date
            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000).toISOString();
            }

            return {
                endDate: endDate,
                totalRevenue: extractValue(item.totalRevenue),
                costOfRevenue: extractValue(item.costOfRevenue),
                grossProfit: extractValue(item.grossProfit),
                researchDevelopment: extractValue(item.researchDevelopment) || extractValue(item.researchAndDevelopment),
                sellingGeneralAdministrative: extractValue(item.sellingGeneralAdministrative),
                operatingExpenses: extractValue(item.totalOperatingExpenses) || extractValue(item.operatingExpenses),
                operatingIncome: extractValue(item.operatingIncome),
                interestExpense: extractValue(item.interestExpense),
                incomeBeforeTax: extractValue(item.incomeBeforeTax),
                incomeTaxExpense: extractValue(item.incomeTaxExpense),
                netIncome: extractValue(item.netIncome),
                ebit: extractValue(item.ebit),
                ebitda: extractValue(item.ebitda),
            };
        };

        // Process balance sheet
        const processBalanceSheet = (item: any) => {
            if (!item) return null;

            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000).toISOString();
            }

            return {
                endDate: endDate,
                totalAssets: extractValue(item.totalAssets),
                totalCurrentAssets: extractValue(item.totalCurrentAssets),
                cash: extractValue(item.cash) || extractValue(item.cashAndCashEquivalents),
                shortTermInvestments: extractValue(item.shortTermInvestments),
                netReceivables: extractValue(item.netReceivables),
                inventory: extractValue(item.inventory),
                totalLiabilities: extractValue(item.totalLiab) || extractValue(item.totalLiabilities),
                totalCurrentLiabilities: extractValue(item.totalCurrentLiabilities),
                accountsPayable: extractValue(item.accountsPayable),
                longTermDebt: extractValue(item.longTermDebt),
                totalStockholderEquity: extractValue(item.totalStockholderEquity) || extractValue(item.totalShareholderEquity),
                commonStock: extractValue(item.commonStock),
                retainedEarnings: extractValue(item.retainedEarnings),
            };
        };

        // Process cash flow
        const processCashFlow = (item: any) => {
            if (!item) return null;

            let endDate = item.endDate;
            if (typeof endDate === 'object' && endDate?.raw) {
                endDate = new Date(endDate.raw * 1000).toISOString();
            }

            const opCashflow = extractValue(item.totalCashFromOperatingActivities) || extractValue(item.operatingCashflow);
            const capex = extractValue(item.capitalExpenditures);

            return {
                endDate: endDate,
                operatingCashflow: opCashflow,
                capitalExpenditures: capex,
                freeCashflow: opCashflow && capex ? opCashflow + capex : extractValue(item.freeCashflow),
                depreciation: extractValue(item.depreciation),
                changeInCash: extractValue(item.changeInCash) || extractValue(item.changeToNetincome),
                dividendsPaid: extractValue(item.dividendsPaid),
                netBorrowings: extractValue(item.netBorrowings),
                stockRepurchased: extractValue(item.repurchaseOfStock),
                issuanceOfStock: extractValue(item.issuanceOfStock),
                investingCashflow: extractValue(item.totalCashflowsFromInvestingActivities) || extractValue(item.investingCashflow),
                financingCashflow: extractValue(item.totalCashFromFinancingActivities) || extractValue(item.financingCashflow),
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

            // Financial Statements (Annual) - pass raw for debugging
            incomeStatement: incomeAnnual.map(processIncomeStatement).filter(Boolean),
            balanceSheet: balanceAnnual.map(processBalanceSheet).filter(Boolean),
            cashFlow: cashflowAnnual.map(processCashFlow).filter(Boolean),

            // Debug: Include raw data length for troubleshooting
            _debug: {
                incomeCount: incomeAnnual.length,
                balanceCount: balanceAnnual.length,
                cashflowCount: cashflowAnnual.length,
            },

            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json(stockData);
    } catch (error) {
        console.error(`Error fetching stock data for ${symbol}:`, error);
        return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
    }
}
