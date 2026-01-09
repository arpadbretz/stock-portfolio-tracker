// Local File Storage Service - Replaces Google Sheets for trade persistence
import fs from 'fs';
import path from 'path';
import { Trade } from '@/types/portfolio';

const DATA_FILE = path.join(process.cwd(), 'data', 'trades.json');

// Ensure the data directory and file exist
function ensureDataFile() {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
    }
}

import { crypto } from 'node:crypto';

// Fetch all trades from the local JSON file
export async function getAllTrades(): Promise<Trade[]> {
    ensureDataFile();
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const trades = JSON.parse(data) as Trade[];

        // Migrate legacy data to have IDs
        let migrated = false;
        const processedTrades = trades.map(t => {
            if (!t.id) {
                migrated = true;
                return { ...t, id: (crypto as any).randomUUID() };
            }
            return t;
        });

        if (migrated) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(processedTrades, null, 2));
        }

        return processedTrades;
    } catch (error) {
        console.error('Error reading trades file:', error);
        return [];
    }
}

// Add a new trade to the local JSON file
export async function addTrade(trade: Omit<Trade, 'id' | 'timestamp' | 'totalCost'>): Promise<Trade> {
    ensureDataFile();

    const trades = await getAllTrades();
    const timestamp = new Date().toISOString();
    const totalCost = trade.quantity * trade.pricePerShare + trade.fees;
    const id = (crypto as any).randomUUID();

    const newTrade: Trade = {
        ...trade,
        id,
        ticker: trade.ticker.toUpperCase(),
        timestamp,
        totalCost,
    };

    trades.push(newTrade);
    fs.writeFileSync(DATA_FILE, JSON.stringify(trades, null, 2));

    return newTrade;
}

// Update an existing trade
export async function updateTrade(id: string, updates: Partial<Trade>): Promise<Trade | null> {
    ensureDataFile();
    const trades = await getAllTrades();
    const index = trades.findIndex(t => t.id === id);

    if (index === -1) return null;

    const currentTrade = trades[index];
    const updatedTrade = {
        ...currentTrade,
        ...updates,
        ticker: updates.ticker ? updates.ticker.toUpperCase() : currentTrade.ticker,
        totalCost: (updates.quantity ?? currentTrade.quantity) *
            (updates.pricePerShare ?? currentTrade.pricePerShare) +
            (updates.fees ?? currentTrade.fees)
    };

    trades[index] = updatedTrade;
    fs.writeFileSync(DATA_FILE, JSON.stringify(trades, null, 2));

    return updatedTrade;
}

// Delete a trade
export async function deleteTrade(id: string): Promise<boolean> {
    ensureDataFile();
    const trades = await getAllTrades();
    const filteredTrades = trades.filter(t => t.id !== id);

    if (filteredTrades.length === trades.length) return false;

    fs.writeFileSync(DATA_FILE, JSON.stringify(filteredTrades, null, 2));
    return true;
}

// Clear all trades
export async function clearAllTrades(): Promise<void> {
    ensureDataFile();
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
}

// Legacy function name for compatibility with existing imports
export const initializeSheet = async () => ensureDataFile();
