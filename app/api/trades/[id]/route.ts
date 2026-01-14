import { NextRequest, NextResponse } from 'next/server';
import { deleteTrade, updateTrade } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const updatedTrade = await updateTrade(id, body, supabase);

        if (!updatedTrade) {
            return NextResponse.json(
                { success: false, error: 'Trade not found' },
                { status: 404 }
            );
        }

        // Trigger history sync
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://${request.headers.get('host')}`;
        fetch(`${baseUrl}/api/cron/sync-history?portfolioId=${updatedTrade.portfolio_id}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
        }).catch(err => console.error('Failed to trigger background sync:', err));

        return NextResponse.json({ success: true, data: updatedTrade });
    } catch (error) {
        console.error('Error updating trade:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update trade' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch trade FIRST to get the portfolioId before it's gone
        const { data: trade } = await supabase
            .from('trades')
            .select('portfolio_id')
            .eq('id', id)
            .single();

        const success = await deleteTrade(id, supabase);

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Trade not found' },
                { status: 404 }
            );
        }

        // Trigger history sync if we found the portfolioId
        if (trade?.portfolio_id) {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://${request.headers.get('host')}`;
            fetch(`${baseUrl}/api/cron/sync-history?portfolioId=${trade.portfolio_id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` }
            }).catch(err => console.error('Failed to trigger background sync:', err));
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting trade:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete trade' },
            { status: 500 }
        );
    }
}
