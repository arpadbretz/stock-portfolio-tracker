import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check if portfolio already exists
        const { data: existingPortfolio } = await supabase
            .from('portfolios')
            .select('id, name')
            .eq('user_id', user.id)
            .single();

        if (existingPortfolio) {
            return NextResponse.json({
                success: true,
                message: 'Portfolio already exists',
                data: existingPortfolio
            });
        }

        // Create new portfolio
        const { data: newPortfolio, error } = await supabase
            .from('portfolios')
            .insert({
                user_id: user.id,
                name: 'My Portfolio',
                is_default: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating portfolio:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Portfolio created successfully',
            data: newPortfolio
        });

    } catch (error) {
        console.error('Error in create-portfolio:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create portfolio' },
            { status: 500 }
        );
    }
}
