
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import YahooFinance from 'npm:yahoo-finance2@2.13.2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log("Stock Search function started");

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const query = url.searchParams.get('q')

        if (!query || query.length < 1) {
            return new Response(JSON.stringify({ results: [] }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
        }

        // Yahoo Finance Search
        const results = await YahooFinance.search(query, {
            quotesCount: 10,
            newsCount: 0,
        });

        const quotes = results.quotes
            .filter((q: any) => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
            .map((q: any) => ({
                symbol: q.symbol,
                name: q.shortname || q.longname || q.symbol,
                exchange: q.exchDisp || q.exchange,
                type: q.quoteType,
            }))
            .slice(0, 8);

        return new Response(JSON.stringify({ results: quotes }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error: any) {
        console.error('Search error:', error);
        return new Response(JSON.stringify({ results: [], error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
