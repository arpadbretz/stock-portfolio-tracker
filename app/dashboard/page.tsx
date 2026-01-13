'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { PortfolioSummary, CurrencyCode, Trade, Holding } from '@/types/portfolio';
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
  Zap,
  Settings2,
  Activity,
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
import {
  useWidgetSystem,
  WidgetGallery,
  EditToolbar,
} from '@/components/WidgetSystem';
import DashboardGrid, { WIDGET_DEFINITIONS } from '@/components/DashboardGrid';
import {
  TopPerformersWidget,
  WorstPerformersWidget,
  WatchlistMiniWidget,
  QuickActionsWidget,
  PriceAlertsWidget,
  DividendTrackerWidget,
  UpcomingEarningsWidget,
  MarketOverviewWidget,
  MarketNewsWidget,
  PerformanceChartWidget,
} from '@/components/DashboardWidgetComponents';


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

  // Widget customization system
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const {
    layouts,
    saveLayouts,
    widgetSizes,
    isEditing,
    setIsEditing,
    removeWidget,
    addWidget,
    resizeWidget,
    resetLayout,
    hiddenWidgets,
    visibleWidgetIds,
    hasLoaded: widgetsLoaded,
    isSyncing,
  } = useWidgetSystem();

  // Load saved currency preference
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency && ['USD', 'EUR', 'HUF'].includes(savedCurrency)) {
      setCurrency(savedCurrency as CurrencyCode);
    }
  }, []);

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

  if (authLoading || (isLoading && !portfolio) || !widgetsLoaded) {
    return <SkeletonDashboard />;
  }

  const summary = portfolio?.summary;
  const trades = portfolio?.trades || [];
  const lastUpdated = portfolio?.lastUpdated;
  const rates = summary?.exchangeRates || { USD: 1, EUR: 0.92, HUF: 350 };
  const holdings = summary?.holdings || [];

  // Calculate Daily P&L from holdings
  const dailyPnL = holdings.reduce((total, holding) => {
    const dayChange = holding.dayChange || 0;
    return total + (dayChange * holding.shares);
  }, 0);

  const dailyPnLPercent = summary?.totalMarketValue
    ? (dailyPnL / (summary.totalMarketValue - dailyPnL)) * 100
    : 0;

  // Prepare holdings data for performer widgets
  const holdingsForPerformers = holdings.map(h => ({
    symbol: h.ticker,
    name: h.ticker, // Holding type doesn't have name, use ticker
    gainPercent: h.unrealizedGainPercent || 0,
    gain: h.unrealizedGain || 0,
  }));

  // ============ WIDGET CONTENT RENDERER ============
  // Now receives size parameter to adapt content
  type WidgetSize = 'small' | 'medium' | 'large';

  const renderWidgetContent = (widgetId: string, size: WidgetSize = 'medium'): ReactNode => {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    switch (widgetId) {
      // Core Metrics
      case 'portfolio-value':
        return (
          <div className="h-full flex flex-col justify-between">
            <div className={`flex items-center gap-3 ${isSmall ? 'mb-2' : 'mb-4'}`}>
              <div className={`${isSmall ? 'w-8 h-8' : 'w-10 h-10'} bg-emerald-500/20 rounded-xl flex items-center justify-center`}>
                <Wallet size={isSmall ? 14 : 18} className="text-emerald-500" />
              </div>
              {!isSmall && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net Asset Value</span>}
            </div>
            <h2 className={`${isSmall ? 'text-2xl' : isLarge ? 'text-5xl' : 'text-3xl'} font-black tracking-tight ${isSmall ? 'mb-1' : 'mb-3'}`}>
              {formatCurrency(convertCurrency(summary?.totalMarketValue || 0, currency, rates), currency)}
            </h2>
            {!isSmall && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} className="h-full bg-emerald-500" />
                </div>
              </div>
            )}
            <div className={`mt-auto ${isSmall ? 'pt-1' : 'pt-3'} flex items-center justify-between text-[10px]`}>
              <span className="font-bold text-muted-foreground">{holdings.length} Holdings</span>
              <span className="font-bold text-emerald-500">LIVE</span>
            </div>
            {isLarge && (
              <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-xl">
                  <div className="text-[10px] text-muted-foreground font-bold mb-1">Cost Basis</div>
                  <div className="font-black">{formatCurrency(convertCurrency(summary?.totalInvested || 0, currency, rates), currency)}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                  <div className="text-[10px] text-muted-foreground font-bold mb-1">Unrealized</div>
                  <div className={`font-black ${(summary?.totalGain || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatCurrency(convertCurrency(summary?.totalGain || 0, currency, rates), currency)}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'total-invested':
        return (
          <div className="h-full flex flex-col justify-between">
            <div className={`flex items-center gap-3 ${isSmall ? 'mb-2' : 'mb-4'}`}>
              <div className={`${isSmall ? 'w-8 h-8' : 'w-10 h-10'} bg-blue-500/20 rounded-xl flex items-center justify-center`}>
                <BarChart3 size={isSmall ? 14 : 18} className="text-blue-500" />
              </div>
              {!isSmall && <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Capital Deployed</span>}
            </div>
            <h2 className={`${isSmall ? 'text-2xl' : isLarge ? 'text-5xl' : 'text-3xl'} font-black tracking-tight ${isSmall ? 'mb-1' : 'mb-3'}`}>
              {formatCurrency(convertCurrency(summary?.totalInvested || 0, currency, rates), currency)}
            </h2>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              COST BASIS
            </div>
            {isLarge && summary && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground mb-2">Top Allocations</div>
                <div className="space-y-2">
                  {holdings.slice(0, 5).map(h => (
                    <div key={h.ticker} className="flex items-center justify-between">
                      <span className="font-bold text-sm">{h.ticker}</span>
                      <span className="text-sm text-muted-foreground">{formatCurrency(convertCurrency(h.totalInvested, currency, rates), currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'daily-pnl':
        const isPnLPositive = dailyPnL >= 0;
        return (
          <div className="h-full flex flex-col justify-between">
            <div className={`flex items-center gap-3 ${isSmall ? 'mb-2' : 'mb-4'}`}>
              <div className={`${isSmall ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center ${isPnLPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}>
                {isPnLPositive ? <ArrowUpRight size={isSmall ? 14 : 18} className="text-emerald-500" /> : <ArrowDownRight size={isSmall ? 14 : 18} className="text-rose-500" />}
              </div>
              {!isSmall && (
                <div className="flex items-center gap-2">
                  <CalendarDays size={12} className="text-muted-foreground" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Today's P&L</span>
                </div>
              )}
            </div>
            <h2 className={`${isSmall ? 'text-2xl' : isLarge ? 'text-5xl' : 'text-3xl'} font-black tracking-tight mb-2 ${isPnLPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPnLPositive ? '+' : ''}{formatCurrency(convertCurrency(dailyPnL, currency, rates), currency)}
            </h2>
            <div className={`inline-flex px-3 py-1 rounded-xl ${isSmall ? 'text-xs' : 'text-sm'} font-black w-fit ${isPnLPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
              {dailyPnLPercent >= 0 ? '+' : ''}{dailyPnLPercent.toFixed(2)}%
            </div>
            {!isSmall && (
              <div className="mt-auto pt-2 text-[10px] font-bold text-muted-foreground">
                vs Previous Close
              </div>
            )}
            {isLarge && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground mb-2">Biggest Movers Today</div>
                <div className="space-y-2">
                  {holdings
                    .filter(h => h.dayChange)
                    .sort((a, b) => Math.abs(b.dayChange || 0) - Math.abs(a.dayChange || 0))
                    .slice(0, 4)
                    .map(h => (
                      <div key={h.ticker} className="flex items-center justify-between">
                        <span className="font-bold text-sm">{h.ticker}</span>
                        <span className={`text-sm font-bold ${(h.dayChangePercent || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {((h.dayChangePercent || 0) >= 0 ? '+' : '')}{(h.dayChangePercent || 0).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'total-gain':
        const isGainPositive = (summary?.totalGain || 0) >= 0;
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-xl ${isGainPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                {isGainPositive ? <TrendingUp className="text-emerald-500" size={20} /> : <TrendingDown className="text-rose-500" size={20} />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">All-Time Performance</span>
            </div>

            <div className="flex items-baseline gap-4 mb-4 flex-wrap">
              <h2 className={`${isLarge ? 'text-5xl' : 'text-4xl'} font-black tracking-tight ${isGainPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {formatCurrency(convertCurrency(summary?.totalGain || 0, currency, rates), currency)}
              </h2>
              <div className={`px-4 py-1.5 rounded-xl text-base font-black ${isGainPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                {formatPercentage(summary?.totalGainPercent || 0)}
              </div>
            </div>

            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.abs(summary?.totalGainPercent || 0) * 2)}%` }}
                className={`h-full ${isGainPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
              />
            </div>

            {isLarge && (
              <div className="mt-auto pt-6 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <div className="text-[10px] text-muted-foreground font-bold mb-1">Invested</div>
                  <div className="font-black text-sm">{formatCurrency(convertCurrency(summary?.totalInvested || 0, currency, rates), currency)}</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <div className="text-[10px] text-muted-foreground font-bold mb-1">Current</div>
                  <div className="font-black text-sm">{formatCurrency(convertCurrency(summary?.totalMarketValue || 0, currency, rates), currency)}</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                  <div className="text-[10px] text-muted-foreground font-bold mb-1">Today</div>
                  <div className={`font-black text-sm ${dailyPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {dailyPnL >= 0 ? '+' : ''}{formatCurrency(convertCurrency(dailyPnL, currency, rates), currency)}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      // Portfolio Widgets
      case 'holdings':
        const holdingsLimit = isLarge ? holdings.length : 5;
        return (
          <div className="h-full overflow-auto -mx-2">
            <HoldingsTable
              holdings={holdings.slice(0, holdingsLimit)}
              currency={currency}
              exchangeRates={rates}
              compact
            />
            {!isLarge && holdings.length > 5 && (
              <div className="text-center mt-2 text-xs text-muted-foreground">
                +{holdings.length - 5} more holdings
              </div>
            )}
          </div>
        );

      case 'sector-allocation':
        return (
          <SectorAllocationChart
            holdings={holdings}
            currency={currency}
            exchangeRates={rates}
          />
        );

      case 'recent-trades':
        const tradesLimit = isLarge ? 15 : isSmall ? 3 : 8;
        return (
          <div className="h-full overflow-auto -mx-2">
            <TradeHistory
              trades={trades.slice(0, tradesLimit)}
              currency={currency}
              exchangeRates={rates}
              onTradeDeleted={() => fetchPortfolio(true)}
              onTradeEdit={handleEditTrade}
              compact
            />
          </div>
        );

      case 'top-performers':
        const topLimit = isLarge ? 10 : isSmall ? 3 : 5;
        return <TopPerformersWidget holdings={holdingsForPerformers} limit={topLimit} showChart={isLarge} />;

      case 'worst-performers':
        const worstLimit = isLarge ? 10 : isSmall ? 3 : 5;
        return <WorstPerformersWidget holdings={holdingsForPerformers} limit={worstLimit} showChart={isLarge} />;

      // Market Widgets
      case 'market-overview':
        return <MarketOverviewWidget expanded={isLarge} />;

      case 'watchlist-mini':
        return <WatchlistMiniWidget limit={isLarge ? 10 : isSmall ? 3 : 5} />;

      case 'market-news':
        return <MarketNewsWidget limit={isLarge ? 8 : isSmall ? 2 : 4} />;

      case 'upcoming-earnings':
        return <UpcomingEarningsWidget limit={isLarge ? 10 : isSmall ? 3 : 5} />;

      // Tool Widgets
      case 'quick-actions':
        return <QuickActionsWidget compact={isSmall} onEditDashboard={() => setIsEditing(true)} />;

      case 'price-alerts':
        return <PriceAlertsWidget limit={isLarge ? 10 : isSmall ? 2 : 4} />;

      case 'dividend-tracker':
        return <DividendTrackerWidget limit={isLarge ? 10 : isSmall ? 3 : 5} showChart={isLarge} />;

      case 'performance-chart':
        return (
          <PerformanceChart
            holdings={holdings}
            currency={currency}
            exchangeRates={rates}
          />
        );

      default:
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Widget not found
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen text-foreground scroll-smooth relative">
      <main className="px-6 py-10 lg:px-12 max-w-[1600px] mx-auto">
        {/* Intelligence Header */}
        <header className="flex flex-col gap-10 mb-12">
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
                    onClick={() => {
                      setCurrency(c);
                      localStorage.setItem('preferredCurrency', c);
                    }}
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
                title="Refresh data"
              >
                <RefreshCw size={20} className={isRefreshing ? 'animate-spin text-primary' : 'text-foreground'} />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsEditing(!isEditing)}
                className={`p-3.5 rounded-2xl border shadow-md transition-all ${isEditing
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border hover:bg-muted'
                  }`}
                title="Customize dashboard"
              >
                <Settings2 size={20} className={isEditing ? '' : 'text-foreground'} />
              </motion.button>
            </div>
          </div>

        </header>

        {/* Widget Gallery (Slide-in Panel) */}
        <WidgetGallery
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          hiddenWidgets={hiddenWidgets}
          onAddWidget={addWidget}
          onReset={resetLayout}
        />

        {/* Edit Mode Toolbar */}
        <EditToolbar
          isEditing={isEditing}
          onToggleEdit={() => setIsEditing(false)}
          onOpenGallery={() => setIsGalleryOpen(true)}
          hiddenCount={hiddenWidgets.length}
          isSyncing={isSyncing}
        />

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
              holdings.map(h =>
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

        {/* Rapid Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link
            href="/dashboard/import"
            className="flex items-center justify-between p-8 bg-card/60 backdrop-blur-md border border-border/40 rounded-[32px] hover:border-primary/30 transition-all group overflow-hidden relative shadow-lg shadow-black/5"
          >
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload size={24} className="text-foreground" />
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">Bulk Import</h3>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">CSV trade upload</p>
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
                <h3 className="font-black text-lg tracking-tight">New Trade</h3>
                <p className="text-xs text-primary-foreground/70 font-black uppercase tracking-widest">Manual entry</p>
              </div>
            </div>
            <ChevronRight size={24} />
            <div className="absolute bottom-0 right-0 p-4 opacity-10">
              <TrendingUp size={100} />
            </div>
          </button>
        </div>

        {/* Trade Form */}
        <AnimatePresence>
          {(isFormOpen || editingTrade) && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -40 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -40 }}
              className="overflow-hidden mb-12"
            >
              <div className="pb-8 pt-4">
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

        {/* ============ WIDGET GRID ============ */}
        <section className="mb-12">
          <DashboardGrid
            isEditing={isEditing}
            layouts={layouts}
            visibleWidgets={visibleWidgetIds}
            widgetSizes={widgetSizes}
            onLayoutChange={saveLayouts}
            onRemoveWidget={removeWidget}
            onResizeWidget={resizeWidget}
            renderWidget={renderWidgetContent}
            widgetRegistry={WIDGET_DEFINITIONS}
          />
        </section>

        {/* Neural Hub Footer */}
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
      </main>

      <style jsx global>{`
        .text-glow-primary {
          text-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}