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
            .from('price_alerts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (symbol) {
            query = query.eq('symbol', symbol.toUpperCase());
        }

        const { data: alerts, error } = await query;

        if (error) {
            console.error('Error fetching alerts:', error);
            return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: alerts });
    } catch (error) {
        console.error('Alerts error:', error);
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
        const { symbol, target_price, condition } = body;

        if (!symbol || !target_price || !condition) {
            return NextResponse.json({ error: 'Symbol, target price, and condition are required' }, { status: 400 });
        }

        if (!['above', 'below'].includes(condition)) {
            return NextResponse.json({ error: 'Condition must be "above" or "below"' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('price_alerts')
            .insert({
                user_id: user.id,
                symbol: symbol.toUpperCase(),
                target_price: parseFloat(target_price),
                condition,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating alert:', error);
            return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Alerts error:', error);
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
        const alertId = searchParams.get('id');

        if (!alertId) {
            return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('price_alerts')
            .delete()
            .eq('id', alertId)
            .eq('user_id', user.id);

        if (error) {
            console.error('Error deleting alert:', error);
            return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Alerts error:', error);
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
        const { id, target_price, condition } = body;

        if (!id) {
            return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
        }

        if (!target_price || !condition) {
            return NextResponse.json({ error: 'Target price and condition are required' }, { status: 400 });
        }

        if (!['above', 'below'].includes(condition)) {
            return NextResponse.json({ error: 'Condition must be "above" or "below"' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('price_alerts')
            .update({
                target_price: parseFloat(target_price),
                condition,
                is_triggered: false, // Reset trigger status when editing
                triggered_at: null,
            })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating alert:', error);
            return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Alerts error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
