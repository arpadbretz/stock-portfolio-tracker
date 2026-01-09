'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { PortfolioSummary, CurrencyCode, Trade } from '@/types/portfolio';
import {
    convertCurrency,
    formatCurrency,
    formatPercentage
} from '@/lib/portfolio';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    BarChart3,
    Clock,
    LayoutDashboard,
    AlertOctagon,
    ArrowRight,
    Globe,
    Zap
} from 'lucide-react';
import HoldingsTable from '@/components/HoldingsTable';
import PerformanceChart from '@/components/PerformanceChart';
import SectorAllocationChart from '@/components/SectorAllocationChart';
import TradeHistory from '@/components/TradeHistory';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface SharedPortfolioData {
    name: string;
    description: string;
    color: string;
    trades: Trade[];
    summary: PortfolioSummary;
    lastUpdated: string;
}

export default function SharedPortfolioPage() {
    const params = useParams();
    const token = typeof params.token === 'string' ? params.token : '';

    const [data, setData] = useState<SharedPortfolioData | null>(null);
    const [currency, setCurrency] = useState<CurrencyCode>('USD');
    const [exchangeRates, setExchangeRates] = useState<Record<CurrencyCode, number>>({ USD: 1, EUR: 0.92, HUF: 350 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (token) fetchSharedPortfolio();
    }, [token]);

    const fetchSharedPortfolio = async () => {
        if (!token) return;
        try {
            setIsLoading(true);
            const response = await fetch(`/api/shared/${token}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Portfolio not found or is private');
                }
                throw new Error('Failed to load portfolio');
            }

            const result = await response.json();
            if (result.success) {
                setData(result.data);
                if (result.data.summary?.exchangeRates) {
                    setExchangeRates(result.data.summary.exchangeRates);
                }
            } else {
                throw new Error(result.error);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
                <div className="p-6 bg-rose-500/10 rounded-[40px] mb-8 border border-rose-500/20">
                    <AlertOctagon size={64} className="text-rose-500" />
                </div>
                <h1 className="text-3xl font-black mb-4">Access Restricted</h1>
                <p className="text-center text-muted-foreground max-w-md mb-10 leading-relaxed font-medium">
                    {error}. This link might have expired or the owner made this portfolio private.
                </p>
                <Link
                    href="/"
                    className="px-10 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                >
                    Return Home
                    <ArrowRight size={20} />
                </Link>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!data) return null;

    const { summary, trades, lastUpdated, name, description, color } = data;
    const rates = exchangeRates;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 scroll-smooth">
            {/* Background Orbs */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
                <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] bg-accent/10 blur-[120px] rounded-full"></div>
            </div>

            <main className="container mx-auto px-6 py-12 max-w-7xl">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-16">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-primary mb-3">
                            <Globe size={18} className="animate-pulse" />
                            <span className="text-xs font-black tracking-[0.2em] uppercase">Shared Public View</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div
                                className="w-3 h-10 rounded-full"
                                style={{ backgroundColor: color }}
                            />
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                                {name}
                            </h1>
                        </div>
                        {description && (
                            <p className="text-muted-foreground mt-4 max-w-2xl font-medium leading-relaxed italic border-l-2 border-border pl-6">
                                "{description}"
                            </p>
                        )}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap shrink-0">
                        <Link
                            href="/register"
                            className="flex items-center gap-3 px-8 py-4 rounded-[24px] bg-primary text-primary-foreground font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            <Zap size={20} />
                            <span>Track Portfolios Free</span>
                        </Link>

                        <div className="flex bg-card p-1.5 rounded-[24px] border border-border">
                            {(['USD', 'EUR', 'HUF'] as CurrencyCode[]).map((c) => (
                                <button
                                    key={c}
                                    onClick={() => setCurrency(c)}
                                    className={`px-5 py-2 rounded-xl text-xs font-black transition-all ${currency === c
                                        ? 'bg-primary text-primary-foreground shadow-lg'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
                    <motion.div whileHover={{ y: -5 }} className="bg-card border border-border p-8 rounded-[40px] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Wallet size={80} className="text-primary" />
                        </div>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3">Market Value</p>
                        <h2 className="text-3xl font-black mb-4">
                            {formatCurrency(convertCurrency(summary?.totalMarketValue || 0, currency, rates), currency)}
                        </h2>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted w-fit px-3 py-1 rounded-full font-bold">
                            <Clock size={12} />
                            <span>{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--'}</span>
                        </div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="bg-card border border-border p-8 rounded-[40px] relative overflow-hidden group shadow-sm">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <BarChart3 size={80} className="text-secondary" />
                        </div>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3">Invested Principal</p>
                        <h2 className="text-3xl font-black mb-4">
                            {formatCurrency(convertCurrency(summary?.totalInvested || 0, currency, rates), currency)}
                        </h2>
                        <div className="text-[10px] text-muted-foreground bg-muted w-fit px-3 py-1 rounded-full uppercase font-black tracking-tighter">
                            Verified Basis
                        </div>
                    </motion.div>

                    <motion.div whileHover={{ y: -5 }} className="col-span-1 md:col-span-2 bg-card border border-border p-8 rounded-[40px] relative overflow-hidden group shadow-lg shadow-black/5">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 h-full">
                            <div>
                                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mb-3">Total Performance</p>
                                <div className="flex items-baseline gap-4 mb-4">
                                    <h2 className={`text-4xl font-black ${(summary?.totalGain || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {formatCurrency(convertCurrency(summary?.totalGain || 0, currency, rates), currency)}
                                    </h2>
                                    <div className={`px-4 py-1.5 rounded-2xl text-sm font-black border ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                                        {formatPercentage(summary?.totalGainPercent || 0)}
                                    </div>
                                </div>
                                <div className="h-2 w-48 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}
                                        style={{ width: `${Math.min(100, Math.abs(summary?.totalGainPercent || 0) * 2)}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center shrink-0 ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                                {(summary?.totalGain || 0) >= 0 ? (
                                    <TrendingUp className="text-emerald-500" size={40} />
                                ) : (
                                    <TrendingDown className="text-rose-500" size={40} />
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <HoldingsTable
                            holdings={summary?.holdings || []}
                            currency={currency}
                            exchangeRates={rates}
                        />

                        <TradeHistory
                            trades={trades}
                            currency={currency}
                            exchangeRates={rates}
                            readOnly={true}
                        />
                    </div>

                    <div className="space-y-12">
                        <div className="bg-card border border-border rounded-[40px] p-8 shadow-sm">
                            <h3 className="text-xl font-black mb-10 flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-xl">
                                    <BarChart3 size={20} className="text-primary" />
                                </div>
                                Performance Sync
                            </h3>
                            <PerformanceChart
                                holdings={summary?.holdings || []}
                                currency={currency}
                                exchangeRates={rates}
                            />
                        </div>

                        <div className="bg-card border border-border rounded-[40px] p-8 shadow-sm">
                            <h3 className="text-xl font-black mb-10 flex items-center gap-3">
                                <div className="p-2 bg-accent/10 rounded-xl">
                                    <LayoutDashboard size={20} className="text-accent" />
                                </div>
                                Asset Weights
                            </h3>
                            <SectorAllocationChart
                                holdings={summary?.holdings || []}
                                currency={currency}
                                exchangeRates={rates}
                            />
                        </div>

                        <div className="p-8 bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 rounded-[40px] text-center">
                            <h4 className="text-lg font-black mb-2">Want a Dashboard like this?</h4>
                            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                                Join 5,000+ investors tracking their wealth with StockTracker's premium tools.
                            </p>
                            <Link href="/register" className="block w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-xl shadow-primary/20">
                                Sign Up Now
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
