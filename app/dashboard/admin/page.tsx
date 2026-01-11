'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import {
    BarChart3,
    Users,
    Briefcase,
    ArrowUpDown,
    Eye,
    Bell,
    Calculator,
    TrendingUp,
    RefreshCw,
    Database,
    Activity,
    Crown,
} from 'lucide-react';
import Link from 'next/link';

interface AdminStats {
    totalUsers: number;
    totalPortfolios: number;
    totalTrades: number;
    totalWatchlistItems: number;
    totalAlerts: number;
    triggeredAlerts: number;
    totalDcfAnalyses: number;
    uniqueTickers: number;
    usersWithWatchlist: number;
    usersWithAlerts: number;
}

interface TickerData {
    symbol: string;
    trades: number;
    watchlist: number;
    alerts: number;
    total: number;
}

export default function AdminDashboard() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [stats, setStats] = useState<AdminStats | null>(null);
    const [tickers, setTickers] = useState<TickerData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchStats = useCallback(async (background = false) => {
        if (!background) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();

            if (data.success) {
                setStats(data.data.stats);
                setTickers(data.data.tickers);
            }
        } catch (err) {
            console.error('Failed to fetch admin stats:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchStats();
        }
    }, [user, fetchStats]);

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const statCards = [
        { label: 'Total Portfolios', value: stats?.totalPortfolios || 0, icon: Briefcase, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Total Trades', value: stats?.totalTrades || 0, icon: ArrowUpDown, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Unique Tickers', value: stats?.uniqueTickers || 0, icon: TrendingUp, color: 'text-violet-500', bg: 'bg-violet-500/10' },
        { label: 'Watchlist Items', value: stats?.totalWatchlistItems || 0, icon: Eye, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Active Alerts', value: stats?.totalAlerts || 0, icon: Bell, color: 'text-orange-500', bg: 'bg-orange-500/10' },
        { label: 'Triggered Alerts', value: stats?.triggeredAlerts || 0, icon: Activity, color: 'text-rose-500', bg: 'bg-rose-500/10' },
        { label: 'DCF Analyses', value: stats?.totalDcfAnalyses || 0, icon: Calculator, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Users with Watchlist', value: stats?.usersWithWatchlist || 0, icon: Users, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    ];

    return (
        <div className="min-h-screen text-foreground px-6 py-10 lg:px-12 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-amber-500/10 rounded-xl">
                            <Crown className="text-amber-500" size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin Panel</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">
                        Platform <span className="text-primary">Analytics</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Overview of all tracked stocks and platform usage
                    </p>
                </div>

                <button
                    onClick={() => fetchStats(true)}
                    disabled={isRefreshing}
                    className="px-6 py-3 bg-card border border-border rounded-xl font-bold flex items-center gap-2 hover:bg-muted transition-all"
                >
                    <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-primary' : ''} />
                    Refresh
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {statCards.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-card border border-border rounded-2xl p-5"
                    >
                        <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                            <stat.icon className={stat.color} size={20} />
                        </div>
                        <p className="text-3xl font-black">{stat.value.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Tracked Tickers Table */}
            <div className="bg-card border border-border rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-xl font-black">Tracked Tickers</h2>
                        <p className="text-sm text-muted-foreground">All symbols being tracked across trades, watchlists, and alerts</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Database size={16} />
                        {tickers.length} symbols
                    </div>
                </div>

                {tickers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <BarChart3 className="mx-auto mb-3" size={40} />
                        <p>No tickers being tracked yet</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left py-3 px-4 font-bold text-muted-foreground text-sm">#</th>
                                    <th className="text-left py-3 px-4 font-bold text-muted-foreground text-sm">Symbol</th>
                                    <th className="text-right py-3 px-4 font-bold text-muted-foreground text-sm">Trades</th>
                                    <th className="text-right py-3 px-4 font-bold text-muted-foreground text-sm">Watchlist</th>
                                    <th className="text-right py-3 px-4 font-bold text-muted-foreground text-sm">Alerts</th>
                                    <th className="text-right py-3 px-4 font-bold text-muted-foreground text-sm">Total</th>
                                    <th className="text-right py-3 px-4 font-bold text-muted-foreground text-sm">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tickers.map((ticker, idx) => (
                                    <motion.tr
                                        key={ticker.symbol}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.02 }}
                                        className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                                    >
                                        <td className="py-3 px-4 text-muted-foreground text-sm">{idx + 1}</td>
                                        <td className="py-3 px-4">
                                            <Link
                                                href={`/dashboard/ticker/${ticker.symbol}`}
                                                className="font-black text-lg hover:text-primary transition-colors"
                                            >
                                                {ticker.symbol}
                                            </Link>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {ticker.trades > 0 ? (
                                                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-sm font-bold">
                                                    {ticker.trades}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {ticker.watchlist > 0 ? (
                                                <span className="px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-sm font-bold">
                                                    {ticker.watchlist}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {ticker.alerts > 0 ? (
                                                <span className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded-lg text-sm font-bold">
                                                    {ticker.alerts}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span className="font-black text-lg">{ticker.total}</span>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Link
                                                href={`/dashboard/ticker/${ticker.symbol}`}
                                                className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="mt-6 bg-muted/50 border border-border rounded-2xl p-4 flex items-start gap-3">
                <Database className="text-muted-foreground shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-muted-foreground">
                    <strong>Data Sources:</strong> This dashboard aggregates data from trades, watchlists, and price alerts tables.
                    Numbers may overlap as users can have the same ticker in multiple places.
                </div>
            </div>
        </div>
    );
}
