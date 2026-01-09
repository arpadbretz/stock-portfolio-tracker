import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { portfolioId, trades } = body;

        if (!portfolioId) {
            return NextResponse.json(
                { error: 'Portfolio ID is required' },
                { status: 400 }
            );
        }

        if (!trades || !Array.isArray(trades) || trades.length === 0) {
            return NextResponse.json(
                { error: 'No trades provided' },
                { status: 400 }
            );
        }

        // Verify portfolio ownership
        const { data: portfolio, error: verifyError } = await supabase
            .from('portfolios')
            .select('id')
            .eq('id', portfolioId)
            .eq('user_id', user.id)
            .single();

        if (verifyError || !portfolio) {
            return NextResponse.json(
                { error: 'Portfolio not found' },
                { status: 404 }
            );
        }

        // Prepare trades for insertion
        // We assume frontend has normalized the keys
        const tradesToInsert = trades.map((t: any) => ({
            portfolio_id: portfolioId,
            ticker: t.ticker.toUpperCase(),
            action: t.action.toUpperCase(), // BUY or SELL
            quantity: Number(t.quantity),
            price_per_share: Number(t.price),
            fees: Number(t.fees || 0),
            total_cost: Number(t.quantity) * Number(t.price) + Number(t.fees || 0), // Basic calc, trusting inputs or should we recalc?
            date_traded: new Date(t.date).toISOString(),
            notes: t.notes || 'Imported via CSV'
        }));

        // Validate basic fields
        if (tradesToInsert.some((t: any) =>
            !t.ticker || !t.quantity || !t.price_per_share || !t.date_traded || !['BUY', 'SELL'].includes(t.action)
        )) {
            return NextResponse.json(
                { error: 'Invalid trade data in CSV. Ensure strict format.' },
                { status: 400 }
            );
        }

        const { data, error: insertError } = await supabase
            .from('trades')
            .insert(tradesToInsert)
            .select();

        if (insertError) {
            console.error('Bulk import error:', insertError);
            return NextResponse.json(
                { error: 'Failed to insert trades' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            count: data.length
        }, { status: 201 });

    } catch (error) {
        console.error('Unexpected error in bulk import:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
