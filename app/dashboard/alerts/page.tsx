'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import {
    Bell,
    Plus,
    Trash2,
    TrendingUp,
    TrendingDown,
    ArrowUp,
    ArrowDown,
    Check,
    RefreshCw,
    AlertTriangle,
    Loader2,
    ExternalLink,
    Edit2,
    X,
} from 'lucide-react';
import { toast } from 'sonner';

interface PriceAlert {
    id: string;
    symbol: string;
    target_price: number;
    condition: 'above' | 'below';
    is_triggered: boolean;
    triggered_at: string | null;
    created_at: string;
    currentPrice?: number;
}

export default function AlertsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();

    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Form state
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [newSymbol, setNewSymbol] = useState('');
    const [newTargetPrice, setNewTargetPrice] = useState('');
    const [newCondition, setNewCondition] = useState<'above' | 'below'>('above');
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Edit state
    const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
    const [editTargetPrice, setEditTargetPrice] = useState('');
    const [editCondition, setEditCondition] = useState<'above' | 'below'>('above');
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const fetchAlerts = useCallback(async (background = false) => {
        if (!background) setIsLoading(true);
        else setIsRefreshing(true);

        try {
            const res = await fetch('/api/alerts');
            const data = await res.json();

            if (data.success) {
                // Fetch current prices for each alert
                const alertsWithPrices = await Promise.all(
                    data.data.map(async (alert: PriceAlert) => {
                        try {
                            const priceRes = await fetch(`/api/stock/${alert.symbol}`);
                            const priceData = await priceRes.json();
                            return {
                                ...alert,
                                currentPrice: priceData.price,
                            };
                        } catch {
                            return alert;
                        }
                    })
                );
                setAlerts(alertsWithPrices);
            }
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchAlerts();
        }
    }, [user, fetchAlerts]);

    const handleCreateAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSymbol.trim() || !newTargetPrice) return;

        setIsCreating(true);
        setError(null);

        try {
            const res = await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: newSymbol.toUpperCase(),
                    target_price: parseFloat(newTargetPrice),
                    condition: newCondition,
                }),
            });

            const data = await res.json();

            if (data.success) {
                setNewSymbol('');
                setNewTargetPrice('');
                setNewCondition('above');
                setIsFormOpen(false);
                fetchAlerts();
                toast.success('Alert created!', {
                    description: `You'll be notified when ${newSymbol.toUpperCase()} goes ${newCondition} $${newTargetPrice}`
                });
            } else {
                setError(data.error || 'Failed to create alert');
                toast.error('Failed to create alert', { description: data.error });
            }
        } catch (err) {
            setError('Failed to create alert');
            toast.error('Failed to create alert');
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteAlert = async (alertId: string) => {
        const alert = alerts.find(a => a.id === alertId);
        try {
            await fetch(`/api/alerts?id=${alertId}`, { method: 'DELETE' });
            setAlerts(prev => prev.filter(a => a.id !== alertId));
            toast.success('Alert deleted', {
                description: alert ? `Removed ${alert.symbol} alert` : undefined
            });
        } catch (err) {
            console.error('Failed to delete alert:', err);
            toast.error('Failed to delete alert');
        }
    };

    const startEditing = (alert: PriceAlert) => {
        setEditingAlert(alert);
        setEditTargetPrice(alert.target_price.toString());
        setEditCondition(alert.condition);
    };

    const cancelEditing = () => {
        setEditingAlert(null);
        setEditTargetPrice('');
        setEditCondition('above');
    };

    const handleUpdateAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAlert || !editTargetPrice) return;

        setIsUpdating(true);
        setError(null);

        try {
            const res = await fetch('/api/alerts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingAlert.id,
                    target_price: parseFloat(editTargetPrice),
                    condition: editCondition,
                }),
            });

            const data = await res.json();

            if (data.success) {
                fetchAlerts();
                cancelEditing();
                toast.success('Alert updated!', {
                    description: `${editingAlert.symbol} ${editCondition} $${editTargetPrice}`
                });
            } else {
                setError(data.error || 'Failed to update alert');
                toast.error('Failed to update alert', { description: data.error });
            }
        } catch (err) {
            setError('Failed to update alert');
            toast.error('Failed to update alert');
        } finally {
            setIsUpdating(false);
        }
    };

    const getAlertStatus = (alert: PriceAlert) => {
        if (alert.is_triggered) return 'triggered';
        if (!alert.currentPrice) return 'pending';

        if (alert.condition === 'above' && alert.currentPrice >= alert.target_price) {
            return 'triggered';
        }
        if (alert.condition === 'below' && alert.currentPrice <= alert.target_price) {
            return 'triggered';
        }
        return 'active';
    };

    const getDistanceToTarget = (alert: PriceAlert) => {
        if (!alert.currentPrice) return null;
        const diff = alert.target_price - alert.currentPrice;
        const percent = (diff / alert.currentPrice) * 100;
        return { diff, percent };
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-foreground px-6 py-10 lg:px-12 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-500/10 rounded-xl">
                            <Bell className="text-orange-500" size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price Alerts</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">
                        <span className="text-primary">{alerts.length}</span> Active Alerts
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => fetchAlerts(true)}
                        disabled={isRefreshing}
                        className="p-3 rounded-xl bg-card border border-border hover:bg-muted transition-all"
                    >
                        <RefreshCw size={18} className={isRefreshing ? 'animate-spin text-primary' : ''} />
                    </button>
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2"
                    >
                        <Plus size={18} />
                        New Alert
                    </button>
                </div>
            </div>

            {/* Create Alert Form */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="bg-card border border-border rounded-3xl p-6">
                            <h3 className="text-lg font-bold mb-4">Create Price Alert</h3>
                            <form onSubmit={handleCreateAlert} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <input
                                        type="text"
                                        value={newSymbol}
                                        onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                                        placeholder="Symbol (e.g., AAPL)"
                                        className="px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={newTargetPrice}
                                        onChange={(e) => setNewTargetPrice(e.target.value)}
                                        placeholder="Target Price"
                                        className="px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setNewCondition('above')}
                                            className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${newCondition === 'above'
                                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                                : 'bg-muted text-muted-foreground border border-border'
                                                }`}
                                        >
                                            <ArrowUp size={16} />
                                            Above
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setNewCondition('below')}
                                            className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${newCondition === 'below'
                                                ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                                                : 'bg-muted text-muted-foreground border border-border'
                                                }`}
                                        >
                                            <ArrowDown size={16} />
                                            Below
                                        </button>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsFormOpen(false)}
                                        className="px-6 py-3 bg-muted text-muted-foreground rounded-xl font-bold"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating || !newSymbol.trim() || !newTargetPrice}
                                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {isCreating ? <Loader2 className="animate-spin" size={16} /> : <Bell size={16} />}
                                        Create Alert
                                    </button>
                                </div>
                                {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alerts List */}
            {alerts.length === 0 ? (
                <div className="text-center py-20">
                    <Bell className="mx-auto text-muted-foreground mb-4" size={48} />
                    <h3 className="text-xl font-bold mb-2">No price alerts set</h3>
                    <p className="text-muted-foreground mb-6">Create an alert to get notified when a stock hits your target price</p>
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold inline-flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Create Your First Alert
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {alerts.map((alert, idx) => {
                            const status = getAlertStatus(alert);
                            const distance = getDistanceToTarget(alert);

                            return (
                                <motion.div
                                    key={alert.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`bg-card border rounded-3xl p-6 ${status === 'triggered'
                                        ? 'border-orange-500/50 bg-orange-500/5'
                                        : 'border-border'
                                        }`}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <Link
                                                href={`/dashboard/ticker/${alert.symbol}`}
                                                className="text-xl font-black hover:text-primary transition-colors"
                                            >
                                                {alert.symbol}
                                            </Link>
                                            <div className="flex items-center gap-2 mt-1">
                                                {status === 'triggered' ? (
                                                    <span className="text-xs font-bold text-orange-500 flex items-center gap-1">
                                                        <AlertTriangle size={12} />
                                                        TRIGGERED
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-bold text-muted-foreground">ACTIVE</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => startEditing(alert)}
                                                className="p-2 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAlert(alert.id)}
                                                className="p-2 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Current Price</span>
                                            <span className="font-bold">
                                                {alert.currentPrice ? `$${alert.currentPrice.toFixed(2)}` : '—'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground flex items-center gap-2">
                                                Target
                                                {alert.condition === 'above' ? (
                                                    <ArrowUp size={14} className="text-emerald-500" />
                                                ) : (
                                                    <ArrowDown size={14} className="text-rose-500" />
                                                )}
                                            </span>
                                            <span className={`font-black ${alert.condition === 'above' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                ${alert.target_price.toFixed(2)}
                                            </span>
                                        </div>
                                        {distance && (
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Distance</span>
                                                <span className={`font-bold ${distance.diff >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {distance.diff >= 0 ? '+' : ''}{distance.percent.toFixed(2)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <Link
                                        href={`/dashboard/ticker/${alert.symbol}`}
                                        className="flex items-center justify-center gap-2 py-3 bg-muted rounded-xl text-sm font-bold hover:bg-primary/10 hover:text-primary transition-all"
                                    >
                                        View Stock
                                        <ExternalLink size={14} />
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Edit Alert Modal */}
            <AnimatePresence>
                {editingAlert && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={cancelEditing}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-6"
                        >
                            <div className="bg-card border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-black">Edit Alert</h3>
                                    <button
                                        onClick={cancelEditing}
                                        className="p-2 rounded-lg hover:bg-muted text-muted-foreground"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="mb-6">
                                    <p className="text-sm text-muted-foreground mb-1">Symbol</p>
                                    <p className="text-2xl font-black">{editingAlert.symbol}</p>
                                </div>

                                <form onSubmit={handleUpdateAlert} className="space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-muted-foreground mb-2 block">
                                            Target Price
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editTargetPrice}
                                            onChange={(e) => setEditTargetPrice(e.target.value)}
                                            className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="text-sm font-bold text-muted-foreground mb-2 block">
                                            Condition
                                        </label>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setEditCondition('above')}
                                                className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${editCondition === 'above'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                                                        : 'bg-muted text-muted-foreground border border-border'
                                                    }`}
                                            >
                                                <ArrowUp size={16} />
                                                Above
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditCondition('below')}
                                                className={`flex-1 px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${editCondition === 'below'
                                                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                                                        : 'bg-muted text-muted-foreground border border-border'
                                                    }`}
                                            >
                                                <ArrowDown size={16} />
                                                Below
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={cancelEditing}
                                            className="flex-1 px-6 py-3 bg-muted text-muted-foreground rounded-xl font-bold"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isUpdating || !editTargetPrice}
                                            className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isUpdating ? (
                                                <Loader2 className="animate-spin" size={16} />
                                            ) : (
                                                <Check size={16} />
                                            )}
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
