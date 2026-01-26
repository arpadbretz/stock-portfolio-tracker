// Portfolio calculation and aggregation utilities

import { Trade, Holding, PortfolioSummary, PriceData } from '@/types/portfolio';

// Aggregate trades into current holdings
export function aggregateHoldings(trades: Trade[], prices: Map<string, PriceData>): Holding[] {
    const holdingsMap = new Map<string, {
        shares: number;
        totalCost: number;
        buyQuantity: number;
    }>();

    // Process each trade
    for (const trade of trades) {
        const ticker = trade.ticker.toUpperCase();
        const current = holdingsMap.get(ticker) || { shares: 0, totalCost: 0, buyQuantity: 0 };

        if (trade.action === 'BUY') {
            current.shares += trade.quantity;
            current.totalCost += trade.quantity * trade.pricePerShare + trade.fees;
            current.buyQuantity += trade.quantity;
        } else if (trade.action === 'SELL') {
            current.shares -= trade.quantity;
            // Reduce cost basis proportionally
            if (current.buyQuantity > 0) {
                const avgCost = current.totalCost / current.buyQuantity;
                current.totalCost -= trade.quantity * avgCost;
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
        const currentPrice = priceData?.currentPrice || 0;
        const avgCostBasis = data.buyQuantity > 0 ? data.totalCost / data.buyQuantity : 0;
        const marketValue = data.shares * currentPrice;
        const unrealizedGain = marketValue - (data.shares * avgCostBasis);
        const unrealizedGainPercent = avgCostBasis > 0
            ? ((currentPrice - avgCostBasis) / avgCostBasis) * 100
            : 0;

        holdings.push({
            ticker,
            shares: data.shares,
            avgCostBasis,
            totalInvested: data.shares * avgCostBasis,
            currentPrice,
            marketValue,
            unrealizedGain,
            unrealizedGainPercent,
            allocation: 0, // Will be calculated in summary
            sector: priceData?.sector,
            industry: priceData?.industry,
            dayChange: priceData?.change || 0,
            dayChangePercent: priceData?.changePercent || 0,
        });
    }

    // Sort by market value (highest first)
    return holdings.sort((a, b) => b.marketValue - a.marketValue);
}

// Calculate portfolio summary
export function calculatePortfolioSummary(
    holdings: Holding[],
    exchangeRates: Record<string, number> = { USD: 1, EUR: 0.92, HUF: 350 },
    cashBalance: number | Record<string, number> = 0
): PortfolioSummary {
    const totalInvested = holdings.reduce((sum, h) => sum + h.totalInvested, 0);
    const totalMarketValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
    const totalGain = totalMarketValue - totalInvested;
    const totalGainPercent = totalInvested > 0
        ? (totalGain / totalInvested) * 100
        : 0;

    // Handle cash balance which could be a single number (USD) or an object with multiple currencies
    let normalizedCashBalance = 0;
    if (typeof cashBalance === 'number') {
        normalizedCashBalance = cashBalance;
    } else {
        // Convert all cash balances to USD first or directly to the reporting currency?
        // Since the summary expects totals, we should aim for consistency.
        // Usually everything else is in USD internally for aggregation, then converted for display.
        for (const [curr, amount] of Object.entries(cashBalance)) {
            // Convert to USD (assuming USD is base 1 in rates)
            const usdRate = exchangeRates[curr] || 1;
            normalizedCashBalance += amount / usdRate;
        }
    }

    // Total portfolio value includes cash balance
    const totalPortfolioValue = totalMarketValue + normalizedCashBalance;

    // Calculate allocation percentages (based on market value only, not including cash)
    const holdingsWithAllocation = holdings.map(h => ({
        ...h,
        allocation: totalMarketValue > 0 ? (h.marketValue / totalMarketValue) * 100 : 0
    }));

    return {
        totalInvested,
        totalMarketValue,
        totalGain,
        totalGainPercent,
        cashBalance: normalizedCashBalance,
        totalPortfolioValue,
        holdings: holdingsWithAllocation,
        exchangeRates: exchangeRates as any,
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
