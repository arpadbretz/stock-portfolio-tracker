import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CashTransaction, CashTransactionType, CurrencyCode } from '@/types/portfolio';
import { getCachedBatchPrices } from '@/lib/yahoo-finance/cached';

// GET - Fetch all cash transactions for a portfolio
export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const portfolioId = searchParams.get('portfolio_id');
        const transactionType = searchParams.get('type');
        const startDate = searchParams.get('start_date');
        const endDate = searchParams.get('end_date');
        const limit = parseInt(searchParams.get('limit') || '100');

        if (!portfolioId) {
            return NextResponse.json({ success: false, error: 'Portfolio ID is required' }, { status: 400 });
        }

        // Build query
        let query = supabase
            .from('cash_transactions')
            .select('*')
            .eq('portfolio_id', portfolioId)
            .eq('user_id', user.id)
            .order('transaction_date', { ascending: false })
            .limit(limit);

        if (transactionType) {
            query = query.eq('transaction_type', transactionType);
        }
        if (startDate) {
            query = query.gte('transaction_date', startDate);
        }
        if (endDate) {
            query = query.lte('transaction_date', endDate);
        }

        const { data: transactions, error: txError } = await query;

        if (txError) {
            console.error('Error fetching cash transactions:', txError);
            throw txError;
        }

        // Calculate multi-currency cash balance
        let cashBalances: Record<string, number> = { USD: 0, EUR: 0, HUF: 0 };
        try {
            const { data: balanceData } = await supabase
                .rpc('get_portfolio_cash_balance_multi', { p_portfolio_id: portfolioId });

            if (balanceData && Array.isArray(balanceData)) {
                balanceData.forEach((row: any) => {
                    cashBalances[row.currency] = Number(row.balance) || 0;
                });
            }
        } catch (e) {
            console.error('Error getting multi-currency cash balance:', e);
        }

        // Fetch exchange rates to calculate normalized cashBalance
        const sets = ['USDEUR=X', 'USDHUF=X'];
        const ratesData = await getCachedBatchPrices(sets);
        const exchangeRates = {
            USD: 1,
            EUR: ratesData.get('USDEUR=X')?.currentPrice || 0.92,
            HUF: ratesData.get('USDHUF=X')?.currentPrice || 350,
        };

        // Calculate normalized cashBalance in USD
        let cashBalance = 0;
        for (const [curr, amount] of Object.entries(cashBalances)) {
            const rate = (exchangeRates as any)[curr] || 1;
            cashBalance += amount / rate;
        }

        // Get cash flow summary
        const { data: flowSummary, error: flowError } = await supabase
            .rpc('get_cash_flow_summary', {
                p_portfolio_id: portfolioId,
                p_start_date: startDate || null,
                p_end_date: endDate || null
            });

        if (flowError) {
            console.error('Error getting cash flow summary:', flowError);
        }

        // Calculate totals from flow summary
        const flowMap = new Map(
            (flowSummary || []).map((f: { transaction_type: string; total_amount: number }) =>
                [f.transaction_type, f.total_amount]
            )
        );

        const totalDeposits = Number(flowMap.get('DEPOSIT') || 0);
        const totalWithdrawals = Math.abs(Number(flowMap.get('WITHDRAWAL') || 0));
        const totalDividends = Number(flowMap.get('DIVIDEND') || 0);
        const totalFees = Math.abs(Number(flowMap.get('FEE') || 0)) + Math.abs(Number(flowMap.get('TAX') || 0));

        // For compatibility, return the USD balance as "cashBalance" or use a converter?
        // Let's return the dictionary as primary.
        return NextResponse.json({
            success: true,
            data: {
                cashBalance,
                cashBalances,
                totalDeposits,
                totalWithdrawals,
                totalDividends,
                totalFees,
                transactions: transactions || [],
                flowSummary: flowSummary || []
            }
        });

    } catch (error) {
        console.error('=== CASH API ERROR ===', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}

// POST - Create a new cash transaction
export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            portfolio_id,
            transaction_type,
            amount,
            currency = 'USD',
            ticker,
            description,
            transaction_date
        } = body;

        // Validation
        if (!portfolio_id) {
            return NextResponse.json({ success: false, error: 'Portfolio ID is required' }, { status: 400 });
        }
        if (!transaction_type) {
            return NextResponse.json({ success: false, error: 'Transaction type is required' }, { status: 400 });
        }
        if (amount === undefined || amount === null) {
            return NextResponse.json({ success: false, error: 'Amount is required' }, { status: 400 });
        }

        const validTypes: CashTransactionType[] = [
            'DEPOSIT', 'WITHDRAWAL', 'DIVIDEND', 'INTEREST', 'FEE', 'TAX', 'ADJUSTMENT'
        ];
        if (!validTypes.includes(transaction_type)) {
            return NextResponse.json({ success: false, error: 'Invalid transaction type' }, { status: 400 });
        }

        // Verify portfolio belongs to user
        const { data: portfolio, error: portfolioError } = await supabase
            .from('portfolios')
            .select('id')
            .eq('id', portfolio_id)
            .eq('user_id', user.id)
            .single();

        if (portfolioError || !portfolio) {
            return NextResponse.json({ success: false, error: 'Portfolio not found' }, { status: 404 });
        }

        // Normalize amount based on transaction type
        // Withdrawals, fees, and taxes should be stored as negative (outflows)
        let normalizedAmount = Number(amount);
        if (['WITHDRAWAL', 'FEE', 'TAX'].includes(transaction_type) && normalizedAmount > 0) {
            normalizedAmount = -normalizedAmount;
        }

        // Insert transaction
        const { data: transaction, error: insertError } = await supabase
            .from('cash_transactions')
            .insert({
                user_id: user.id,
                portfolio_id,
                transaction_type,
                amount: normalizedAmount,
                currency: currency as CurrencyCode,
                ticker: ticker?.toUpperCase() || null,
                description,
                transaction_date: transaction_date || new Date().toISOString()
            })
            .select()
            .single();

        if (insertError) {
            console.error('Error inserting cash transaction:', insertError);
            throw insertError;
        }

        // Get updated balance (multi-currency)
        let cashBalances: Record<string, number> = { USD: 0, EUR: 0, HUF: 0 };
        const { data: balanceData } = await supabase
            .rpc('get_portfolio_cash_balance_multi', { p_portfolio_id: portfolio_id });
        if (balanceData && Array.isArray(balanceData)) {
            balanceData.forEach((row: any) => {
                cashBalances[row.currency] = Number(row.balance) || 0;
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                transaction,
                cashBalances
            }
        });

    } catch (error) {
        console.error('=== CASH POST ERROR ===', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}

// PUT - Update a cash transaction
export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            id,
            transaction_type,
            amount,
            currency,
            ticker,
            description,
            transaction_date
        } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
        }

        // Build update object
        const updates: Partial<CashTransaction> = {};
        if (transaction_type !== undefined) updates.transaction_type = transaction_type;
        if (amount !== undefined) {
            let normalizedAmount = Number(amount);
            if (transaction_type && ['WITHDRAWAL', 'FEE', 'TAX'].includes(transaction_type) && normalizedAmount > 0) {
                normalizedAmount = -normalizedAmount;
            }
            updates.amount = normalizedAmount;
        }
        if (currency !== undefined) updates.currency = currency;
        if (ticker !== undefined) updates.ticker = ticker?.toUpperCase() || undefined;
        if (description !== undefined) updates.description = description;
        if (transaction_date !== undefined) updates.transaction_date = transaction_date;

        const { data: transaction, error: updateError } = await supabase
            .from('cash_transactions')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating cash transaction:', updateError);
            throw updateError;
        }

        if (!transaction) {
            return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
        }

        // Get updated balance (multi-currency)
        let cashBalances: Record<string, number> = { USD: 0, EUR: 0, HUF: 0 };
        const { data: balanceData } = await supabase
            .rpc('get_portfolio_cash_balance_multi', { p_portfolio_id: transaction.portfolio_id });
        if (balanceData && Array.isArray(balanceData)) {
            balanceData.forEach((row: any) => {
                cashBalances[row.currency] = Number(row.balance) || 0;
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                transaction,
                cashBalances
            }
        });

    } catch (error) {
        console.error('=== CASH PUT ERROR ===', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete a cash transaction
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Transaction ID is required' }, { status: 400 });
        }

        // Get portfolio_id before deleting for balance update
        const { data: existing } = await supabase
            .from('cash_transactions')
            .select('portfolio_id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (!existing) {
            return NextResponse.json({ success: false, error: 'Transaction not found' }, { status: 404 });
        }

        const { error: deleteError } = await supabase
            .from('cash_transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (deleteError) {
            console.error('Error deleting cash transaction:', deleteError);
            throw deleteError;
        }

        // Get updated balance (multi-currency)
        let cashBalances: Record<string, number> = { USD: 0, EUR: 0, HUF: 0 };
        const { data: balanceData } = await supabase
            .rpc('get_portfolio_cash_balance_multi', { p_portfolio_id: existing.portfolio_id });
        if (balanceData && Array.isArray(balanceData)) {
            balanceData.forEach((row: any) => {
                cashBalances[row.currency] = Number(row.balance) || 0;
            });
        }

        return NextResponse.json({
            success: true,
            data: {
                deleted: true,
                cashBalances
            }
        });

    } catch (error) {
        console.error('=== CASH DELETE ERROR ===', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            },
            { status: 500 }
        );
    }
}
