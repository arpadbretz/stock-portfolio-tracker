import * as localDb from './local-db';
import * as supabaseService from './supabase-service';

const useSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getAllTrades(client?: any) {
    if (useSupabase) {
        return supabaseService.getAllTrades(client);
    }
    return localDb.getAllTrades();
}

export async function addTrade(trade: any, client?: any) {
    if (useSupabase) {
        return supabaseService.addTrade(trade, client);
    }
    return localDb.addTrade(trade);
}

export async function updateTrade(id: string, updates: any, client?: any) {
    if (useSupabase) {
        return supabaseService.updateTrade(id, updates, client);
    }
    return localDb.updateTrade(id, updates);
}

export async function deleteTrade(id: string, client?: any) {
    if (useSupabase) {
        return supabaseService.deleteTrade(id, client);
    }
    return localDb.deleteTrade(id);
}

export const initializeSheet = async () => {
    if (!useSupabase) {
        return localDb.initializeSheet();
    }
};
