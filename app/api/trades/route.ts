import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Destructure all expected fields, including portfolioId
        const {
            portfolioId,
            ticker,
            action,
            quantity,
            pricePerShare,
            fees = 0,
            notes = ''
        } = body;

        // --- VALIDATION ---

        if (!portfolioId || typeof portfolioId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Portfolio ID is required' },
                { status: 400 }
            );
        }

        if (!ticker || typeof ticker !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Ticker is required' },
                { status: 400 }
            );
        }

        if (!action || !['BUY', 'SELL'].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Action must be BUY or SELL' },
                { status: 400 }
            );
        }

        if (typeof quantity !== 'number' || quantity <= 0) {
            return NextResponse.json(
                { success: false, error: 'Quantity must be a positive number' },
                { status: 400 }
            );
        }

        if (typeof pricePerShare !== 'number' || pricePerShare <= 0) {
            return NextResponse.json(
                { success: false, error: 'Price per share must be a positive number' },
                { status: 400 }
            );
        }

        // --- DATABASE INSERTION ---

        // Calculate total cost for the trade
        const totalCost = (quantity * pricePerShare) + fees;

        // We insert directly here to ensure column mapping is correct
        // (camelCase from form -> snake_case in DB)
        const { data: trade, error } = await supabase
            .from('trades')
            .insert({
                portfolio_id: portfolioId,
                ticker: ticker.toUpperCase(),
                action,
                quantity,
                price_per_share: pricePerShare,
                fees,
                total_cost: totalCost,
                notes,
                date_traded: new Date().toISOString(),
                user_id: user.id // Required for RLS
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insertion error:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            data: trade,
        });

    } catch (error) {
        console.error('Error adding trade:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            { status: 500 }
        );
    }
}