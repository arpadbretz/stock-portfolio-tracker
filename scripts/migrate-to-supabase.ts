import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for migration

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const DATA_FILE = path.join(process.cwd(), 'data', 'trades.json');

async function migrate() {
    console.log('🚀 Starting migration to Supabase...');

    if (!fs.existsSync(DATA_FILE)) {
        console.error('No local trades found at data/trades.json');
        return;
    }

    const trades = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    console.log(`📦 Found ${trades.length} local trades.`);

    for (const trade of trades) {
        console.log(`📤 Migrating ${trade.ticker} (${trade.action})...`);

        const { error } = await supabase
            .from('trades')
            .upsert({
                id: trade.id,
                ticker: trade.ticker,
                action: trade.action,
                quantity: trade.quantity,
                price_per_share: trade.pricePerShare,
                fees: trade.fees,
                total_cost: trade.totalCost,
                timestamp: trade.timestamp,
                notes: trade.notes
            }, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Failed to migrate ${trade.ticker}:`, error.message);
        } else {
            console.log(`✅ Success`);
        }
    }

    console.log('🎉 Migration complete!');
}

migrate();
