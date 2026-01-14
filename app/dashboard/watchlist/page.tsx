'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import {
    Eye,
    Plus,
    Trash2,
    TrendingUp,
    TrendingDown,
    Search,
    Target,
    ExternalLink,
    RefreshCw,
    Star,
    Loader2,
} from 'lucide-react';
import { SkeletonWatchlist } from '@/components/Skeleton';
import { toast } from 'sonner';

interface WatchlistItem {
    id: string;
    symbol: string;
    name: string | null;
    added_price: number | null;
    target_price: number | null;
    notes: string | null;
    created_at: string;
    // These will be fetched
    currentPrice?: number;
    change?: number;
    changePercent?: number;
}

export default function WatchlistPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [addSymbol, setAddSymbol] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const fetchWatchlist = useCallback(async (background = false) => {
        if (!background) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const res = await fetch('/api/watchlist');
            const data = await res.json();

            if (data.success) {
                // Fetch current prices for each item
                const itemsWithPrices = await Promise.all(
                    data.data.map(async (item: WatchlistItem) => {
                        try {
                            const priceRes = await fetch(`/api/stock/${item.symbol}`);
                            const priceData = await priceRes.json();
                            return {
                                ...item,
                                currentPrice: priceData.price,
                                change: priceData.change,
                                changePercent: priceData.changePercent,
                                name: priceData.name || item.name,
                            };
                        } catch {
                            return item;
                        }
                    })
                );
                setWatchlist(itemsWithPrices);
            }
        } catch (err) {
            console.error('Failed to fetch watchlist:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchWatchlist();
        }
    }, [user, fetchWatchlist]);

    const handleAddToWatchlist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addSymbol.trim()) return;

        setIsAdding(true);
        setError(null);

        try {
            // First fetch the stock to get name and current price
            const stockRes = await fetch(`/api/stock/${addSymbol.toUpperCase()}`);
            const stockData = await stockRes.json();

            if (stockData.error) {
                setError('Stock not found');
                setIsAdding(false);
                return;
            }

            const res = await fetch('/api/watchlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: addSymbol.toUpperCase(),
                    name: stockData.name,
                    added_price: stockData.price,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setAddSymbol('');
                fetchWatchlist();
                toast.success('Added to watchlist!', { description: addSymbol.toUpperCase() });
            } else {
                setError(data.error || 'Failed to add');
                toast.error('Failed to add', { description: data.error });
            }
        } catch (err) {
            setError('Failed to add to watchlist');
            toast.error('Failed to add to watchlist');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = async (symbol: string) => {
        try {
            await fetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' });
            setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
            toast.success('Removed from watchlist', { description: symbol });
        } catch (err) {
            console.error('Failed to remove:', err);
            toast.error('Failed to remove');
        }
    };

    if (authLoading || isLoading) {
        return <SkeletonWatchlist />;
    }

    return (
        <div className="min-h-screen text-foreground px-6 py-10 lg:px-12 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Eye className="text-primary" size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Watchlist</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">
                        Tracking <span className="text-primary">{watchlist.length}</span> Stocks
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fetchWatchlist(true)}
                        disabled={isRefreshing}
                        className="p-3 rounded-xl bg-card border border-border hover:bg-muted transition-all"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-primary' : ''} />
                    </button>
                </div>
            </div>

            {/* Add to Watchlist Form */}
            <div className="bg-card border border-border rounded-3xl p-6 mb-8">
                <form onSubmit={handleAddToWatchlist} className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            value={addSymbol}
                            onChange={(e) => setAddSymbol(e.target.value.toUpperCase())}
                            placeholder="Enter ticker symbol (e.g., AAPL)"
                            className="w-full pl-12 pr-4 py-4 bg-muted border border-border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding || !addSymbol.trim()}
                        className="px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                        {isAdding ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <>
                                <Plus size={18} />
                                Add to Watchlist
                            </>
                        )}
                    </button>
                </form>
                {error && (
                    <p className="text-rose-500 text-sm font-bold mt-3">{error}</p>
                )}
            </div>

            {/* Watchlist Grid */}
            {watchlist.length === 0 ? (
                <div className="text-center py-20">
                    <Star className="mx-auto text-muted-foreground mb-4" size={48} />
                    <h3 className="text-xl font-bold mb-2">Your watchlist is empty</h3>
                    <p className="text-muted-foreground">Add stocks above to start tracking them</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {watchlist.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-card border border-border rounded-3xl p-6 hover:border-primary/30 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <Link href={`/dashboard/ticker/${item.symbol}`} className="flex-1">
                                        <h3 className="text-xl font-black group-hover:text-primary transition-colors">{item.symbol}</h3>
                                        <p className="text-sm text-muted-foreground truncate">{item.name || 'Loading...'}</p>
                                    </Link>
                                    <button
                                        onClick={() => handleRemove(item.symbol)}
                                        className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-2xl font-black">
                                            {item.currentPrice ? `$${item.currentPrice.toFixed(2)}` : '—'}
                                        </p>
                                        <div className={`flex items-center gap-1 text-sm font-bold ${(item.changePercent ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {(item.changePercent ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {(item.changePercent ?? 0) >= 0 ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
                                        </div>
                                    </div>

                                    {item.added_price && (
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground">Added at</p>
                                            <p className="text-sm font-bold">${(item.added_price ?? 0).toFixed(2)}</p>
                                            {item.currentPrice && item.added_price && (
                                                <p className={`text-xs font-bold ${item.currentPrice >= item.added_price ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {item.currentPrice >= item.added_price ? '+' : ''}
                                                    {(((item.currentPrice - item.added_price) / item.added_price) * 100).toFixed(1)}%
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <Link
                                    href={`/dashboard/ticker/${item.symbol}`}
                                    className="mt-4 flex items-center justify-center gap-2 py-3 bg-muted rounded-xl text-sm font-bold hover:bg-primary/10 hover:text-primary transition-all"
                                >
                                    View Details
                                    <ExternalLink size={14} />
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
