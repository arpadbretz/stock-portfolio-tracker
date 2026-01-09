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
  History
} from 'lucide-react';
import AddTradeForm from '@/components/AddTradeForm';
import HoldingsTable from '@/components/HoldingsTable';
import PerformanceChart from '@/components/PerformanceChart';
import SectorAllocationChart from '@/components/SectorAllocationChart';
import TradeHistory from '@/components/TradeHistory';
import { useAuth } from '@/components/auth/AuthProvider';
import UserButton from '@/components/auth/UserButton';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { useRouter } from 'next/navigation';
import PortfolioSwitcher from '@/components/PortfolioSwitcher';

export default function Home() {
  // 1. UPDATED: Added 'id' to the state definition
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
      // Use specific ID if provided, otherwise if we already have one loaded, keep using it
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
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchPortfolio(true), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPortfolio, user]);

  const handlePortfolioChange = (newPortfolioId: string) => {
    fetchPortfolio(false, newPortfolioId);
  };

  const summary = portfolio?.summary;
  const trades = portfolio?.trades || [];
  const lastUpdated = portfolio?.lastUpdated;
  const rates = summary?.exchangeRates || { USD: 1, EUR: 0.92, HUF: 350 };

  const handleEditTrade = (trade: Trade) => {
    setEditingTrade(trade);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-emerald-500/30">
      {/* Background Glow */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] -right-[10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full"></div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-7xl pb-24 md:pb-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <LayoutDashboard size={18} />
              <span className="text-sm font-semibold tracking-wider uppercase">Dashboard</span>
            </div>
            <h1 className="text-4xl font-bold text-white tracking-tight">
              Stock <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Portfolio</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
            {/* Portfolio Switcher */}
            {portfolio && (
              <PortfolioSwitcher
                currentPortfolioId={portfolio.id}
                onPortfolioChange={handlePortfolioChange}
              />
            )}

            {/* Currency Selector */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-[200px] md:max-w-none">
              {(['USD', 'EUR', 'HUF'] as CurrencyCode[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${currency === c
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              onClick={() => fetchPortfolio(true)}
              disabled={isRefreshing}
              className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all text-slate-300 disabled:opacity-50"
              title="Refresh prices"
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>

            <button
              onClick={() => {
                setIsFormOpen(!isFormOpen);
                if (editingTrade) setEditingTrade(null);
              }}
              disabled={!portfolio}
              className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusCircle size={20} />
              <span>Add Trade</span>
            </button>
            <UserButton />
          </div>
        </header>

        {/* Portfolio Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Market Value Card */}
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Wallet size={64} className="text-emerald-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Total Market Value</p>
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLoading ? (
                <div className="h-9 w-32 bg-slate-700 animate-pulse rounded"></div>
              ) : (
                formatCurrency(convertCurrency(summary?.totalMarketValue || 0, currency, rates), currency)
              )}
            </h2>
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Clock size={12} />
              <span>Last updated: {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never'}</span>
            </div>
          </div>

          {/* Total Invested */}
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart3 size={64} className="text-blue-400" />
            </div>
            <p className="text-slate-400 text-sm font-medium mb-1">Total Invested</p>
            <h2 className="text-3xl font-bold text-white mb-2">
              {isLoading ? (
                <div className="h-9 w-32 bg-slate-700 animate-pulse rounded"></div>
              ) : (
                formatCurrency(convertCurrency(summary?.totalInvested || 0, currency, rates), currency)
              )}
            </h2>
            <div className="text-xs text-slate-500">Includes all fees and costs</div>
          </div>

          {/* Total P&L */}
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-6 rounded-3xl relative overflow-hidden group col-span-1 md:col-span-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Profit / Loss</p>
                <div className="flex items-baseline gap-3">
                  <h2 className={`text-3xl font-bold mb-1 ${(summary?.totalGain || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isLoading ? (
                      <div className="h-9 w-32 bg-slate-700 animate-pulse rounded"></div>
                    ) : (
                      formatCurrency(convertCurrency(summary?.totalGain || 0, currency, rates), currency)
                    )}
                  </h2>
                  <span className={`text-lg font-semibold px-2 py-0.5 rounded-lg ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {isLoading ? '...' : formatPercentage(summary?.totalGainPercent || 0)}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-2xl ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {(summary?.totalGain || 0) >= 0 ? (
                  <TrendingUp className="text-emerald-400" size={24} />
                ) : (
                  <TrendingDown className="text-red-400" size={24} />
                )}
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${(summary?.totalGain || 0) >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, Math.abs(summary?.totalGainPercent || 0) * 2)}%` }}
              ></div>
            </div>
          </div>
        </section>

        {/* Dashboard Content - Full Width */}
        <div className="space-y-8">
          {(isFormOpen || editingTrade) && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              {/* 2. UPDATED: Passing the portfolio ID to the form */}
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
          )}

          <HoldingsTable
            holdings={summary?.holdings || []}
            currency={currency}
            exchangeRates={rates}
            isLoading={isLoading}
          />

          <PerformanceChart
            holdings={summary?.holdings || []}
            currency={currency}
            exchangeRates={rates}
            isLoading={isLoading}
          />

          <SectorAllocationChart
            holdings={summary?.holdings || []}
            currency={currency}
            exchangeRates={rates}
            isLoading={isLoading}
          />

          <TradeHistory
            trades={trades}
            currency={currency}
            exchangeRates={rates}
            onTradeDeleted={() => fetchPortfolio(true)}
            onTradeEdit={handleEditTrade}
          />

          {/* Market Status */}
          <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-3xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-xl">
                  <History className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">System Status</h3>
                  <p className="text-slate-400 text-sm">Real-time data and storage connectivity</p>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 flex-1 max-w-2xl">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Data Source</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-200 text-sm font-medium">Yahoo Finance API</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Database</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-slate-200 text-sm font-medium">Supabase Cloud Database</span>
                  </div>
                </div>
                <div className="space-y-1 hidden lg:block">
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Sync Interval</span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                    <span className="text-slate-200 text-sm font-medium">Manual / 5 min</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav
        onAddClick={() => {
          setIsFormOpen(true);
          setEditingTrade(null);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
}