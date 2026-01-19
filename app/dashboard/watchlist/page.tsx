'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
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
    ChevronDown,
    ChevronUp,
    Folder,
    MoreVertical,
    Clock,
    X,
    LayoutGrid,
    List,
    Columns,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    CheckSquare,
    Square,
    Percent,
    DollarSign,
    BarChart3,
    Filter,
    GripVertical,
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
    stage?: KanbanStage;
    // Additional metrics
    peRatio?: number;
    marketCap?: number;
    dividendYield?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    beta?: number;
    sinceAddedPercent?: number;
}

interface WatchlistGroup {
    id: string;
    name: string;
    color: string;
    icon: string | null;
}

type ViewMode = 'grid' | 'table' | 'kanban';
type SortField = 'symbol' | 'name' | 'currentPrice' | 'changePercent' | 'sinceAddedPercent' | 'created_at';
type SortDirection = 'asc' | 'desc';

// Kanban stages
type KanbanStage = 'researching' | 'ready' | 'holding' | 'sold';
const KANBAN_STAGES: { id: KanbanStage; label: string; color: string }[] = [
    { id: 'researching', label: 'Researching', color: '#3b82f6' },
    { id: 'ready', label: 'Ready to Buy', color: '#10b981' },
    { id: 'holding', label: 'Holding', color: '#8b5cf6' },
    { id: 'sold', label: 'Sold', color: '#6b7280' },
];

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

    // New state for enhanced features
    const [viewMode, setViewMode] = useState<ViewMode>('grid');
    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [kanbanData, setKanbanData] = useState<Record<KanbanStage, string[]>>({
        researching: [],
        ready: [],
        holding: [],
        sold: [],
    });

    // Auto-refresh
    const [autoRefreshInterval, setAutoRefreshInterval] = useState<number>(0); // 0 = off, else seconds

    // Comparison mode
    const [compareItems, setCompareItems] = useState<string[]>([]);
    const [isCompareMode, setIsCompareMode] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    // Load view preferences from localStorage
    useEffect(() => {
        const savedView = localStorage.getItem('watchlist-view');
        const savedSort = localStorage.getItem('watchlist-sort');
        if (savedView && ['grid', 'table', 'kanban'].includes(savedView)) {
            setViewMode(savedView as ViewMode);
        }
        if (savedSort) {
            try {
                const { field, direction } = JSON.parse(savedSort);
                setSortField(field);
                setSortDirection(direction);
            } catch { }
        }
    }, []);

    // Save preferences
    useEffect(() => {
        localStorage.setItem('watchlist-view', viewMode);
        localStorage.setItem('watchlist-sort', JSON.stringify({ field: sortField, direction: sortDirection }));
    }, [viewMode, sortField, sortDirection]);

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

                            const priceResponse = await priceRes.json();
                            const chartData = await chartRes.json();

                            // Handle new API format: { success: true, data: { ... } }
                            const priceData = priceResponse.success ? priceResponse.data : priceResponse;

                            const currentPrice = priceData?.price;
                            const sinceAddedPercent = item.added_price && currentPrice
                                ? ((currentPrice - item.added_price) / item.added_price) * 100
                                : null;

                            return {
                                ...item,
                                currentPrice,
                                change: priceData?.change,
                                changePercent: priceData?.changePercent,
                                name: priceData?.name || item.name,
                                peRatio: priceData?.pe || priceData?.trailingPE || priceData?.forwardPE,
                                marketCap: priceData?.marketCap,
                                dividendYield: priceData?.dividendYield,
                                fiftyTwoWeekHigh: priceData?.fiftyTwoWeekHigh,
                                fiftyTwoWeekLow: priceData?.fiftyTwoWeekLow,
                                beta: priceData?.beta,
                                sparklineData: chartData.data?.slice(-7).map((d: any) => ({ value: d.close })) || [],
                                sinceAddedPercent,
                            };
                        } catch {
                            return item;
                        }
                    })
                );
                setWatchlist(itemsWithData);

                // Initialize Kanban data from stage field in DB
                const newKanbanData: Record<KanbanStage, string[]> = {
                    researching: [],
                    ready: [],
                    holding: [],
                    sold: [],
                };
                itemsWithData.forEach((item: WatchlistItem) => {
                    const stage = item.stage || 'researching';
                    if (newKanbanData[stage]) {
                        newKanbanData[stage].push(item.symbol);
                    } else {
                        newKanbanData.researching.push(item.symbol);
                    }
                });
                setKanbanData(newKanbanData);
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

    // Auto-refresh effect
    useEffect(() => {
        if (autoRefreshInterval <= 0 || !user) return;
        const interval = setInterval(() => fetchWatchlist(true), autoRefreshInterval * 1000);
        return () => clearInterval(interval);
    }, [autoRefreshInterval, user, fetchWatchlist]);

    // Handle Kanban stage change
    const handleStageChange = async (symbol: string, newStage: KanbanStage) => {
        try {
            await fetch('/api/watchlist', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symbol, stage: newStage }),
            });
            // Update local state
            setWatchlist(prev => prev.map(item =>
                item.symbol === symbol ? { ...item, stage: newStage } : item
            ));
            // Update kanban data
            setKanbanData(prev => {
                const newData = { ...prev };
                // Remove from all stages
                Object.keys(newData).forEach(stage => {
                    newData[stage as KanbanStage] = newData[stage as KanbanStage].filter(s => s !== symbol);
                });
                // Add to new stage
                newData[newStage].push(symbol);
                return newData;
            });
        } catch {
            toast.error('Failed to update stage');
        }
    };

    // Toggle comparison item
    const toggleCompareItem = (symbol: string) => {
        setCompareItems(prev => {
            if (prev.includes(symbol)) {
                return prev.filter(s => s !== symbol);
            }
            if (prev.length >= 3) {
                toast.error('Compare up to 3 stocks');
                return prev;
            }
            return [...prev, symbol];
        });
    };

    // Sorted watchlist
    const sortedWatchlist = useMemo(() => {
        return [...watchlist].sort((a, b) => {
            let aVal: any = a[sortField];
            let bVal: any = b[sortField];

            // Handle nulls
            if (aVal == null) aVal = sortDirection === 'asc' ? Infinity : -Infinity;
            if (bVal == null) bVal = sortDirection === 'asc' ? Infinity : -Infinity;

            // String comparison for symbol/name
            if (sortField === 'symbol' || sortField === 'name') {
                aVal = String(aVal).toLowerCase();
                bVal = String(bVal).toLowerCase();
                return sortDirection === 'asc'
                    ? aVal.localeCompare(bVal)
                    : bVal.localeCompare(aVal);
            }

            // Date comparison
            if (sortField === 'created_at') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }

            // Numeric comparison
            return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        });
    }, [watchlist, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const toggleSelectItem = (symbol: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(symbol)) {
                newSet.delete(symbol);
            } else {
                newSet.add(symbol);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === watchlist.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(watchlist.map(w => w.symbol)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedItems.size === 0) return;
        if (!confirm(`Delete ${selectedItems.size} items from watchlist?`)) return;

        try {
            await Promise.all(
                Array.from(selectedItems).map(symbol =>
                    fetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' })
                )
            );
            setWatchlist(prev => prev.filter(item => !selectedItems.has(item.symbol)));
            setSelectedItems(new Set());
            setIsSelectMode(false);
            toast.success(`Removed ${selectedItems.size} items`);
        } catch {
            toast.error('Failed to remove some items');
        }
    };

    const handleBulkMoveToGroup = async (groupId: string | null) => {
        if (selectedItems.size === 0) return;

        try {
            await Promise.all(
                Array.from(selectedItems).map(symbol =>
                    fetch('/api/watchlist', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ symbol, group_id: groupId }),
                    })
                )
            );
            toast.success(`Moved ${selectedItems.size} items`);
            setSelectedItems(new Set());
            setIsSelectMode(false);
            fetchWatchlist();
        } catch {
            toast.error('Failed to move some items');
        }
    };

    const handleAddToWatchlist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addSymbol.trim()) return;

        setIsAdding(true);
        setError(null);

        try {
            // First fetch the stock to get name and current price
            const stockRes = await fetch(`/api/stock/${addSymbol.toUpperCase()}`);
            const stockResponse = await stockRes.json();

            // Handle new API format: { success: true, data: { ... } }
            const stockData = stockResponse.success ? stockResponse.data : stockResponse;

            if (!stockData || stockResponse.error || !stockResponse.success) {
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

    // Sort icon helper
    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="opacity-30" />;
        return sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />;
    };

    if (authLoading || isLoading) {
        return <SkeletonWatchlist />;
    }

    return (
        <div className="pb-20">
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
                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-muted rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('table')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'table' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Table View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2.5 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                            title="Kanban View"
                        >
                            <Columns size={18} />
                        </button>
                    </div>

                    {/* Auto-Refresh Dropdown */}
                    <div className="relative group">
                        <button className={`p-3 rounded-xl transition-all flex items-center gap-1 ${autoRefreshInterval > 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                            <RefreshCw size={16} className={autoRefreshInterval > 0 ? 'animate-spin' : ''} />
                            {autoRefreshInterval > 0 && <span className="text-xs font-bold">{autoRefreshInterval}s</span>}
                        </button>
                        <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[120px]">
                            {[0, 30, 60, 300].map(sec => (
                                <button
                                    key={sec}
                                    onClick={() => setAutoRefreshInterval(sec)}
                                    className={`w-full px-4 py-2.5 text-left text-sm font-bold hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl ${autoRefreshInterval === sec ? 'text-primary' : ''}`}
                                >
                                    {sec === 0 ? 'Off' : sec === 60 ? '1 min' : sec === 300 ? '5 min' : `${sec}s`}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Compare Mode Toggle */}
                    <button
                        onClick={() => {
                            setIsCompareMode(!isCompareMode);
                            if (isCompareMode) setCompareItems([]);
                        }}
                        className={`p-3 rounded-xl transition-all ${isCompareMode ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        title="Compare Stocks"
                    >
                        <BarChart3 size={18} />
                    </button>

                    {/* Select Mode Toggle */}
                    <button
                        onClick={() => {
                            setIsSelectMode(!isSelectMode);
                            if (isSelectMode) setSelectedItems(new Set());
                        }}
                        className={`p-3 rounded-xl transition-all ${isSelectMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                        title="Bulk Select"
                    >
                        <CheckSquare size={18} />
                    </button>

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

            {/* Bulk Actions Bar */}
            <AnimatePresence>
                {isSelectMode && selectedItems.size > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="bg-card border border-primary/20 rounded-2xl p-4 mb-6 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-4">
                            <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground">
                                {selectedItems.size === watchlist.length ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                                {selectedItems.size} selected
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative group">
                                <button className="px-4 py-2 bg-muted rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-muted/80">
                                    <Folder size={16} />
                                    Move to
                                    <ChevronDown size={14} />
                                </button>
                                <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[200px]">
                                    <button
                                        onClick={() => handleBulkMoveToGroup(null)}
                                        className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-muted transition-colors rounded-t-xl"
                                    >
                                        Ungrouped
                                    </button>
                                    {groups.map(g => (
                                        <button
                                            key={g.id}
                                            onClick={() => handleBulkMoveToGroup(g.id)}
                                            className="w-full px-4 py-3 text-left text-sm font-bold hover:bg-muted transition-colors flex items-center gap-2"
                                        >
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                                            {g.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleBulkDelete}
                                className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-rose-500/20"
                            >
                                <Trash2 size={16} />
                                Delete
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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

            {/* Watchlist Content */}
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
            ) : viewMode === 'table' ? (
                /* TABLE VIEW */
                <div className="bg-card border border-border rounded-[32px] overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border bg-muted/30">
                                {isSelectMode && (
                                    <th className="p-4 w-12">
                                        <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                                            {selectedItems.size === watchlist.length ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                                        </button>
                                    </th>
                                )}
                                <th className="p-4 text-left">
                                    <button onClick={() => handleSort('symbol')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                                        Symbol <SortIcon field="symbol" />
                                    </button>
                                </th>
                                <th className="p-4 text-left hidden md:table-cell">
                                    <button onClick={() => handleSort('name')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">
                                        Name <SortIcon field="name" />
                                    </button>
                                </th>
                                <th className="p-4 text-right">
                                    <button onClick={() => handleSort('currentPrice')} className="flex items-center gap-2 justify-end text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground w-full">
                                        Price <SortIcon field="currentPrice" />
                                    </button>
                                </th>
                                <th className="p-4 text-right">
                                    <button onClick={() => handleSort('changePercent')} className="flex items-center gap-2 justify-end text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground w-full">
                                        Change <SortIcon field="changePercent" />
                                    </button>
                                </th>
                                <th className="p-4 text-right hidden lg:table-cell">
                                    <button onClick={() => handleSort('sinceAddedPercent')} className="flex items-center gap-2 justify-end text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground w-full">
                                        Since Added <SortIcon field="sinceAddedPercent" />
                                    </button>
                                </th>
                                <th className="p-4 text-center w-24 hidden lg:table-cell">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stage</span>
                                </th>
                                <th className="p-4 text-center w-28 hidden md:table-cell">Chart</th>
                                <th className="p-4 w-20"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedWatchlist.map((item, idx) => (
                                <tr
                                    key={item.id}
                                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${selectedItems.has(item.symbol) ? 'bg-primary/5' : ''}`}
                                >
                                    {isSelectMode && (
                                        <td className="p-4">
                                            <button onClick={() => toggleSelectItem(item.symbol)} className="text-muted-foreground hover:text-foreground">
                                                {selectedItems.has(item.symbol) ? <CheckSquare size={18} className="text-primary" /> : <Square size={18} />}
                                            </button>
                                        </td>
                                    )}
                                    <td className="p-4">
                                        <Link href={`/dashboard/ticker/${item.symbol}`} className="font-black text-lg hover:text-primary transition-colors">
                                            {item.symbol}
                                        </Link>
                                    </td>
                                    <td className="p-4 text-muted-foreground text-sm truncate max-w-[200px] hidden md:table-cell">
                                        {item.name || '—'}
                                    </td>
                                    <td className="p-4 text-right font-black">
                                        {item.currentPrice ? `$${item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
                                    </td>
                                    <td className="p-4 text-right">
                                        <span className={`font-black ${(item.changePercent ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {(item.changePercent ?? 0) >= 0 ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
                                        </span>
                                    </td>
                                    <td className="p-4 text-right hidden lg:table-cell">
                                        {item.sinceAddedPercent != null ? (
                                            <span className={`font-black ${item.sinceAddedPercent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {item.sinceAddedPercent >= 0 ? '+' : ''}{item.sinceAddedPercent.toFixed(1)}%
                                            </span>
                                        ) : '—'}
                                    </td>
                                    <td className="p-4 hidden lg:table-cell">
                                        <div className="relative group/stage">
                                            <button
                                                className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase mx-auto block"
                                                style={{
                                                    backgroundColor: `${KANBAN_STAGES.find(s => s.id === (item.stage || 'researching'))?.color || '#3b82f6'}20`,
                                                    color: KANBAN_STAGES.find(s => s.id === (item.stage || 'researching'))?.color || '#3b82f6'
                                                }}
                                            >
                                                {KANBAN_STAGES.find(s => s.id === (item.stage || 'researching'))?.label.split(' ')[0] || 'Research'}
                                            </button>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-card border border-border rounded-xl shadow-xl opacity-0 invisible group-hover/stage:opacity-100 group-hover/stage:visible transition-all z-50 min-w-[120px]">
                                                {KANBAN_STAGES.map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => handleStageChange(item.symbol, s.id)}
                                                        className={`w-full px-3 py-2 text-left text-xs font-bold hover:bg-muted transition-colors first:rounded-t-xl last:rounded-b-xl flex items-center gap-2 ${item.stage === s.id ? 'bg-muted' : ''}`}
                                                    >
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                                        {s.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 hidden md:table-cell">
                                        <div className="w-20 h-8 mx-auto">
                                            {item.sparklineData && item.sparklineData.length > 0 && (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={item.sparklineData}>
                                                        <Area
                                                            type="monotone"
                                                            dataKey="value"
                                                            stroke={(item.changePercent ?? 0) >= 0 ? '#10b981' : '#f43f5e'}
                                                            strokeWidth={2}
                                                            fill="transparent"
                                                            isAnimationActive={false}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => setMoveItem(item)}
                                                className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                                            >
                                                <Folder size={16} />
                                            </button>
                                            {isCompareMode && (
                                                <button
                                                    onClick={() => toggleCompareItem(item.symbol)}
                                                    className={`p-2 rounded-lg transition-all ${compareItems.includes(item.symbol) ? 'bg-amber-500 text-white' : 'text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500'}`}
                                                >
                                                    <BarChart3 size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleRemove(item.symbol)}
                                                className="p-2 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : viewMode === 'kanban' ? (
                /* KANBAN VIEW */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {KANBAN_STAGES.map((stage) => (
                        <div key={stage.id} className="bg-card/50 border border-border rounded-[32px] p-6 min-h-[400px]">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                                <h3 className="font-black text-sm uppercase tracking-widest">{stage.label}</h3>
                                <span className="ml-auto bg-muted px-2.5 py-1 rounded-full text-xs font-bold text-muted-foreground">
                                    {kanbanData[stage.id].length}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {kanbanData[stage.id].map((symbol) => {
                                    const item = watchlist.find(w => w.symbol === symbol);
                                    if (!item) return null;
                                    return (
                                        <motion.div
                                            key={item.id}
                                            layout
                                            className="bg-card border border-border rounded-2xl p-4 hover:shadow-lg hover:border-primary/20 transition-all group"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <Link href={`/dashboard/ticker/${item.symbol}`} className="font-black text-lg hover:text-primary transition-colors">
                                                        {item.symbol}
                                                    </Link>
                                                    <p className="text-[10px] text-muted-foreground truncate uppercase">
                                                        {item.name || 'Loading...'}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {isCompareMode && (
                                                        <button
                                                            onClick={() => toggleCompareItem(item.symbol)}
                                                            className={`p-1.5 rounded-lg transition-all ${compareItems.includes(item.symbol) ? 'bg-amber-500 text-white' : 'text-muted-foreground/50 hover:text-amber-500 hover:bg-amber-500/10'}`}
                                                        >
                                                            <BarChart3 size={14} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemove(item.symbol)}
                                                        className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-black">
                                                    ${item.currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '—'}
                                                </span>
                                                <span className={`text-sm font-bold ${(item.changePercent ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {(item.changePercent ?? 0) >= 0 ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
                                                </span>
                                            </div>
                                            {/* Stage change buttons */}
                                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {KANBAN_STAGES.filter(s => s.id !== stage.id).map(s => (
                                                    <button
                                                        key={s.id}
                                                        onClick={() => handleStageChange(item.symbol, s.id)}
                                                        className="flex-1 py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all hover:scale-105"
                                                        style={{ backgroundColor: `${s.color}20`, color: s.color }}
                                                    >
                                                        → {s.label.split(' ')[0]}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                {kanbanData[stage.id].length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground/50">
                                        <p className="text-sm font-bold">Drop stocks here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* GRID VIEW (default) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    <AnimatePresence mode='popLayout'>
                        {sortedWatchlist.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`bg-card border rounded-[40px] p-1 shadow-sm hover:shadow-2xl hover:shadow-primary/5 group ${selectedItems.has(item.symbol) ? 'border-primary bg-primary/5' : 'border-border'}`}
                            >
                                <div className="p-8">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="flex items-start gap-3">
                                            {isSelectMode && (
                                                <button onClick={() => toggleSelectItem(item.symbol)} className="mt-1">
                                                    {selectedItems.has(item.symbol) ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} className="text-muted-foreground" />}
                                                </button>
                                            )}
                                            <Link href={`/dashboard/ticker/${item.symbol}`} className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-3xl font-black tracking-tighter group-hover:text-primary transition-colors">{item.symbol}</h3>
                                                    {item.stage && item.stage !== 'researching' && (
                                                        <span
                                                            className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase"
                                                            style={{
                                                                backgroundColor: `${KANBAN_STAGES.find(s => s.id === item.stage)?.color || '#3b82f6'}20`,
                                                                color: KANBAN_STAGES.find(s => s.id === item.stage)?.color || '#3b82f6'
                                                            }}
                                                        >
                                                            {KANBAN_STAGES.find(s => s.id === item.stage)?.label || item.stage}
                                                        </span>
                                                    )}
                                                    <ChevronRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                                </div>
                                                <p className="text-[10px] font-black text-muted-foreground truncate uppercase tracking-[0.2em]">{item.name || 'Resolving...'}</p>
                                            </Link>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isCompareMode && (
                                                <button
                                                    onClick={() => toggleCompareItem(item.symbol)}
                                                    className={`p-3 rounded-2xl transition-all active:scale-90 ${compareItems.includes(item.symbol) ? 'bg-amber-500 text-white' : 'bg-muted/50 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-500'}`}
                                                    title="Compare"
                                                >
                                                    <BarChart3 size={18} />
                                                </button>
                                            )}
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

            {/* Comparison Mode Panel */}
            <AnimatePresence>
                {isCompareMode && compareItems.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card border border-amber-500/30 rounded-[32px] p-6 shadow-2xl shadow-amber-500/20 min-w-[600px] max-w-[900px]"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-black text-lg flex items-center gap-2">
                                <BarChart3 className="text-amber-500" size={20} />
                                Comparing {compareItems.length} Stocks
                            </h3>
                            <button onClick={() => { setIsCompareMode(false); setCompareItems([]); }} className="p-2 rounded-xl hover:bg-muted">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            {compareItems.map(symbol => {
                                const item = watchlist.find(w => w.symbol === symbol);
                                if (!item) return null;

                                // Calculate 52-week range position
                                const rangePosition = item.fiftyTwoWeekLow && item.fiftyTwoWeekHigh && item.currentPrice
                                    ? ((item.currentPrice - item.fiftyTwoWeekLow) / (item.fiftyTwoWeekHigh - item.fiftyTwoWeekLow)) * 100
                                    : null;

                                return (
                                    <div key={symbol} className="bg-muted/50 rounded-2xl p-4 relative">
                                        <button
                                            onClick={() => toggleCompareItem(symbol)}
                                            className="absolute top-2 right-2 p-1 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"
                                        >
                                            <X size={14} />
                                        </button>
                                        <h4 className="font-black text-xl mb-1">{symbol}</h4>
                                        <p className="text-[10px] text-muted-foreground truncate uppercase mb-4">{item.name}</p>

                                        {/* Price Section */}
                                        <div className="flex items-baseline gap-2 mb-4">
                                            <span className="text-2xl font-black">${item.currentPrice?.toFixed(2) || '—'}</span>
                                            <span className={`text-sm font-bold ${(item.changePercent ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {(item.changePercent ?? 0) >= 0 ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
                                            </span>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Since Added</span>
                                                <span className={`font-bold ${(item.sinceAddedPercent ?? 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {item.sinceAddedPercent != null ? `${item.sinceAddedPercent >= 0 ? '+' : ''}${item.sinceAddedPercent.toFixed(1)}%` : '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">P/E Ratio</span>
                                                <span className="font-bold">{item.peRatio?.toFixed(1) || '—'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Market Cap</span>
                                                <span className="font-bold">
                                                    {item.marketCap
                                                        ? item.marketCap >= 1e12
                                                            ? `$${(item.marketCap / 1e12).toFixed(1)}T`
                                                            : item.marketCap >= 1e9
                                                                ? `$${(item.marketCap / 1e9).toFixed(1)}B`
                                                                : `$${(item.marketCap / 1e6).toFixed(0)}M`
                                                        : '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Dividend</span>
                                                <span className="font-bold">
                                                    {item.dividendYield ? `${(item.dividendYield * 100).toFixed(2)}%` : '—'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Beta</span>
                                                <span className="font-bold">{item.beta?.toFixed(2) || '—'}</span>
                                            </div>

                                            {/* 52-Week Range Bar */}
                                            {rangePosition !== null && (
                                                <div className="pt-2">
                                                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                                        <span>${item.fiftyTwoWeekLow?.toFixed(0)}</span>
                                                        <span className="font-bold">52W Range</span>
                                                        <span>${item.fiftyTwoWeekHigh?.toFixed(0)}</span>
                                                    </div>
                                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full"
                                                            style={{ width: `${Math.min(100, Math.max(0, rangePosition))}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            {compareItems.length < 3 && (
                                <div className="border-2 border-dashed border-border rounded-2xl p-4 flex items-center justify-center text-muted-foreground">
                                    <p className="text-sm font-bold">Click stocks to add</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
