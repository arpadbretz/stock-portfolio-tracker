import { supabase } from './supabase';
import { Trade } from '@/types/portfolio';

export async function getAllTrades(client = supabase): Promise<Trade[]> {
    if (!client) return [];
    const { data, error } = await client
        .from('trades')
        .select('*')
        .order('timestamp', { ascending: false });

    if (error) {
        console.error('Error fetching trades from Supabase:', error);
        return [];
    }

    // Map database snake_case to camelCase types
    return (data || []).map(t => ({
        id: t.id,
        ticker: t.ticker,
        action: t.action,
        quantity: Number(t.quantity),
        pricePerShare: Number(t.price_per_share),
        fees: Number(t.fees),
        totalCost: Number(t.total_cost),
        timestamp: t.timestamp,
        notes: t.notes,
        user_id: t.user_id,
        portfolio_id: t.portfolio_id
    }));
}

export async function addTrade(trade: Omit<Trade, 'id' | 'timestamp' | 'totalCost'>, client = supabase): Promise<Trade | null> {
    if (!client) return null;

    const { data: { user } } = await client.auth.getUser();
    if (!user) return null;

    // Fetch the user's default portfolio
    const { data: portfolio } = await client
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single();

    const totalCost = trade.quantity * trade.pricePerShare + trade.fees;

    const { data, error } = await client
        .from('trades')
        .insert([{
            ticker: trade.ticker.toUpperCase(),
            action: trade.action,
            quantity: trade.quantity,
            price_per_share: trade.pricePerShare,
            fees: trade.fees,
            total_cost: totalCost,
            notes: trade.notes,
            user_id: user.id,
            portfolio_id: portfolio?.id
        }])
        .select()
        .single();

    if (error) {
        console.error('Error adding trade to Supabase:', error);
        return null;
    }

    return {
        id: data.id,
        ticker: data.ticker,
        action: data.action,
        quantity: Number(data.quantity),
        pricePerShare: Number(data.price_per_share),
        fees: Number(data.fees),
        totalCost: Number(data.total_cost),
        timestamp: data.timestamp,
        notes: data.notes,
        user_id: data.user_id,
        portfolio_id: data.portfolio_id
    };
}

export async function updateTrade(id: string, updates: Partial<Trade>, client = supabase): Promise<Trade | null> {
    // If quantity/price/fees change, we need to recalculate totalCost
    // Since we don't have the full previous trade, this is tricky.
    // Best to fetch it first or use a triggered function in DB.
    // For simplicity, let's fetch first if we are updating cost-related fields.

    const dbUpdates: any = { ...updates };

    if (updates.ticker) dbUpdates.ticker = updates.ticker.toUpperCase();
    if (updates.pricePerShare) dbUpdates.price_per_share = updates.pricePerShare;
    if (updates.totalCost) dbUpdates.total_cost = updates.totalCost;

    // Remove camelCase fields that are mapped differently
    delete dbUpdates.pricePerShare;
    delete dbUpdates.totalCost;

    if (!client) return null;
    const { data, error } = await client
        .from('trades')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating trade in Supabase:', error);
        return null;
    }

    return {
        id: data.id,
        ticker: data.ticker,
        action: data.action,
        quantity: Number(data.quantity),
        pricePerShare: Number(data.price_per_share),
        fees: Number(data.fees),
        totalCost: Number(data.total_cost),
        timestamp: data.timestamp,
        notes: data.notes,
        user_id: data.user_id,
        portfolio_id: data.portfolio_id
    };
}

export async function deleteTrade(id: string, client = supabase): Promise<boolean> {
    if (!client) return false;
    const { error } = await client
        .from('trades')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting trade from Supabase:', error);
        return false;
    }

    return true;
}
