import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // Destructure all expected fields, including portfolioId
        const {
            portfolioId,
            ticker,
            action,
            quantity,
            pricePerShare,
            fees = 0,
            notes = '',
            dateTraded = new Date().toISOString(),
            skipCashTransaction = false  // Allow opting out for imports
        } = body;

        // --- VALIDATION ---

        if (!portfolioId || typeof portfolioId !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Portfolio ID is required' },
                { status: 400 }
            );
        }

        if (!ticker || typeof ticker !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Ticker is required' },
                { status: 400 }
            );
        }

        if (!action || !['BUY', 'SELL'].includes(action)) {
            return NextResponse.json(
                { success: false, error: 'Action must be BUY or SELL' },
                { status: 400 }
            );
        }

        if (typeof quantity !== 'number' || quantity <= 0) {
            return NextResponse.json(
                { success: false, error: 'Quantity must be a positive number' },
                { status: 400 }
            );
        }

        if (typeof pricePerShare !== 'number' || pricePerShare <= 0) {
            return NextResponse.json(
                { success: false, error: 'Price per share must be a positive number' },
                { status: 400 }
            );
        }

        // --- CALCULATE TOTALS ---
        const grossAmount = quantity * pricePerShare;
        const totalCost = grossAmount + fees;

        // --- CREATE CASH TRANSACTION (BUY = withdrawal, SELL = deposit) ---
        let cashTransactionId: string | null = null;

        if (!skipCashTransaction) {
            const cashTransactionType = action === 'BUY' ? 'WITHDRAWAL' : 'DEPOSIT';
            // For BUY: we withdraw the total cost (price + fees)
            // For SELL: we deposit the net proceeds (price - fees)
            const cashAmount = action === 'BUY' ? totalCost : (grossAmount - fees);

            const { data: cashTx, error: cashError } = await supabase
                .from('cash_transactions')
                .insert({
                    user_id: user.id,
                    portfolio_id: portfolioId,
                    transaction_type: cashTransactionType,
                    amount: cashAmount,
                    currency: 'USD',
                    ticker: ticker.toUpperCase(),
                    description: `${action} ${quantity} shares of ${ticker.toUpperCase()} @ $${pricePerShare.toFixed(2)}`,
                    transaction_date: dateTraded
                })
                .select('id')
                .single();

            if (cashError) {
                console.warn('Failed to create cash transaction (table may not exist):', cashError.message);
                // Don't fail the trade if cash tracking isn't set up yet
            } else if (cashTx) {
                cashTransactionId = cashTx.id;
            }

            // --- TRACK FEES AS SEPARATE TRANSACTION ---
            if (fees > 0) {
                const { error: feeError } = await supabase
                    .from('cash_transactions')
                    .insert({
                        user_id: user.id,
                        portfolio_id: portfolioId,
                        transaction_type: 'FEE',
                        amount: -Math.abs(fees),
                        currency: 'USD',
                        ticker: ticker.toUpperCase(),
                        description: `Trading fee for ${action} ${ticker.toUpperCase()}`,
                        transaction_date: dateTraded
                    });

                if (feeError) {
                    console.warn('Failed to record fee:', feeError.message);
                }
            }
        }

        // --- INSERT THE TRADE ---
        const { data: trade, error } = await supabase
            .from('trades')
            .insert({
                portfolio_id: portfolioId,
                ticker: ticker.toUpperCase(),
                action,
                quantity,
                price_per_share: pricePerShare,
                fees,
                total_cost: totalCost,
                notes,
                date_traded: dateTraded,
                user_id: user.id,
                cash_transaction_id: cashTransactionId
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insertion error:', error);
            // Rollback cash transaction if trade fails
            if (cashTransactionId) {
                await supabase.from('cash_transactions').delete().eq('id', cashTransactionId);
            }
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        // --- TRACK REALIZED P/L FOR SELL TRADES ---
        let realizedPnl = null;
        if (action === 'SELL') {
            try {
                // Calculate cost basis using FIFO
                const { data: costBasisData } = await supabase
                    .rpc('calculate_cost_basis_fifo', {
                        p_portfolio_id: portfolioId,
                        p_ticker: ticker.toUpperCase(),
                        p_sell_quantity: quantity
                    });

                if (costBasisData && costBasisData.length > 0) {
                    const { total_cost_basis, avg_cost_per_share } = costBasisData[0];
                    const saleProceeds = grossAmount;
                    const realizedGain = saleProceeds - total_cost_basis;
                    const realizedGainPercent = total_cost_basis > 0
                        ? ((saleProceeds - total_cost_basis) / total_cost_basis) * 100
                        : 0;

                    // Get the first buy date for holding period calculation
                    const { data: firstBuy } = await supabase
                        .from('trades')
                        .select('date_traded')
                        .eq('portfolio_id', portfolioId)
                        .eq('ticker', ticker.toUpperCase())
                        .eq('action', 'BUY')
                        .order('date_traded', { ascending: true })
                        .limit(1)
                        .single();

                    const holdingPeriodDays = firstBuy?.date_traded
                        ? Math.floor((new Date(dateTraded).getTime() - new Date(firstBuy.date_traded).getTime()) / (1000 * 60 * 60 * 24))
                        : null;

                    // Insert realized P/L record
                    const { data: pnlRecord, error: pnlError } = await supabase
                        .from('realized_pnl')
                        .insert({
                            user_id: user.id,
                            portfolio_id: portfolioId,
                            trade_id: trade.id,
                            ticker: ticker.toUpperCase(),
                            quantity,
                            cost_basis: avg_cost_per_share || 0,
                            sale_price: pricePerShare,
                            realized_gain: realizedGain,
                            realized_gain_percent: realizedGainPercent,
                            holding_period_days: holdingPeriodDays,
                            closed_at: dateTraded
                        })
                        .select()
                        .single();

                    if (pnlError) {
                        console.warn('Failed to record realized P/L (table may not exist):', pnlError.message);
                    } else {
                        realizedPnl = pnlRecord;
                    }
                }
            } catch (pnlErr) {
                console.warn('Realized P/L calculation skipped:', pnlErr);
            }
        }

        // Trigger portfolio history sync in the background (fire and forget)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `http://${request.headers.get('host')}`;
        fetch(`${baseUrl}/api/cron/sync-history?portfolioId=${portfolioId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET}`
            }
        }).catch(err => console.error('Failed to trigger background sync:', err));

        console.log('Trade inserted successfully:', trade);

        return NextResponse.json({
            success: true,
            data: {
                trade,
                cashTransactionId,
                realizedPnl
            },
        });

    } catch (error) {
        console.error('Error adding trade:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
            },
            { status: 500 }
        );
    }
}