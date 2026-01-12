'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, Minus, ExternalLink, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

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

// Specific industries (sub-sectors)
const INDUSTRY_PEERS: Record<string, string[]> = {
    'Semiconductors': ['NVDA', 'TSM', 'AVGO', 'AMD', 'INTC', 'QCOM', 'TXN', 'MU', 'AMAT', 'LRCX'],
    'Software—Infrastructure': ['MSFT', 'ADBE', 'CRM', 'NOW', 'INTU', 'SNOW', 'PLTR', 'DDOG', 'ZS'],
    'Software—Application': ['MSFT', 'ADBE', 'CRM', 'NOW', 'INTU', 'SNOW', 'PLTR', 'DDOG', 'ZS'],
    'Biotechnology': ['VRTX', 'REGN', 'AMGN', 'GILD', 'MRNA', 'BIIB', 'ILMN', 'ALNY', 'BNTX'],
    'Banks—Diversified': ['JPM', 'BAC', 'WFC', 'C', 'HSBC', 'RY', 'TD', 'USB', 'PNC', 'TFC'],
    'Banks—Regional': ['JPM', 'BAC', 'WFC', 'C', 'USB', 'PNC', 'TFC', 'FITB', 'KEY'],
    'Auto Manufacturers': ['TSLA', 'TM', 'F', 'GM', 'STLA', 'HMC', 'RIVN', 'LCID', 'NIO', 'LI'],
    'Aerospace & Defense': ['RTX', 'LMT', 'BA', 'NOC', 'GD', 'LHX', 'TDG', 'HII', 'TXT'],
    'Specialty Retail': ['AMZN', 'WMT', 'COST', 'HD', 'TGT', 'LOW', 'TJX', 'ROST', 'DLTR', 'DG'],
    'Discount Stores': ['WMT', 'COST', 'TGT', 'DG', 'DLTR', 'BJ', 'OLLI'],
    'Travel Services': ['BKNG', 'ABNB', 'EXPE', 'TCOM', 'TRIP'],
    'Airlines': ['DAL', 'UAL', 'LUV', 'AAL', 'JBLU', 'ALK', 'SAVE'],
    'Lodging': ['MAR', 'HLT', 'H', 'WH', 'IHG', 'CHH'],
    'Credit Services': ['V', 'MA', 'AXP', 'PYPL', 'SQ', 'FIS', 'FISV', 'GPN', 'AFRM'],
    'Copper': ['BHP', 'RIO', 'FCX', 'SCCO', 'TECK'],
    'Gold': ['NEM', 'GOLD', 'AEM', 'WPM', 'FNV'],
    'Steel': ['AA', 'CLF', 'X', 'NUE', 'STLD'],
    'Restaurants': ['MCD', 'SBUX', 'CMG', 'YUM', 'DRI', 'DARDEN', 'WING'],
    'Internet Retail': ['AMZN', 'BABA', 'JD', 'PDD', 'MELI', 'SE', 'SHOP'],
    'Drug Manufacturers': ['LLY', 'JNJ', 'MRK', 'ABBV', 'PFE', 'NVS', 'AZN', 'BMY'],
    'Medical Devices': ['ABT', 'MDT', 'SYK', 'BSX', 'ISRG', 'EW', 'BDX'],
    'Insurance—Diversified': ['BRK.B', 'UNH', 'AIG', 'MET', 'PRU', 'AFL'],
    'Asset Management': ['BLK', 'BX', 'KKR', 'APO', 'CG', 'ARES'],
    'Oil & Gas Integrated': ['XOM', 'CVX', 'SHEL', 'TTE', 'BP', 'COP'],
    'Oil & Gas E&P': ['COP', 'EOG', 'PXD', 'DVN', 'OXY', 'FANG'],
    'Solar': ['ENPH', 'FSLR', 'SEDG', 'RUN', 'SPWR', 'JKS'],
    'Utilities—Renewable': ['NEE', 'AES', 'CWEN', 'HASI', 'BEPC'],
};

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
    const [peers, setPeers] = useState<PeerStock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPeers = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Try industry-specific peers first, then fall back to sector
                let peerSymbols = INDUSTRY_PEERS[industry] || SECTOR_PEERS[sector] || SECTOR_PEERS['Technology'];

                // Filter out the current symbol and take top 6
                const filteredPeers = peerSymbols.filter(s => s !== symbol).slice(0, 6);

                // Fetch quotes for all peers in parallel
                const peerPromises = filteredPeers.map(async (peerSymbol) => {
                    try {
                        const res = await fetch(`/api/stock/${peerSymbol}`);
                        if (res.ok) {
                            const data = await res.json();
                            if (data.success) {
                                return {
                                    symbol: peerSymbol,
                                    name: data.data.name || peerSymbol,
                                    price: data.data.price || 0,
                                    changePercent: data.data.changePercent || 0,
                                    marketCap: data.data.marketCap || 0,
                                    pe: data.data.trailingPE || null,
                                    revenue: null,
                                };
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to fetch peer ${peerSymbol}:`, e);
                    }
                    return null;
                });

                const results = await Promise.all(peerPromises);
                const peerData = results.filter((p): p is NonNullable<typeof p> => p !== null);

                setPeers(peerData);
            } catch (e) {
                console.error('Failed to fetch peers:', e);
                setError('Failed to load peer comparison');
            } finally {
                setIsLoading(false);
            }
        };

        if (sector || industry) {
            fetchPeers();
        }
    }, [symbol, sector, industry]);

    if (!sector) {
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
                        <h3 className="font-black text-lg">Peer Comparison</h3>
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
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="animate-spin text-primary" size={32} />
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>{error}</p>
                        </div>
                    ) : peers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No peer data available for this sector</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-widest">
                                        <th className="pb-4 font-bold">Company</th>
                                        <th className="pb-4 font-bold text-right">Price</th>
                                        <th className="pb-4 font-bold text-right">Change</th>
                                        <th className="pb-4 font-bold text-right">Market Cap</th>
                                        <th className="pb-4 font-bold text-right">P/E</th>
                                        <th className="pb-4 font-bold text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {/* Current Stock Row (highlighted) */}
                                    <tr className="bg-primary/5">
                                        <td className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black text-xs">
                                                    {symbol.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-sm">{symbol}</div>
                                                    <div className="text-[10px] text-muted-foreground">Current</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 text-right font-bold">
                                            ${currentPrice.toFixed(2)}
                                        </td>
                                        <td className="py-4 text-right">-</td>
                                        <td className="py-4 text-right font-bold">
                                            {formatMarketCap(currentMarketCap)}
                                        </td>
                                        <td className="py-4 text-right font-bold">
                                            {currentPE ? currentPE.toFixed(1) : '-'}
                                        </td>
                                        <td className="py-4 text-right">-</td>
                                    </tr>

                                    {/* Peer Rows */}
                                    {peers.map((peer) => {
                                        const isPositive = peer.changePercent >= 0;

                                        return (
                                            <tr key={peer.symbol} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-4">
                                                    <Link href={`/dashboard/ticker/${peer.symbol}`} className="flex items-center gap-3 group">
                                                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-black text-xs group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                                            {peer.symbol.slice(0, 2)}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-sm group-hover:text-primary transition-colors">{peer.symbol}</div>
                                                            <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{peer.name}</div>
                                                        </div>
                                                    </Link>
                                                </td>
                                                <td className="py-4 text-right font-bold">
                                                    ${peer.price.toFixed(2)}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <span className={`inline-flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        <span className="font-bold text-sm">
                                                            {isPositive ? '+' : ''}{peer.changePercent.toFixed(2)}%
                                                        </span>
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right text-sm font-bold">
                                                    {formatMarketCap(peer.marketCap)}
                                                </td>
                                                <td className="py-4 text-right text-sm">
                                                    {peer.pe ? peer.pe.toFixed(1) : '-'}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <Link
                                                        href={`/dashboard/ticker/${peer.symbol}`}
                                                        className="p-2 hover:bg-primary/10 rounded-lg transition-colors inline-flex"
                                                    >
                                                        <ExternalLink size={14} className="text-muted-foreground" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Average Comparison */}
                    {peers.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-border">
                            <h4 className="text-sm font-bold text-muted-foreground mb-4">Sector Averages</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-muted/30 rounded-xl p-4 text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Avg P/E</div>
                                    <div className="font-black text-lg">
                                        {(peers.filter(p => p.pe).reduce((acc, p) => acc + (p.pe || 0), 0) / peers.filter(p => p.pe).length || 0).toFixed(1)}
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-xl p-4 text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Your P/E</div>
                                    <div className={`font-black text-lg ${currentPE && currentPE < (peers.filter(p => p.pe).reduce((acc, p) => acc + (p.pe || 0), 0) / peers.filter(p => p.pe).length || 0) ? 'text-emerald-500' : ''}`}>
                                        {currentPE?.toFixed(1) || '-'}
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-xl p-4 text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Avg Change</div>
                                    <div className={`font-black text-lg ${(peers.reduce((acc, p) => acc + p.changePercent, 0) / peers.length) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {(peers.reduce((acc, p) => acc + p.changePercent, 0) / peers.length).toFixed(2)}%
                                    </div>
                                </div>
                                <div className="bg-muted/30 rounded-xl p-4 text-center">
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Peers</div>
                                    <div className="font-black text-lg">{peers.length}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
