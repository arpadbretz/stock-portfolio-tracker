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

        if (period === '1M') startDate.setMonth(now.getMonth() - 1);
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

        // 2. Fetch Benchmark data (S&P 500) for the SAME timeframe
        const firstEntryDate = new Date(history[0].date);
        const benchmarkData = await getHistoricalBenchmark(firstEntryDate);

        // 3. Normalize and combine data
        // Normalization: First entry of portfolio value is 0% change
        const startValue = history[0].total_value || 1; // Avoid div by zero

        const combinedData = history.map(entry => {
            const dateStr = new Date(entry.date).toISOString().split('T')[0];
            const benchEntry = benchmarkData.find((b: any) => {
                const bDate = new Date(b.date).toISOString().split('T')[0];
                return bDate === dateStr;
            });

            return {
                date: entry.date,
                portfolio: ((entry.total_value / startValue) - 1) * 100,
                benchmark: benchEntry ? benchEntry.performance * 100 : null,
                value: entry.total_value,
                benchValue: benchEntry ? benchEntry.value : null
            };
        });

        return NextResponse.json({
            success: true,
            data: combinedData
        });

    } catch (error: any) {
        console.error('Performance API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
