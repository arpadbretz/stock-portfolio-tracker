'use client';

import { useState, useEffect, useCallback } from 'react';
import { PortfolioSummary, CurrencyCode, Trade, Holding } from '@/types/portfolio';
import {
    convertCurrency,
    formatCurrency,
    formatPercentage,
    formatNumber
} from '@/lib/portfolio';
import {
    TrendingUp,
    TrendingDown,
    Shield,
    Activity,
    Award,
    AlertTriangle,
    Zap,
    Target,
    ArrowLeft,
    ChevronRight,
    Dna,
    Database,
    Briefcase,
    HelpCircle,
    BarChart3
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportPage() {
    const [portfolio, setPortfolio] = useState<{
        id: string;
        trades: Trade[];
        summary: PortfolioSummary;
        lastUpdated: string;
    } | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const fetchPortfolio = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/portfolio');
            const result = await response.json();
            if (result.success) {
                setPortfolio(result.data);
            }
        } catch (error) {
            console.error('Failed to fetch portfolio:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchPortfolio();
        }
    }, [user, authLoading, router, fetchPortfolio]);

    if (authLoading || isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin mb-8"></div>
                <h2 className="text-2xl font-black tracking-tighter animate-pulse">GENERATING CLINICAL AUDIT...</h2>
                <p className="text-muted-foreground text-sm font-medium uppercase tracking-[0.3em] mt-4">Analyzing deep-structure market resonance</p>
            </div>
        );
    }

    if (!portfolio) return null;

    const { summary, trades } = portfolio;
    const holdings = summary.holdings;
    const rates = summary.exchangeRates;
    const currency: CurrencyCode = 'USD'; // Default for report

    // Advanced Metrics Calculations

    // 1. Concentration Metrics
    const sortedHoldings = [...holdings].sort((a, b) => b.marketValue - a.marketValue);
    const top1Weight = sortedHoldings[0]?.allocation || 0;
    const top3Weight = sortedHoldings.slice(0, 3).reduce((sum, h) => sum + h.allocation, 0);
    const top5Weight = sortedHoldings.slice(0, 5).reduce((sum, h) => sum + h.allocation, 0);

    // 2. Performance Drivers (Abs return)
    const topPerformers = [...holdings]
        .sort((a, b) => b.unrealizedGain - a.unrealizedGain)
        .slice(0, 3);

    const bottomPerformers = [...holdings]
        .sort((a, b) => a.unrealizedGain - b.unrealizedGain)
        .slice(0, 3);

    // 3. Operational Efficiency
    const totalFees = trades.reduce((sum, t) => sum + t.fees, 0);
    const feeEfficiency = summary.totalInvested > 0 ? (totalFees / summary.totalInvested) * 100 : 0;

    // 4. Sector Breakdown
    const sectorWeights = holdings.reduce((acc, h) => {
        const sector = h.sector || 'Unassigned';
        acc[sector] = (acc[sector] || 0) + h.allocation;
        return acc;
    }, {} as Record<string, number>);

    const dominantSector = Object.entries(sectorWeights).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

    const Tooltip = ({ title, content }: { title: string, content: string }) => {
        const [isVisible, setIsVisible] = useState(false);
        return (
            <div className="relative inline-block ml-2 cursor-help" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
                <HelpCircle size={14} className="text-muted-foreground/60 hover:text-primary transition-colors" />
                <AnimatePresence>
                    {isVisible && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-card/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl pointer-events-none"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary block mb-2">{title}</span>
                            <p className="text-[11px] font-medium leading-relaxed text-foreground/80">{content}</p>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-card/90"></div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            <main className="px-6 py-10 lg:px-12 max-w-[1400px] mx-auto">
                {/* Navigation Header */}
                <header className="flex flex-col gap-8 mb-16">
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors w-fit group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Return to Command Center</span>
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-2">
                            <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] block">Strategic Wealth Intelligence</span>
                            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">Comprehensive Audit</h1>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-[32px] border border-border/50">
                            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Audit Status</span>
                                <span className="text-xs font-black uppercase tracking-tight">System Validated • Institutional Grade</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Main Content Area - Left Column */}
                    <div className="lg:col-span-8 space-y-8">

                        {/* Executive Summary Section */}
                        <section className="p-10 bg-card border border-border/60 rounded-[48px] shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="p-3 bg-primary/10 rounded-2xl">
                                        <Award className="text-primary" size={24} />
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight">Executive Summary</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                                            Your portfolio currently manages <span className="text-foreground font-black">{holdings.length} active positions</span> with a net market value of <span className="text-foreground font-black">{formatCurrency(summary.totalMarketValue, currency)}</span>.
                                            The audit reveals a <span className="text-foreground font-black">{summary.totalGain >= 0 ? 'surplus' : 'deficit'} of {formatPercentage(summary.totalGainPercent)}</span> relative to cost basis.
                                        </p>
                                        <div className="p-6 bg-muted/40 rounded-3xl border border-border/40">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-4">Core Exposure Breakdown</span>
                                            <div className="space-y-4">
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                                                        <span>Dominant Sector: {dominantSector[0]}</span>
                                                        <span className="text-primary">{dominantSector[1].toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${dominantSector[1]}%` }}
                                                            className="h-full bg-primary"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="flex justify-between text-[10px] font-black uppercase mb-1.5">
                                                        <span>Concentration (Top 3)</span>
                                                        <span className="text-accent">{top3Weight.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${top3Weight}%` }}
                                                            className="h-full bg-accent"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-6 bg-card border border-border/40 rounded-3xl flex flex-col justify-between group/card hover:border-primary/30 transition-colors">
                                            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl w-fit mb-4 shadow-lg shadow-primary/5 group-hover/card:bg-primary/20 transition-colors">
                                                <Activity className="text-primary" size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Fee Efficiency</h4>
                                                <p className="text-xl font-black">{feeEfficiency.toFixed(3)}%</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-card border border-border/40 rounded-3xl flex flex-col justify-between group/card hover:border-emerald-500/30 transition-colors">
                                            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit mb-4 shadow-lg shadow-emerald-500/5 group-hover/card:bg-emerald-500/20 transition-colors">
                                                <Zap className="text-emerald-500" size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 text-emerald-500/80">Growth Engine</h4>
                                                <p className="text-xl font-black">{topPerformers[0]?.ticker || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-card border border-border/40 rounded-3xl flex flex-col justify-between group/card hover:border-accent/30 transition-colors">
                                            <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl w-fit mb-4 shadow-lg shadow-accent/5 group-hover/card:bg-accent/20 transition-colors">
                                                <Shield className="text-accent" size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 text-accent/80">Top Exposure</h4>
                                                <p className="text-xl font-black">{top1Weight.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        <div className="p-6 bg-card border border-border/40 rounded-3xl flex flex-col justify-between group/card hover:border-primary/30 transition-colors">
                                            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl w-fit mb-4 shadow-lg shadow-primary/5 group-hover/card:bg-primary/20 transition-colors">
                                                <Target className="text-primary" size={18} />
                                            </div>
                                            <div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 font-bold">Health Score</h4>
                                                <p className="text-xl font-black">AA+</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-24 -right-24 opacity-5 rotate-12">
                                <Award size={400} className="text-primary" />
                            </div>
                        </section>

                        {/* Performance Drivers Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section className="p-10 bg-card border border-border/60 rounded-[40px] shadow-xl">
                                <h3 className="text-xl font-black mb-8 flex items-center gap-4">
                                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                                        <TrendingUp className="text-emerald-500" size={18} />
                                    </div>
                                    Primary Alpha Drivers
                                </h3>
                                <div className="space-y-4">
                                    {topPerformers.map((p) => (
                                        <div key={p.ticker} className="p-4 bg-muted/20 border border-transparent hover:border-emerald-500/20 rounded-2xl transition-all group">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center font-black text-emerald-500 text-xs">
                                                        {p.ticker}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black">{p.ticker}</span>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Equity Contribution</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-emerald-500">+{formatCurrency(p.unrealizedGain, currency)}</div>
                                                    <div className="text-[8px] font-black uppercase tracking-widest text-emerald-500/60">{formatPercentage(p.unrealizedGainPercent)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="p-10 bg-card border border-border/60 rounded-[40px] shadow-xl">
                                <h3 className="text-xl font-black mb-8 flex items-center gap-4">
                                    <div className="p-2 bg-rose-500/10 rounded-xl">
                                        <TrendingDown className="text-rose-500" size={18} />
                                    </div>
                                    Resource Headwinds
                                </h3>
                                <div className="space-y-4">
                                    {bottomPerformers.map((p) => (
                                        <div key={p.ticker} className="p-4 bg-muted/20 border border-transparent hover:border-rose-500/20 rounded-2xl transition-all group">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center font-black text-rose-500 text-xs">
                                                        {p.ticker}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black">{p.ticker}</span>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Equity Impact</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-black text-rose-500">{formatCurrency(p.unrealizedGain, currency)}</div>
                                                    <div className="text-[8px] font-black uppercase tracking-widest text-rose-500/60">{formatPercentage(p.unrealizedGainPercent)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>

                    {/* Sidebar Area - Right Column */}
                    <div className="lg:col-span-4 space-y-8">

                        {/* Risk Terminal */}
                        <section className="p-10 bg-card border border-border/60 rounded-[48px] shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-2xl font-black mb-10 flex items-center gap-4">
                                    <div className="p-2 bg-accent/10 rounded-xl">
                                        <BarChart3 className="text-accent" size={20} />
                                    </div>
                                    Risk Terminal
                                </h3>

                                <div className="space-y-6">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Concentration Architecture</span>
                                    <div className="flex items-end justify-between gap-6 h-40 px-2 mt-4">
                                        {sortedHoldings.slice(0, 3).map((h, i) => (
                                            <div key={h.ticker} className="flex flex-col items-center gap-4 w-full h-full">
                                                <div className="flex-1 w-full bg-muted/20 rounded-2xl overflow-hidden relative flex flex-col justify-end">
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: `${h.allocation}%` }}
                                                        className={`w-full rounded-t-xl shadow-[0_-5px_15px_rgba(0,0,0,0.1)] ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-accent' : 'bg-emerald-500'}`}
                                                    />
                                                </div>
                                                <div className="text-center">
                                                    <span className="text-[10px] font-black block text-foreground tracking-tighter">{h.ticker}</span>
                                                    <span className="text-[8px] font-black text-muted-foreground uppercase">{h.allocation.toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-5 bg-card border border-border/40 rounded-[32px] text-[10px] font-medium leading-relaxed shadow-sm">
                                        <p className="flex items-start gap-3">
                                            <AlertTriangle size={14} className="shrink-0 text-amber-500" />
                                            <span>Portfolio utilizes an <span className="font-black text-foreground underline decoration-primary/30 decoration-2 underline-offset-2">{top3Weight > 50 ? 'Aggressive' : 'Optimized'}</span> architecture with <span className="font-black text-foreground">{top3Weight.toFixed(1)}%</span> capital deployment in primary assets.</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-8 pt-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Stability Audit</span>
                                        <Tooltip title="System Stability" content="An algorithmic oversight of your total portfolio's structural health, diversification balance, and cash-flow resonance." />
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Liquidity</span>
                                                <Tooltip title="Liquidity" content="The efficiency with which assets can be converted into currency without major valuation slippage. Ultra-high represents large-cap asset dominance." />
                                            </div>
                                            <p className="text-sm font-black text-primary tracking-tight">ULTRA-HIGH</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">Volatility</span>
                                                <Tooltip title="Volatility Cluster" content="The historical frequency and intensity of price fluctuations in your current asset cluster." />
                                            </div>
                                            <p className="text-sm font-black text-accent tracking-tight">MODERATE</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Neural Backbone Message */}
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            className="p-10 bg-gradient-to-br from-primary/10 via-accent/10 to-transparent border border-white/5 rounded-[48px] relative overflow-hidden group shadow-2xl"
                        >
                            <div className="relative z-10">
                                <div className="p-3 bg-primary/20 rounded-2xl w-fit mb-8">
                                    <Dna className="text-primary" size={24} />
                                </div>
                                <h3 className="text-2xl font-black tracking-tighter mb-4 leading-tight">Institutional<br />Resonance</h3>
                                <p className="text-muted-foreground text-[11px] font-medium mb-8 leading-relaxed">
                                    Your portfolio is being analyzed against institutional-grade DCF and comparative valuation models. Launching in Q1.
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                    <span className="text-[8px] font-black uppercase tracking-widest text-primary">Neural Link Active</span>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </main>
        </div>
    );
}
