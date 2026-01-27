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
        const portfolioId = searchParams.get('portfolioId');
        const limit = parseInt(searchParams.get('limit') || '50');

        if (!portfolioId) {
            return NextResponse.json({ success: false, error: 'Portfolio ID is required' }, { status: 400 });
        }

        // 1. Fetch Trades
        const { data: trades, error: tradesError } = await supabase
            .from('trades')
            .select('*')
            .eq('portfolio_id', portfolioId)
            .order('date_traded', { ascending: false })
            .limit(limit);

        if (tradesError) throw tradesError;

        // 2. Fetch Cash Transactions
        const { data: cashTx, error: cashError } = await supabase
            .from('cash_transactions')
            .select('*')
            .eq('portfolio_id', portfolioId)
            .order('transaction_date', { ascending: false })
            .limit(limit);

        if (cashError) throw cashError;

        // 3. Map to Unified Format
        const unifiedTrades = (trades || []).map(t => ({
            id: t.id,
            type: 'stock',
            ticker: t.ticker,
            action: t.action,
            quantity: Number(t.quantity),
            price: Number(t.price_per_share),
            total: Number(t.total_cost || 0),
            date: t.date_traded,
            timestamp: t.date_traded,
            currency: (t as any).currency || 'USD'
        }));

        const unifiedCash = (cashTx || []).map(c => ({
            id: c.id,
            type: 'cash',
            ticker: c.ticker || 'CASH',
            action: c.transaction_type, // DEPOSIT, WITHDRAWAL, etc.
            quantity: 1,
            price: Math.abs(Number(c.amount)),
            total: Math.abs(Number(c.amount)),
            date: c.transaction_date,
            timestamp: c.transaction_date,
            currency: c.currency,
            description: c.description
        }));

        // 4. Combine and Sort
        const allTransactions = [...unifiedTrades, ...unifiedCash]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);

        return NextResponse.json({
            success: true,
            data: allTransactions
        });

    } catch (error) {
        console.error('=== TRANSACTIONS API ERROR ===', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}
