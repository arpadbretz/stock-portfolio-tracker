import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new (YahooFinance as any)();

// Map ticker to CIK (Central Index Key) using SEC API
async function getCIK(ticker: string): Promise<string | null> {
    try {
        const response = await fetch(
            `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${ticker}&type=&dateb=&owner=exclude&count=1&output=atom`,
            {
                headers: {
                    'User-Agent': 'StockTrackr contact@stocktrackr.eu',
                },
            }
        );

        const text = await response.text();
        const cikMatch = text.match(/CIK=(\d{10})/);
        return cikMatch ? cikMatch[1] : null;
    } catch (error) {
        console.error('Error fetching CIK:', error);
        return null;
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> }
) {
    const { symbol } = await params;

    if (!symbol) {
        return NextResponse.json({ error: 'Symbol required' }, { status: 400 });
    }

    try {
        const ticker = symbol.toUpperCase();

        // Get CIK for the ticker
        const cik = await getCIK(ticker);

        if (!cik) {
            return NextResponse.json({ error: 'CIK not found for symbol' }, { status: 404 });
        }

        // Fetch filings from SEC EDGAR
        const response = await fetch(
            `https://data.sec.gov/submissions/CIK${cik}.json`,
            {
                headers: {
                    'User-Agent': 'StockTrackr contact@stocktrackr.eu',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch SEC data');
        }

        const data = await response.json();
        const filings = data.filings?.recent || {};

        // Filter for important filing types
        const importantTypes = ['10-K', '10-Q', '8-K', 'DEF 14A', 'S-1', '13F-HR'];
        const recentFilings = [];

        for (let i = 0; i < (filings.form || []).length && recentFilings.length < 20; i++) {
            const form = filings.form[i];
            if (importantTypes.includes(form)) {
                recentFilings.push({
                    form: form,
                    filingDate: filings.filingDate[i],
                    reportDate: filings.reportDate[i],
                    accessionNumber: filings.accessionNumber[i],
                    primaryDocument: filings.primaryDocument[i],
                    description: filings.primaryDocDescription[i],
                    url: `https://www.sec.gov/cgi-bin/viewer?action=view&cik=${cik}&accession_number=${filings.accessionNumber[i].replace(/-/g, '')}&xbrl_type=v`,
                });
            }
        }

        return NextResponse.json({
            symbol: ticker,
            cik: cik,
            companyName: data.name,
            filings: recentFilings,
        });
    } catch (error) {
        console.error(`Error fetching SEC filings for ${symbol}:`, error);
        return NextResponse.json({ error: 'Failed to fetch SEC filings' }, { status: 500 });
    }
}
