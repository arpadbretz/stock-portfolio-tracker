import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { syncPortfolioHistory } from '@/lib/portfolio-history';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const portfolioId = searchParams.get('portfolioId');

        // Verify auth: Either via CRON_SECRET or an authenticated user session
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;
        const supabase = await createClient();

        let isAuthorized = false;

        // 1. Check for cron secret
        if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
            isAuthorized = true;
        }

        // 2. Check for authenticated user if portfolioId is provided
        const { data: { user } } = await supabase.auth.getUser();
        if (user && portfolioId) {
            isAuthorized = true;
        }

        if (!isAuthorized && !portfolioId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let targetPortfolios = [];

        if (portfolioId) {
            // Manual sync for specific portfolio (requires auth)
            if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

            const { data: portfolio } = await supabase
                .from('portfolios')
                .select('id, user_id')
                .eq('id', portfolioId)
                .eq('user_id', user.id)
                .single();

            if (!portfolio) return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
            targetPortfolios = [portfolio];
        } else {
            // Backup/Cron sync for all active portfolios
            // In a real app, we might only sync recently active users
            const { data: portfolios } = await supabase
                .from('portfolios')
                .select('id, user_id');

            targetPortfolios = portfolios || [];
        }

        const results = [];
        for (const p of targetPortfolios) {
            try {
                const res = await syncPortfolioHistory(p.id, p.user_id);
                results.push({ id: p.id, ...res });
            } catch (err: any) {
                console.error(`Failed to sync portfolio ${p.id}:`, err);
                results.push({ id: p.id, success: false, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            synced: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            details: results
        });
    } catch (error: any) {
        console.error('History sync error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// POST also triggers it (used for initial sync after trade import)
export async function POST(request: Request) {
    return GET(request);
}
