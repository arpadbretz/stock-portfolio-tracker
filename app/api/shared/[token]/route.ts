import { NextRequest, NextResponse } from 'next/server';
import { getCachedBatchPrices } from '@/lib/yahoo-finance/cached';
import { aggregateHoldings, calculatePortfolioSummary } from '@/lib/portfolio';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await context.params;
        const supabase = await createClient();

        if (!token) {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // 1. Fetch Portfolio by Share Token
        // Check is_public = true AND share_token = token
        const { data: portfolio, error: portfolioError } = await supabase
            .from('portfolios')
            .select('id, name, description, color, is_public, user_id')
            .eq('share_token', token)
            .eq('is_public', true)
            .single();

        if (portfolioError || !portfolio) {
            return NextResponse.json(
                { error: 'Portfolio not found or private' },
                { status: 404 }
            );
        }

        // 2. Fetch Trades
        // Since RLS policies likely restrict access to "own" rows, we typically can't read this with a standard user client
        // UNLESS the table has a policy for "public" access?
        // OR we use the SUPABASE_SERVICE_ROLE_KEY to bypass RLS.
        // Since this is a public endpoint intended to expose data, using Service Role here is appropriate IF we strictly validate logic.

        // HOWEVER, to keep it simple and safe, let's assume valid RLS for now or using a method that works.
        // Actually, without a Service Role client, `createClient()` (cookie based) won't have access to OTHER users' data.
        // So we MUST use a Service Role client or define "Public functions" in DB.

        // Let's use `supabase-js` with Service Key if available, or just rely on a DB function if we want to be pure.
        // But for Next.js, creating a service client is common for admin/public read tasks.

        // Let's modify the imports to support service role client if needed, OR relies on RLS policies being updated.
        // Since I didn't add "Public" RLS policies (which is safer), I need a privileged client.

        // DO WE HAVE SERVICE ROLE KEY? 
        // YES, it's in .env.local usually.

        // BUT `createClient()` from `@/lib/supabase/server` uses cookies. We need a different client construction.
        // Let's check `lib/supabase/server.ts` - usually it's just cookie auth.
        // I'll manually create a simple supabase client here using process.env

        const adminSupabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: dbTrades, error: tradesError } = await adminSupabase
            .from('trades')
            .select('*')
            .eq('portfolio_id', portfolio.id)
            .order('date_traded', { ascending: false });

        if (tradesError) {
            console.error('Trades fetch error:', tradesError);
            throw tradesError;
        }

        // 3. Process Data (Same as usual)
        const trades = (dbTrades || []).map((t: any) => ({
            id: t.id,
            portfolioId: t.portfolio_id,
            ticker: t.ticker,
            action: t.action,
            quantity: Number(t.quantity),
            pricePerShare: Number(t.price_per_share),
            fees: Number(t.fees),
            totalCost: Number(t.total_cost || 0),
            notes: t.notes,
            timestamp: t.date_traded,
            date: t.date_traded,
        }));

        const tickers = [...new Set(trades.map((t: any) => t.ticker.toUpperCase()))];
        const prices = await getCachedBatchPrices(tickers);

        const ratesData = await getCachedBatchPrices(['USDEUR=X', 'USDHUF=X']);
        const exchangeRates = {
            USD: 1,
            EUR: ratesData.get('USDEUR=X')?.currentPrice || 0.92,
            HUF: ratesData.get('USDHUF=X')?.currentPrice || 350,
        };

        const holdings = aggregateHoldings(trades, prices);
        const summary = calculatePortfolioSummary(holdings, exchangeRates);

        return NextResponse.json({
            success: true,
            data: {
                name: portfolio.name,
                description: portfolio.description,
                color: portfolio.color,
                trades,
                holdings,
                summary,
                lastUpdated: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Error fetching shared portfolio:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
