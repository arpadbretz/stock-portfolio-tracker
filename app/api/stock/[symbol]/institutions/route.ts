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
            modules: ['institutionOwnership', 'fundOwnership', 'majorHoldersBreakdown']
        }).catch(() => null);

        if (!summary) {
            return NextResponse.json({ error: 'No institutional data' }, { status: 404 });
        }

        const institutions = summary?.institutionOwnership?.ownershipList || [];
        const funds = summary?.fundOwnership?.ownershipList || [];
        const breakdown = summary?.majorHoldersBreakdown || {};

        // Process institutional holders
        const institutionalHolders = institutions.slice(0, 15).map((inst: any) => ({
            organization: inst.organization,
            pctHeld: inst.pctHeld?.raw || null,
            position: inst.position?.raw || null,
            value: inst.value?.raw || null,
            reportDate: inst.reportDate ? new Date(inst.reportDate.raw * 1000).toISOString() : null,
        }));

        // Process fund holders
        const fundHolders = funds.slice(0, 10).map((fund: any) => ({
            organization: fund.organization,
            pctHeld: fund.pctHeld?.raw || null,
            position: fund.position?.raw || null,
            value: fund.value?.raw || null,
            reportDate: fund.reportDate ? new Date(fund.reportDate.raw * 1000).toISOString() : null,
        }));

        // Ownership breakdown
        const ownershipBreakdown = {
            institutionsPercentHeld: breakdown.institutionsPercentHeld?.raw || null,
            institutionsFloatPercentHeld: breakdown.institutionsFloatPercentHeld?.raw || null,
            institutionsCount: breakdown.institutionsCount?.raw || null,
            insidersPercentHeld: breakdown.insidersPercentHeld?.raw || null,
        };

        return NextResponse.json({
            symbol: ticker,
            institutions: institutionalHolders,
            funds: fundHolders,
            breakdown: ownershipBreakdown,
        });
    } catch (error) {
        console.error(`Error fetching institutional data for ${symbol}:`, error);
        return NextResponse.json({ error: 'Failed to fetch institutional data' }, { status: 500 });
    }
}
