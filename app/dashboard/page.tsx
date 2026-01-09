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
  Database
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

  if (authLoading || isLoading && !portfolio) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const summary = portfolio?.summary;
  const trades = portfolio?.trades || [];
  const lastUpdated = portfolio?.lastUpdated;
  const rates = summary?.exchangeRates || { USD: 1, EUR: 0.92, HUF: 350 };

  return (
    <div className="min-h-screen bg-background text-foreground scroll-smooth">
      <main className="container mx-auto px-4 py-8 lg:px-10 max-w-7xl">

        {/* Responsive Header */}
        <header className="flex flex-col gap-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-primary mb-1">
                <LayoutDashboard size={18} />
                <span className="text-sm font-bold tracking-wider uppercase">Overview</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                Trading <span className="text-primary">Dashboard</span>
              </h1>
            </div>

            <div className="flex items-center gap-4 self-end md:self-auto">
              {portfolio && (
                <PortfolioSwitcher
                  currentPortfolioId={portfolio.id}
                  onPortfolioChange={handlePortfolioChange}
                />
              )}
              <button
                onClick={() => fetchPortfolio(true)}
                disabled={isRefreshing}
                className="p-3 rounded-2xl bg-card border border-border hover:bg-muted transition-all disabled:opacity-50"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 bg-card/50 rounded-3xl border border-border/50">
            <div className="flex items-center bg-muted p-1 rounded-2xl border border-border self-start">
              {(['USD', 'EUR', 'HUF'] as CurrencyCode[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${currency === c
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/import"
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-card border border-border hover:bg-muted font-bold text-sm transition-all"
              >
                <Upload size={18} />
                <span>Import</span>
              </Link>
              <button
                onClick={() => {
                  setIsFormOpen(!isFormOpen);
                  if (editingTrade) setEditingTrade(null);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <PlusCircle size={18} />
                <span>Add Trade</span>
              </button>
            </div>
          </div>
        </header>

        {/* Global Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Market Value */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-card border border-border p-8 rounded-[40px] relative overflow-hidden group shadow-lg shadow-black/5"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <Wallet size={80} className="text-primary" />
            </div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">Portfolio Value</p>
            <h2 className="text-3xl font-extrabold mb-4">
              {formatCurrency(convertCurrency(summary?.totalMarketValue || 0, currency, rates), currency)}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted w-fit px-3 py-1 rounded-full">
              <Clock size={12} />
              <span>{lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '--:--'}</span>
            </div>
          </motion.div>

          {/* Invested */}
          <motion.div
            whileHover={{ y: -5 }}
            className="bg-card border border-border p-8 rounded-[40px] relative overflow-hidden group shadow-lg shadow-black/5"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
              <BarChart3 size={80} className="text-secondary" />
            </div>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">Total Invested</p>
            <h2 className="text-3xl font-extrabold mb-4">
              {formatCurrency(convertCurrency(summary?.totalInvested || 0, currency, rates), currency)}
            </h2>
            <div className="text-[10px] text-muted-foreground bg-muted w-fit px-3 py-1 rounded-full uppercase font-bold tracking-tighter">
              Net Cost Basis
            </div>
          </motion.div>

          {/* Profit Loss - Double Span */}
          <motion.div
            whileHover={{ y: -5 }}
            className={`col-span-1 sm:col-span-2 bg-card border border-border p-8 rounded-[40px] relative overflow-hidden group shadow-lg shadow-black/5`}
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 h-full">
              <div className="flex-1">
                <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mb-2">Cumulative Return</p>
                <div className="flex items-baseline gap-4 mb-4">
                  <h2 className={`text-4xl font-extrabold ${(summary?.totalGain || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatCurrency(convertCurrency(summary?.totalGain || 0, currency, rates), currency)}
                  </h2>
                  <div className={`px-4 py-1.5 rounded-2xl text-sm font-black border ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                    {formatPercentage(summary?.totalGainPercent || 0)}
                  </div>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, Math.abs(summary?.totalGainPercent || 0) * 2)}%` }}
                    className={`h-full ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}
                  />
                </div>
              </div>

              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500/5' : 'bg-rose-500/5'}`}>
                {(summary?.totalGain || 0) >= 0 ? (
                  <TrendingUp className="text-emerald-500" size={40} />
                ) : (
                  <TrendingDown className="text-rose-500" size={40} />
                )}
              </div>
            </div>
          </motion.div>
        </section>

        {/* Dashboard Components */}
        <div className="space-y-12">
          <AnimatePresence>
            {(isFormOpen || editingTrade) && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="overflow-hidden"
              >
                <div className="mb-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <HoldingsTable
                holdings={summary?.holdings || []}
                currency={currency}
                exchangeRates={rates}
              />
              <TradeHistory
                trades={trades}
                currency={currency}
                exchangeRates={rates}
                onTradeDeleted={() => fetchPortfolio(true)}
                onTradeEdit={handleEditTrade}
              />
            </div>

            <div className="space-y-8">
              <div className="bg-card border border-border rounded-[40px] p-8 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <PieChart className="text-primary" size={20} />
                  Performance
                </h3>
                <PerformanceChart
                  holdings={summary?.holdings || []}
                  currency={currency}
                  exchangeRates={rates}
                />
              </div>

              <div className="bg-card border border-border rounded-[40px] p-8 shadow-sm">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Layers size={20} className="text-accent" />
                  Allocation
                </h3>
                <SectorAllocationChart
                  holdings={summary?.holdings || []}
                  currency={currency}
                  exchangeRates={rates}
                />
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 p-8 rounded-[40px] relative overflow-hidden group"
              >
                <div className="relative z-10">
                  <div className="p-3 bg-primary/20 rounded-2xl w-fit mb-4">
                    <Database className="text-primary" size={24} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">DCF Models</h3>
                  <p className="text-muted-foreground text-sm mb-6">
                    Professional valuation tools are coming soon to your dashboard.
                  </p>
                  <button className="px-5 py-2.5 bg-card border border-border rounded-xl text-xs font-bold cursor-not-allowed opacity-50">
                    Not Available Yet
                  </button>
                </div>
                <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-10 blur-2xl w-40 h-40 bg-primary/40 rounded-full"></div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Mock PieChart and Layers icon if not imported
function PieChart({ className, size }: { className?: string, size?: number }) {
  return <TrendingUp className={className} size={size} />;
}
function Layers({ className, size }: { className?: string, size?: number }) {
  return <BarChart3 className={className} size={size} />;
}