import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)();

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

        // Fetch comprehensive stock data including BOTH annual AND quarterly financial statements
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
                    // Annual statements
                    'incomeStatementHistory',
                    'balanceSheetHistory',
                    'cashflowStatementHistory',
                    // Quarterly statements
                    'incomeStatementHistoryQuarterly',
                    'balanceSheetHistoryQuarterly',
                    'cashflowStatementHistoryQuarterly',
                ]
            }).catch((e: any) => {
                console.warn('quoteSummary partial failure:', e.message);
                return null;
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

        // Get annual statements
        const incomeAnnual = summary?.incomeStatementHistory?.incomeStatementHistory || [];
        const balanceAnnual = summary?.balanceSheetHistory?.balanceSheetStatements || [];
        const cashflowAnnual = summary?.cashflowStatementHistory?.cashflowStatements || [];

        // Get quarterly statements
        const incomeQuarterly = summary?.incomeStatementHistoryQuarterly?.incomeStatementHistory || [];
        const balanceQuarterly = summary?.balanceSheetHistoryQuarterly?.balanceSheetStatements || [];
        const cashflowQuarterly = summary?.cashflowStatementHistoryQuarterly?.cashflowStatements || [];

        console.log(`[${ticker}] Financial data available:`, {
            incomeAnnual: incomeAnnual.length,
            incomeQuarterly: incomeQuarterly.length,
            balanceAnnual: balanceAnnual.length,
            balanceQuarterly: balanceQuarterly.length,
            cashflowAnnual: cashflowAnnual.length,
            cashflowQuarterly: cashflowQuarterly.length,
        });

        // Get next earnings date from calendar
        const earningsDate = calendar?.earnings?.earningsDate?.[0] || earnings?.earningsDate?.[0] || null;

        // Robust value extraction helper - handles both raw values and nested objects
        const extractValue = (item: any, ...fields: string[]): number | null => {
            for (const field of fields) {
                if (!item || item[field] === undefined || item[field] === null) continue;
                const val = item[field];
                if (typeof val === 'number') return val;
                if (typeof val === 'object' && val.raw !== undefined) return val.raw;
                if (typeof val === 'object' && val.value !== undefined) return val.value;
            }
            return null;
        };

        // Extract date from item
        const extractDate = (item: any): string | null => {
            const date = item?.endDate;
            if (!date) return null;
            if (typeof date === 'string') return date;
            if (typeof date === 'object' && date.raw) {
                return new Date(date.raw * 1000).toISOString();
            }
            return null;
        };

        // Enhanced income statement processing with more fields
        const processIncomeStatement = (item: any) => {
            if (!item) return null;

            const date = extractDate(item);
            if (!date) return null;

            const result: any = { endDate: date };

            // Revenue
            const rev = extractValue(item, 'totalRevenue');
            if (rev !== null) result.totalRevenue = rev;

            // Cost of Revenue
            const cor = extractValue(item, 'costOfRevenue');
            if (cor !== null) result.costOfRevenue = cor;

            // Gross Profit
            const gp = extractValue(item, 'grossProfit');
            if (gp !== null) result.grossProfit = gp;

            // Operating Expenses
            const opex = extractValue(item, 'operatingExpenses', 'totalOperatingExpenses');
            if (opex !== null) result.operatingExpenses = opex;

            // R&D
            const rd = extractValue(item, 'researchDevelopment', 'researchAndDevelopment');
            if (rd !== null) result.researchDevelopment = rd;

            // SGA
            const sga = extractValue(item, 'sellingGeneralAdministrative');
            if (sga !== null) result.sellingGeneralAdministrative = sga;

            // Operating Income
            const oi = extractValue(item, 'operatingIncome');
            if (oi !== null) result.operatingIncome = oi;

            // EBIT
            const ebit = extractValue(item, 'ebit');
            if (ebit !== null) result.ebit = ebit;

            // EBITDA (calculated if not available)
            const ebitda = extractValue(item, 'ebitda');
            if (ebitda !== null) result.ebitda = ebitda;

            // Interest Expense
            const interest = extractValue(item, 'interestExpense');
            if (interest !== null) result.interestExpense = interest;

            // Pre-tax Income
            const pretax = extractValue(item, 'incomeBeforeTax');
            if (pretax !== null) result.incomeBeforeTax = pretax;

            // Income Tax
            const tax = extractValue(item, 'incomeTaxExpense');
            if (tax !== null) result.incomeTaxExpense = tax;

            // Net Income
            const ni = extractValue(item, 'netIncome', 'netIncomeApplicableToCommonShares', 'netIncomeFromContinuingOps');
            if (ni !== null) result.netIncome = ni;

            // EPS
            const eps = extractValue(item, 'dilutedEPS', 'basicEPS');
            if (eps !== null) result.eps = eps;

            return Object.keys(result).length > 1 ? result : null;
        };

        // Enhanced balance sheet processing with more fields
        const processBalanceSheet = (item: any) => {
            if (!item) return null;

            const date = extractDate(item);
            if (!date) return null;

            const result: any = { endDate: date };

            // Assets
            const assets = extractValue(item, 'totalAssets');
            if (assets !== null) result.totalAssets = assets;

            // Current Assets
            const currentAssets = extractValue(item, 'totalCurrentAssets');
            if (currentAssets !== null) result.totalCurrentAssets = currentAssets;

            // Cash
            const cash = extractValue(item, 'cash', 'cashAndCashEquivalents');
            if (cash !== null) result.cash = cash;

            // Short Term Investments
            const sti = extractValue(item, 'shortTermInvestments');
            if (sti !== null) result.shortTermInvestments = sti;

            // Receivables
            const receivables = extractValue(item, 'netReceivables', 'accountsReceivable');
            if (receivables !== null) result.netReceivables = receivables;

            // Inventory
            const inventory = extractValue(item, 'inventory');
            if (inventory !== null) result.inventory = inventory;

            // Non-current Assets
            const nonCurrentAssets = extractValue(item, 'totalNonCurrentAssets');
            if (nonCurrentAssets !== null) result.totalNonCurrentAssets = nonCurrentAssets;

            // Property Plant Equipment
            const ppe = extractValue(item, 'propertyPlantEquipment', 'netPPE');
            if (ppe !== null) result.propertyPlantEquipment = ppe;

            // Goodwill
            const gw = extractValue(item, 'goodWill', 'goodwill');
            if (gw !== null) result.goodwill = gw;

            // Intangibles
            const intangibles = extractValue(item, 'intangibleAssets');
            if (intangibles !== null) result.intangibleAssets = intangibles;

            // Total Liabilities
            const liabs = extractValue(item, 'totalLiab', 'totalLiabilities');
            if (liabs !== null) result.totalLiabilities = liabs;

            // Current Liabilities
            const currentLiabs = extractValue(item, 'totalCurrentLiabilities');
            if (currentLiabs !== null) result.totalCurrentLiabilities = currentLiabs;

            // Accounts Payable
            const ap = extractValue(item, 'accountsPayable');
            if (ap !== null) result.accountsPayable = ap;

            // Short Term Debt
            const std = extractValue(item, 'shortLongTermDebt', 'shortTermDebt');
            if (std !== null) result.shortTermDebt = std;

            // Long Term Debt
            const ltd = extractValue(item, 'longTermDebt');
            if (ltd !== null) result.longTermDebt = ltd;

            // Total Debt
            const totalDebt = extractValue(item, 'totalDebt');
            if (totalDebt !== null) result.totalDebt = totalDebt;

            // Stockholders' Equity
            const equity = extractValue(item, 'totalStockholderEquity', 'totalShareholderEquity', 'stockholdersEquity');
            if (equity !== null) result.totalStockholderEquity = equity;

            // Retained Earnings
            const re = extractValue(item, 'retainedEarnings');
            if (re !== null) result.retainedEarnings = re;

            // Common Stock
            const cs = extractValue(item, 'commonStock');
            if (cs !== null) result.commonStock = cs;

            return Object.keys(result).length > 1 ? result : null;
        };

        // Enhanced cash flow processing with more fields
        const processCashFlow = (item: any) => {
            if (!item) return null;

            const date = extractDate(item);
            if (!date) return null;

            const result: any = { endDate: date };

            // Net Income
            const ni = extractValue(item, 'netIncome');
            if (ni !== null) result.netIncome = ni;

            // Depreciation
            const dep = extractValue(item, 'depreciation', 'depreciationAndAmortization');
            if (dep !== null) result.depreciation = dep;

            // Operating Cash Flow
            const ocf = extractValue(item, 'totalCashFromOperatingActivities', 'operatingCashflow');
            if (ocf !== null) result.operatingCashflow = ocf;

            // Changes in Working Capital
            const wc = extractValue(item, 'changeToNetincome', 'changeInWorkingCapital');
            if (wc !== null) result.changeInWorkingCapital = wc;

            // Capital Expenditures
            const capex = extractValue(item, 'capitalExpenditures');
            if (capex !== null) result.capitalExpenditures = capex;

            // Investments
            const investments = extractValue(item, 'investments');
            if (investments !== null) result.investments = investments;

            // Investing Cash Flow
            const icf = extractValue(item, 'totalCashflowsFromInvestingActivities', 'investingCashflow');
            if (icf !== null) result.investingCashflow = icf;

            // Dividends Paid
            const div = extractValue(item, 'dividendsPaid');
            if (div !== null) result.dividendsPaid = div;

            // Stock Repurchases
            const buyback = extractValue(item, 'repurchaseOfStock');
            if (buyback !== null) result.stockRepurchases = buyback;

            // Debt Repayment
            const debtRepay = extractValue(item, 'repaymentOfDebt');
            if (debtRepay !== null) result.debtRepayment = debtRepay;

            // Financing Cash Flow
            const fcf = extractValue(item, 'totalCashFromFinancingActivities', 'financingCashflow');
            if (fcf !== null) result.financingCashflow = fcf;

            // Free Cash Flow (calculate if not present)
            const freeCF = extractValue(item, 'freeCashflow');
            if (freeCF !== null) {
                result.freeCashflow = freeCF;
            } else if (result.operatingCashflow !== undefined && capex !== null) {
                result.freeCashflow = result.operatingCashflow + capex; // capex is usually negative
            }

            // Net Change in Cash
            const netChange = extractValue(item, 'changeInCash');
            if (netChange !== null) result.netChangeInCash = netChange;

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

            // Financial Statements - ANNUAL
            incomeStatement: incomeAnnual.map(processIncomeStatement).filter(Boolean),
            balanceSheet: balanceAnnual.map(processBalanceSheet).filter(Boolean),
            cashFlow: cashflowAnnual.map(processCashFlow).filter(Boolean),

            // Financial Statements - QUARTERLY (NEW!)
            incomeStatementQuarterly: incomeQuarterly.map(processIncomeStatement).filter(Boolean),
            balanceSheetQuarterly: balanceQuarterly.map(processBalanceSheet).filter(Boolean),
            cashFlowQuarterly: cashflowQuarterly.map(processCashFlow).filter(Boolean),

            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json({ success: true, data: stockData });
    } catch (error) {
        console.error(`Error fetching stock data for ${symbol}:`, error);
        return NextResponse.json({ success: false, error: 'Failed to fetch stock data' }, { status: 500 });
    }
}
