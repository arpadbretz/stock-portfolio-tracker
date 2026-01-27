import { Trade, CurrencyCode, CashTransactionType } from '@/types/portfolio';
import { formatCurrency, formatNumber, convertCurrency } from '@/lib/portfolio';
import {
    Trash2,
    Edit2,
    Clock,
    Tag,
    ArrowUpRight,
    ArrowDownRight,
    MoreHorizontal,
    Wallet,
    DollarSign,
    Receipt,
    RefreshCw,
    TrendingUp,
    PiggyBank,
    Banknote
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface UnifiedTransaction {
    id: string;
    type: 'stock' | 'cash';
    ticker: string;
    action: string; // BUY, SELL for stock | DEPOSIT, WITHDRAWAL, etc. for cash
    quantity: number;
    price: number;
    total: number;
    date: string;
    timestamp: string;
    currency: CurrencyCode;
    description?: string;
}

interface TradeHistoryProps {
    trades?: Trade[];
    transactions?: UnifiedTransaction[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    onTradeDeleted?: () => void;
    onTradeEdit?: (trade: any) => void;
    readOnly?: boolean;
    compact?: boolean;
}

export default function TradeHistory({
    trades,
    transactions,
    currency,
    exchangeRates,
    onTradeDeleted,
    onTradeEdit,
    readOnly = false,
    compact = false
}: TradeHistoryProps) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const normalizedTransactions = useMemo(() => {
        if (transactions) return transactions;
        if (!trades) return [];

        return trades.map(t => ({
            id: t.id,
            type: 'stock' as const,
            ticker: t.ticker,
            action: t.action,
            quantity: t.quantity,
            price: t.pricePerShare,
            total: t.totalCost,
            date: t.timestamp,
            timestamp: t.timestamp,
            currency: (t as any).currency || 'USD',
            description: undefined
        }));
    }, [trades, transactions]);

    const handleDelete = async (id: string, type: 'stock' | 'cash') => {
        if (readOnly || !onTradeDeleted) return;
        if (!confirm(`Are you sure you want to delete this ${type === 'stock' ? 'trade' : 'transaction'}?`)) return;

        setIsDeleting(id);
        try {
            const endpoint = type === 'stock' ? `/api/trades/${id}` : `/api/cash?id=${id}`;
            const response = await fetch(endpoint, {
                method: 'DELETE',
            });
            if (response.ok) {
                onTradeDeleted();
            }
        } catch (error) {
            console.error('Failed to delete:', error);
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredTransactions = normalizedTransactions.filter(t =>
        t.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const sortedTransactions = [...filteredTransactions].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (normalizedTransactions.length === 0) {
        return null;
    }

    const getTransactionConfig = (tx: UnifiedTransaction) => {
        if (tx.type === 'stock') {
            const isBuy = tx.action === 'BUY';
            return {
                icon: isBuy ? ArrowUpRight : ArrowDownRight,
                color: isBuy ? 'text-emerald-500' : 'text-blue-500',
                bg: isBuy ? 'bg-emerald-500/10' : 'bg-blue-500/10',
                label: tx.action,
                subLabel: `${formatNumber(tx.quantity)} shares`
            };
        } else {
            const type = tx.action as CashTransactionType;
            switch (type) {
                case 'DEPOSIT':
                    return { icon: PiggyBank, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Deposit', subLabel: tx.description || 'Cash In' };
                case 'WITHDRAWAL':
                    return { icon: Banknote, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Withdrawal', subLabel: tx.description || 'Cash Out' };
                case 'DIVIDEND':
                    return { icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Dividend', subLabel: tx.ticker };
                case 'INTEREST':
                    return { icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Interest', subLabel: tx.description || 'Yield' };
                case 'FEE':
                    return { icon: Receipt, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Fee', subLabel: tx.description || 'Charges' };
                default:
                    return { icon: Wallet, color: 'text-purple-500', bg: 'bg-purple-500/10', label: tx.action, subLabel: tx.description || 'Adjustment' };
            }
        }
    };

    // Compact mode for widgets - simple list view
    if (compact) {
        return (
            <div className="space-y-2">
                {sortedTransactions.slice(0, 8).map((tx) => {
                    const config = getTransactionConfig(tx);
                    const Icon = config.icon;
                    const date = new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const convertedTotal = convertCurrency(tx.total, currency, exchangeRates);
                    const isPositive = ['BUY', 'DEPOSIT', 'DIVIDEND', 'INTEREST'].includes(tx.action) || (tx.type === 'cash' && tx.action === 'ADJUSTMENT' && tx.total > 0);

                    return (
                        <div
                            key={tx.id}
                            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                                    <Icon size={12} />
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-sm flex items-center gap-1.5 truncate">
                                        {tx.type === 'stock' ? tx.ticker : config.label}
                                        <span className={`text-[8px] font-black px-1 py-0.5 rounded ${config.bg} ${config.color}`}>
                                            {tx.type === 'stock' ? tx.action : tx.ticker}
                                        </span>
                                    </div>
                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <Clock size={9} />
                                        {date}
                                        <span className="opacity-30">•</span>
                                        <span className="truncate max-w-[80px]">{config.subLabel}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="font-bold text-sm blur-stealth">{formatCurrency(convertedTotal, currency)}</div>
                                    <div className="text-[10px] text-muted-foreground truncate">
                                        {tx.type === 'stock' ? `${formatNumber(tx.quantity)} × ${tx.ticker}` : tx.action}
                                    </div>
                                </div>
                                {!readOnly && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onTradeEdit?.(tx);
                                            }}
                                            className="p-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
                                        >
                                            <Edit2 size={10} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handleDelete(tx.id, tx.type);
                                            }}
                                            disabled={isDeleting === tx.id}
                                            className="p-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/50 transition-all disabled:opacity-50"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="bg-card rounded-[32px] md:rounded-[40px] border border-border overflow-hidden shadow-sm">
            <div className="p-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight">Transaction History</h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Unified Portfolio Ledger</p>
                </div>
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search tickers or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block max-h-[500px] overflow-y-auto custom-scrollbar">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border/50">
                            <th className="text-left py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Asset & Date</th>
                            <th className="text-left py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Type & Action</th>
                            <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Quantity / Info</th>
                            <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Price / Rate</th>
                            <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Amount</th>
                            {!readOnly && <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {sortedTransactions.map((tx) => {
                            const config = getTransactionConfig(tx);
                            const Icon = config.icon;
                            const date = new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const convertedTotal = convertCurrency(tx.total, currency, exchangeRates);
                            const convertedPrice = convertCurrency(tx.price, currency, exchangeRates);
                            const isPositive = ['DEPOSIT', 'DIVIDEND', 'INTEREST'].includes(tx.action) || (tx.action === 'ADJUSTMENT' && tx.total > 0);

                            return (
                                <motion.tr
                                    key={tx.id}
                                    whileHover={{ backgroundColor: 'var(--muted)' }}
                                    className="transition-colors group"
                                >
                                    <td className="py-5 px-8">
                                        <div className="flex flex-col">
                                            <span className="text-foreground font-black flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}></div>
                                                {tx.type === 'stock' ? tx.ticker : config.label}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 mt-1 uppercase tracking-tighter">
                                                <Clock size={10} />
                                                {date}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-8">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${config.bg} ${config.color} border border-current/10`}>
                                            <Icon size={10} />
                                            {tx.type === 'stock' ? tx.action : tx.action}
                                        </span>
                                    </td>
                                    <td className="py-5 px-8 text-right font-bold text-sm">
                                        {tx.type === 'stock'
                                            ? formatNumber(tx.quantity, tx.quantity % 1 !== 0 ? 3 : 0)
                                            : <span className="text-xs text-muted-foreground">{tx.description || config.subLabel}</span>
                                        }
                                    </td>
                                    <td className="py-5 px-8 text-right text-muted-foreground text-sm blur-stealth">
                                        {formatCurrency(convertedPrice, currency)}
                                    </td>
                                    <td className={`py-5 px-8 text-right font-black blur-stealth ${isPositive ? 'text-emerald-500' : 'text-foreground'}`}>
                                        {formatCurrency(convertedTotal, currency)}
                                    </td>
                                    {!readOnly && (
                                        <td className="py-5 px-8 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onTradeEdit && onTradeEdit(tx)}
                                                    className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tx.id, tx.type)}
                                                    disabled={isDeleting === tx.id}
                                                    className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/50 transition-all shadow-sm disabled:opacity-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} className={isDeleting === tx.id ? 'animate-pulse' : ''} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border/50">
                {sortedTransactions.map((tx) => {
                    const config = getTransactionConfig(tx);
                    const Icon = config.icon;
                    const date = new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const convertedTotal = convertCurrency(tx.total, currency, exchangeRates);
                    const isPositive = ['DEPOSIT', 'DIVIDEND', 'INTEREST'].includes(tx.action) || (tx.action === 'ADJUSTMENT' && tx.total > 0);

                    return (
                        <div key={tx.id} className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${config.bg} ${config.color} border border-current/10`}>
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <div className="font-black text-base flex items-center gap-1.5">
                                            {tx.type === 'stock' ? tx.ticker : config.label}
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${config.bg} ${config.color} border-current/10`}>
                                                {tx.type === 'stock' ? tx.action : tx.ticker}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter flex items-center gap-1 mt-0.5">
                                            <Clock size={10} />
                                            {date}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-black blur-stealth ${isPositive ? 'text-emerald-500' : 'text-white'}`}>
                                        {formatCurrency(convertedTotal, currency)}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                                        {tx.type === 'stock' ? `${formatNumber(tx.quantity)} Total` : tx.action}
                                    </div>
                                </div>
                            </div>

                            {!readOnly && (
                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        onClick={() => onTradeEdit && onTradeEdit(tx)}
                                        className="px-4 py-2 rounded-xl bg-muted border border-border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Edit2 size={12} />
                                        Modfn
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tx.id, tx.type)}
                                        disabled={isDeleting === tx.id}
                                        className="px-4 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Trash2 size={12} />
                                        Rm
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="p-8 text-center bg-muted/30">
                <button className="text-[10px] text-muted-foreground hover:text-foreground font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 mx-auto">
                    Export Ledger to Spreadsheet (CSV)
                </button>
            </div>
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(var(--primary-rgb), 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(var(--primary-rgb), 0.2);
                }
            `}</style>
        </div >
    );
}
