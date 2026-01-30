/**
 * Centralized Data Transformers for Yahoo Finance
 * Standardizes raw Yahoo Finance API responses into clean, UI-ready types.
 */

export interface StockPrice {
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    lastUpdated: string;
}

export interface SparklinePoint {
    date: string;
    value: number;
}

export interface BatchStockData extends StockPrice {
    symbol: string;
    name: string;
    sparkline: SparklinePoint[];
}

/**
 * Extracts a numeric value from various Yahoo Finance field formats
 */
export function extractYahooValue(field: any): number | null {
    if (field === null || field === undefined) return null;
    if (typeof field === 'number') return field;
    if (typeof field === 'object') {
        if ('raw' in field) return field.raw;
        if ('value' in field) return field.value;
    }
    return null;
}

/**
 * Formats a Date object or numeric timestamp to ISO string
 */
export function formatYahooDate(date: any): string | null {
    if (!date) return null;
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'object' && date.raw) return new Date(date.raw * 1000).toISOString();
    if (typeof date === 'number') return new Date(date).toISOString();
    if (typeof date === 'string') return new Date(date).toISOString();
    return null;
}

/**
 * Transforms a raw QuoteSummary into a standardized Stock Overview
 */
export function transformStockSummary(symbol: string, summary: any) {
    if (!summary) return null;

    const price = summary.price || {};
    const details = summary.summaryDetail || {};
    const financials = summary.financialData || {};
    const keyStats = summary.defaultKeyStatistics || {};
    const profile = summary.assetProfile || {};
    const earnings = summary.earnings || {};
    const calendar = summary.calendarEvents || {};
    const incomeHistory = summary.incomeStatementHistory?.incomeStatementHistory || [];
    const balanceHistory = summary.balanceSheetHistory?.balanceSheetStatements || [];
    const cashflowHistory = summary.cashflowStatementHistory?.cashflowStatements || [];

    const mapStatement = (item: any) => {
        if (!item) return null;
        let date = item.endDate;
        if (typeof date === 'object' && date?.raw) date = new Date(date.raw * 1000).toISOString();
        else if (typeof date === 'number') date = new Date(date * 1000).toISOString();
        else if (date instanceof Date) date = date.toISOString();

        return {
            endDate: date,
            // Income fields
            totalRevenue: extractYahooValue(item.totalRevenue),
            costOfRevenue: extractYahooValue(item.costOfRevenue),
            grossProfit: extractYahooValue(item.grossProfit),
            operatingExpenses: extractYahooValue(item.totalOperatingExpenses),
            operatingIncome: extractYahooValue(item.operatingIncome),
            netIncome: extractYahooValue(item.netIncome),
            ebit: extractYahooValue(item.ebit),
            ebitda: extractYahooValue(item.ebitda),
            eps: extractYahooValue(item.dilutedEPS) || extractYahooValue(item.basicEPS),
            researchDevelopment: extractYahooValue(item.researchDevelopment),
            sellingGeneralAdministrative: extractYahooValue(item.sellingGeneralAdministrative),
            interestExpense: extractYahooValue(item.interestExpense),
            incomeTaxExpense: extractYahooValue(item.incomeTaxExpense),
            // Balance fields
            totalAssets: extractYahooValue(item.totalAssets),
            totalCurrentAssets: extractYahooValue(item.totalCurrentAssets),
            cash: extractYahooValue(item.cash) || extractYahooValue(item.cashAndCashEquivalents),
            shortTermInvestments: extractYahooValue(item.shortTermInvestments),
            netReceivables: extractYahooValue(item.netReceivables),
            inventory: extractYahooValue(item.inventory),
            totalLiabilities: extractYahooValue(item.totalLiabilitiesNetMinorityInterest) || extractYahooValue(item.totalLiabilities),
            totalCurrentLiabilities: extractYahooValue(item.totalCurrentLiabilities),
            accountsPayable: extractYahooValue(item.accountsPayable),
            longTermDebt: extractYahooValue(item.longTermDebt),
            totalDebt: extractYahooValue(item.totalDebt),
            totalStockholderEquity: extractYahooValue(item.totalStockholderEquity),
            // Cash flow fields
            operatingCashflow: extractYahooValue(item.totalCashFromOperatingActivities) || extractYahooValue(item.operatingCashflow),
            investingCashflow: extractYahooValue(item.totalCashflowsFromInvestingActivities) || extractYahooValue(item.investingCashflow),
            financingCashflow: extractYahooValue(item.totalCashFromFinancingActivities) || extractYahooValue(item.financingCashflow),
            freeCashflow: extractYahooValue(item.freeCashFlow),
            capitalExpenditures: extractYahooValue(item.capitalExpenditures),
            depreciation: extractYahooValue(item.depreciation),
            dividendsPaid: extractYahooValue(item.dividendsPaid),
        };
    };

    return {
        symbol: symbol.toUpperCase(),
        name: price.shortName || price.longName || symbol,
        exchange: price.fullExchangeName || price.exchange,
        currency: price.currency || 'USD',
        price: extractYahooValue(price.regularMarketPrice) || 0,
        previousClose: extractYahooValue(price.regularMarketPreviousClose) || 0,
        open: extractYahooValue(price.regularMarketOpen) || 0,
        dayHigh: extractYahooValue(price.regularMarketDayHigh) || 0,
        dayLow: extractYahooValue(price.regularMarketDayLow) || 0,
        change: extractYahooValue(price.regularMarketChange) || 0,
        changePercent: extractYahooValue(price.regularMarketChangePercent) || 0,
        volume: extractYahooValue(price.regularMarketVolume) || 0,
        avgVolume: extractYahooValue(price.averageDailyVolume3Month) || 0,
        marketCap: extractYahooValue(price.marketCap) || 0,
        sharesOutstanding: extractYahooValue(keyStats.sharesOutstanding) || extractYahooValue(price.sharesOutstanding) || null,
        fiftyTwoWeekHigh: extractYahooValue(price.fiftyTwoWeekHigh) || 0,
        fiftyTwoWeekLow: extractYahooValue(price.fiftyTwoWeekLow) || 0,
        fiftyTwoWeekChange: extractYahooValue(keyStats.fiftyTwoWeekChange) || null,
        trailingPE: extractYahooValue(details.trailingPE) || extractYahooValue(price.trailingPE) || null,
        forwardPE: extractYahooValue(details.forwardPE) || extractYahooValue(price.forwardPE) || null,
        priceToBook: extractYahooValue(keyStats.priceToBook) || null,
        pegRatio: extractYahooValue(keyStats.pegRatio) || extractYahooValue(details.pegRatio) || extractYahooValue(financials.pegRatio) || null,
        priceToSales: extractYahooValue(keyStats.priceToSalesTrailing12Months) || null,
        enterpriseValue: extractYahooValue(keyStats.enterpriseValue) || null,
        evToRevenue: extractYahooValue(keyStats.enterpriseToRevenue) || null,
        evToEbitda: extractYahooValue(keyStats.enterpriseToEbitda) || null,
        dividendYield: extractYahooValue(details.dividendYield) || null,
        dividendRate: extractYahooValue(details.dividendRate) || null,
        exDividendDate: formatYahooDate(details.exDividendDate) || null,
        payoutRatio: extractYahooValue(details.payoutRatio) || null,
        beta: extractYahooValue(keyStats.beta) || extractYahooValue(details.beta) || null,
        eps: extractYahooValue(price.epsTrailingTwelveMonths) || extractYahooValue(keyStats.trailingEps) || extractYahooValue(details.trailingEps) || null,
        forwardEps: extractYahooValue(keyStats.forwardEps) || null,
        revenueGrowth: extractYahooValue(financials.revenueGrowth) || null,
        earningsGrowth: extractYahooValue(financials.earningsGrowth) || null,
        profitMargin: extractYahooValue(financials.profitMargins) || null,
        grossMargin: extractYahooValue(financials.grossMargins) || null,
        operatingMargin: extractYahooValue(financials.operatingMargins) || null,
        returnOnAssets: extractYahooValue(financials.returnOnAssets) || null,
        returnOnEquity: extractYahooValue(financials.returnOnEquity) || null,
        debtToEquity: extractYahooValue(financials.debtToEquity) || null,
        currentRatio: extractYahooValue(financials.currentRatio) || null,
        quickRatio: extractYahooValue(financials.quickRatio) || null,
        freeCashflow: extractYahooValue(financials.freeCashflow) || null,
        operatingCashflow: extractYahooValue(financials.operatingCashflow) || null,
        totalRevenue: extractYahooValue(financials.totalRevenue) || null,
        totalDebt: extractYahooValue(financials.totalDebt) || null,
        totalCash: extractYahooValue(financials.totalCash) || null,
        shortRatio: extractYahooValue(keyStats.shortRatio) || null,
        shortPercentOfFloat: extractYahooValue(keyStats.shortPercentOfFloat) || null,
        sharesShort: extractYahooValue(keyStats.sharesShort) || null,
        sharesShortPriorMonth: extractYahooValue(keyStats.sharesShortPriorMonth) || null,
        sector: profile.sector || null,
        industry: profile.industry || null,
        employees: profile.fullTimeEmployees || null,
        website: profile.website || null,
        description: profile.longBusinessSummary || null,
        country: profile.country || null,
        city: profile.city || null,
        earningsDate: formatYahooDate(calendar?.earnings?.earningsDate?.[0]) || formatYahooDate(earnings?.earningsDate?.[0]) || null,
        earningsQuarterlyGrowth: extractYahooValue(keyStats.earningsQuarterlyGrowth) || null,
        incomeStatement: incomeHistory.map(mapStatement).filter(Boolean),
        balanceSheet: balanceHistory.map(mapStatement).filter(Boolean),
        cashFlow: cashflowHistory.map(mapStatement).filter(Boolean),
        lastUpdated: formatYahooDate(price.regularMarketTime) || new Date().toISOString(),
    };
}

/**
 * Transforms Analyst data into a UI-ready format
 */
export function transformAnalysts(symbol: string, summary: any) {
    if (!summary) return null;

    const recommendations = summary.recommendationTrend?.trend || [];
    const upgrades = summary.upgradeDowngradeHistory?.history || [];
    const financials = summary.financialData || {};

    const currentMonth = recommendations.find((r: any) => r.period === '0m') || recommendations[0] || {};
    const totalAnalysts = (currentMonth.strongBuy || 0) + (currentMonth.buy || 0) +
        (currentMonth.hold || 0) + (currentMonth.sell || 0) + (currentMonth.strongSell || 0);

    let averageScore = null;
    if (totalAnalysts > 0) {
        const weightedSum = (currentMonth.strongBuy || 0) * 1 +
            (currentMonth.buy || 0) * 2 +
            (currentMonth.hold || 0) * 3 +
            (currentMonth.sell || 0) * 4 +
            (currentMonth.strongSell || 0) * 5;
        averageScore = weightedSum / totalAnalysts;
    }

    let recommendation = 'N/A';
    if (averageScore !== null) {
        if (averageScore <= 1.5) recommendation = 'Strong Buy';
        else if (averageScore <= 2.5) recommendation = 'Buy';
        else if (averageScore <= 3.5) recommendation = 'Hold';
        else if (averageScore <= 4.5) recommendation = 'Sell';
        else recommendation = 'Strong Sell';
    }

    const recentActions = upgrades.slice(0, 5).map((action: any) => ({
        firm: action.firm,
        toGrade: action.toGrade,
        fromGrade: action.fromGrade,
        action: action.action,
        date: formatYahooDate(action.epochGradeDate),
    }));

    const currentPrice = extractYahooValue(financials.currentPrice);
    const targetMean = extractYahooValue(financials.targetMeanPrice);

    return {
        symbol: symbol.toUpperCase(),
        recommendation,
        averageScore,
        totalAnalysts,
        ratings: {
            strongBuy: currentMonth.strongBuy || 0,
            buy: currentMonth.buy || 0,
            hold: currentMonth.hold || 0,
            sell: currentMonth.sell || 0,
            strongSell: currentMonth.strongSell || 0,
        },
        priceTarget: {
            high: extractYahooValue(financials.targetHighPrice),
            low: extractYahooValue(financials.targetLowPrice),
            mean: targetMean,
            median: extractYahooValue(financials.targetMedianPrice),
            current: currentPrice,
            numberOfAnalysts: financials.numberOfAnalystOpinions || totalAnalysts,
            upside: targetMean && currentPrice ? ((targetMean - currentPrice) / currentPrice * 100) : null,
        },
        recentActions,
    };
}

/**
 * Transforms Insider data into a UI-ready format
 */
export function transformInsiders(symbol: string, summary: any) {
    if (!summary) return null;

    const transactions = summary.insiderTransactions?.transactions || [];
    const holders = summary.insiderHolders?.holders || [];

    const recentTransactions = transactions.slice(0, 20).map((txn: any) => ({
        filerName: txn.filerName,
        filerRelation: txn.filerRelation,
        transactionText: txn.transactionText,
        moneyText: txn.moneyText,
        ownership: txn.ownership,
        startDate: formatYahooDate(txn.startDate),
        value: extractYahooValue(txn.value),
        shares: extractYahooValue(txn.shares),
    }));

    const insiderHolders = holders.map((holder: any) => ({
        name: holder.name,
        relation: holder.relation,
        url: holder.url,
        transactionDescription: holder.transactionDescription,
        latestTransDate: formatYahooDate(holder.latestTransDate),
        positionDirect: extractYahooValue(holder.positionDirect),
        positionDirectDate: formatYahooDate(holder.positionDirectDate),
    }));

    return {
        symbol: symbol.toUpperCase(),
        transactions: recentTransactions,
        holders: insiderHolders,
    };
}

/**
 * Transforms News items into a UI-ready format
 */
export function transformNews(newsItems: any[]) {
    return (newsItems || []).map((item: any) => ({
        uuid: item.uuid,
        title: item.title,
        publisher: item.publisher,
        link: item.link,
        providerPublishTime: formatYahooDate(item.providerPublishTime),
        type: item.type,
        thumbnail: item.thumbnail?.resolutions?.[0]?.url || null,
        relatedTickers: item.relatedTickers || [],
    }));
}
/**
 * Transforms complex 10-year Fundamentals TimeSeries into clean, chart-ready and statement-ready data.
 * This is the "Better" version providing 10 years of data.
 */
export function transformFundamentals(symbol: string, rawData: any[], summary?: any) {
    if (!rawData || !rawData.length) return null;

    // Group all entries by date to reconstruct statements
    const entriesByDate: Record<string, any> = {};

    // Metrics we want for charts
    const charts: Record<string, any[]> = {
        revenue: [],
        netIncome: [],
        grossProfit: [],
        operatingIncome: [],
        freeCashflow: [],
        operatingCashflow: [],
        totalAssets: [],
        totalDebt: [],
        shareholderEquity: [],
        eps: [],
    };

    // Metric mapping (Yahoo Type -> UI Key)
    const mapping: Record<string, string> = {
        annualTotalRevenue: 'revenue',
        annualNetIncome: 'netIncome',
        annualGrossProfit: 'grossProfit',
        annualOperatingIncome: 'operatingIncome',
        annualOperatingCashFlow: 'operatingCashflow',
        annualCapitalExpenditure: 'capex',
        annualTotalAssets: 'totalAssets',
        annualLongTermDebt: 'totalDebt',
        annualTotalStockholderEquity: 'shareholderEquity',
    };

    // Extract EPS history if summary available
    if (summary?.earningsHistory?.history) {
        charts.eps = summary.earningsHistory.history.map((item: any) => ({
            date: item.quarter,
            quarter: item.quarter ? new Date(item.quarter).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) : null,
            actual: extractYahooValue(item.epsActual),
            estimate: extractYahooValue(item.epsEstimate),
        })).filter((d: any) => d.actual !== null).reverse();
    }

    (rawData || []).forEach((entry: any) => {
        const type = entry.type;
        const date = entry.meta?.type?.split(',')?.pop() || entry.timestamp || entry.asOfDate;
        const value = extractYahooValue(entry.reportedValue) || extractYahooValue(entry);

        if (!date || value === null) return;

        const dateStr = new Date(date).toISOString().split('T')[0];
        if (!entriesByDate[dateStr]) entriesByDate[dateStr] = { endDate: dateStr };

        const uiKey = mapping[type];
        if (uiKey) {
            entriesByDate[dateStr][uiKey] = value;

            // Add to charts
            if (uiKey !== 'capex') {
                charts[uiKey].push({
                    date: dateStr,
                    year: new Date(dateStr).getFullYear(),
                    value: value
                });
            }
        } else {
            // Unmapped fields go to statement
            entriesByDate[dateStr][type] = value;
        }
    });

    // Special case for FCF: OpCF + Capex (Capex is usually negative)
    Object.values(entriesByDate).forEach((item: any) => {
        if (item.operatingCashflow !== undefined && item.capex !== undefined) {
            item.freeCashflow = item.operatingCashflow + item.capex;
            charts.freeCashflow.push({
                date: item.endDate,
                year: new Date(item.endDate).getFullYear(),
                value: item.freeCashflow
            });
        }
    });

    // Sort charts by date
    Object.keys(charts).forEach(key => {
        charts[key].sort((a, b) => a.date.localeCompare(b.date));
    });

    // Reconstruct statements (Sorted newest first)
    const statements = Object.values(entriesByDate).sort((a: any, b: any) => b.endDate.localeCompare(a.endDate));

    return {
        charts,
        statements,
    };
}
/**
 * Merges detailed 4-year statements with long-range 10-year trends.
 * Ensures we keep the high-fidelity fields from QuoteSummary while adding history from TimeSeries.
 */
export function mergeFinancials(detailed: any[], longRange: any[]) {
    if (!detailed?.length) return longRange || [];
    if (!longRange?.length) return detailed || [];

    const mergedMap = new Map<string, any>();

    // Start with long-range data as the skeleton
    longRange.forEach(item => {
        const year = new Date(item.endDate).getFullYear();
        mergedMap.set(year.toString(), { ...item });
    });

    // Overwrite/Enrich with detailed data (Priority)
    detailed.forEach(item => {
        const year = new Date(item.endDate).getFullYear();
        const existing = mergedMap.get(year.toString()) || {};
        mergedMap.set(year.toString(), { ...existing, ...item });
    });

    // Return sorted newest first
    return Array.from(mergedMap.values()).sort((a, b) => b.endDate.localeCompare(a.endDate));
}
