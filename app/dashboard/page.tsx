'use client';

import { useState, useEffect, useCallback } from 'react';
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
  RefreshCw,
  PlusCircle,
  Clock,
  LayoutDashboard,
  History,
  Upload,
  Database,
  PieChart as PieChartIcon,
  Layers as LayersIcon,
  ChevronRight,
  CalendarDays,
  Download,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react';
import AddTradeForm from '@/components/AddTradeForm';
import HoldingsTable from '@/components/HoldingsTable';
import PerformanceChart from '@/components/PerformanceChart';
import SectorAllocationChart from '@/components/SectorAllocationChart';
import TradeHistory from '@/components/TradeHistory';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PortfolioSwitcher from '@/components/PortfolioSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonDashboard } from '@/components/Skeleton';

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<{
    id: string;
    trades: Trade[];
    summary: PortfolioSummary;
    lastUpdated: string;
  } | null>(null);

  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchPortfolio = useCallback(async (background = false, specificPortfolioId?: string) => {
    if (!background) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const queryId = specificPortfolioId || (portfolio?.id ? portfolio.id : '');
      const url = `/api/portfolio${queryId ? `?id=${queryId}` : ''}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setPortfolio(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [portfolio?.id]);

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
    const interval = setInterval(() => fetchPortfolio(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPortfolio, user]);

  const handlePortfolioChange = (newPortfolioId: string) => {
    fetchPortfolio(false, newPortfolioId);
  };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (authLoading || (isLoading && !portfolio)) {
    return <SkeletonDashboard />;
  }

  const summary = portfolio?.summary;
  const trades = portfolio?.trades || [];
  const lastUpdated = portfolio?.lastUpdated;
  const rates = summary?.exchangeRates || { USD: 1, EUR: 0.92, HUF: 350 };

  // Calculate Daily P&L from holdings (using any extended properties from API)
  const dailyPnL = (summary?.holdings || []).reduce((total, holding: any) => {
    // Use dayChange if available, otherwise calculate from change percent
    const dayChange = holding.dayChange || (holding.changePercent ? (holding.currentPrice * holding.changePercent / 100) : 0);
    return total + (dayChange * holding.shares);
  }, 0);

  const dailyPnLPercent = summary?.totalMarketValue
    ? (dailyPnL / (summary.totalMarketValue - dailyPnL)) * 100
    : 0;

  return (
    <div className="min-h-screen text-foreground scroll-smooth relative">
      <main className="px-6 py-10 lg:px-12 max-w-[1600px] mx-auto">
        {/* Intelligence Header */}
        <header className="flex flex-col gap-10 mb-16">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-1 px-3 bg-primary/10 rounded-full border border-primary/20">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">System Dashboard</span>
                </div>
                <div className="h-1 w-1 bg-border rounded-full" />
                <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                  <Clock size={12} />
                  <span>Sync: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--'}</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                Investment <span className="text-primary text-glow-primary">Protocol.</span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="bg-card/40 backdrop-blur-xl border border-border/50 p-1.5 rounded-[22px] flex items-center shadow-xl shadow-black/5">
                {(['USD', 'EUR', 'HUF'] as CurrencyCode[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCurrency(c)}
                    className={`px-6 py-2.5 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${currency === c
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {portfolio && (
                <PortfolioSwitcher
                  currentPortfolioId={portfolio.id}
                  onPortfolioChange={handlePortfolioChange}
                />
              )}

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchPortfolio(true)}
                disabled={isRefreshing}
                className="p-3.5 rounded-2xl bg-card border border-border shadow-md hover:bg-muted transition-all disabled:opacity-50"
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin text-primary' : 'text-foreground'} />
              </motion.button>
            </div>
          </div>

        </header>

        {/* Global Metric Clusters */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-12">
          {/* Card: Net Asset Value */}
          <motion.div
            whileHover={{ y: -8 }}
            className="p-10 bg-card border border-border/80 rounded-[48px] shadow-2xl shadow-black/5 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/10 border border-primary/20">
                <Wallet size={20} className="text-primary" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Net Asset Value</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4">
              {formatCurrency(convertCurrency(summary?.totalMarketValue || 0, currency, rates), currency)}
            </h2>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="h-full bg-primary" />
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">{summary?.holdings?.length || 0} Holdings</span>
              <span className="text-[8px] font-black text-primary">LIVE SYNC</span>
            </div>
          </motion.div>

          {/* Card: Capital Distribution */}
          <motion.div
            whileHover={{ y: -8 }}
            className="p-10 bg-card border border-border/80 rounded-[48px] shadow-2xl shadow-black/5 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center shadow-lg shadow-accent/10 border border-accent/20">
                <BarChart3 size={20} className="text-accent" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Total Deployed</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-4">
              {formatCurrency(convertCurrency(summary?.totalInvested || 0, currency, rates), currency)}
            </h2>
            <div className="text-[10px] font-black text-muted-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent" />
              CORE COST BASIS
            </div>
          </motion.div>

          {/* Card: Daily P&L */}
          <motion.div
            whileHover={{ y: -8 }}
            className={`p-10 border rounded-[48px] shadow-2xl shadow-black/5 relative overflow-hidden group ${dailyPnL >= 0
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-rose-500/5 border-rose-500/20'
              }`}
          >
            <div className="flex items-center justify-between mb-8">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border ${dailyPnL >= 0
                ? 'bg-emerald-500/20 shadow-emerald-500/10 border-emerald-500/20'
                : 'bg-rose-500/20 shadow-rose-500/10 border-rose-500/20'
                }`}>
                {dailyPnL >= 0
                  ? <ArrowUpRight size={20} className="text-emerald-500" />
                  : <ArrowDownRight size={20} className="text-rose-500" />
                }
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Today's P&L</span>
              </div>
            </div>
            <h2 className={`text-4xl font-black tracking-tighter mb-2 ${dailyPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {dailyPnL >= 0 ? '+' : ''}{formatCurrency(convertCurrency(dailyPnL, currency, rates), currency)}
            </h2>
            <div className={`inline-flex px-3 py-1 rounded-xl text-sm font-black ${dailyPnL >= 0
              ? 'bg-emerald-500/10 text-emerald-500'
              : 'bg-rose-500/10 text-rose-500'
              }`}>
              {dailyPnLPercent >= 0 ? '+' : ''}{dailyPnLPercent.toFixed(2)}%
            </div>
            <div className="mt-6 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
              Based on previous close
            </div>
          </motion.div>

          {/* Card: Performance Yield */}
          <motion.div
            whileHover={{ y: -8 }}
            className={`md:col-span-2 p-10 bg-card/40 backdrop-blur-2xl border border-border/80 rounded-[48px] shadow-2xl shadow-black/10 relative overflow-hidden group`}
          >
            <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-10 h-full">
              <div className="flex-1 w-full xl:w-auto">
                <div className="flex items-center gap-4 mb-8">
                  <div className={`p-3 rounded-2xl ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                    {(summary?.totalGain || 0) >= 0 ? (
                      <TrendingUp className="text-emerald-500" size={24} />
                    ) : (
                      <TrendingDown className="text-rose-500" size={24} />
                    )}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Portfolio Yield Metrics</span>
                </div>

                <div className="flex flex-wrap items-baseline gap-6 mb-8">
                  <h2 className={`text-6xl font-black tracking-tighter ${(summary?.totalGain || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatCurrency(convertCurrency(summary?.totalGain || 0, currency, rates), currency)}
                  </h2>
                  <div className={`px-5 py-2 rounded-2xl text-lg font-black border ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                    {formatPercentage(summary?.totalGainPercent || 0)}
                  </div>
                </div>

                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.abs(summary?.totalGainPercent || 0) * 2)}%` }}
                    className={`h-full ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]'}`}
                  />
                </div>
              </div>

              <div className="hidden xl:flex w-32 h-32 rounded-[40px] bg-muted/30 border border-border/50 items-center justify-center shrink-0">
                <PieChartIcon className={(summary?.totalGain || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'} size={60} />
              </div>
            </div>
          </motion.div>
        </section>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap gap-3 mb-8 p-4 bg-card/30 backdrop-blur-md border border-border/30 rounded-2xl">
          <button
            onClick={() => fetchPortfolio(true)}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh Prices
          </button>

          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl font-bold text-sm transition-all"
          >
            <PlusCircle size={16} />
            Add Trade
          </button>

          <Link
            href="/dashboard/report"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 rounded-xl font-bold text-sm transition-all"
          >
            <LineChart size={16} />
            Full Report
          </Link>

          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(
              'Symbol,Shares,Avg Price,Current Price,Market Value,Gain/Loss\n' +
              (summary?.holdings || []).map(h =>
                `${h.ticker},${h.shares},${h.avgCostBasis.toFixed(2)},${h.currentPrice.toFixed(2)},${h.marketValue.toFixed(2)},${h.unrealizedGain.toFixed(2)}`
              ).join('\n')
            )}`}
            download={`portfolio-${new Date().toISOString().split('T')[0]}.csv`}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl font-bold text-sm transition-all"
          >
            <Download size={16} />
            Export CSV
          </a>

          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Zap size={14} className="text-primary" />
              <span className="font-bold">Quick Actions</span>
            </div>
          </div>
        </div>

        {/* Rapid Action Layer */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          <Link
            href="/dashboard/import"
            className="flex items-center justify-between p-8 bg-card/60 backdrop-blur-md border border-border/40 rounded-[32px] hover:border-primary/30 transition-all group overflow-hidden relative shadow-lg shadow-black/5"
          >
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={24} className="text-foreground" />
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">Bulk Import Engineering</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Batch trade CSV processing</p>
              </div>
            </div>
            <ChevronRight size={24} className="text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Database size={80} />
            </div>
          </Link>

          <button
            onClick={() => {
              setIsFormOpen(!isFormOpen);
              if (editingTrade) setEditingTrade(null);
            }}
            className="flex items-center justify-between p-8 bg-primary text-primary-foreground rounded-[32px] shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all group relative overflow-hidden"
          >
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500">
                <PlusCircle size={28} />
              </div>
              <div className="text-left">
                <h3 className="font-black text-lg tracking-tight">Execute New Trade</h3>
                <p className="text-xs text-primary-foreground/70 font-black uppercase tracking-widest">Manual position entry</p>
              </div>
            </div>
            <ChevronRight size={24} />
            <div className="absolute bottom-0 right-0 p-4 opacity-10">
              <TrendingUp size={100} />
            </div>
          </button>
        </div>

        {/* Central Terminal Display */}
        <div className="space-y-20">
          <AnimatePresence>
            {(isFormOpen || editingTrade) && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -40 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -40 }}
                className="overflow-hidden"
              >
                <div className="pb-16 pt-4">
                  <AddTradeForm
                    portfolioId={portfolio?.id || ''}
                    editTrade={editingTrade}
                    onCancel={() => {
                      setIsFormOpen(false);
                      setEditingTrade(null);
                    }}
                    onTradeAdded={() => {
                      fetchPortfolio(true);
                      setIsFormOpen(false);
                      setEditingTrade(null);
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 gap-20">
            {/* Primary Analysis - Full Width */}
            <div className="space-y-20">
              <section>
                <div className="flex items-center gap-4 mb-10 pl-2">
                  <div className="w-1.5 h-8 bg-primary rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                  <h3 className="text-3xl font-black tracking-tight">Active Holdings</h3>
                </div>
                <HoldingsTable
                  holdings={summary?.holdings || []}
                  currency={currency}
                  exchangeRates={rates}
                />
              </section>

              {/* Data Visualization Grid - Moving here from sidebar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="p-10 bg-card border border-border/60 rounded-[48px] shadow-2xl shadow-black/5 backdrop-blur-3xl overflow-hidden">
                  <h3 className="text-xl font-black mb-10 flex items-center gap-4 px-2">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <PieChartIcon className="text-primary" size={20} />
                    </div>
                    Performance Attribution
                  </h3>
                  <PerformanceChart
                    holdings={summary?.holdings || []}
                    currency={currency}
                    exchangeRates={rates}
                  />
                </div>

                <div className="p-10 bg-card border border-border/60 rounded-[48px] shadow-2xl shadow-black/5 backdrop-blur-3xl overflow-hidden">
                  <h3 className="text-xl font-black mb-10 flex items-center gap-4 px-2">
                    <div className="p-2 bg-accent/10 rounded-xl">
                      <LayersIcon className="text-accent" size={20} />
                    </div>
                    Fundamental Allocation
                  </h3>
                  <SectorAllocationChart
                    holdings={summary?.holdings || []}
                    currency={currency}
                    exchangeRates={rates}
                  />
                </div>
              </div>

              <section>
                <div className="flex items-center gap-4 mb-10 pl-2">
                  <div className="w-1.5 h-8 bg-accent rounded-full shadow-[0_0_15px_rgba(96,165,250,0.5)]" />
                  <h3 className="text-3xl font-black tracking-tight">Log History</h3>
                </div>
                <TradeHistory
                  trades={trades}
                  currency={currency}
                  exchangeRates={rates}
                  onTradeDeleted={() => fetchPortfolio(true)}
                  onTradeEdit={handleEditTrade}
                />
              </section>
            </div>

            {/* Neural Hub - Full Width Footer style */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="p-12 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent border border-white/5 rounded-[64px] relative overflow-hidden group shadow-2xl"
            >
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                <div className="p-6 bg-primary/20 rounded-3xl shadow-inner shrink-0">
                  <Database className="text-primary" size={40} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-4xl font-black tracking-tighter mb-4 leading-none">Valuation Neural Hub</h3>
                  <p className="text-muted-foreground text-lg font-medium max-w-2xl leading-relaxed">
                    Institutional-grade DCF and comparative valuation models launching in Q1. Unified alpha discovery for sophisticated capital management.
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="px-4 py-1.5 bg-muted rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">Operational Alpha</span>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">System Encoding</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-20 -right-20 opacity-5 rotate-12">
                <Database size={300} className="text-primary" />
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .text-glow-primary {
          text-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}