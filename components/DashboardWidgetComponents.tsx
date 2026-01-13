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
                const isPositive = index.change >= 0;
                return (
                    <div
                        key={index.symbol}
                        className={`p-3 rounded-xl border ${isPositive ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}
                    >
                        <div className="text-xs font-bold text-muted-foreground mb-1">{index.name}</div>
                        <div className={`font-black ${expanded ? 'text-xl' : 'text-lg'}`}>{index.price.toLocaleString()}</div>
                        <div className={`text-xs font-bold flex items-center gap-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                            {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                        </div>
                        {expanded && (
                            <div className="text-[10px] text-muted-foreground mt-1">
                                {isPositive ? '+' : ''}{index.change.toFixed(2)} pts
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
                        <div className="text-emerald-500 font-bold text-sm w-16 text-right">+{holding.gainPercent.toFixed(2)}%</div>
                    </div>
                </Link>
            ))}
        </div>
    );
}

// ============ WORST PERFORMERS WIDGET ============
export function WorstPerformersWidget({ holdings = [], limit = 5, showChart = false }: PerformerProps) {
    const sorted = [...holdings].sort((a, b) => a.gainPercent - b.gainPercent).slice(0, limit);

    if (sorted.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <TrendingDown size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No holdings yet</p>
            </div>
        );
    }

    // Calculate max loss for chart scale
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
                                    style={{ width: `${(Math.abs(holding.gainPercent) / maxLoss) * 100}%` }}
                                />
                            </div>
                        )}
                        <div className="text-rose-500 font-bold text-sm w-16 text-right">{holding.gainPercent.toFixed(2)}%</div>
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
                if (data.success && data.watchlist) {
                    setWatchlist(data.watchlist.slice(0, limit));
                }
            } catch (e) {
                console.error('Failed to fetch watchlist:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchWatchlist();
    }, []);

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
                const isPositive = item.changePercent >= 0;
                return (
                    <Link
                        key={item.symbol}
                        href={`/dashboard/ticker/${item.symbol}`}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-colors group"
                    >
                        <div className="flex items-center gap-2">
                            <Star size={14} className="text-yellow-500" />
                            <span className="font-bold text-sm group-hover:text-primary transition-colors">{item.symbol}</span>
                        </div>
                        <div className={`font-bold text-sm ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
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
}

export function QuickActionsWidget({ compact = false, onEditDashboard }: QuickActionsProps) {
    const actions = [
        { icon: <Plus size={compact ? 14 : 16} />, label: 'Trade', href: '/dashboard', color: 'bg-emerald-500/10 text-emerald-500' },
        { icon: <Search size={compact ? 14 : 16} />, label: 'Search', href: '/dashboard/stocks', color: 'bg-blue-500/10 text-blue-500' },
        { icon: <Bell size={compact ? 14 : 16} />, label: 'Alerts', href: '/dashboard/alerts', color: 'bg-orange-500/10 text-orange-500' },
        { icon: <FileText size={compact ? 14 : 16} />, label: 'Report', href: '/dashboard/report', color: 'bg-purple-500/10 text-purple-500' },
    ];

    return (
        <div className="space-y-2">
            <div className={`grid ${compact ? 'grid-cols-4 gap-1' : 'grid-cols-2 gap-2'}`}>
                {actions.map((action) => (
                    <Link
                        key={action.label}
                        href={action.href}
                        className={`flex flex-col items-center justify-center ${compact ? 'p-2' : 'p-3'} rounded-xl ${action.color} hover:opacity-80 transition-opacity`}
                    >
                        {action.icon}
                        <span className={`${compact ? 'text-[9px]' : 'text-xs'} font-bold mt-1`}>{action.label}</span>
                    </Link>
                ))}
            </div>
            {onEditDashboard && !compact && (
                <button
                    onClick={onEditDashboard}
                    className="w-full flex items-center justify-center gap-2 p-2 rounded-xl bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Settings size={14} />
                    <span className="text-xs font-bold">Edit Dashboard</span>
                </button>
            )}
        </div>
    );
}

// ============ PRICE ALERTS WIDGET ============
interface Alert {
    id: string;
    symbol: string;
    targetPrice: number;
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
                if (data.success) {
                    setAlerts(data.alerts?.slice(0, limit) || []);
                }
            } catch (e) {
                console.error('Failed to fetch alerts:', e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAlerts();
    }, []);

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
                        {alert.condition === 'above' ? '↑' : '↓'} ${alert.targetPrice}
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
export function PerformanceChartWidget() {
    // Placeholder for chart - would use Recharts
    return (
        <div className="h-full flex items-center justify-center">
            <div className="text-center">
                <Activity size={48} className="mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Performance Chart</p>
                <p className="text-xs text-muted-foreground/70">Coming soon</p>
            </div>
        </div>
    );
}

// ============ MARKET NEWS WIDGET ============
interface NewsItem {
    title: string;
    source: string;
    url: string;
    time: string;
}

export function MarketNewsWidget({ limit = 4, showImages = false }: { limit?: number; showImages?: boolean }) {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Placeholder - would fetch from news API
        setNews([
            { title: 'Fed signals potential rate cuts in 2024', source: 'Reuters', url: '#', time: '2h ago' },
            { title: 'Tech stocks rally on earnings optimism', source: 'Bloomberg', url: '#', time: '4h ago' },
            { title: 'Oil prices stabilize amid global tensions', source: 'CNBC', url: '#', time: '6h ago' },
            { title: 'Crypto markets see renewed interest', source: 'CoinDesk', url: '#', time: '8h ago' },
            { title: 'European markets close higher', source: 'FT', url: '#', time: '10h ago' },
            { title: 'Asian shares mixed as investors assess data', source: 'Reuters', url: '#', time: '12h ago' },
            { title: 'Gold prices hit new highs on safe-haven demand', source: 'Bloomberg', url: '#', time: '14h ago' },
            { title: 'Bond yields fall after inflation data', source: 'WSJ', url: '#', time: '16h ago' },
        ].slice(0, limit));
        setIsLoading(false);
    }, [limit]);

    if (isLoading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: Math.min(3, limit) }).map((_, i) => (
                    <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className={`space-y-3 ${showImages ? 'grid grid-cols-2 gap-4' : ''}`}>
            {news.map((item, i) => (
                <a
                    key={i}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block p-3 rounded-xl hover:bg-muted/50 transition-colors group ${showImages ? 'border border-border/50' : ''}`}
                >
                    {showImages && (
                        <div className="w-full h-20 bg-muted rounded-lg mb-2 flex items-center justify-center">
                            <ExternalLink size={20} className="text-muted-foreground/30" />
                        </div>
                    )}
                    <div className={`font-medium ${showImages ? 'text-xs' : 'text-sm'} group-hover:text-primary transition-colors line-clamp-2`}>
                        {item.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{item.source}</span>
                        <span>•</span>
                        <span>{item.time}</span>
                    </div>
                </a>
            ))}
        </div>
    );
}
