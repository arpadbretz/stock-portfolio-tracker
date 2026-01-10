import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: watchlist, error } = await supabase
            .from('watchlists')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching watchlist:', error);
            return NextResponse.json({ error: 'Failed to fetch watchlist' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: watchlist });
    } catch (error) {
        console.error('Watchlist error:', error);
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
        const { symbol, name, added_price, target_price, notes } = body;

        if (!symbol) {
            return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('watchlists')
            .upsert({
                user_id: user.id,
                symbol: symbol.toUpperCase(),
                name: name || null,
                added_price: added_price || null,
                target_price: target_price || null,
                notes: notes || null,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,symbol',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (error) {
            console.error('Error adding to watchlist:', error);
            return NextResponse.json({ error: 'Failed to add to watchlist' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Watchlist error:', error);
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
        const symbol = searchParams.get('symbol');

        if (!symbol) {
            return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
        }

        const { error } = await supabase
            .from('watchlists')
            .delete()
            .eq('user_id', user.id)
            .eq('symbol', symbol.toUpperCase());

        if (error) {
            console.error('Error removing from watchlist:', error);
            return NextResponse.json({ error: 'Failed to remove from watchlist' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Watchlist error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
