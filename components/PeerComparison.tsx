'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

interface PeerStock {
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
    marketCap: number;
    pe: number | null;
    revenue: number | null;
}

interface PeerComparisonProps {
    symbol: string;
    sector: string;
    industry: string;
    currentPrice: number;
    currentPE: number | null;
    currentMarketCap: number;
}

// Comprehensive peer data by sector, industry, and theme
const SECTOR_PEERS: Record<string, string[]> = {
    // --- MAJOR SECTORS (Standard 11) ---
    'Technology': ['AAPL', 'MSFT', 'NVDA', 'AVGO', 'ORCL', 'CSCO', 'ACN'],
    'Consumer Cyclical': ['AMZN', 'TSLA', 'HD', 'MCD', 'NKE', 'LOW', 'BKNG'],
    'Healthcare': ['LLY', 'UNH', 'JNJ', 'MRK', 'ABBV', 'TMO', 'PFE'],
    'Financial Services': ['BRK.B', 'JPM', 'V', 'MA', 'BAC', 'MS', 'GS'],
    'Communication Services': ['GOOGL', 'META', 'NFLX', 'DIS', 'TMUS', 'CMCSA'],
    'Consumer Defensive': ['WMT', 'PG', 'COST', 'KO', 'PEP', 'PM', 'EL'],
    'Energy': ['XOM', 'CVX', 'SHEL', 'TTE', 'COP', 'BP', 'SLB'],
    'Industrials': ['CAT', 'UNP', 'GE', 'HON', 'UPS', 'DE', 'RTX'],
    'Basic Materials': ['LIN', 'BHP', 'RIO', 'SHW', 'FCX', 'SCCO', 'APD'],
    'Utilities': ['NEE', 'SO', 'DUK', 'SRE', 'AEP', 'D', 'PEG'],
    'Real Estate': ['PLD', 'AMT', 'EQIX', 'CCI', 'PSA', 'O', 'SPG'],
};

// Specific industries (sub-sectors) - includes Yahoo Finance industry names
const INDUSTRY_PEERS: Record<string, string[]> = {
    // Technology
    'Semiconductors': ['NVDA', 'TSM', 'AVGO', 'AMD', 'INTC', 'QCOM', 'TXN', 'MU', 'AMAT', 'LRCX'],
    'Semiconductor Equipment & Materials': ['AMAT', 'LRCX', 'KLAC', 'ASML', 'TER'],
    'Software—Infrastructure': ['MSFT', 'ADBE', 'CRM', 'NOW', 'INTU', 'SNOW', 'PLTR', 'DDOG', 'ZS'],
    'Software—Application': ['MSFT', 'ADBE', 'CRM', 'NOW', 'INTU', 'SNOW', 'PLTR', 'DDOG', 'ZS'],
    'Software - Infrastructure': ['MSFT', 'ADBE', 'CRM', 'NOW', 'INTU', 'SNOW', 'DDOG'],
    'Software - Application': ['MSFT', 'ADBE', 'CRM', 'NOW', 'INTU', 'PLTR'],
    'Information Technology Services': ['ACN', 'IBM', 'CTSH', 'INFY', 'WIT'],

    // Consumer Electronics (Apple's actual industry)
    'Consumer Electronics': ['AAPL', 'SONY', 'DELL', 'HPQ', 'LOGI', 'GPRO', 'SONO'],
    'Electronic Components': ['APH', 'TEL', 'GLW', 'JBL', 'FLEX'],
    'Computer Hardware': ['AAPL', 'DELL', 'HPQ', 'HPE', 'LOGI', 'NTAP', 'WDC'],

    // Healthcare/Pharma
    'Biotechnology': ['VRTX', 'REGN', 'AMGN', 'GILD', 'MRNA', 'BIIB', 'ILMN', 'ALNY', 'BNTX'],
    'Drug Manufacturers—General': ['LLY', 'JNJ', 'MRK', 'ABBV', 'PFE', 'NVS', 'AZN', 'BMY'],
    'Drug Manufacturers - Major': ['LLY', 'JNJ', 'MRK', 'ABBV', 'PFE', 'NVS', 'AZN'],
    'Drug Manufacturers—Specialty & Generic': ['TEVA', 'VTRS', 'PRGO', 'JAZZ'],
    'Medical Devices': ['ABT', 'MDT', 'SYK', 'BSX', 'ISRG', 'EW', 'BDX'],
    'Medical Instruments & Supplies': ['ABT', 'SYK', 'BSX', 'ISRG', 'EW'],
    'Diagnostics & Research': ['TMO', 'DHR', 'A', 'ILMN', 'PKI'],

    // Financial
    'Banks—Diversified': ['JPM', 'BAC', 'WFC', 'C', 'HSBC', 'RY', 'TD', 'USB', 'PNC', 'TFC'],
    'Banks - Diversified': ['JPM', 'BAC', 'WFC', 'C', 'HSBC'],
    'Banks—Regional': ['JPM', 'BAC', 'WFC', 'C', 'USB', 'PNC', 'TFC', 'FITB', 'KEY'],
    'Banks - Regional': ['USB', 'PNC', 'TFC', 'FITB', 'KEY', 'MTB'],
    'Credit Services': ['V', 'MA', 'AXP', 'PYPL', 'SQ', 'FIS', 'FISV', 'GPN', 'AFRM'],
    'Insurance—Life': ['MET', 'PRU', 'AFL', 'LNC', 'PFG'],
    'Insurance - Life': ['MET', 'PRU', 'AFL', 'LNC'],
    'Insurance—Diversified': ['BRK.B', 'UNH', 'AIG', 'MET', 'PRU', 'AFL'],
    'Asset Management': ['BLK', 'BX', 'KKR', 'APO', 'CG', 'ARES'],
    'Capital Markets': ['GS', 'MS', 'SCHW', 'BLK', 'CME'],

    // Automotive
    'Auto Manufacturers': ['TSLA', 'TM', 'F', 'GM', 'STLA', 'HMC', 'RIVN', 'LCID', 'NIO', 'LI'],
    'Automobiles': ['TSLA', 'TM', 'F', 'GM', 'STLA', 'HMC'],
    'Auto Parts': ['APTV', 'BWA', 'LEA', 'VC', 'ALV'],

    // Retail & Consumer
    'Internet Retail': ['AMZN', 'BABA', 'JD', 'PDD', 'MELI', 'SE', 'SHOP', 'EBAY'],
    'Specialty Retail': ['AMZN', 'HD', 'TJX', 'ROST', 'ORLY', 'AZO', 'ULTA'],
    'Discount Stores': ['WMT', 'COST', 'TGT', 'DG', 'DLTR', 'BJ'],
    'Home Improvement Retail': ['HD', 'LOW', 'FND', 'TSCO'],
    'Restaurants': ['MCD', 'SBUX', 'CMG', 'YUM', 'DRI', 'QSR', 'WING'],
    'Apparel Retail': ['TJX', 'ROST', 'GPS', 'ANF', 'AEO'],
    'Footwear & Accessories': ['NKE', 'LULU', 'DECK', 'CROX', 'SKX'],

    // Industrial
    'Aerospace & Defense': ['RTX', 'LMT', 'BA', 'NOC', 'GD', 'LHX', 'TDG', 'HII'],
    'Airlines': ['DAL', 'UAL', 'LUV', 'AAL', 'JBLU', 'ALK'],
    'Railroads': ['UNP', 'CSX', 'NSC', 'CP', 'CNI'],
    'Industrial Conglomerates': ['HON', 'MMM', 'GE', 'ITW', 'EMR'],
    'Farm & Heavy Construction Machinery': ['CAT', 'DE', 'AGCO', 'CNHI'],

    // Energy
    'Oil & Gas Integrated': ['XOM', 'CVX', 'SHEL', 'TTE', 'BP', 'COP'],
    'Oil & Gas E&P': ['COP', 'EOG', 'PXD', 'DVN', 'OXY', 'FANG'],
    'Oil & Gas Refining & Marketing': ['MPC', 'VLO', 'PSX'],

    // Communication/Media
    'Internet Content & Information': ['GOOGL', 'META', 'SNAP', 'PINS', 'TWTR'],
    'Entertainment': ['NFLX', 'DIS', 'WBD', 'PARA', 'LYV'],
    'Broadcasting': ['CMCSA', 'FOXA', 'NXST', 'SBGI'],
    'Telecom Services': ['T', 'VZ', 'TMUS', 'LUMN'],

    // Materials & Mining
    'Copper': ['BHP', 'RIO', 'FCX', 'SCCO', 'TECK'],
    'Gold': ['NEM', 'GOLD', 'AEM', 'WPM', 'FNV'],
    'Steel': ['NUE', 'CLF', 'X', 'STLD', 'RS'],
    'Specialty Chemicals': ['SHW', 'APD', 'ECL', 'PPG', 'DD'],

    // Real Estate
    'REIT—Diversified': ['PLD', 'AMT', 'EQIX', 'CCI', 'PSA'],
    'REIT - Diversified': ['PLD', 'AMT', 'EQIX', 'CCI'],
    'REIT—Retail': ['SPG', 'O', 'REG', 'KIM'],

    // Travel & Leisure
    'Travel Services': ['BKNG', 'ABNB', 'EXPE', 'TCOM', 'TRIP'],
    'Lodging': ['MAR', 'HLT', 'H', 'WH', 'IHG'],
    'Resorts & Casinos': ['LVS', 'WYNN', 'MGM', 'CZR'],

    // Utilities
    'Utilities—Regulated Electric': ['NEE', 'DUK', 'SO', 'D', 'AEP'],
    'Utilities - Regulated Electric': ['NEE', 'SO', 'DUK', 'D'],
    'Utilities—Renewable': ['NEE', 'AES', 'CWEN', 'HASI', 'BEPC'],
    'Solar': ['ENPH', 'FSLR', 'SEDG', 'RUN', 'JKS'],
};

// Function to find best matching peers
function findPeers(industry: string, sector: string): string[] {
    // Direct match
    if (INDUSTRY_PEERS[industry]) {
        return INDUSTRY_PEERS[industry];
    }

    // Try partial match on industry (case-insensitive)
    const industryLower = industry.toLowerCase();
    for (const [key, peers] of Object.entries(INDUSTRY_PEERS)) {
        if (key.toLowerCase().includes(industryLower) || industryLower.includes(key.toLowerCase())) {
            return peers;
        }
    }

    // Try keyword matching
    const keywords = industryLower.split(/[\s\-—]+/);
    for (const keyword of keywords) {
        if (keyword.length < 4) continue;
        for (const [key, peers] of Object.entries(INDUSTRY_PEERS)) {
            if (key.toLowerCase().includes(keyword)) {
                return peers;
            }
        }
    }

    // Fall back to sector
    if (SECTOR_PEERS[sector]) {
        return SECTOR_PEERS[sector];
    }

    // Ultimate fallback
    return SECTOR_PEERS['Technology'];
}

function formatMarketCap(value: number): string {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(0)}`;
}

export default function PeerComparison({
    symbol,
    sector,
    industry,
    currentPrice,
    currentPE,
    currentMarketCap
}: PeerComparisonProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    // Get peers statically from our mapping
    const peerSymbols = findPeers(industry, sector).filter(s => s !== symbol).slice(0, 8);

    if (!sector || peerSymbols.length === 0) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-[32px] overflow-hidden"
        >
            {/* Header */}
            <div
                className="p-6 border-b border-border flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                        <Users className="text-blue-400" size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-lg">Similar Stocks</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            {sector} • {industry}
                        </p>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp size={20} className="text-muted-foreground" />
                ) : (
                    <ChevronDown size={20} className="text-muted-foreground" />
                )}
            </div>

            {isExpanded && (
                <div className="p-6">
                    <p className="text-sm text-muted-foreground mb-6">
                        Compare {symbol} with other stocks in the {industry} industry:
                    </p>

                    {/* Peer Grid - Static Links */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {peerSymbols.map((peerSymbol) => (
                            <Link
                                key={peerSymbol}
                                href={`/dashboard/ticker/${peerSymbol}`}
                                className="group p-4 bg-muted/30 hover:bg-primary/10 border border-border hover:border-primary/30 rounded-2xl transition-all text-center"
                            >
                                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-muted group-hover:bg-primary/20 flex items-center justify-center text-muted-foreground group-hover:text-primary font-black text-sm transition-colors">
                                    {peerSymbol.slice(0, 2)}
                                </div>
                                <div className="font-bold text-sm group-hover:text-primary transition-colors">
                                    {peerSymbol}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
                                    <ExternalLink size={10} />
                                    View
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Current Stock Highlight */}
                    <div className="mt-6 pt-6 border-t border-border">
                        <div className="flex items-center justify-between bg-primary/5 rounded-2xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black">
                                    {symbol.slice(0, 2)}
                                </div>
                                <div>
                                    <div className="font-black">{symbol}</div>
                                    <div className="text-xs text-muted-foreground">Current Stock</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-black text-lg">${currentPrice.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                    P/E: {currentPE ? currentPE.toFixed(1) : 'N/A'} • {formatMarketCap(currentMarketCap)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
}

