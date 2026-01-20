import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HealthCheck {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    checks: {
        database: { status: 'ok' | 'error'; latency?: number; error?: string };
        api: { status: 'ok' };
    };
}

const startTime = Date.now();

export async function GET() {
    const health: HealthCheck = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        checks: {
            database: { status: 'ok' },
            api: { status: 'ok' },
        },
    };

    // Check database connectivity
    try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            health.checks.database = { status: 'error', error: 'Missing configuration' };
            health.status = 'degraded';
        } else {
            const supabase = createClient(supabaseUrl, supabaseKey);
            const dbStart = Date.now();

            // Simple query to check connection
            const { error } = await supabase.from('portfolios').select('count', { count: 'exact', head: true });

            const latency = Date.now() - dbStart;

            if (error) {
                health.checks.database = { status: 'error', error: error.message };
                health.status = 'degraded';
            } else {
                health.checks.database = { status: 'ok', latency };
            }
        }
    } catch (err) {
        health.checks.database = { status: 'error', error: err instanceof Error ? err.message : 'Unknown error' };
        health.status = 'unhealthy';
    }

    // Return appropriate status code
    const statusCode = health.status === 'healthy' ? 200 : health.status === 'degraded' ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
}
