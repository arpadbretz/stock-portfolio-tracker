'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
} from 'lucide-react';

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
                const symbols = ['^GSPC', '^IXIC', '^DJI', '^VIX'];
                const promises = symbols.map(async (symbol) => {
                    try {
                        const res = await fetch(`/api/stock/${encodeURIComponent(symbol)}`);
                        const data = await res.json();
                        if (data.success && data.data?.price) {
                            return {
                                symbol,
                                name: symbol === '^GSPC' ? 'S&P 500' :
                                    symbol === '^IXIC' ? 'NASDAQ' :
                                        symbol === '^DJI' ? 'DOW' : 'VIX',
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
            <div className={`grid ${expanded ? 'grid-cols-4' : 'grid-cols-2'} gap-3`}>
                {[1, 2, 3, 4].map(i => (
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
        <div className={`grid ${expanded ? 'grid-cols-4' : 'grid-cols-2'} gap-3`}>
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
    }>;
    limit?: number;
    showChart?: boolean;
}

export function TopPerformersWidget({ holdings = [], limit = 5, showChart = false }: PerformerProps) {
    const sorted = [...holdings].sort((a, b) => b.gainPercent - a.gainPercent).slice(0, limit);

    if (sorted.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No holdings yet</p>
            </div>
        );
    }

    // Calculate max gain for chart scale
    const maxGain = Math.max(...sorted.map(h => Math.abs(h.gainPercent)));

    return (
        <div className="space-y-2">
            {sorted.map((holding, i) => (
                <Link
                    key={holding.symbol}
                    href={`/dashboard/ticker/${holding.symbol}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xs">
                            {i + 1}
                        </div>
                        <div>
                            <div className="font-bold text-sm group-hover:text-primary transition-colors">{holding.symbol}</div>
                            {showChart && <div className="text-xs text-muted-foreground truncate max-w-[100px]">{holding.name}</div>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {showChart && (
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${(holding.gainPercent / maxGain) * 100}%` }}
                                />
                            </div>
                        )}
                        <div className="text-emerald-500 font-bold text-sm w-16 text-right">+{(holding.gainPercent ?? 0).toFixed(2)}%</div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

// ============ WORST PERFORMERS WIDGET ============
export function WorstPerformersWidget({ holdings = [], limit = 5, showChart = false }: PerformerProps) {
    // Sort from most negative to least negative/most positive, then take top X
    const sorted = [...holdings]
        .sort((a, b) => a.gainPercent - b.gainPercent)
        .slice(0, limit);

    if (sorted.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <TrendingDown size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No holdings yet</p>
            </div>
        );
    }

    // For chart scale, use the most negative value as the 100% bar
    const maxLoss = Math.max(...sorted.map(h => Math.abs(h.gainPercent)));

    return (
        <div className="space-y-2">
            {sorted.map((holding, i) => (
                <Link
                    key={holding.symbol}
                    href={`/dashboard/ticker/${holding.symbol}`}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 font-black text-xs">
                            {i + 1}
                        </div>
                        <div>
                            <div className="font-bold text-sm group-hover:text-primary transition-colors">{holding.symbol}</div>
                            {showChart && <div className="text-xs text-muted-foreground truncate max-w-[100px]">{holding.name}</div>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {showChart && (
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-rose-500 rounded-full"
                                    style={{ width: `${(Math.abs(Math.min(0, holding.gainPercent)) / maxLoss) * 100}%` }}
                                />
                            </div>
                        )}
                        <div className={`${(holding.gainPercent ?? 0) < 0 ? 'text-rose-500' : 'text-emerald-500'} font-bold text-sm w-16 text-right`}>
                            {(holding.gainPercent ?? 0) > 0 ? '+' : ''}{(holding.gainPercent ?? 0).toFixed(2)}%
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

// ============ WATCHLIST MINI WIDGET ============
interface WatchlistItem {
    symbol: string;
    name: string;
    price: number;
    changePercent: number;
}

export function WatchlistMiniWidget({ limit = 5 }: { limit?: number }) {
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
                return (
                    <Link
                        key={item.symbol}
                        href={`/dashboard/ticker/${item.symbol}`}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                        <div className="flex items-center gap-2">
                            <Star size={14} className="text-yellow-500" />
                            <div>
                                <span className="font-bold text-sm group-hover:text-primary transition-colors">{item.symbol}</span>
                                {item.price && <div className="text-[10px] text-muted-foreground">${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>}
                            </div>
                        </div>
                        <div className={`font-bold text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {item.changePercent !== undefined && item.changePercent !== null ? (
                                <>{isPositive ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%</>
                            ) : (
                                <span className="text-muted-foreground">N/A</span>
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

// ============ PRICE ALERTS WIDGET ============
interface Alert {
    id: string;
    symbol: string;
    target_price: number; // Snake case from API
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

// End of widgets
