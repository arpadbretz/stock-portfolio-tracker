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
import AssetAllocationChart from '@/components/AssetAllocationChart';
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
  RecentAlertsWidget,
  MarketOverviewWidget,
  PerformanceChartWidget,
  WealthCompositionWidget,
  MarketPulseWidget,
  PortfolioIntelligenceWidget,
} from '@/components/DashboardWidgetComponents';
import { CashBalanceWidget } from '@/components/CashBalanceWidget';


import { CashTransactionModal } from '@/components/CashTransactionModal';
import { UnifiedTransaction } from '@/components/TradeHistory';

export default function DashboardPage() {
  const [portfolio, setPortfolio] = useState<{
    id: string;
    trades: Trade[];
    summary: PortfolioSummary;
    lastUpdated: string;
  } | null>(null);

  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>(new Date().toISOString());
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isStealthMode, setIsStealthMode] = useState(false);

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
    if (savedCurrency && ['USD', 'EUR', 'HUF', 'GBP'].includes(savedCurrency)) {
      setCurrency(savedCurrency as CurrencyCode);
    }
  }, []);

  // Trigger welcome email check for new users
  useEffect(() => {
    if (user && !authLoading) {
      // Small delay to ensure everything is loaded, fire and forget
      const timer = setTimeout(() => {
        fetch('/api/auth/welcome', { method: 'POST' }).catch(err =>
          console.error('Failed to trigger welcome email:', err)
        );
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchTransactions = useCallback(async (portfolioId: string) => {
    try {
      const res = await fetch(`/api/portfolio/transactions?portfolioId=${portfolioId}&limit=50`);
      const result = await res.json();
      if (result.success) {
        setTransactions(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
  }, []);

  const fetchPortfolio = useCallback(async (background = false, specificPortfolioId?: string) => {
    if (!background) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const queryId = specificPortfolioId || (portfolio?.id ? portfolio.id : '');
      const url = `/api/portfolio${queryId ? `?id=${queryId}` : ''}${queryId ? '&' : '?'}refresh=${background}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setPortfolio(result.data);
        if (result.data.id) {
          fetchTransactions(result.data.id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [portfolio?.id, fetchTransactions]);

  /**
   * Triggers the history sync engine to generate snapshots for the chart
   */
  const syncHistory = useCallback(async (force = false) => {
    if (!portfolio?.id) return;

    // Manual sync (force=true) should show loading state
    if (force) setIsRefreshing(true);

    try {
      console.log('🔄 Triggering history sync for current portfolio...');
      const res = await fetch(`/api/cron/sync-history?portfolioId=${portfolio.id}`);
      const data = await res.json();
      if (data.success) {
        console.log('✅ History sync complete:', data.synced, 'days synced');
        setLastSyncedAt(new Date().toISOString());
        // If we force sync (from button), we should refetch everything to update the UI
        if (force) {
          await fetchPortfolio(true);
        }
      }
    } catch (err) {
      console.error('❌ History sync failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [portfolio?.id, fetchPortfolio]);

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
    // Refresh prices every 15 minutes - but only if user is active/tab is focused
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchPortfolio(false); // Soft refresh: uses cache if valid (< 15 mins)
      }
    }, 15 * 60 * 1000);

    // Refresh history snapshots every hour while app is open
    const historyInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        syncHistory();
      }
    }, 60 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearInterval(historyInterval);
    };
  }, [fetchPortfolio, syncHistory, user]);

  const handlePortfolioChange = (newPortfolioId: string) => {
    fetchPortfolio(false, newPortfolioId);
  };

  const handleEditTrade = (trade: any) => {
    setEditingTrade(trade);
    if (trade.type === 'stock') {
      setIsFormOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsCashModalOpen(true);
    }
  };

  const handleCashTransaction = async (tx: any) => {
    try {
      const res = await fetch('/api/cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tx,
          portfolio_id: portfolio?.id
        })
      });
      const result = await res.json();
      if (result.success) {
        setIsCashModalOpen(false);
        fetchPortfolio(true);
      }
    } catch (err) {
      console.error('Failed to add cash tx:', err);
    }
  };

  if (authLoading || (isLoading && !portfolio) || !widgetsLoaded) {
    return <SkeletonDashboard />;
  }

  const summary = portfolio?.summary;
  const trades = portfolio?.trades || [];
  const lastUpdated = portfolio?.lastUpdated;
  const rates = summary?.exchangeRates || { USD: 1, EUR: 0.92, HUF: 350, GBP: 0.79 };
  const holdings = summary?.holdings || [];

  // Use pre-calculated Daily P&L from summary
  const dailyPnL = summary?.dailyPnL || 0;
  const dailyPnLPercent = summary?.dailyPnLPercent || 0;
  const fxPnL = summary?.fxPnL || 0;

  // Prepare holdings data for performer widgets
  const holdingsForPerformers = holdings.map(h => ({
    symbol: h.ticker,
    name: h.ticker, // Holding type doesn't have name, use ticker
    gainPercent: h.unrealizedGainPercent || 0,
    gain: h.unrealizedGain || 0,
    dayChangePercent: h.dayChangePercent || 0,
    value: h.marketValue || 0,
  }));


  // ============ WIDGET CONTENT RENDERER ============
  // Now receives size parameter to adapt content
  type WidgetSize = 'small' | 'medium' | 'large';

  const renderWidgetContent = (widgetId: string, size: WidgetSize = 'medium'): ReactNode => {
    const isSmall = size === 'small';
    const isLarge = size === 'large';

    switch (widgetId) {
      // Core Metrics
      case 'net-worth':
        const totalReturnPercent = summary?.totalGainPercent || 0;
        const totalReturnValue = summary?.totalGain || 0;
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col justify-between relative overflow-hidden"
          >
            {/* Decorative orb */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className={`flex items-center justify-between ${isSmall ? 'mb-1' : 'mb-4'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Net Worth</span>
                  <div className={`${isSmall ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl bg-primary/10 flex items-center justify-center`}>
                    <Wallet size={isSmall ? 14 : 18} className="text-primary" />
                  </div>
                </div>
                <h2 className={`${isSmall ? 'text-2xl' : isLarge ? 'text-5xl' : 'text-3xl'} font-black tracking-tight blur-stealth`}>
                  {formatCurrency(convertCurrency(summary?.totalPortfolioValue || 0, currency, rates), currency)}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <div className={`px-2 py-0.5 rounded-lg text-[10px] font-black border flex items-center gap-1 ${(summary?.totalGain ?? 0) >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                  {(summary?.totalGain ?? 0) >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {formatPercentage(summary?.totalGainPercent || 0)}
                </div>
              </div>
            </div>

            {isLarge && (
              <div className="mt-4 pt-4 border-t border-border/50 grid grid-cols-2 gap-4 relative z-10">
                <div className="p-3 bg-muted/30 rounded-xl">
                  <div className="text-[10px] text-muted-foreground font-bold mb-1">Cost Basis</div>
                  <div className="font-black blur-stealth">{formatCurrency(convertCurrency(summary?.totalInvested || 0, currency, rates), currency)}</div>
                </div>
                <div className="p-3 bg-muted/30 rounded-xl">
                  <div className="text-[10px] text-muted-foreground font-bold mb-1">Unrealized</div>
                  <div className={`font-black blur-stealth ${(summary?.totalGain || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {formatCurrency(convertCurrency(summary?.totalGain || 0, currency, rates), currency)}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        );

      case 'total-invested':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="h-full flex flex-col justify-between relative overflow-hidden"
          >
            {/* Decorative orb */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16" />
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className={`flex items-center justify-between ${isSmall ? 'mb-1' : 'mb-4'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Invested</span>
                  <div className={`${isSmall ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl bg-blue-500/10 flex items-center justify-center`}>
                    <BarChart3 size={isSmall ? 14 : 18} className="text-blue-500" />
                  </div>
                </div>
                <h2 className={`${isSmall ? 'text-2xl' : isLarge ? 'text-5xl' : 'text-3xl'} font-black tracking-tight blur-stealth`}>
                  {formatCurrency(convertCurrency(summary?.totalInvested || 0, currency, rates), currency)}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <div className="px-2 py-0.5 rounded-lg text-[10px] font-black border border-blue-500/20 bg-blue-500/10 text-blue-500">
                  {holdings.length} Assets
                </div>
              </div>
            </div>
            {isLarge && summary && (
              <div className="mt-4 pt-4 border-t border-border/50 relative z-10">
                <div className="text-xs text-muted-foreground mb-2">Top Allocations</div>
                <div className="space-y-2">
                  {holdings.slice(0, 5).map(h => (
                    <div key={h.ticker} className="flex items-center justify-between">
                      <span className="font-bold text-sm">{h.ticker}</span>
                      <span className="text-sm text-muted-foreground blur-stealth">{formatCurrency(convertCurrency(h.totalInvested, currency, rates), currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        );

      case 'daily-pnl':
        const isPnLPositive = dailyPnL >= 0;
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="h-full flex flex-col justify-between relative overflow-hidden"
          >
            {/* Decorative orb */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 ${isPnLPositive ? 'bg-emerald-500/5' : 'bg-rose-500/5'
              }`} />

            <div className="relative z-10">
              <div className={`flex items-center justify-between ${isSmall ? 'mb-2' : 'mb-4'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Day Change</span>
                <div className={`${isSmall ? 'w-8 h-8' : 'w-10 h-10'} rounded-xl flex items-center justify-center ${isPnLPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                  }`}>
                  {isPnLPositive ? <ArrowUpRight size={isSmall ? 14 : 18} className="text-emerald-500" /> : <ArrowDownRight size={isSmall ? 14 : 18} className="text-rose-500" />}
                </div>
              </div>
              <h2 className={`${isSmall ? 'text-2xl' : isLarge ? 'text-5xl' : 'text-3xl'} font-black tracking-tight mb-2 ${isPnLPositive ? 'text-emerald-500' : 'text-rose-500'} blur-stealth`}>
                {isPnLPositive ? '+' : ''}{formatCurrency(convertCurrency(dailyPnL, currency, rates), currency)}
              </h2>
              <div className="flex items-center gap-2">
                <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border ${isPnLPositive
                  ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                  : 'border-rose-500/30 text-rose-500 bg-rose-500/5'
                  }`}>
                  {isPnLPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {(dailyPnLPercent ?? 0) >= 0 ? '+' : ''}{(dailyPnLPercent ?? 0).toFixed(2)}%
                </div>
                <span className="text-xs text-muted-foreground font-bold">Today</span>
              </div>
            </div>

            {isLarge && (
              <div className="mt-4 pt-4 border-t border-border/50 relative z-10">
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
          </motion.div>
        );

      case 'total-gain':
        const isGainPositive = (summary?.totalGain || 0) >= 0;
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="h-full flex flex-col justify-between relative overflow-hidden"
          >
            {/* Decorative orb */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 ${isGainPositive ? 'bg-emerald-500/5' : 'bg-rose-500/5'
              }`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Return</span>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isGainPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                  }`}>
                  {isGainPositive ? <TrendingUp className="text-emerald-500" size={20} /> : <TrendingDown className="text-rose-500" size={20} />}
                </div>
              </div>

              <div className="mb-4">
                <h2 className={`${isLarge ? 'text-5xl' : 'text-3xl'} font-black tracking-tight mb-2 blur-stealth`}>
                  {formatCurrency(convertCurrency(summary?.totalGain || 0, currency, rates), currency)}
                </h2>
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold border ${isGainPositive
                    ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                    : 'border-rose-500/30 text-rose-500 bg-rose-500/5'
                    }`}>
                    {isGainPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {formatPercentage(summary?.totalGainPercent || 0)}
                  </div>
                  <span className="text-xs text-muted-foreground font-bold">All time</span>
                </div>
              </div>
            </div>

            {!isSmall && (
              <div className={`grid ${isLarge ? 'grid-cols-3 gap-4' : 'grid-cols-1 gap-2'} mt-2 relative z-10`}>
                <div className={`flex ${isLarge ? 'flex-col items-center p-3' : 'justify-between items-center p-2'} bg-muted/20 hover:bg-muted/30 transition-colors rounded-xl border border-border/10`}>
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Invested</div>
                  <div className="font-black text-sm blur-stealth">{formatCurrency(convertCurrency(summary?.totalInvested || 0, currency, rates), currency)}</div>
                </div>
                <div className={`flex ${isLarge ? 'flex-col items-center p-3' : 'justify-between items-center p-2'} bg-muted/20 hover:bg-muted/30 transition-colors rounded-xl border border-border/10`}>
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Current</div>
                  <div className="font-black text-sm blur-stealth">{formatCurrency(convertCurrency(summary?.totalMarketValue || 0, currency, rates), currency)}</div>
                </div>
                <div className={`flex ${isLarge ? 'flex-col items-center p-3' : 'justify-between items-center p-2'} bg-muted/20 hover:bg-muted/30 transition-colors rounded-xl border border-border/10`}>
                  <div className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Today</div>
                  <div className={`font-black text-sm blur-stealth ${dailyPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {dailyPnL >= 0 ? '+' : ''}{formatCurrency(convertCurrency(dailyPnL, currency, rates), currency)}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
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
              cashBalance={summary?.cashBalance}
              cashBalances={summary?.cashBalances}
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
            cashBalances={summary?.cashBalances}
            size={size}
          />
        );

      case 'recent-trades':
        const tradesLimit = isLarge ? 15 : isSmall ? 3 : 8;
        return (
          <div className="h-full overflow-auto -mx-2">
            <TradeHistory
              transactions={transactions.slice(0, tradesLimit)}
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
        return (
          <TopPerformersWidget
            holdings={holdingsForPerformers}
            limit={topLimit}
            showChart={isLarge}
            showDailyMovers={true}
            currency={currency}
            exchangeRates={rates}
            isStealthMode={isStealthMode}
          />
        );

      case 'worst-performers':
        const worstLimit = isLarge ? 10 : isSmall ? 3 : 5;
        return (
          <WorstPerformersWidget
            holdings={holdingsForPerformers}
            limit={worstLimit}
            showChart={isLarge}
            showDailyMovers={true}
            currency={currency}
            exchangeRates={rates}
            isStealthMode={isStealthMode}
          />
        );


      // Market Widgets
      case 'market-overview':
        return <MarketOverviewWidget expanded={isLarge} />;

      case 'watchlist-mini':
        return (
          <WatchlistMiniWidget
            limit={isLarge ? 10 : isSmall ? 3 : 5}
            currency={currency}
            exchangeRates={rates}
            isStealthMode={isStealthMode}
          />
        );


      // Tool Widgets
      case 'quick-actions':
        return (
          <QuickActionsWidget
            compact={isSmall}
            onEditDashboard={() => setIsEditing(true)}
            onTradeAction={() => setIsFormOpen(true)}
            onCashAction={() => setIsCashModalOpen(true)}
          />
        );

      case 'price-alerts':
        return <PriceAlertsWidget limit={isLarge ? 10 : isSmall ? 2 : 4} />;

      case 'recent-alerts':
        return <RecentAlertsWidget limit={isLarge ? 10 : isSmall ? 3 : 5} />;

      case 'asset-allocation':
        return (
          <AssetAllocationChart
            holdings={holdings}
            currency={currency}
            exchangeRates={rates}
            size={size}
            cashBalance={summary?.cashBalance}
            cashBalances={summary?.cashBalances}
          />
        );

      case 'performance-line':
        return (
          <PerformanceChartWidget
            portfolioId={portfolio?.id}
            refreshKey={lastSyncedAt}
          />
        );

      case 'cash-balance':
        return (
          <CashBalanceWidget
            portfolioId={portfolio?.id}
            currency={currency}
            exchangeRates={rates}
            isStealthMode={isStealthMode}
            expanded={isLarge}
          />
        );

      case 'wealth-composition':
        return (
          <WealthCompositionWidget
            summary={summary}
            isStealthMode={isStealthMode}
            currency={currency}
            exchangeRates={rates}
          />
        );

      case 'market-pulse':
        return <MarketPulseWidget />;

      case 'portfolio-intelligence':
        return <PortfolioIntelligenceWidget holdings={holdings} isStealthMode={isStealthMode} />;

      default:
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Widget not found
          </div>
        );
    }
  };

  return (
    <div className={`p-6 transition-all duration-300 ${isStealthMode ? 'stealth-active' : ''}`}>

      {/* Intelligence Header */}
      <header className="flex flex-col gap-10 mb-12">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tight">Dashboard</h1>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
                <div className="w-2 h-2 bg-primary rounded-full pulse-glow" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Live</span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Last updated: <span className="text-foreground font-bold">
                {lastUpdated
                  ? (() => {
                    const now = new Date();
                    const updated = new Date(lastUpdated);
                    const diffMs = now.getTime() - updated.getTime();
                    const diffMins = Math.floor(diffMs / 60000);
                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
                    const diffHours = Math.floor(diffMins / 60);
                    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
                    return updated.toLocaleTimeString();
                  })()
                  : '--:--'
                }
              </span>
            </p>
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
              onClick={() => syncHistory(true)}
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

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsStealthMode(!isStealthMode)}
              className={`p-3.5 rounded-2xl border shadow-md transition-all ${isStealthMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                : 'bg-card border-border hover:bg-muted'
                }`}
              title={isStealthMode ? "Disable Stealth Mode" : "Enable Stealth Mode"}
            >
              <Zap size={20} className={isStealthMode ? "fill-amber-500" : "text-foreground"} />
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
          onClick={() => syncHistory(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          Sync & Refresh
        </button>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl font-bold text-sm transition-all"
        >
          <PlusCircle size={16} />
          Add Trade
        </button>

        <button
          onClick={() => setIsCashModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-xl font-bold text-sm transition-all"
        >
          <Wallet size={16} />
          Liquid Assets
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
              `${h.ticker},${h.shares},${(h.avgCostBasis ?? 0).toFixed(2)},${(h.currentPrice ?? 0).toFixed(2)},${(h.marketValue ?? 0).toFixed(2)},${(h.unrealizedGain ?? 0).toFixed(2)}`
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

        <button
          onClick={() => setIsCashModalOpen(true)}
          className="flex items-center justify-between p-8 bg-blue-600 text-white rounded-[32px] shadow-2xl shadow-blue-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all group relative overflow-hidden"
        >
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Wallet size={28} />
            </div>
            <div className="text-left">
              <h3 className="font-black text-lg tracking-tight">Liquid Assets</h3>
              <p className="text-xs text-blue-100/70 font-black uppercase tracking-widest">Cash management</p>
            </div>
          </div>
          <ChevronRight size={24} />
          <div className="absolute bottom-0 right-0 p-4 opacity-10">
            <Activity size={100} />
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
                  syncHistory(); // Background history update after trade
                  setIsFormOpen(false);
                  setEditingTrade(null);
                }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cash Transaction Modal */}
      <AnimatePresence>
        {isCashModalOpen && (
          <CashTransactionModal
            onClose={() => {
              setIsCashModalOpen(false);
              setEditingTrade(null);
            }}
            onSubmit={handleCashTransaction}
            currency={currency}
            editTransaction={editingTrade}
          />
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

      <style jsx global>{`
        .text-glow-primary {
          text-shadow: 0 0 40px rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </div>
  );
}