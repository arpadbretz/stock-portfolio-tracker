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

        const summary = await yf.quoteSummary(ticker, {
            modules: [
                'recommendationTrend',
                'upgradeDowngradeHistory',
                'financialData',
            ]
        }).catch(() => null);

        if (!summary) {
            return NextResponse.json({ error: 'No analyst data' }, { status: 404 });
        }

        const recommendations = summary?.recommendationTrend?.trend || [];
        const upgrades = summary?.upgradeDowngradeHistory?.history || [];
        const financials = summary?.financialData || {};

        // Get current month recommendation breakdown
        const currentMonth = recommendations.find((r: any) => r.period === '0m') || recommendations[0] || {};

        // Calculate overall score (1-5, where 1 = Strong Buy, 5 = Strong Sell)
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

        // Convert score to recommendation text
        let recommendation = 'N/A';
        if (averageScore !== null) {
            if (averageScore <= 1.5) recommendation = 'Strong Buy';
            else if (averageScore <= 2.5) recommendation = 'Buy';
            else if (averageScore <= 3.5) recommendation = 'Hold';
            else if (averageScore <= 4.5) recommendation = 'Sell';
            else recommendation = 'Strong Sell';
        }

        // Get recent upgrades/downgrades (last 5)
        const recentActions = upgrades.slice(0, 5).map((action: any) => ({
            firm: action.firm,
            toGrade: action.toGrade,
            fromGrade: action.fromGrade,
            action: action.action,
            date: action.epochGradeDate ? new Date(action.epochGradeDate * 1000).toISOString() : null,
        }));

        // Price targets
        const targetHigh = financials.targetHighPrice || null;
        const targetLow = financials.targetLowPrice || null;
        const targetMean = financials.targetMeanPrice || null;
        const targetMedian = financials.targetMedianPrice || null;
        const currentPrice = financials.currentPrice || null;
        const numberOfAnalysts = financials.numberOfAnalystOpinions || totalAnalysts;

        return NextResponse.json({
            symbol: ticker,
            recommendation,
            averageScore,
            totalAnalysts,
            breakdown: {
                strongBuy: currentMonth.strongBuy || 0,
                buy: currentMonth.buy || 0,
                hold: currentMonth.hold || 0,
                sell: currentMonth.sell || 0,
                strongSell: currentMonth.strongSell || 0,
            },
            priceTarget: {
                high: targetHigh,
                low: targetLow,
                mean: targetMean,
                median: targetMedian,
                current: currentPrice,
                numberOfAnalysts,
                upside: targetMean && currentPrice ? ((targetMean - currentPrice) / currentPrice * 100) : null,
            },
            recentActions,
        });
    } catch (error) {
        console.error(`Error fetching analyst data for ${symbol}:`, error);
        return NextResponse.json({ error: 'Failed to fetch analyst data' }, { status: 500 });
    }
}
