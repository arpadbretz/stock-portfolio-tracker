import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getHistoricalBenchmark } from '@/lib/yahoo-finance';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const portfolioId = searchParams.get('portfolioId');
        const period = searchParams.get('period') || '1Y'; // 1M, 3M, 6M, 1Y, YTD, ALL

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!portfolioId) {
            return NextResponse.json({ error: 'Portfolio ID is required' }, { status: 400 });
        }

        // 1. Fetch portfolio history from our saved snapshots
        let query = supabase
            .from('portfolio_history')
            .select('*')
            .eq('portfolio_id', portfolioId)
            .eq('user_id', user.id)
            .order('date', { ascending: true });

        // Filter based on period
        const now = new Date();
        let startDate = new Date();

        if (period === '1W') startDate.setDate(now.getDate() - 7);
        else if (period === '1M') startDate.setMonth(now.getMonth() - 1);
        else if (period === '3M') startDate.setMonth(now.getMonth() - 3);
        else if (period === '6M') startDate.setMonth(now.getMonth() - 6);
        else if (period === '1Y') startDate.setFullYear(now.getFullYear() - 1);
        else if (period === 'YTD') startDate = new Date(now.getFullYear(), 0, 1);
        else if (period === 'ALL') startDate = new Date(2000, 0, 1); // Way back

        if (period !== 'ALL') {
            query = query.gte('date', startDate.toISOString().split('T')[0]);
        }

        const { data: history, error: historyError } = await query;

        if (historyError) throw historyError;

        if (!history || history.length === 0) {
            return NextResponse.json({
                success: true,
                data: [],
                message: 'No history found. Try performing a sync.'
            });
        }

        // 2. Map history data using TWR columns
        const combinedData = history.map(entry => {
            return {
                date: entry.date,
                portfolio: (entry.cumulative_twr || 0) * 100,
                benchmark: (entry.bench_cumulative || 0) * 100,
                value: entry.total_value,
                costBasis: entry.cost_basis
            };
        });

        // If the first entry is not exactly 0 (due to calculation start), we might want to normalize
        // But TWR should already be 0 at the start of the series relative to inception.
        // For the chosen period (e.g. 1M), we should re-normalize relative to the start of that period.
        const startTwr = history[0].cumulative_twr || 0;
        const startBench = history[0].bench_cumulative || 0;

        const periodNormalizedData = combinedData.map(d => ({
            ...d,
            portfolio: (((1 + d.portfolio / 100) / (1 + startTwr)) - 1) * 100,
            benchmark: (((1 + d.benchmark / 100) / (1 + startBench)) - 1) * 100,
        }));

        return NextResponse.json({
            success: true,
            data: periodNormalizedData
        });

    } catch (error: any) {
        console.error('Performance API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
