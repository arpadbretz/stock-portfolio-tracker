'use client';

import { Trade, CurrencyCode } from '@/types/portfolio';
import { formatCurrency, formatNumber, convertCurrency } from '@/lib/portfolio';
import { Trash2, Edit2, Clock, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useState } from 'react';

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

    const sortedTrades = [...trades].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    if (trades.length === 0) {
        return null;
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">Trade History</h2>
                    <p className="text-slate-400 text-sm mt-1">All processed transactions</p>
                </div>
            </div>

            <div className="overflow-x-auto hidden md:block">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50">
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Date & Ticker</th>
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Type</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Quantity</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Price</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Total</th>
                            {!readOnly && <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTrades.map((trade) => {
                            const isBuy = trade.action === 'BUY';
                            const date = new Date(trade.timestamp).toLocaleDateString();
                            const convertedTotal = convertCurrency(trade.totalCost, currency, exchangeRates);
                            const convertedPrice = convertCurrency(trade.pricePerShare, currency, exchangeRates);

                            return (
                                <tr
                                    key={trade.id}
                                    className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors group"
                                >
                                    <td className="py-4 px-6">
                                        <div className="flex flex-col">
                                            <span className="text-white font-semibold flex items-center gap-1.5">
                                                <Tag size={12} className="text-slate-500" />
                                                {trade.ticker}
                                            </span>
                                            <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                <Clock size={10} />
                                                {date}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                                            }`}>
                                            {isBuy ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                            {trade.action}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6 text-right text-slate-300">
                                        {formatNumber(trade.quantity, trade.quantity % 1 !== 0 ? 3 : 0)}
                                    </td>
                                    <td className="py-4 px-6 text-right text-slate-300">
                                        {formatCurrency(convertedPrice, currency)}
                                    </td>
                                    <td className="py-4 px-6 text-right text-white font-medium">
                                        {formatCurrency(convertedTotal, currency)}
                                    </td>
                                    {!readOnly && (
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onTradeEdit && onTradeEdit(trade)}
                                                    className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                                                    title="Edit trade"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(trade.id)}
                                                    disabled={isDeleting === trade.id}
                                                    className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-50"
                                                    title="Delete trade"
                                                >
                                                    <Trash2 size={16} className={isDeleting === trade.id ? 'animate-pulse' : ''} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4 p-4">
                {sortedTrades.map((trade) => {
                    const isBuy = trade.action === 'BUY';
                    const date = new Date(trade.timestamp).toLocaleDateString();
                    const convertedTotal = convertCurrency(trade.totalCost, currency, exchangeRates);
                    const convertedPrice = convertCurrency(trade.pricePerShare, currency, exchangeRates);

                    return (
                        <div key={trade.id} className="bg-slate-700/20 rounded-xl p-4 border border-slate-700/30">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isBuy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {isBuy ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-white tracking-wide">{trade.ticker}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1">
                                            <Clock size={10} />
                                            {date}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-white">{formatCurrency(convertedTotal, currency)}</div>
                                    <div className="text-xs text-slate-400">
                                        {formatNumber(trade.quantity)} @ {formatCurrency(convertedPrice, currency)}
                                    </div>
                                </div>
                            </div>

                            {!readOnly && (
                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-700/30">
                                    <button
                                        onClick={() => onTradeEdit && onTradeEdit(trade)}
                                        className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-blue-300 font-medium transition-colors flex items-center gap-1.5"
                                    >
                                        <Edit2 size={12} />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(trade.id)}
                                        disabled={isDeleting === trade.id}
                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-xs text-red-400 font-medium transition-colors flex items-center gap-1.5"
                                    >
                                        {isDeleting === trade.id ? <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin"></div> : <Trash2 size={12} />}
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div >
    );
}
