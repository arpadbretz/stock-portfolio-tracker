import { NextRequest, NextResponse } from 'next/server';
import { getCachedQuoteSummary } from '@/lib/yahoo-finance';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;
    if (!symbol) return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    const ticker = symbol.toUpperCase();

    try {
        const summary = await getCachedQuoteSummary(ticker, [
            'institutionOwnership',
            'fundOwnership',
            'majorHoldersBreakdown'
        ]);

        if (!summary) throw new Error('No data');

        const institutions = summary?.institutionOwnership?.ownershipList || [];
        const funds = summary?.fundOwnership?.ownershipList || [];
        const breakdown = summary?.majorHoldersBreakdown || {};

        return NextResponse.json({
            success: true,
            data: {
                symbol: ticker,
                institutions: institutions.slice(0, 15).map((inst: any) => ({
                    organization: inst.organization,
                    pctHeld: inst.pctHeld?.raw || null,
                    position: inst.position?.raw || null,
                    value: inst.value?.raw || null,
                    reportDate: inst.reportDate ? new Date(inst.reportDate.raw * 1000).toISOString() : null,
                })),
                funds: funds.slice(0, 10).map((fund: any) => ({
                    organization: fund.organization,
                    pctHeld: fund.pctHeld?.raw || null,
                    position: fund.position?.raw || null,
                    value: fund.value?.raw || null,
                    reportDate: fund.reportDate ? new Date(fund.reportDate.raw * 1000).toISOString() : null,
                })),
                breakdown: {
                    institutionsPercentHeld: breakdown.institutionsPercentHeld?.raw || null,
                    institutionsFloatPercentHeld: breakdown.institutionsFloatPercentHeld?.raw || null,
                    institutionsCount: breakdown.institutionsCount?.raw || null,
                    insidersPercentHeld: breakdown.insidersPercentHeld?.raw || null,
                },
            }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 });
    }
}
