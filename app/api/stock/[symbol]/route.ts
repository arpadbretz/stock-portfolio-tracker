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

        // Get annual statements
        const incomeAnnual = summary?.incomeStatementHistory?.incomeStatementHistory || [];
        const balanceAnnual = summary?.balanceSheetHistory?.balanceSheetStatements || [];
        const cashflowAnnual = summary?.cashflowStatementHistory?.cashflowStatements || [];

        // USER REQUESTED DEBUG LOG
        console.log(`[${ticker}] incomeStatementHistory structure:`, JSON.stringify(summary?.incomeStatementHistory, null, 2));

        console.log(`[${ticker}] Financial data available:`, {
            incomeStatements: incomeAnnual.length,
            balanceSheets: balanceAnnual.length,
            cashFlows: cashflowAnnual.length,
            hasFinancialData: !!financials,
        });

        // Get next earnings date from calendar
        const earningsDate = calendar?.earnings?.earningsDate?.[0] || earnings?.earningsDate?.[0] || null;

        // Robust value extraction helper
        const extractValue = (item: any, field: string): number | null => {
            if (!item || item[field] === undefined || item[field] === null) return null;
            const val = item[field];
            if (typeof val === 'number') return val;
            if (typeof val === 'object' && val.raw !== undefined) return val.raw;
            if (typeof val === 'object' && val.value !== undefined) return val.value;
            return null;
        };

        // Simple processing - only include fields that actually have data
        const processIncomeStatement = (item: any) => {
            if (!item) return null;

            // Format date if it's an object
            let date = item.endDate;
            if (typeof date === 'object' && date.raw) {
                date = new Date(date.raw * 1000).toISOString();
            }

            const result: any = { endDate: date };

            // Map common fields with fallbacks
            const rev = extractValue(item, 'totalRevenue');
            if (rev !== null) result.totalRevenue = rev;

            const ni = extractValue(item, 'netIncome') || extractValue(item, 'netIncomeApplicableToCommonShares');
            if (ni !== null) result.netIncome = ni;

            const gp = extractValue(item, 'grossProfit');
            if (gp !== null && gp !== 0) result.grossProfit = gp;

            const oi = extractValue(item, 'operatingIncome');
            if (oi !== null && oi !== 0) result.operatingIncome = oi;

            const ebit = extractValue(item, 'ebit');
            if (ebit !== null && ebit !== 0) result.ebit = ebit;

            return Object.keys(result).length > 1 ? result : null;
        };

        const processBalanceSheet = (item: any) => {
            if (!item) return null;

            let date = item.endDate;
            if (typeof date === 'object' && date.raw) {
                date = new Date(date.raw * 1000).toISOString();
            }

            const result: any = { endDate: date };

            const assets = extractValue(item, 'totalAssets');
            if (assets !== null) result.totalAssets = assets;

            const liabs = extractValue(item, 'totalLiab') || extractValue(item, 'totalLiabilities');
            if (liabs !== null) result.totalLiabilities = liabs;

            const equity = extractValue(item, 'totalStockholderEquity') || extractValue(item, 'totalShareholderEquity');
            if (equity !== null) result.totalStockholderEquity = equity;

            const cash = extractValue(item, 'cash') || extractValue(item, 'cashAndCashEquivalents');
            if (cash !== null) result.cash = cash;

            const debt = extractValue(item, 'longTermDebt') || extractValue(item, 'totalDebt');
            if (debt !== null) result.longTermDebt = debt;

            return Object.keys(result).length > 1 ? result : null;
        };

        const processCashFlow = (item: any) => {
            if (!item) return null;

            let date = item.endDate;
            if (typeof date === 'object' && date.raw) {
                date = new Date(date.raw * 1000).toISOString();
            }

            const result: any = { endDate: date };

            const ni = extractValue(item, 'netIncome');
            if (ni !== null) result.netIncome = ni;

            const ocf = extractValue(item, 'totalCashFromOperatingActivities') || extractValue(item, 'operatingCashflow');
            if (ocf !== null) result.operatingCashflow = ocf;

            const capex = extractValue(item, 'capitalExpenditures');
            if (capex !== null) result.capitalExpenditures = capex;

            const fcf = extractValue(item, 'freeCashflow');
            if (fcf !== null) result.freeCashflow = fcf;

            // Calculate FCF if missing but we have components
            if (result.operatingCashflow !== undefined && capex !== null && result.freeCashflow === undefined) {
                result.freeCashflow = result.operatingCashflow + capex; // capex is usually negative
            }

            return Object.keys(result).length > 1 ? result : null;
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

            // Financial Statements (Annual) - filtered to only include non-null entries
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
