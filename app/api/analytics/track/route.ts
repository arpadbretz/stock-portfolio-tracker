import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createHash } from 'crypto';

function hashUserId(userId: string): string {
    const salt = process.env.NEXT_PUBLIC_ANALYTICS_SALT || 'default-salt-change-me';
    return createHash('sha256').update(userId + salt).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const { eventType, userId, sessionHash, metadata, timestamp } = await request.json();

        if (!eventType || (!userId && !sessionHash)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = await createClient();

        // Generate or use existing hash
        const finalHash = sessionHash || (userId ? hashUserId(userId) : 'anonymous');

        // Insert analytics event
        const { error: eventError } = await supabase
            .from('analytics_events')
            .insert({
                event_type: eventType,
                session_hash: finalHash,
                metadata: metadata || {},
                created_at: new Date(timestamp).toISOString(),
            });

        if (eventError) {
            console.error('Analytics event error:', eventError);
            return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
        }

        // Update trending tickers if applicable
        if (eventType === 'ticker_view' && metadata?.ticker) {
            await updateTrendingTicker(supabase, metadata.ticker, 'view');
        } else if (eventType === 'ticker_search' && metadata?.ticker) {
            await updateTrendingTicker(supabase, metadata.ticker, 'search');
        }

        // Update DAU
        await updateDailyActiveUsers(supabase, finalHash);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

async function updateTrendingTicker(supabase: any, ticker: string, type: 'view' | 'search') {
    const column = type === 'view' ? 'view_count_24h' : 'search_count_24h';

    // Upsert trending ticker
    await supabase.rpc('increment_ticker_count', {
        p_ticker: ticker.toUpperCase(),
        p_column: column,
    });
}

async function updateDailyActiveUsers(supabase: any, sessionHash: string) {
    const today = new Date().toISOString().split('T')[0];

    // This would need a more sophisticated implementation with a separate sessions table
    // For now, we'll just increment the event count
    await supabase.rpc('increment_dau', {
        p_date: today,
    });
}
