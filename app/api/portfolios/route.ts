import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/portfolios - Get all portfolios for the current user
export async function GET() {
    try {
        const supabase = createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get all portfolios for the user
        const { data: portfolios, error: portfoliosError } = await supabase
            .from('portfolios')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (portfoliosError) {
            console.error('Error fetching portfolios:', portfoliosError);
            return NextResponse.json(
                { error: 'Failed to fetch portfolios' },
                { status: 500 }
            );
        }

        // Get user preferences to identify default portfolio
        const { data: preferences } = await supabase
            .from('user_preferences')
            .select('default_portfolio_id')
            .eq('user_id', user.id)
            .single();

        return NextResponse.json({
            portfolios: portfolios || [],
            defaultPortfolioId: preferences?.default_portfolio_id || portfolios?.[0]?.id
        });

    } catch (error) {
        console.error('Unexpected error in GET /api/portfolios:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST /api/portfolios - Create a new portfolio
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
        const { name, description, color } = body;

        if (!name || name.trim().length === 0) {
            return NextResponse.json(
                { error: 'Portfolio name is required' },
                { status: 400 }
            );
        }

        // Create the portfolio
        const { data: portfolio, error: createError } = await supabase
            .from('portfolios')
            .insert({
                user_id: user.id,
                name: name.trim(),
                description: description?.trim() || null,
                color: color || '#10b981'
            })
            .select()
            .single();

        if (createError) {
            console.error('Error creating portfolio:', createError);
            return NextResponse.json(
                { error: 'Failed to create portfolio' },
                { status: 500 }
            );
        }

        return NextResponse.json({ portfolio }, { status: 201 });

    } catch (error) {
        console.error('Unexpected error in POST /api/portfolios:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT /api/portfolios - Update a portfolio or set default
export async function PUT(request: Request) {
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
        const { portfolioId, name, description, color, setAsDefault } = body;

        if (!portfolioId) {
            return NextResponse.json(
                { error: 'Portfolio ID is required' },
                { status: 400 }
            );
        }

        // Verify the portfolio belongs to the user
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

        // Update portfolio details if provided
        if (name !== undefined || description !== undefined || color !== undefined) {
            const updates: any = {};
            if (name !== undefined) updates.name = name.trim();
            if (description !== undefined) updates.description = description?.trim() || null;
            if (color !== undefined) updates.color = color;

            const { error: updateError } = await supabase
                .from('portfolios')
                .update(updates)
                .eq('id', portfolioId)
                .eq('user_id', user.id);

            if (updateError) {
                console.error('Error updating portfolio:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update portfolio' },
                    { status: 500 }
                );
            }
        }

        // Set as default if requested
        if (setAsDefault) {
            const { error: prefError } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    default_portfolio_id: portfolioId
                }, {
                    onConflict: 'user_id'
                });

            if (prefError) {
                console.error('Error setting default portfolio:', prefError);
                return NextResponse.json(
                    { error: 'Failed to set default portfolio' },
                    { status: 500 }
                );
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Unexpected error in PUT /api/portfolios:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE /api/portfolios - Delete a portfolio
export async function DELETE(request: Request) {
    try {
        const supabase = createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const portfolioId = searchParams.get('id');

        if (!portfolioId) {
            return NextResponse.json(
                { error: 'Portfolio ID is required' },
                { status: 400 }
            );
        }

        // Check if this is the user's only portfolio
        const { data: portfolios, error: countError } = await supabase
            .from('portfolios')
            .select('id')
            .eq('user_id', user.id);

        if (countError) {
            console.error('Error counting portfolios:', countError);
            return NextResponse.json(
                { error: 'Failed to verify portfolio count' },
                { status: 500 }
            );
        }

        if (portfolios && portfolios.length <= 1) {
            return NextResponse.json(
                { error: 'Cannot delete your only portfolio' },
                { status: 400 }
            );
        }

        // Delete the portfolio (trades will be cascade deleted)
        const { error: deleteError } = await supabase
            .from('portfolios')
            .delete()
            .eq('id', portfolioId)
            .eq('user_id', user.id);

        if (deleteError) {
            console.error('Error deleting portfolio:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete portfolio' },
                { status: 500 }
            );
        }

        // If this was the default portfolio, clear the preference
        await supabase
            .from('user_preferences')
            .update({ default_portfolio_id: null })
            .eq('user_id', user.id)
            .eq('default_portfolio_id', portfolioId);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Unexpected error in DELETE /api/portfolios:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
