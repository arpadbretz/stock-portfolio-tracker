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
    FolderPlus,
    Settings,
    ChevronRight,
    Folder,
    MoreVertical,
    Clock,
    X,
    LayoutGrid,
} from 'lucide-react';
import { SkeletonWatchlist } from '@/components/Skeleton';
import { toast } from 'sonner';
import TickerSearch from '@/components/shared/TickerSearch';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface WatchlistItem {
    id: string;
    symbol: string;
    name: string | null;
    added_price: number | null;
    target_price: number | null;
    notes: string | null;
    created_at: string;
    currentPrice?: number;
    change?: number;
    changePercent?: number;
    group_id: string | null;
    sparklineData?: any[];
}

interface WatchlistGroup {
    id: string;
    name: string;
    color: string;
    icon: string | null;
}

export default function WatchlistPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [groups, setGroups] = useState<WatchlistGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [addSymbol, setAddSymbol] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [moveItem, setMoveItem] = useState<WatchlistItem | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const fetchGroups = useCallback(async () => {
        try {
            const res = await fetch('/api/watchlist/groups');
            const data = await res.json();
            if (data.success) setGroups(data.data);
        } catch (err) {
            console.error('Failed to fetch groups:', err);
        }
    }, []);

    const fetchWatchlist = useCallback(async (background = false) => {
        if (!background) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const url = selectedGroupId
                ? `/api/watchlist?groupId=${selectedGroupId}`
                : '/api/watchlist';

            const res = await fetch(url);
            const data = await res.json();

            if (data.success) {
                // Fetch current prices and sparklines for each item
                const itemsWithData = await Promise.all(
                    data.data.map(async (item: WatchlistItem) => {
                        try {
                            const [priceRes, chartRes] = await Promise.all([
                                fetch(`/api/stock/${item.symbol}`),
                                fetch(`/api/stock/${item.symbol}/chart?range=1mo&interval=1d`)
                            ]);

                            const priceData = await priceRes.json();
                            const chartData = await chartRes.json();

                            return {
                                ...item,
                                currentPrice: priceData.price,
                                change: priceData.change,
                                changePercent: priceData.changePercent,
                                name: priceData.name || item.name,
                                sparklineData: chartData.data?.slice(-7).map((d: any) => ({ value: d.close })) || []
                            };
                        } catch {
                            return item;
                        }
                    })
                );
                setWatchlist(itemsWithData);
            }
        } catch (err) {
            console.error('Failed to fetch watchlist:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [selectedGroupId]);

    useEffect(() => {
        if (user) {
            fetchGroups();
            fetchWatchlist();
        }
    }, [user, fetchGroups, fetchWatchlist]);

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
                    group_id: selectedGroupId === 'none' ? null : selectedGroupId,
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

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) return;

        setIsCreatingGroup(true);
        try {
            const res = await fetch('/api/watchlist/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newGroupName }),
            });
            const data = await res.json();
            if (data.success) {
                setGroups(prev => [...prev, data.data]);
                setNewGroupName('');
                setIsGroupModalOpen(false);
                toast.success('Group created!');
            }
        } catch (err) {
            toast.error('Failed to create group');
        } finally {
            setIsCreatingGroup(false);
        }
    };

    const handleDeleteGroup = async (id: string, name: string) => {
        if (!confirm(`Delete group "${name}"? Stocks will be ungrouped but not deleted.`)) return;

        try {
            const res = await fetch(`/api/watchlist/groups?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setGroups(prev => prev.filter(g => g.id !== id));
                if (selectedGroupId === id) setSelectedGroupId(null);
                toast.success('Group deleted');
                fetchWatchlist();
            }
        } catch (err) {
            toast.error('Failed to delete group');
        }
    };

    const handleMoveToGroup = async (symbol: string, groupId: string | null) => {
        try {
            const res = await fetch('/api/watchlist', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, group_id: groupId }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(`Moved ${symbol}`);
                fetchWatchlist();
            }
        } catch (err) {
            toast.error('Failed to move item');
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
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Portfolio Intelligence</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">
                        Research <span className="text-primary italic">Pipeline</span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsGroupModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-muted border border-border rounded-xl font-bold text-sm hover:bg-muted/80 transition-all active:scale-95"
                    >
                        <FolderPlus size={16} />
                        New Group
                    </button>
                    <button
                        onClick={() => fetchWatchlist(true)}
                        disabled={isRefreshing}
                        className="p-3 rounded-xl bg-card border border-border hover:bg-muted transition-all active:scale-95"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-primary' : ''} />
                    </button>
                </div>
            </div>

            {/* Group Selector */}
            <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-4 pt-4 px-4 -mx-4 scrollbar-none">
                <button
                    onClick={() => setSelectedGroupId(null)}
                    className={`px-8 py-4 rounded-2xl text-sm font-black whitespace-nowrap transition-all ${selectedGroupId === null
                        ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/30 scale-105'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <LayoutGrid size={16} />
                        All Assets
                    </div>
                </button>
                {groups.map((group) => (
                    <div key={group.id} className="relative group/folder">
                        <button
                            onClick={() => setSelectedGroupId(group.id)}
                            className={`px-8 py-4 rounded-2xl text-sm font-black whitespace-nowrap transition-all border ${selectedGroupId === group.id
                                ? 'bg-primary/5 border-primary text-primary scale-105 shadow-xl shadow-primary/5'
                                : 'bg-card border-border text-muted-foreground hover:border-primary/30'
                                }`}
                        >
                            <span
                                className="inline-block w-2.5 h-2.5 rounded-full mr-3 shadow-current shadow-lg"
                                style={{ backgroundColor: group.color || '#3b82f6' }}
                            />
                            {group.name}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id, group.name); }}
                            className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full opacity-0 group-hover/folder:opacity-100 transition-opacity shadow-lg hover:scale-110 active:scale-90"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
                <button
                    onClick={() => setSelectedGroupId('none')}
                    className={`px-8 py-4 rounded-2xl text-sm font-black whitespace-nowrap transition-all border ${selectedGroupId === 'none'
                        ? 'bg-amber-500/5 border-amber-500 text-amber-500 scale-105 shadow-xl shadow-amber-500/5'
                        : 'bg-card border-border text-muted-foreground hover:border-amber-500/30'
                        }`}
                >
                    Ungrouped
                </button>
            </div>

            {/* Add to Watchlist Form */}
            <div className="bg-card border border-border rounded-[40px] p-10 mb-12 shadow-2xl shadow-primary/5">
                <form onSubmit={handleAddToWatchlist} className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                        <TickerSearch
                            onSelect={(result) => setAddSymbol(result.symbol)}
                            placeholder="Add symbol to track (e.g., TSLA)"
                            inputClassName="w-full pl-16 pr-6 py-5 bg-muted/30 border border-border rounded-[24px] font-black text-lg focus:ring-primary/10"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding || !addSymbol.trim()}
                        className="px-10 py-5 bg-primary text-primary-foreground rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-primary/20 transition-all disabled:opacity-50"
                    >
                        {isAdding ? (
                            <Loader2 className="animate-spin" size={24} />
                        ) : (
                            <>
                                <Plus size={24} />
                                Start Tracking
                            </>
                        )}
                    </button>
                </form>
                {error && (
                    <p className="text-rose-500 text-sm font-black mt-6 flex items-center gap-3 px-4">
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        {error}
                    </p>
                )}
            </div>

            {/* Watchlist Grid */}
            {watchlist.length === 0 ? (
                <div className="text-center py-40 bg-card/10 border border-dashed border-border/50 rounded-[50px]">
                    <Star className="mx-auto text-muted-foreground/20 mb-8" size={80} />
                    <h3 className="text-3xl font-black mb-4">Pipeline Empty</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto text-lg">
                        {selectedGroupId
                            ? "This folder has no assets. Add your first pick above."
                            : "Your research pipeline is waiting for high-growth tickers."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    <AnimatePresence mode='popLayout'>
                        {watchlist.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-card border border-border rounded-[40px] p-1 shadow-sm hover:shadow-2xl hover:shadow-primary/5 group"
                            >
                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-8">
                                        <Link href={`/dashboard/ticker/${item.symbol}`} className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-3xl font-black tracking-tighter group-hover:text-primary transition-colors">{item.symbol}</h3>
                                                <ChevronRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                            </div>
                                            <p className="text-[10px] font-black text-muted-foreground truncate uppercase tracking-[0.2em]">{item.name || 'Resolving...'}</p>
                                        </Link>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setMoveItem(item)}
                                                className="p-3 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all active:scale-90"
                                                title="Move to Group"
                                            >
                                                <Folder size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleRemove(item.symbol)}
                                                className="p-3 rounded-2xl bg-muted/50 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all active:scale-90"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-4xl font-black tracking-tighter mb-2">
                                                {item.currentPrice ? `$${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                            </p>
                                            <div className={`flex items-center gap-2 text-sm font-black ${(item.changePercent ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {(item.changePercent ?? 0) >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                                {(item.changePercent ?? 0) >= 0 ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
                                            </div>
                                        </div>

                                        {/* Sparkline */}
                                        <div className="w-32 h-16 opacity-50 group-hover:opacity-100 transition-opacity">
                                            {item.sparklineData && item.sparklineData.length > 0 && (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={item.sparklineData}>
                                                        <defs>
                                                            <linearGradient id={`grad-${item.symbol}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={(item.changePercent ?? 0) >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0.3} />
                                                                <stop offset="95%" stopColor={(item.changePercent ?? 0) >= 0 ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Area
                                                            type="monotone"
                                                            dataKey="value"
                                                            stroke={(item.changePercent ?? 0) >= 0 ? '#10b981' : '#f43f5e'}
                                                            strokeWidth={3}
                                                            fillOpacity={1}
                                                            fill={`url(#grad-${item.symbol})`}
                                                            isAnimationActive={false}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </div>

                                    {item.added_price && (
                                        <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                                                    <Clock size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-muted-foreground uppercase">Tracking Since</p>
                                                    <p className="text-sm font-black">${item.added_price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <div className={`px-4 py-2 rounded-2xl text-xs font-black ${item.currentPrice && item.added_price && item.currentPrice >= item.added_price ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                {item.currentPrice && item.added_price && (
                                                    <>
                                                        {item.currentPrice >= item.added_price ? '+' : ''}
                                                        {(((item.currentPrice - item.added_price) / item.added_price) * 100).toFixed(1)}%
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Move to Group Modal */}
            <AnimatePresence>
                {moveItem && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMoveItem(null)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[101] flex items-center justify-center p-6 pointer-events-none"
                        >
                            <div className="bg-card border border-border rounded-[40px] p-10 w-full max-w-md shadow-2xl pointer-events-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black italic">Move <span className="text-primary tracking-tighter not-italic">{moveItem.symbol}</span></h3>
                                    <button
                                        onClick={() => setMoveItem(null)}
                                        className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin">
                                    <button
                                        onClick={() => {
                                            handleMoveToGroup(moveItem.symbol, null);
                                            setMoveItem(null);
                                        }}
                                        className={`w-full p-5 rounded-2xl text-left font-black transition-all flex items-center justify-between group ${moveItem.group_id === null ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted'}`}
                                    >
                                        Ungrouped
                                        <ChevronRight size={18} className={moveItem.group_id === null ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                                    </button>

                                    {groups.map(g => (
                                        <button
                                            key={g.id}
                                            onClick={() => {
                                                handleMoveToGroup(moveItem.symbol, g.id);
                                                setMoveItem(null);
                                            }}
                                            className={`w-full p-5 rounded-2xl text-left font-black transition-all flex items-center justify-between group ${moveItem.group_id === g.id ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                                                {g.name}
                                            </div>
                                            <ChevronRight size={18} className={moveItem.group_id === g.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => {
                                        setMoveItem(null);
                                        setIsGroupModalOpen(true);
                                    }}
                                    className="w-full mt-8 py-5 border-2 border-dashed border-border rounded-2xl font-black text-muted-foreground hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={18} />
                                    Create New Group
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Create Group Modal */}
            <AnimatePresence>
                {isGroupModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsGroupModalOpen(false)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[110]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-0 z-[111] flex items-center justify-center p-6 pointer-events-none"
                        >
                            <div className="bg-card border border-border rounded-[40px] p-10 w-full max-w-md shadow-2xl pointer-events-auto">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black italic">Create <span className="text-primary tracking-tighter not-italic">Folder</span></h3>
                                    <button
                                        onClick={() => setIsGroupModalOpen(false)}
                                        className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateGroup} className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3 block">Folder Name</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder="e.g. AI Growth Picks"
                                            className="w-full px-6 py-5 bg-muted/50 border border-border rounded-2xl font-black focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all text-xl"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isCreatingGroup || !newGroupName.trim()}
                                        className="w-full py-6 bg-primary text-primary-foreground rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-primary/20 transition-all disabled:opacity-50"
                                    >
                                        {isCreatingGroup ? <Loader2 className="animate-spin" size={24} /> : "Establish Folder"}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
