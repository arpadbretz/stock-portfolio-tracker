import { NextResponse } from 'next/server';
import { deleteTrade, updateTrade } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const supabase = createClient();
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
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const success = await deleteTrade(id, supabase);

        if (!success) {
            return NextResponse.json(
                { success: false, error: 'Trade not found' },
                { status: 404 }
            );
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
