'use client';

import { Holding, CurrencyCode } from '@/types/portfolio';
import {
    formatCurrency,
    formatPercentage,
    formatNumber,
    convertCurrency
} from '@/lib/portfolio';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface HoldingsTableProps {
    holdings: Holding[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    isLoading?: boolean;
    compact?: boolean;
}

export default function HoldingsTable({ holdings, currency, exchangeRates, isLoading, compact = false }: HoldingsTableProps) {
    if (isLoading) {
        return (
            <div className="bg-card rounded-[40px] border border-border p-8">
                <div className="h-6 w-32 bg-muted animate-pulse rounded mb-8"></div>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex items-center gap-4">
                            <div className="h-12 w-12 bg-muted rounded-2xl"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-muted rounded w-1/4"></div>
                                <div className="h-3 bg-muted rounded w-1/3"></div>
                            </div>
                            <div className="h-4 bg-muted rounded w-24"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (holdings.length === 0) {
        return (
            <div className={compact ? "text-center py-8" : "bg-card rounded-[40px] border border-border p-12 text-center"}>
                <div className="w-16 h-16 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <TrendingUp className="text-muted-foreground" size={32} />
                </div>
                <h3 className="text-xl font-bold mb-2">No Holdings Yet</h3>
                <p className="text-muted-foreground max-w-xs mx-auto mb-8 text-sm">
                    Add your trades to see your portfolio performance and analytics.
                </p>
            </div>
        );
    }

    // Compact mode for widgets - simple list view
    if (compact) {
        return (
            <div className="space-y-2">
                {holdings.map((holding) => {
                    const isPositive = holding.unrealizedGain > 0;
                    const isNegative = holding.unrealizedGain < 0;

                    return (
                        <Link
                            key={holding.ticker}
                            href={`/dashboard/ticker/${holding.ticker}`}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-black text-[10px]">
                                    {holding.ticker.slice(0, 3)}
                                </div>
                                <div>
                                    <div className="font-bold text-sm group-hover:text-primary transition-colors">{holding.ticker}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                        {formatNumber(holding.shares, holding.shares % 1 !== 0 ? 2 : 0)} shares
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-bold text-sm">
                                    {formatCurrency(convertCurrency(holding.marketValue, currency, exchangeRates), currency)}
                                </div>
                                <div className={`text-[10px] font-bold ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-muted-foreground'}`}>
                                    {formatPercentage(holding.unrealizedGainPercent)}
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="bg-card rounded-[32px] md:rounded-[40px] border border-border overflow-hidden shadow-sm">
            <div className="p-8 pb-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Holdings</h2>
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">
                            {holdings.length} Positions Active
                        </p>
                    </div>
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border/50">
                            <th className="text-left py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Symbol</th>
                            <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Shares</th>
                            <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Avg Cost</th>
                            <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Price</th>
                            <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Value</th>
                            <th className="text-right py-5 px-8 text-xs font-black text-muted-foreground uppercase tracking-wider">Return</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                        {holdings.map((holding) => {
                            const isPositive = holding.unrealizedGain > 0;
                            const isNegative = holding.unrealizedGain < 0;

                            return (
                                <motion.tr
                                    key={holding.ticker}
                                    whileHover={{ backgroundColor: 'var(--muted)', opacity: 1 }}
                                    className="transition-colors group"
                                >
                                    <td className="py-5 px-8">
                                        <Link href={`/dashboard/ticker/${holding.ticker}`} className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-black text-sm group-hover:scale-110 transition-transform">
                                                {holding.ticker}
                                            </div>
                                            <div>
                                                <div className="font-black text-foreground group-hover:text-primary transition-colors">{holding.ticker}</div>
                                                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">View Details →</div>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="py-5 px-8 text-right font-bold text-sm">
                                        {formatNumber(holding.shares, holding.shares % 1 !== 0 ? 3 : 0)}
                                    </td>
                                    <td className="py-5 px-8 text-right text-muted-foreground text-sm">
                                        {formatCurrency(convertCurrency(holding.avgCostBasis, currency, exchangeRates), currency)}
                                    </td>
                                    <td className="py-5 px-8 text-right font-black text-sm">
                                        {formatCurrency(convertCurrency(holding.currentPrice, currency, exchangeRates), currency)}
                                    </td>
                                    <td className="py-5 px-8 text-right font-black text-foreground">
                                        {formatCurrency(convertCurrency(holding.marketValue, currency, exchangeRates), currency)}
                                    </td>
                                    <td className="py-5 px-8 text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <div className="text-right">
                                                <div className={`font-black text-sm ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-muted-foreground'}`}>
                                                    {formatCurrency(convertCurrency(holding.unrealizedGain, currency, exchangeRates), currency)}
                                                </div>
                                                <div className={`text-[10px] font-black ${isPositive ? 'text-emerald-500/70' : isNegative ? 'text-rose-500/70' : 'text-muted-foreground/50'}`}>
                                                    {formatPercentage(holding.unrealizedGainPercent)}
                                                </div>
                                            </div>
                                            <div className={`p-1.5 rounded-lg ${isPositive ? 'bg-emerald-500/10' : isNegative ? 'bg-rose-500/10' : 'bg-muted'}`}>
                                                {isPositive && <TrendingUp size={14} className="text-emerald-500" />}
                                                {isNegative && <TrendingDown size={14} className="text-rose-500" />}
                                                {!isPositive && !isNegative && <Minus size={14} className="text-muted-foreground" />}
                                            </div>
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border/50">
                {holdings.map((holding) => {
                    const isPositive = holding.unrealizedGain > 0;
                    const isNegative = holding.unrealizedGain < 0;

                    return (
                        <Link href={`/dashboard/ticker/${holding.ticker}`} key={holding.ticker} className="block p-6 active:bg-muted transition-colors">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-black text-sm">
                                        {holding.ticker}
                                    </div>
                                    <div>
                                        <div className="font-black text-lg">{holding.ticker}</div>
                                        <div className="text-xs text-muted-foreground font-bold uppercase tracking-tighter">
                                            {formatNumber(holding.shares, holding.shares % 1 !== 0 ? 3 : 0)} Shares
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-lg">
                                        {formatCurrency(convertCurrency(holding.marketValue, currency, exchangeRates), currency)}
                                    </div>
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                        Total Value
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-muted/50 p-4 rounded-2xl border border-border/50">
                                    <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1 text-center">Price</div>
                                    <div className="font-black text-center text-sm">
                                        {formatCurrency(convertCurrency(holding.currentPrice, currency, exchangeRates), currency)}
                                    </div>
                                </div>
                                <div className={`p-4 rounded-2xl border ${isPositive ? 'bg-emerald-500/5 border-emerald-500/20' : isNegative ? 'bg-rose-500/5 border-rose-500/20' : 'bg-muted/50 border-border/50'}`}>
                                    <div className={`text-[10px] uppercase font-bold tracking-widest mb-1 text-center ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-muted-foreground'}`}>Return</div>
                                    <div className={`font-black text-center text-sm ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-foreground'}`}>
                                        {formatPercentage(holding.unrealizedGainPercent)}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="p-8 pt-4 border-t border-border/50 text-center">
                <Link
                    href="/dashboard/report"
                    className="text-xs text-muted-foreground hover:text-primary font-bold uppercase tracking-widest transition-colors flex items-center gap-2 mx-auto w-fit"
                >
                    View Comprehensive Report
                    <ChevronRight size={14} />
                </Link>
            </div>
        </div>
    );
}
