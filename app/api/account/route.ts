import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        if (action === 'export') {
            // Fetch all user data
            const [profileData, portfoliosData, tradesData] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', user.id).single(),
                supabase.from('portfolios').select('*').eq('user_id', user.id),
                supabase.from('trades').select('*').eq('user_id', user.id)
            ]);

            const exportData = {
                exported_at: new Date().toISOString(),
                user: {
                    id: user.id,
                    email: user.email,
                    created_at: user.created_at,
                },
                profile: profileData.data,
                portfolios: portfoliosData.data || [],
                trades: tradesData.data || [],
                metadata: {
                    total_portfolios: portfoliosData.data?.length || 0,
                    total_trades: tradesData.data?.length || 0,
                    export_format: 'JSON',
                    gdpr_compliance: 'This export contains all personal data as per GDPR Article 20'
                }
            };

            // Return as downloadable JSON file
            return new NextResponse(JSON.stringify(exportData, null, 2), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="portfolio-data-${new Date().toISOString().split('T')[0]}.json"`,
                },
            });
        }

        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error in account API:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to process request' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Delete all user data (cascading deletes will handle related data)
        // Order matters due to foreign key constraints
        const { error: tradesError } = await supabase
            .from('trades')
            .delete()
            .eq('user_id', user.id);

        if (tradesError) {
            console.error('Error deleting trades:', tradesError);
        }

        const { error: portfoliosError } = await supabase
            .from('portfolios')
            .delete()
            .eq('user_id', user.id);

        if (portfoliosError) {
            console.error('Error deleting portfolios:', portfoliosError);
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .delete()
            .eq('id', user.id);

        if (profileError) {
            console.error('Error deleting profile:', profileError);
        }

        // Delete the auth user (this is the final step)
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);

        if (authError) {
            console.error('Error deleting auth user:', authError);
            return NextResponse.json(
                { success: false, error: 'Failed to delete account. Please contact support.' },
                { status: 500 }
            );
        }

        // Sign out the user
        await supabase.auth.signOut();

        return NextResponse.json({
            success: true,
            message: 'Account successfully deleted'
        });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete account' },
            { status: 500 }
        );
    }
}
