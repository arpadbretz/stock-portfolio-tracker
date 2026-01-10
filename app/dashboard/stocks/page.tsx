'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    TrendingUp,
    ArrowRight,
    Sparkles,
    Building2,
    BarChart3,
    Globe,
    Zap,
} from 'lucide-react';

interface SearchResult {
    symbol: string;
    name: string;
    exchange: string;
    type: string;
}

const POPULAR_STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Cyclical' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
    { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial' },
];

export default function StockSearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchStocks = async () => {
            if (query.length < 1) {
                setResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setResults(data.results || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(searchStocks, 300);
        return () => clearTimeout(debounce);
    }, [query]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/dashboard/ticker/${query.trim().toUpperCase()}`);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1),transparent_50%)]" />

                <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full mb-6">
                            <Sparkles size={14} className="text-primary" />
                            <span className="text-xs font-black uppercase tracking-widest text-primary">Stock Intelligence</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
                            Research Any Stock
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Access real-time pricing, financial data, and institutional-grade analytics for thousands of stocks worldwide.
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        ref={searchRef}
                        className="relative max-w-2xl mx-auto"
                    >
                        <form onSubmit={handleSubmit}>
                            <div className="relative">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground" size={24} />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => {
                                        setQuery(e.target.value);
                                        setShowResults(true);
                                    }}
                                    onFocus={() => setShowResults(true)}
                                    placeholder="Search by ticker or company name..."
                                    className="w-full pl-16 pr-6 py-6 bg-card border-2 border-border rounded-[32px] text-lg font-bold focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all shadow-2xl shadow-black/10"
                                />
                                {isSearching && (
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        </form>

                        {/* Search Results Dropdown */}
                        <AnimatePresence>
                            {showResults && results.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                    className="absolute top-full left-0 right-0 mt-4 bg-card border border-border rounded-[32px] shadow-2xl overflow-hidden z-50"
                                >
                                    {results.map((result, i) => (
                                        <Link
                                            key={result.symbol}
                                            href={`/dashboard/ticker/${result.symbol}`}
                                            className="flex items-center justify-between p-5 hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0 group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center font-black text-primary text-sm">
                                                    {result.symbol.slice(0, 3)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-foreground group-hover:text-primary transition-colors">
                                                        {result.symbol}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                                        {result.name}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                                    {result.exchange}
                                                </span>
                                                <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </Link>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            {/* Popular Stocks Grid */}
            <div className="max-w-6xl mx-auto px-6 pb-20">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-1.5 h-8 bg-primary rounded-full" />
                    <h2 className="text-2xl font-black tracking-tight">Popular Stocks</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {POPULAR_STOCKS.map((stock, i) => (
                        <motion.div
                            key={stock.symbol}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link
                                href={`/dashboard/ticker/${stock.symbol}`}
                                className="block p-6 bg-card border border-border rounded-[28px] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center font-black text-primary text-sm group-hover:bg-primary/20 transition-colors">
                                        {stock.symbol.slice(0, 2)}
                                    </div>
                                    <TrendingUp size={16} className="text-emerald-500" />
                                </div>
                                <h3 className="font-black text-lg mb-1 group-hover:text-primary transition-colors">{stock.symbol}</h3>
                                <p className="text-sm text-muted-foreground truncate">{stock.name}</p>
                                <div className="mt-4 pt-4 border-t border-border/50">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        {stock.sector}
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-muted/30 border-t border-border">
                <div className="max-w-6xl mx-auto px-6 py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black tracking-tight mb-4">Institutional-Grade Research</h2>
                        <p className="text-muted-foreground max-w-xl mx-auto">
                            Access the same data institutional investors use to make decisions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-8 bg-card border border-border rounded-[32px]">
                            <div className="p-3 bg-primary/10 rounded-2xl w-fit mb-6">
                                <BarChart3 className="text-primary" size={24} />
                            </div>
                            <h3 className="font-black text-lg mb-2">Financial Metrics</h3>
                            <p className="text-muted-foreground text-sm">
                                P/E ratios, profit margins, debt levels, and growth rates at a glance.
                            </p>
                        </div>

                        <div className="p-8 bg-card border border-border rounded-[32px]">
                            <div className="p-3 bg-accent/10 rounded-2xl w-fit mb-6">
                                <Building2 className="text-accent" size={24} />
                            </div>
                            <h3 className="font-black text-lg mb-2">Company Profiles</h3>
                            <p className="text-muted-foreground text-sm">
                                Sector, industry, employee count, and detailed business descriptions.
                            </p>
                        </div>

                        <div className="p-8 bg-card border border-border rounded-[32px]">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl w-fit mb-6">
                                <Globe className="text-emerald-500" size={24} />
                            </div>
                            <h3 className="font-black text-lg mb-2">Global Coverage</h3>
                            <p className="text-muted-foreground text-sm">
                                Search stocks from major exchanges worldwide including NYSE, NASDAQ, and more.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
