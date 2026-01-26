'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
    Star,
    ExternalLink,
    Calendar,
    DollarSign,
    Bell,
    Plus,
    Search,
    FileText,
    Activity,
    Settings,
    Sparkles,
    Clock,
} from 'lucide-react';
import { formatCurrency, convertCurrency } from '@/lib/portfolio';
import { CurrencyCode } from '@/types/portfolio';


// ============ MARKET OVERVIEW WIDGET ============
interface MarketIndex {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
}

export function MarketOverviewWidget({ expanded = false }: { expanded?: boolean }) {
    const [indices, setIndices] = useState<MarketIndex[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        // Fetch market indices
        const fetchIndices = async () => {
            try {
                setHasError(false);
                const symbols = expanded
                    ? ['^GSPC', '^IXIC', '^DJI', '^VIX', 'USDEUR=X', 'USDHUF=X']
                    : ['^GSPC', '^IXIC', '^DJI', '^VIX'];
                const promises = symbols.map(async (symbol) => {
                    try {
                        const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}`);
                        const data = await res.json();
                        if (data.success && data.data?.price) {
                            let name = symbol;
                            if (symbol === '^GSPC') name = 'S&P 500';
                            else if (symbol === '^IXIC') name = 'NASDAQ';
                            else if (symbol === '^DJI') name = 'DOW';
                            else if (symbol === '^VIX') name = 'VIX';
                            else if (symbol === 'USDEUR=X') name = 'USD/EUR';
                            else if (symbol === 'USDHUF=X') name = 'USD/HUF';

                            return {
                                symbol,
                                name,
                                price: data.data.price,
                                change: data.data.change || 0,
                                changePercent: data.data.changePercent || 0,
                            };
                        }
                    } catch {
                        return null;
                    }
                    return null;
                });
                const results = (await Promise.all(promises)).filter(Boolean) as MarketIndex[];
                setIndices(results);
                if (results.length === 0) {
                    setHasError(true);
                }
            } catch (e) {
                console.error('Failed to fetch market indices:', e);
                setHasError(true);
            } finally {
                setIsLoading(false);
            }
        };

        fetchIndices();
        const interval = setInterval(fetchIndices, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    if (isLoading) {
        return (
            <div className={`grid ${expanded ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'} gap-3`}>
                {[1, 2, 3, 4, 5, 6].slice(0, expanded ? 6 : 4).map(i => (
                    <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (hasError || indices.length === 0) {
        return (
            <div className="text-center py-8">
                <Activity size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Market data unavailable</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Check back during market hours</p>
            </div>
        );
    }

    return (
        <div className={`grid ${expanded ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2'} gap-3`}>
            {indices.map((index) => {
                const isPositive = (index.changePercent ?? 0) >= 0;
                return (
                    <div
                        key={index.symbol}
                        className={`p-3 rounded-xl border ${isPositive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}
                    >
                        <div className="text-xs font-bold text-muted-foreground mb-1">{index.name}</div>
                        <div className={`font-black ${expanded ? 'text-xl' : 'text-lg'}`}>{(index.price ?? 0).toLocaleString()}</div>
                        <div className={`text-xs font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {isPositive ? '+' : ''}{(index.changePercent ?? 0).toFixed(2)}%
                        </div>
                        {expanded && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                                {isPositive ? '+' : ''}{(index.change ?? 0).toFixed(2)} pts
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ============ TOP PERFORMERS WIDGET ============
interface PerformerProps {
    holdings?: Array<{
        symbol: string;
        name: string;
        gainPercent: number;
        gain: number;
        dayChangePercent?: number;
        value?: number;
    }>;
    limit?: number;
    showChart?: boolean;
    showDailyMovers?: boolean;
    currency?: CurrencyCode;
    exchangeRates?: Record<string, number>;
    isStealthMode?: boolean;
}


export function TopPerformersWidget({
    holdings = [],
    limit = 5,
    showChart = false,
    showDailyMovers = false,
    currency = 'USD',
    exchangeRates = { USD: 1 },
    isStealthMode = false
}: PerformerProps) {
    const [view, setView] = useState<'daily' | 'total'>(showDailyMovers ? 'daily' : 'total');

    // Filter and sort based on view (Best first)
    const sorted = view === 'daily'
        ? [...holdings]
            .filter(h => h.dayChangePercent !== undefined)
            .sort((a, b) => (b.dayChangePercent || 0) - (a.dayChangePercent || 0))
            .slice(0, limit)
        : [...holdings].sort((a, b) => b.gainPercent - a.gainPercent).slice(0, limit);

    if (sorted.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No holdings yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* View Toggle */}
            <div className="flex items-center justify-center bg-muted/30 p-1 rounded-xl border border-border/50">
                <button
                    onClick={() => setView('total')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'total' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    All-time
                </button>
                <button
                    onClick={() => setView('daily')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'daily' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Daily Movers
                </button>
            </div>

            <div className="space-y-3">
                {sorted.map((holding, i) => {
                    const changePercent = view === 'daily' ? (holding.dayChangePercent || 0) : (holding.gainPercent || 0);
                    const isUp = changePercent >= 0;

                    return (
                        <motion.div
                            key={holding.symbol}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Link
                                href={`/dashboard/ticker/${holding.symbol}`}
                                className="flex items-center justify-between p-3 rounded-2xl bg-card/50 hover:bg-muted/30 border border-border/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${isUp ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                                        }`}>
                                        <span className={`text-[10px] font-black ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {holding.symbol.slice(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-black text-sm">{holding.symbol}</div>
                                        {showChart && <div className="text-[10px] text-muted-foreground font-bold truncate max-w-[80px]">{holding.name}</div>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${isUp
                                        ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                                        : 'border-rose-500/30 text-rose-500 bg-rose-500/5'
                                        }`}>
                                        {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                        {isUp ? '+' : ''}{changePercent.toFixed(2)}%
                                    </div>
                                    {holding.value !== undefined && (
                                        <div className={`text-[10px] font-bold text-muted-foreground mt-1 ${isStealthMode ? 'blur-stealth' : ''}`}>
                                            {formatCurrency(convertCurrency(holding.value, currency, exchangeRates), currency)}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

// ============ WORST PERFORMERS WIDGET ============
export function WorstPerformersWidget({
    holdings = [],
    limit = 5,
    showChart = false,
    showDailyMovers = false,
    currency = 'USD',
    exchangeRates = { USD: 1 },
    isStealthMode = false
}: PerformerProps) {
    const [view, setView] = useState<'daily' | 'total'>(showDailyMovers ? 'daily' : 'total');

    // Filter and sort based on view (Worst first)
    const sorted = view === 'daily'
        ? [...holdings]
            .filter(h => h.dayChangePercent !== undefined)
            .sort((a, b) => (a.dayChangePercent || 0) - (b.dayChangePercent || 0))
            .slice(0, limit)
        : [...holdings].sort((a, b) => a.gainPercent - b.gainPercent).slice(0, limit);

    if (sorted.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <TrendingDown size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No holdings yet</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* View Toggle */}
            <div className="flex items-center justify-center bg-muted/30 p-1 rounded-xl border border-border/50">
                <button
                    onClick={() => setView('total')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'total' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    All-time
                </button>
                <button
                    onClick={() => setView('daily')}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${view === 'daily' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Daily Movers
                </button>
            </div>

            <div className="space-y-3">
                {sorted.map((holding, i) => {
                    const changePercent = view === 'daily' ? (holding.dayChangePercent || 0) : (holding.gainPercent || 0);
                    const isUp = changePercent >= 0;

                    return (
                        <motion.div
                            key={holding.symbol}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Link
                                href={`/dashboard/ticker/${holding.symbol}`}
                                className="flex items-center justify-between p-3 rounded-2xl bg-card/50 hover:bg-muted/30 border border-border/30 transition-all cursor-pointer group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${isUp ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                                        }`}>
                                        <span className={`text-[10px] font-black ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {holding.symbol.slice(0, 2)}
                                        </span>
                                    </div>
                                    <div>
                                        <div className="font-black text-sm">{holding.symbol}</div>
                                        {showChart && <div className="text-[10px] text-muted-foreground font-bold truncate max-w-[80px]">{holding.name}</div>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${isUp
                                        ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                                        : 'border-rose-500/30 text-rose-500 bg-rose-500/5'
                                        }`}>
                                        {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                        {isUp ? '+' : ''}{changePercent.toFixed(2)}%
                                    </div>
                                    {holding.value !== undefined && (
                                        <div className={`text-[10px] font-bold text-muted-foreground mt-1 ${isStealthMode ? 'blur-stealth' : ''}`}>
                                            {formatCurrency(convertCurrency(holding.value, currency, exchangeRates), currency)}
                                        </div>
                                    )}
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}


// ============ WATCHLIST MINI WIDGET ============
interface WatchlistItem {
    symbol: string;
    // name: string; // Removed as per new structure, not used in the new display
    price: number;
    changePercent: number;
    fiftyTwoWeekLow?: number;
    fiftyTwoWeekHigh?: number;
    earningsDate?: string;
}

export function WatchlistMiniWidget({
    limit = 5,
    currency = 'USD',
    exchangeRates = { USD: 1 },
    isStealthMode = false
}: {
    limit?: number;
    currency?: CurrencyCode;
    exchangeRates?: Record<string, number>;
    isStealthMode?: boolean;
}) {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                const res = await fetch('/api/watchlist');
                const data = await res.json();
                if (data.success && data.data) {
                    // Fetch real-time prices for items that don't have them
                    const itemsWithPrices = await Promise.all(
                        data.data.slice(0, limit).map(async (item: any) => {
                            try {
                                const priceRes = await fetch(`/api/stock/${item.symbol}`);
                                const priceData = await priceRes.json();
                                return {
                                    ...item,
                                    price: priceData.data?.price || item.added_price,
                                    changePercent: priceData.data?.changePercent || 0,
                                    fiftyTwoWeekLow: priceData.data?.fiftyTwoWeekLow,
                                    fiftyTwoWeekHigh: priceData.data?.fiftyTwoWeekHigh,
                                    earningsDate: priceData.data?.earningsDate,
                                };
                            } catch {
                                return item;
                            }
                        })
                    );
                    setWatchlist(itemsWithPrices);
                }
            } catch (e) {
                console.error('Failed to fetch watchlist:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWatchlist();
    }, [limit]);

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (watchlist.length === 0) {
        return (
            <div className="text-center py-8">
                <Star size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No watched stocks</p>
                <Link href="/dashboard/watchlist" className="text-primary text-sm font-bold hover:underline mt-2 inline-block">
                    Add stocks →
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {watchlist.map((item) => {
                const isPositive = (item.changePercent ?? 0) >= 0;

                // Smart Badges
                const nearLow = item.price && item.fiftyTwoWeekLow && item.price <= (item.fiftyTwoWeekLow * 1.05);
                const nearHigh = item.price && item.fiftyTwoWeekHigh && item.price >= (item.fiftyTwoWeekHigh * 0.95);

                let earningsSoon = false;
                if (item.earningsDate) {
                    const eDate = new Date(item.earningsDate);
                    const now = new Date();
                    const diff = (eDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                    earningsSoon = diff >= 0 && diff <= 7;
                }

                return (
                    <Link
                        key={item.symbol}
                        href={`/dashboard/ticker/${item.symbol}`}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors group relative overflow-hidden"
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center font-black text-[10px] group-hover:border-primary/30 transition-colors">
                                {item.symbol.slice(0, 2)}
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black">{item.symbol}</span>
                                    {nearLow && (
                                        <div className="px-1.5 py-0.5 rounded-[4px] bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-tighter shadow-sm animate-pulse">
                                            Near Low
                                        </div>
                                    )}
                                    {nearHigh && (
                                        <div className="px-1.5 py-0.5 rounded-[4px] bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-tighter shadow-sm">
                                            Near High
                                        </div>
                                    )}
                                    {earningsSoon && (
                                        <div className="px-1.5 py-0.5 rounded-[4px] bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-tighter shadow-sm">
                                            Earnings
                                        </div>
                                    )}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-bold leading-none">
                                    NASDAQ
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className={`text-xs font-black ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {isPositive ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
                            </div>
                            {item.price && (
                                <div className={`text-[10px] text-muted-foreground font-bold ${isStealthMode ? 'blur-stealth' : ''}`}>
                                    {formatCurrency(convertCurrency(item.price, currency, exchangeRates), currency)}
                                </div>
                            )}
                        </div>
                    </Link>
                );
            })}
            <Link href="/dashboard/watchlist" className="block text-center text-primary text-xs font-bold hover:underline mt-3">
                View all →
            </Link>
        </div>
    );
}

// ============ QUICK ACTIONS WIDGET ============
interface QuickActionsProps {
    compact?: boolean;
    onEditDashboard?: () => void;
    onTradeAction?: () => void;
}

export function QuickActionsWidget({ compact = false, onEditDashboard, onTradeAction }: QuickActionsProps) {
    const actions = [
        { icon: <Plus size={compact ? 14 : 16} />, label: 'Trade', onClick: onTradeAction, color: 'bg-emerald-500/10 text-emerald-500' },
        { icon: <Search size={compact ? 14 : 16} />, label: 'Search', href: '/dashboard/stocks', color: 'bg-blue-500/10 text-blue-500' },
        { icon: <Bell size={compact ? 14 : 16} />, label: 'Alerts', href: '/dashboard/alerts', color: 'bg-orange-500/10 text-orange-500' },
        { icon: <FileText size={compact ? 14 : 16} />, label: 'Report', href: '/dashboard/report', color: 'bg-purple-500/10 text-purple-500' },
    ];

    return (
        <div className="flex flex-col h-full justify-center gap-3">
            <div className={`grid ${compact ? 'grid-cols-4 gap-1' : 'grid-cols-2 gap-2'}`}>
                {actions.map((action) => {
                    const content = (
                        <div className={`flex flex-col items-center justify-center h-full w-full ${compact ? 'p-2' : 'p-3'} rounded-xl ${action.color} hover:shadow-lg hover:shadow-current/5 transition-all active:scale-95 cursor-pointer`}>
                            {action.icon}
                            <span className={`${compact ? 'text-[9px]' : 'text-xs'} font-bold mt-1`}>{action.label}</span>
                        </div>
                    );

                    if (action.href) {
                        return (
                            <Link key={action.label} href={action.href}>
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <button key={action.label} onClick={action.onClick}>
                            {content}
                        </button>
                    );
                })}
            </div>
            {!compact && onEditDashboard && (
                <button
                    onClick={onEditDashboard}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/10 hover:bg-muted/30 text-muted-foreground hover:text-foreground transition-all text-xs font-bold mt-auto"
                >
                    <Settings size={14} />
                    <span>Customize Dashboard</span>
                </button>
            )}
        </div>
    );
}

// ============ RECENT ALERTS WIDGET ============
interface RecentAlert {
    ticker: string;
    type: 'price_target' | 'analyst' | 'earnings' | 'price_alert';
    message: string;
    time: string; // Relative time like "5 min ago"
    isPositive: boolean;
}

export function RecentAlertsWidget({ limit = 5 }: { limit?: number }) {
    const [alerts, setAlerts] = useState<RecentAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecentAlerts = async () => {
            try {
                // Fetch price alerts
                const alertsRes = await fetch('/api/alerts');
                const alertsData = await alertsRes.json();

                const recentAlerts: RecentAlert[] = [];

                if (alertsData.success && alertsData.data) {
                    // Convert price alerts to recent alerts format
                    alertsData.data.slice(0, limit).forEach((alert: any) => {
                        const currentPrice = alert.currentPrice || 0;
                        const targetPrice = alert.target_price;
                        const isPositive = alert.condition === 'above' ? currentPrice >= targetPrice : currentPrice <= targetPrice;

                        recentAlerts.push({
                            ticker: alert.symbol,
                            type: 'price_alert',
                            message: alert.condition === 'above'
                                ? `Price crossed above $${targetPrice}`
                                : `Price dropped below $${targetPrice}`,
                            time: 'Just now', // Would calculate from timestamp
                            isPositive,
                        });
                    });
                }

                // Sort by time (most recent first) and limit
                setAlerts(recentAlerts.slice(0, limit));
            } catch (e) {
                console.error('Failed to fetch recent alerts:', e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRecentAlerts();
        // Refresh every minute
        const interval = setInterval(fetchRecentAlerts, 60000);
        return () => clearInterval(interval);
    }, [limit]);

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-muted/50 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className="text-center py-8">
                <Sparkles size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No recent alerts</p>
                <Link href="/dashboard/alerts" className="text-primary text-sm font-bold hover:underline mt-2 inline-block">
                    Create alert →
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <AnimatePresence>
                {alerts.map((alert, index) => (
                    <motion.div
                        key={`${alert.ticker}-${index}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Link
                            href={`/dashboard/ticker/${alert.ticker}`}
                            className="flex items-start gap-4 p-4 rounded-2xl bg-card/50 hover:bg-muted/30 border border-border/30 transition-all cursor-pointer"
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${alert.isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                                }`}>
                                <span className={`text-xs font-black ${alert.isPositive ? 'text-emerald-500' : 'text-rose-500'
                                    }`}>
                                    {alert.ticker.slice(0, 2)}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-black text-sm">{alert.ticker}</span>
                                    <div className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-muted/50 text-muted-foreground">
                                        {alert.type.replace('_', ' ')}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground font-medium mb-1">
                                    {alert.message}
                                </p>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock size={12} />
                                    <span className="font-bold">{alert.time}</span>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </AnimatePresence>
            <Link href="/dashboard/alerts" className="block text-center text-primary text-xs font-bold hover:underline mt-3">
                View All Alerts →
            </Link>
        </div>
    );
}

// ============ PRICE ALERTS WIDGET ============
interface Alert {
    id: string;
    symbol: string;
    target_price: number;
    condition: 'above' | 'below';
    currentPrice?: number;
}

export function PriceAlertsWidget({ limit = 5 }: { limit?: number }) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const res = await fetch('/api/alerts');
                const data = await res.json();
                if (data.success && data.data) {
                    setAlerts(data.data.slice(0, limit) || []);
                }
            } catch (e) {
                console.error('Failed to fetch alerts:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAlerts();
    }, [limit]);

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[1, 2].map(i => (
                    <div key={i} className="h-12 bg-muted/50 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className="text-center py-8">
                <Bell size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No active alerts</p>
                <Link href="/dashboard/alerts" className="text-primary text-sm font-bold hover:underline mt-2 inline-block">
                    Create alert →
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {alerts.map((alert) => (
                <div
                    key={alert.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-muted/30"
                >
                    <div className="flex items-center gap-2">
                        <Bell size={14} className="text-orange-500" />
                        <span className="font-bold text-sm">{alert.symbol}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                        {alert.condition === 'above' ? '↑' : '↓'} ${alert.target_price}
                    </div>
                </div>
            ))}
            <Link href="/dashboard/alerts" className="block text-center text-primary text-xs font-bold hover:underline mt-3">
                Manage alerts →
            </Link>
        </div>
    );
}

// ============ DIVIDEND TRACKER WIDGET ============
export function DividendTrackerWidget({ limit = 5, showChart = false }: { limit?: number; showChart?: boolean }) {
    // Placeholder - would fetch from API
    const upcomingDividends = [
        { symbol: 'AAPL', date: '2024-02-15', amount: 0.24 },
        { symbol: 'MSFT', date: '2024-02-20', amount: 0.75 },
    ].slice(0, limit);

    return (
        <div className="space-y-3">
            {upcomingDividends.length === 0 ? (
                <div className="text-center py-8">
                    <DollarSign size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No upcoming dividends</p>
                </div>
            ) : (
                upcomingDividends.map((div) => (
                    <div
                        key={div.symbol}
                        className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/20"
                    >
                        <div className="flex items-center gap-3">
                            <DollarSign size={16} className="text-green-500" />
                            <div>
                                <div className="font-bold text-sm">{div.symbol}</div>
                                <div className="text-xs text-muted-foreground">{div.date}</div>
                            </div>
                        </div>
                        <div className="font-black text-green-500">${div.amount}</div>
                    </div>
                ))
            )}
            {showChart && upcomingDividends.length > 0 && (
                <div className="pt-3 border-t border-border/50">
                    <div className="text-xs text-muted-foreground mb-2">Annual Dividend Income</div>
                    <div className="text-2xl font-black text-green-500">$1,250</div>
                    <div className="text-xs text-muted-foreground">Estimated yearly</div>
                </div>
            )}
        </div>
    );
}

// ============ UPCOMING EARNINGS WIDGET ============
export function UpcomingEarningsWidget({ limit = 5 }: { limit?: number }) {
    // Placeholder - would fetch from API
    const earnings = [
        { symbol: 'NVDA', date: '2024-02-21', estimate: '$4.50' },
        { symbol: 'TSLA', date: '2024-01-24', estimate: '$0.74' },
    ].slice(0, limit);

    return (
        <div className="space-y-2">
            {earnings.length === 0 ? (
                <div className="text-center py-8">
                    <Calendar size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">No upcoming earnings</p>
                </div>
            ) : (
                earnings.map((item) => (
                    <Link
                        key={item.symbol}
                        href={`/dashboard/ticker/${item.symbol}`}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <Calendar size={14} className="text-violet-500" />
                            <div>
                                <div className="font-bold text-sm group-hover:text-primary transition-colors">{item.symbol}</div>
                                <div className="text-xs text-muted-foreground">{item.date}</div>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-muted-foreground">Est: {item.estimate}</div>
                    </Link>
                ))
            )}
        </div>
    );
}

// ============ PERFORMANCE CHART WIDGET ============
import { LineChart as ReLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export function PerformanceChartWidget({ portfolioId, refreshKey }: { portfolioId?: string, refreshKey?: string }) {
    const [data, setData] = useState<any[]>([]);
    const [period, setPeriod] = useState('1Y');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!portfolioId) return;

        const fetchPerformance = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/portfolio/performance?portfolioId=${portfolioId}&period=${period}`);
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (e) {
                console.error('Failed to fetch performance:', e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPerformance();
    }, [portfolioId, period, refreshKey]);

    if (isLoading) {
        return (
            <div className="h-full flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground text-xs animate-pulse font-black uppercase tracking-widest">Analyzing Market Alpha...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                    <Activity size={24} className="text-primary" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest mb-2">No History Recorded</h3>
                <p className="text-xs text-muted-foreground max-w-[200px] mb-4">
                    Trade history is required to generate performance charts. We gather history from your trade log automatically.
                </p>
                <button
                    onClick={async () => {
                        if (!portfolioId) return;
                        setIsLoading(true);
                        try {
                            const res = await fetch(`/api/cron/sync-history?portfolioId=${portfolioId}`);
                            const result = await res.json();
                            if (result.success) {
                                // Successfully synced, now reload the chart data
                                console.log('Sync result:', result);
                                window.location.reload();
                            } else {
                                alert(`Sync failed: ${result.error || 'Unknown error'}`);
                                setIsLoading(false);
                            }
                        } catch (e: any) {
                            console.error('Sync failed:', e);
                            alert(`Sync error: ${e.message || 'Check terminal logs'}`);
                            setIsLoading(false);
                        }
                    }}
                    className="px-4 py-2 bg-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/30 transition-colors disabled:opacity-50"
                    disabled={isLoading}
                >
                    {isLoading ? 'Syncing...' : 'Initialize Sync'}
                </button>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Portfolio</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">S&P 500</span>
                    </div>
                </div>

                <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border/50">
                    {['1W', '1M', '3M', '6M', '1Y', 'YTD', 'ALL'].map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${period === p ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700 }}
                            minTickGap={30}
                            tickFormatter={(str) => {
                                const date = new Date(str);
                                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                            }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700 }}
                            tickFormatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(0)}%`}
                        />
                        <ReTooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-card/95 backdrop-blur-xl border border-border p-3 rounded-xl shadow-2xl">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2">
                                                {new Date(payload[0].payload.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                                            </p>
                                            <div className="space-y-1.5">
                                                <div className="flex items-center justify-between gap-8">
                                                    <span className="text-xs font-bold text-foreground">Portfolio</span>
                                                    <span className={`text-xs font-black ${(payload[0].value ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {(payload[0].value ?? 0) >= 0 ? '+' : ''}{(payload[0].value ?? 0).toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-8">
                                                    <span className="text-xs font-bold text-muted-foreground">S&P 500</span>
                                                    <span className={`text-xs font-black ${(payload[1]?.value ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                        {(payload[1]?.value ?? 0) >= 0 ? '+' : ''}{(payload[1]?.value ?? 0).toFixed(2)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="portfolio"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorPortfolio)"
                            animationDuration={1500}
                        />
                        <Line
                            type="monotone"
                            dataKey="benchmark"
                            stroke="#475569"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// ============ WEALTH COMPOSITION WIDGET ============
export function WealthCompositionWidget({
    summary,
    isStealthMode = false,
    currency = 'USD',
    exchangeRates = { USD: 1 }
}: {
    summary?: any; // PortfolioSummary
    isStealthMode?: boolean;
    currency?: CurrencyCode;
    exchangeRates?: Record<string, number>;
}) {
    if (!summary) return null;

    const stocksValue = summary.totalMarketValue || 0;
    const cashValue = summary.cashBalance || 0;
    const totalValue = summary.totalPortfolioValue || 1;

    const stocksPct = (stocksValue / totalValue) * 100;
    const cashPct = (cashValue / totalValue) * 100;

    // Currency breakdown
    const cashBalances = summary.cashBalances || {};
    const currencyData = Object.entries(cashBalances)
        .filter(([_, amount]) => (amount as number) !== 0)
        .map(([curr, amount]) => {
            const usdVal = (amount as number) / (exchangeRates[curr] || 1);
            return {
                name: curr,
                value: (amount as number),
                usdValue: usdVal,
                percentage: (usdVal / totalValue) * 100
            };
        })
        .sort((a, b) => b.usdValue - a.usdValue);

    return (
        <div className="h-full flex flex-col space-y-6">
            {/* Split Bar */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Asset Split</span>
                    <div className="flex items-center gap-4 text-[10px] font-bold">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span>Stocks {stocksPct.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>Cash {cashPct.toFixed(1)}%</span>
                        </div>
                    </div>
                </div>
                <div className="w-full h-3 bg-slate-800/50 rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-white/5">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stocksPct}%` }}
                        className="h-full bg-primary rounded-l-full"
                    />
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cashPct}%` }}
                        className="h-full bg-blue-500 rounded-r-full"
                    />
                </div>
            </div>

            {/* Values */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10">
                    <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Stocks</div>
                    <div className={`text-lg font-black ${isStealthMode ? 'blur-stealth' : ''}`}>
                        {formatCurrency(convertCurrency(stocksValue, currency, exchangeRates), currency)}
                    </div>
                </div>
                <div className="p-3 rounded-2xl bg-blue-500/5 border border-blue-500/10">
                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Liquid Cash</div>
                    <div className={`text-lg font-black ${isStealthMode ? 'blur-stealth' : ''}`}>
                        {formatCurrency(convertCurrency(cashValue, currency, exchangeRates), currency)}
                    </div>
                </div>
            </div>

            {/* Currency Breakdown */}
            {currencyData.length > 0 && (
                <div className="flex-1 min-h-0">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-3">Currency Weights</span>
                    <div className="space-y-2 overflow-auto custom-scrollbar pr-2">
                        {currencyData.map((data) => (
                            <div key={data.name} className="flex items-center justify-between p-2 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center font-black text-[10px] group-hover:border-primary/30 transition-colors">
                                        {data.name}
                                    </div>
                                    <div>
                                        <div className="text-xs font-black">{data.name} Allocation</div>
                                        <div className={`text-[10px] text-muted-foreground font-bold ${isStealthMode ? 'blur-stealth' : ''}`}>
                                            {formatCurrency(data.value, data.name as any)}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-black">{data.percentage.toFixed(1)}%</div>
                                    <div className="text-[10px] text-muted-foreground font-bold">of Total</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
