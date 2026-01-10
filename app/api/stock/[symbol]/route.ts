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

        // Fetch comprehensive stock data
        const [quote, summary] = await Promise.all([
            yf.quote(ticker),
            yf.quoteSummary(ticker, {
                modules: [
                    'assetProfile',
                    'summaryDetail',
                    'financialData',
                    'defaultKeyStatistics',
                    'earnings',
                ]
            }).catch(() => null)
        ]);

        if (!quote) {
            return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
        }

        const profile = summary?.assetProfile || {};
        const details = summary?.summaryDetail || {};
        const financials = summary?.financialData || {};
        const keyStats = summary?.defaultKeyStatistics || {};
        const earnings = summary?.earnings || {};

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

            // 52 Week Range
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
            fiftyTwoWeekChange: keyStats.fiftyTwoWeekChange || null,

            // Valuation
            trailingPE: details.trailingPE || quote.trailingPE || null,
            forwardPE: details.forwardPE || quote.forwardPE || null,
            priceToBook: keyStats.priceToBook || null,
            pegRatio: keyStats.pegRatio || null,

            // Dividends
            dividendYield: details.dividendYield || null,
            dividendRate: details.dividendRate || null,
            exDividendDate: details.exDividendDate || null,

            // Financials
            beta: keyStats.beta || details.beta || null,
            eps: quote.epsTrailingTwelveMonths || null,
            revenueGrowth: financials.revenueGrowth || null,
            profitMargin: financials.profitMargins || null,
            operatingMargin: financials.operatingMargins || null,
            returnOnEquity: financials.returnOnEquity || null,
            debtToEquity: financials.debtToEquity || null,
            currentRatio: financials.currentRatio || null,
            freeCashflow: financials.freeCashflow || null,

            // Company Profile
            sector: profile.sector || null,
            industry: profile.industry || null,
            employees: profile.fullTimeEmployees || null,
            website: profile.website || null,
            description: profile.longBusinessSummary || null,

            // Earnings
            earningsDate: earnings.earningsDate?.[0] || null,
            earningsQuarterlyGrowth: keyStats.earningsQuarterlyGrowth || null,

            lastUpdated: new Date().toISOString(),
        };

        return NextResponse.json(stockData);
    } catch (error) {
        console.error(`Error fetching stock data for ${symbol}:`, error);
        return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
    }
}
