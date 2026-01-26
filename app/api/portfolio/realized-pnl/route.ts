import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch realized P/L summary and history for a portfolio
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const portfolioId = searchParams.get('portfolio_id');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const ticker = searchParams.get('ticker');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!portfolioId) {
            return NextResponse.json({ success: false, error: 'Portfolio ID is required' }, { status: 400 });
        }

        // Get realized P/L summary using the database function
        let summary = null;
        try {
            const { data: summaryData, error: summaryError } = await supabase
                .rpc('get_realized_pnl_summary', {
                    p_portfolio_id: portfolioId,
                    p_start_date: startDate || null,
                    p_end_date: endDate || null
                });

            if (summaryError) {
                console.warn('Failed to get realized P/L summary:', summaryError.message);
            } else if (summaryData && summaryData.length > 0) {
                summary = summaryData[0];
            }
        } catch (e) {
            console.warn('Realized P/L summary function not available');
        }

        // Build query for individual realized P/L records
        let query = supabase
            .from('realized_pnl')
            .select('*')
            .eq('portfolio_id', portfolioId)
            .eq('user_id', user.id)
            .order('closed_at', { ascending: false })
            .limit(limit);

        if (ticker) {
            query = query.eq('ticker', ticker.toUpperCase());
        }
        if (startDate) {
            query = query.gte('closed_at', startDate);
        }
        if (endDate) {
            query = query.lte('closed_at', endDate);
        }

        const { data: records, error: recordsError } = await query;

        if (recordsError) {
            console.error('Error fetching realized P/L records:', recordsError);
        }

        // Calculate totals from records if summary function failed
        if (!summary && records && records.length > 0) {
            const totalRealizedGain = records.reduce((sum, r) => sum + Number(r.realized_gain), 0);
            const winningTrades = records.filter(r => Number(r.realized_gain) >= 0);
            const losingTrades = records.filter(r => Number(r.realized_gain) < 0);

            summary = {
                total_realized_gain: totalRealizedGain,
                total_trades: records.length,
                winning_trades: winningTrades.length,
                losing_trades: losingTrades.length,
                win_rate: records.length > 0 ? (winningTrades.length / records.length) * 100 : 0,
                avg_gain: winningTrades.length > 0
                    ? winningTrades.reduce((sum, r) => sum + Number(r.realized_gain), 0) / winningTrades.length
                    : 0,
                avg_loss: losingTrades.length > 0
                    ? losingTrades.reduce((sum, r) => sum + Number(r.realized_gain), 0) / losingTrades.length
                    : 0,
                biggest_win: winningTrades.length > 0
                    ? Math.max(...winningTrades.map(r => Number(r.realized_gain)))
                    : 0,
                biggest_loss: losingTrades.length > 0
                    ? Math.min(...losingTrades.map(r => Number(r.realized_gain)))
                    : 0
            };
        }

        // Group by ticker for breakdown
        const byTicker: Record<string, { totalGain: number; count: number; avgGainPercent: number }> = {};
        if (records) {
            for (const record of records) {
                if (!byTicker[record.ticker]) {
                    byTicker[record.ticker] = { totalGain: 0, count: 0, avgGainPercent: 0 };
                }
                byTicker[record.ticker].totalGain += Number(record.realized_gain);
                byTicker[record.ticker].count += 1;
                byTicker[record.ticker].avgGainPercent += Number(record.realized_gain_percent);
            }
            // Calculate averages
            for (const ticker of Object.keys(byTicker)) {
                byTicker[ticker].avgGainPercent /= byTicker[ticker].count;
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                summary: summary || {
                    total_realized_gain: 0,
                    total_trades: 0,
                    winning_trades: 0,
                    losing_trades: 0,
                    win_rate: 0,
                    avg_gain: 0,
                    avg_loss: 0,
                    biggest_win: 0,
                    biggest_loss: 0
                },
                records: records || [],
                byTicker
            }
        });

    } catch (error) {
        console.error('=== REALIZED P/L API ERROR ===', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}
