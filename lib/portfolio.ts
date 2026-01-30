// Portfolio calculation and aggregation utilities

import { Trade, Holding, PortfolioSummary, PriceData, CurrencyCode } from '@/types/portfolio';

// Aggregate trades into current holdings (Normalizing everything to USD)
export function aggregateHoldings(
    trades: Trade[],
    prices: Map<string, PriceData>,
    exchangeRates: Record<string, number> = { USD: 1, EUR: 1, HUF: 1 }
): Holding[] {
    const holdingsMap = new Map<string, {
        shares: number;
        totalCostUSD: number;
        buyQuantity: number;
    }>();

    // Process each trade
    for (const trade of trades) {
        const ticker = trade.ticker.toUpperCase();
        const current = holdingsMap.get(ticker) || { shares: 0, totalCostUSD: 0, buyQuantity: 0 };
        const tradeCurrency = (trade as any).currency || 'USD';
        const rate = exchangeRates[tradeCurrency] || 1;

        if (trade.action === 'BUY') {
            current.shares += trade.quantity;
            // Convert trade cost to USD
            const costInUSD = (trade.quantity * trade.pricePerShare + trade.fees) / rate;
            current.totalCostUSD += costInUSD;
            current.buyQuantity += trade.quantity;
        } else if (trade.action === 'SELL') {
            current.shares -= trade.quantity;
            // Reduce cost basis proportionally (already in USD)
            if (current.buyQuantity > 0) {
                const avgCostUSD = current.totalCostUSD / current.buyQuantity;
                current.totalCostUSD -= trade.quantity * avgCostUSD;
                current.buyQuantity -= trade.quantity;
            }
        }

        holdingsMap.set(ticker, current);
    }

    // Convert to Holding array
    const holdings: Holding[] = [];

    for (const [ticker, data] of holdingsMap) {
        // Skip if no shares held
        if (data.shares <= 0) continue;

        const priceData = prices.get(ticker);
        const localCurrentPrice = priceData?.currentPrice || 0;
        const assetCurrency = (priceData?.currency || 'USD').toUpperCase();
        const assetRate = exchangeRates[assetCurrency] || 1;

        // Normalize prices to USD for consistent gain calculations
        const currentPriceUSD = localCurrentPrice / assetRate;
        const avgCostBasisUSD = data.buyQuantity > 0 ? data.totalCostUSD / data.buyQuantity : 0;

        const marketValueUSD = data.shares * currentPriceUSD;
        const totalInvestedUSD = data.shares * avgCostBasisUSD;
        const unrealizedGainUSD = marketValueUSD - totalInvestedUSD;

        const unrealizedGainPercent = avgCostBasisUSD > 0
            ? ((currentPriceUSD - avgCostBasisUSD) / avgCostBasisUSD) * 100
            : 0;

        holdings.push({
            ticker,
            shares: data.shares,
            avgCostBasis: avgCostBasisUSD,
            totalInvested: totalInvestedUSD,
            currentPrice: currentPriceUSD,
            marketValue: marketValueUSD,
            unrealizedGain: unrealizedGainUSD,
            unrealizedGainPercent,
            allocation: 0, // Will be calculated in summary
            sector: priceData?.sector,
            industry: priceData?.industry,
            dayChange: (priceData?.change || 0) / assetRate,
            dayChangePercent: priceData?.changePercent || 0,
            currency: assetCurrency,
        });
    }

    // Sort by market value (highest first)
    return holdings.sort((a, b) => b.marketValue - a.marketValue);
}

export function calculatePortfolioSummary(
    holdings: Holding[],
    exchangeRates: Record<string, number> = { USD: 1, EUR: 0.92, HUF: 350 },
    cashBalance: number | Record<string, number> = 0,
    prices: Map<string, PriceData> = new Map()
): PortfolioSummary {
    // Note: holdings marketValue and totalInvested are already normalized to USD by aggregateHoldings
    const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
    const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalGain = totalMarketValue - totalInvested;
    const totalGainPercent = totalInvested > 0
        ? (totalGain / totalInvested) * 100
        : 0;

    // Handle cash balance which could be a single number (USD) or an object with multiple currencies
    let normalizedCashBalance = 0;
    const balancesObject = typeof cashBalance === 'object' ? cashBalance : { USD: cashBalance };

    // Calculate Daily FX P&L from cash
    let totalFxPnL = 0;

    for (const [curr, amount] of Object.entries(balancesObject)) {
        const rate = exchangeRates[curr] || 1;
        normalizedCashBalance += amount / rate;

        // Calculate FX impact for this currency if not USD
        if (curr !== 'USD' && amount !== 0) {
            const fxSymbol = `USD${curr}=X`;
            const fxData = prices.get(fxSymbol);
            if (fxData && fxData.changePercent) {
                // RateToday = rate
                // RatePrev = rate / (1 + changePercent/100)
                // ValueToday = amount / rate
                // ValuePrev = amount / ratePrev
                const changeP = (fxData.changePercent || 0) / 100;
                const prevRate = rate / (1 + changeP);
                const valueToday = amount / rate;
                const valuePrev = amount / prevRate;
                totalFxPnL += (valueToday - valuePrev);
            }
        }
    }

    // Total portfolio value includes cash balance
    const totalPortfolioValue = totalMarketValue + normalizedCashBalance;

    // Calculate Stock Daily P&L (Holdings are already normalized to USD)
    const stockDailyPnL = holdings.reduce((total, h) => {
        return total + (h.dayChange || 0) * h.shares;
    }, 0);

    const dailyPnL = stockDailyPnL + totalFxPnL;
    const dailyPnLPercent = (totalPortfolioValue - dailyPnL) > 0
        ? (dailyPnL / (totalPortfolioValue - dailyPnL)) * 100
        : 0;

    // Calculate allocation percentages
    const holdingsWithAllocation = holdings.map(h => ({
        ...h,
        allocation: totalPortfolioValue > 0 ? (h.marketValue / totalPortfolioValue) * 100 : 0
    }));

    return {
        totalInvested,
        totalMarketValue,
        totalGain,
        totalGainPercent,
        cashBalance: normalizedCashBalance,
        cashBalances: balancesObject as Record<CurrencyCode, number>,
        totalPortfolioValue,
        holdings: holdingsWithAllocation,
        exchangeRates: exchangeRates as any,
        dailyPnL,
        dailyPnLPercent,
        fxPnL: totalFxPnL,
    };
}

// Format currency for display
export function formatCurrency(value: number, currency: string = 'USD'): string {
    const locale = currency === 'HUF' ? 'hu-HU' : 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'HUF' ? 0 : 2,
        maximumFractionDigits: currency === 'HUF' ? 0 : 2,
    }).format(value);
}

// Format percentage for display
export function formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

// Format number with commas
export function formatNumber(value: number, decimals: number = 0): string {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

// Convert USD value to target currency
export function convertCurrency(value: number, toCurrency: string, rates: Record<string, number>): number {
    const rate = rates[toCurrency] || 1;
    return value * rate;
}
