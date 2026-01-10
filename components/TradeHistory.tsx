'use client';

import { Trade, CurrencyCode } from '@/types/portfolio';
import { formatCurrency, formatNumber, convertCurrency } from '@/lib/portfolio';
import { Trash2, Edit2, Clock, Tag, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TradeHistoryProps {
    trades: Trade[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    onTradeDeleted?: () => void;
    onTradeEdit?: (trade: Trade) => void;
    readOnly?: boolean;
}

export default function TradeHistory({
    trades,
    currency,
    exchangeRates,
    onTradeDeleted,
    onTradeEdit,
    readOnly = false
}: TradeHistoryProps) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const handleDelete = async (id: string) => {
        if (readOnly || !onTradeDeleted) return;
        if (!confirm('Are you sure you want to delete this trade?')) return;

        setIsDeleting(id);
        try {
            const response = await fetch(`/api/trades/${id}`, {
                method: 'DELETE',
            });
            if (response.ok) {
                onTradeDeleted();
            }
        } catch (error) {
            console.error('Failed to delete trade:', error);
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredTrades = trades.filter(t =>
        t.ticker.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedTrades = [...filteredTrades].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (trades.length === 0) {
        return null;
    }

    return (
        <div className="bg-card rounded-[32px] md:rounded-[40px] border border-border overflow-hidden shadow-sm">
            <div className="p-8 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-black tracking-tight">Trade History</h2>
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Transaction Ledger</p>
                </div>
                <div className="relative w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search tickers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block max-h-[400px] overflow-y-auto custom-scrollbar">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border/50">
                            <th className="text-left py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Asset & Date</th>
                            <th className="text-left py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Action</th>
                            <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Quantity</th>
                            <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Price</th>
                            <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Total Value</th>
                            {!readOnly && <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {sortedTrades.map((trade) => {
                            const isBuy = trade.action === 'BUY';
                            const date = new Date(trade.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                            const convertedTotal = convertCurrency(trade.totalCost, currency, exchangeRates);
                            const convertedPrice = convertCurrency(trade.pricePerShare, currency, exchangeRates);

                            return (
                                <motion.tr
                                    key={trade.id}
                                    whileHover={{ backgroundColor: 'var(--muted)' }}
                                    className="transition-colors group"
                                >
                                    <td className="py-5 px-8">
                                        <div className="flex flex-col">
                                            <span className="text-foreground font-black flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${isBuy ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                                {trade.ticker}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1 mt-1 uppercase tracking-tighter">
                                                <Clock size={10} />
                                                {date}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-8">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${isBuy ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                            }`}>
                                            {isBuy ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                            {trade.action}
                                        </span>
                                    </td>
                                    <td className="py-5 px-8 text-right font-bold text-sm">
                                        {formatNumber(trade.quantity, trade.quantity % 1 !== 0 ? 3 : 0)}
                                    </td>
                                    <td className="py-5 px-8 text-right text-muted-foreground text-sm">
                                        {formatCurrency(convertedPrice, currency)}
                                    </td>
                                    <td className="py-5 px-8 text-right font-black text-foreground">
                                        {formatCurrency(convertedTotal, currency)}
                                    </td>
                                    {!readOnly && (
                                        <td className="py-5 px-8 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onTradeEdit && onTradeEdit(trade)}
                                                    className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-primary hover:border-primary/50 transition-all shadow-sm"
                                                    title="Edit trade"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(trade.id)}
                                                    disabled={isDeleting === trade.id}
                                                    className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-rose-500 hover:border-rose-500/50 transition-all shadow-sm disabled:opacity-50"
                                                    title="Delete trade"
                                                >
                                                    <Trash2 size={14} className={isDeleting === trade.id ? 'animate-pulse' : ''} />
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
                {sortedTrades.map((trade) => {
                    const isBuy = trade.action === 'BUY';
                    const date = new Date(trade.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const convertedTotal = convertCurrency(trade.totalCost, currency, exchangeRates);
                    const convertedPrice = convertCurrency(trade.pricePerShare, currency, exchangeRates);

                    return (
                        <div key={trade.id} className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${isBuy ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'}`}>
                                        {isBuy ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                    </div>
                                    <div>
                                        <div className="font-black text-base flex items-center gap-1.5">
                                            {trade.ticker}
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${isBuy ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'}`}>
                                                {trade.action}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter flex items-center gap-1 mt-0.5">
                                            <Clock size={10} />
                                            {date}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-white">{formatCurrency(convertedTotal, currency)}</div>
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                                        {formatNumber(trade.quantity)} Total
                                    </div>
                                </div>
                            </div>

                            {!readOnly && (
                                <div className="flex justify-end gap-2 pt-4">
                                    <button
                                        onClick={() => onTradeEdit && onTradeEdit(trade)}
                                        className="px-4 py-2 rounded-xl bg-muted border border-border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Edit2 size={12} />
                                        Modfn
                                    </button>
                                    <button
                                        onClick={() => handleDelete(trade.id)}
                                        disabled={isDeleting === trade.id}
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
