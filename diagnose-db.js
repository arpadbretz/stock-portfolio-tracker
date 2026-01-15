import { createClient } from './lib/supabase/client';

async function diagnose() {
    const supabase = createClient();

    console.log('--- Database Diagnostic ---');

    // Check portfolios
    const { data: portfolios, error: pError } = await supabase.from('portfolios').select('id, name');
    if (pError) {
        console.error('Error fetching portfolios:', pError);
    } else {
        console.log('Portfolios found:', portfolios.length);
        portfolios.forEach(p => console.log(`- ${p.name} (${p.id})`));
    }

    // Check trades
    const { data: trades, error: tError } = await supabase.from('trades').select('count', { count: 'exact', head: true });
    if (tError) {
        console.error('Error checking trades:', tError);
    } else {
        console.log('Total trades in DB:', trades);
    }

    // Check portfolio_history table existence
    const { data: history, error: hError } = await supabase.from('portfolio_history').select('id').limit(1);
    if (hError) {
        if (hError.code === '42P01') {
            console.error('CRITICAL: Table "portfolio_history" does NOT exist. You need to run migrations/005_portfolio_history.sql in Supabase.');
        } else {
            console.error('Error checking portfolio_history:', hError);
        }
    } else {
        console.log('Table "portfolio_history" exists.');
        const { count } = await supabase.from('portfolio_history').select('*', { count: 'exact', head: true });
        console.log('Total history entries:', count);
    }
}

diagnose();
