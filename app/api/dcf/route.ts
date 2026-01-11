import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol');

        let query = supabase
            .from('dcf_analyses')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (symbol) {
            query = query.eq('symbol', symbol.toUpperCase());
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching DCF analyses:', error);
            return NextResponse.json({ error: 'Failed to fetch analyses' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('DCF API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        const { data, error } = await supabase
            .from('dcf_analyses')
            .insert({
                user_id: user.id,
                symbol: body.symbol?.toUpperCase(),
                name: body.name,
                current_price: body.currentPrice,
                free_cash_flow: body.freeCashFlow,
                shares_outstanding: body.sharesOutstanding,
                growth_rate_1_5: body.growthRateYear1to5,
                growth_rate_6_10: body.growthRateYear6to10,
                terminal_growth_rate: body.terminalGrowthRate,
                discount_rate: body.discountRate,
                margin_of_safety: body.marginOfSafety,
                is_advanced: body.isAdvanced || false,
                custom_growth_rates: body.customGrowthRates,
                cost_of_equity: body.costOfEquity,
                cost_of_debt: body.costOfDebt,
                tax_rate: body.taxRate,
                debt_ratio: body.debtRatio,
                equity_ratio: body.equityRatio,
                risk_free_rate: body.riskFreeRate,
                beta: body.beta,
                market_risk_premium: body.marketRiskPremium,
                cash_and_equivalents: body.cashAndEquivalents,
                total_debt: body.totalDebt,
                scenario_type: body.scenarioType || 'base',
                intrinsic_value: body.intrinsicValue,
                fair_value: body.fairValue,
                upside_percent: body.upsidePercent,
                notes: body.notes,
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving DCF analysis:', error);
            return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('DCF API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('dcf_analyses')
            .update({
                symbol: updateData.symbol?.toUpperCase(),
                name: updateData.name,
                current_price: updateData.currentPrice,
                free_cash_flow: updateData.freeCashFlow,
                shares_outstanding: updateData.sharesOutstanding,
                growth_rate_1_5: updateData.growthRateYear1to5,
                growth_rate_6_10: updateData.growthRateYear6to10,
                terminal_growth_rate: updateData.terminalGrowthRate,
                discount_rate: updateData.discountRate,
                margin_of_safety: updateData.marginOfSafety,
                is_advanced: updateData.isAdvanced || false,
                custom_growth_rates: updateData.customGrowthRates,
                cost_of_equity: updateData.costOfEquity,
                cost_of_debt: updateData.costOfDebt,
                tax_rate: updateData.taxRate,
                debt_ratio: updateData.debtRatio,
                equity_ratio: updateData.equityRatio,
                risk_free_rate: updateData.riskFreeRate,
                beta: updateData.beta,
                market_risk_premium: updateData.marketRiskPremium,
                cash_and_equivalents: updateData.cashAndEquivalents,
                total_debt: updateData.totalDebt,
                scenario_type: updateData.scenarioType || 'base',
                intrinsic_value: updateData.intrinsicValue,
                fair_value: updateData.fairValue,
                upside_percent: updateData.upsidePercent,
                notes: updateData.notes,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating DCF analysis:', error);
            return NextResponse.json({ error: 'Failed to update analysis' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('DCF API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Analysis ID required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('dcf_analyses')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting DCF analysis:', error);
            return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('DCF API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
