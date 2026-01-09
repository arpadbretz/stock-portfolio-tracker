// API Route: POST /api/trades - Add a new trade

import { NextRequest, NextResponse } from 'next/server';
import { addTrade } from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate required fields
        const { ticker, action, quantity, pricePerShare, fees = 0, notes = '' } = body;

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

        // Add the trade to Google Sheets
        const trade = await addTrade({
            ticker: ticker.toUpperCase(),
            action,
            quantity,
            pricePerShare,
            fees: fees || 0,
            notes: notes || '',
        });

        return NextResponse.json({
            success: true,
            data: trade,
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
