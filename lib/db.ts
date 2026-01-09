import * as localDb from './local-db';
import * as supabaseService from './supabase-service';

const useSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function getAllTrades() {
    if (useSupabase) {
        return supabaseService.getAllTrades();
    }
    return localDb.getAllTrades();
}

export async function addTrade(trade: any) {
    if (useSupabase) {
        return supabaseService.addTrade(trade);
    }
    return localDb.addTrade(trade);
}

export async function updateTrade(id: string, updates: any) {
    if (useSupabase) {
        return supabaseService.updateTrade(id, updates);
    }
    return localDb.updateTrade(id, updates);
}

export async function deleteTrade(id: string) {
    if (useSupabase) {
        return supabaseService.deleteTrade(id);
    }
    return localDb.deleteTrade(id);
}

export const initializeSheet = async () => {
    if (!useSupabase) {
        return localDb.initializeSheet();
    }
};
