'use client';

import { Holding, CurrencyCode } from '@/types/portfolio';
import {
    formatCurrency,
    formatPercentage,
    formatNumber,
    convertCurrency
} from '@/lib/portfolio';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HoldingsTableProps {
    holdings: Holding[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    isLoading?: boolean;
}

export default function HoldingsTable({ holdings, currency, exchangeRates, isLoading }: HoldingsTableProps) {
    if (isLoading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Holdings</h2>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse flex items-center gap-4">
                            <div className="h-12 w-20 bg-slate-700 rounded-lg"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-700 rounded w-1/4"></div>
                                <div className="h-3 bg-slate-700 rounded w-1/3"></div>
                            </div>
                            <div className="h-4 bg-slate-700 rounded w-24"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (holdings.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Holdings</h2>
                <div className="text-center py-12">
                    <div className="text-slate-400 text-lg">No holdings yet</div>
                    <p className="text-slate-500 text-sm mt-2">
                        Add your first trade to get started
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
            <div className="p-6 border-b border-slate-700/50">
                <h2 className="text-xl font-semibold text-white">Holdings</h2>
                <p className="text-slate-400 text-sm mt-1">{holdings.length} position{holdings.length !== 1 ? 's' : ''}</p>
            </div>

            <div className="overflow-x-auto hidden md:block">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-700/50">
                            <th className="text-left py-4 px-6 text-sm font-medium text-slate-400">Symbol</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Shares</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Avg Cost</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Current Price</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Market Value</th>
                            <th className="text-right py-4 px-6 text-sm font-medium text-slate-400">Gain/Loss</th>
                        </tr>
                    </thead>
                    <tbody>
                        {holdings.map((holding) => {
                            const isPositive = holding.unrealizedGain > 0;
                            const isNegative = holding.unrealizedGain < 0;

                            return (
                                <tr
                                    key={holding.ticker}
                                    className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                                >
                                    <td className="py-4 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
                                                {holding.ticker.substring(0, 2)}
                                            </div>
                                            <span className="text-white font-semibold">{holding.ticker}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 text-right text-white">
                                        {formatNumber(holding.shares, holding.shares % 1 !== 0 ? 3 : 0)}
                                    </td>
                                    <td className="py-4 px-6 text-right text-slate-300">
                                        {formatCurrency(convertCurrency(holding.avgCostBasis, currency, exchangeRates), currency)}
                                    </td>
                                    <td className="py-4 px-6 text-right text-white font-medium">
                                        {holding.currentPrice > 0
                                            ? formatCurrency(convertCurrency(holding.currentPrice, currency, exchangeRates), currency)
                                            : 'N/A'}
                                    </td>
                                    <td className="py-4 px-6 text-right text-white font-semibold">
                                        {formatCurrency(convertCurrency(holding.marketValue, currency, exchangeRates), currency)}
                                    </td>
                                    <td className="py-4 px-6 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {isPositive && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                                            {isNegative && <TrendingDown className="w-4 h-4 text-red-400" />}
                                            {!isPositive && !isNegative && <Minus className="w-4 h-4 text-slate-400" />}
                                            <div className="text-right">
                                                <div className={`font-semibold ${isPositive ? 'text-emerald-400' :
                                                    isNegative ? 'text-red-400' : 'text-slate-400'
                                                    }`}>
                                                    {formatCurrency(convertCurrency(holding.unrealizedGain, currency, exchangeRates), currency)}
                                                </div>
                                                <div className={`text-xs ${isPositive ? 'text-emerald-400/70' :
                                                    isNegative ? 'text-red-400/70' : 'text-slate-500'
                                                    }`}>
                                                    {formatPercentage(holding.unrealizedGainPercent)}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
                {holdings.map((holding) => {
                    const isPositive = holding.unrealizedGain > 0;
                    const isNegative = holding.unrealizedGain < 0;

                    return (
                        <div key={holding.ticker} className="p-4 border-b border-slate-700/50 last:border-none">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-bold text-sm">
                                        {holding.ticker.substring(0, 2)}
                                    </div>
                                    <div>
                                        <span className="text-white font-bold text-lg">{holding.ticker}</span>
                                        <div className="text-xs text-slate-400">
                                            {formatNumber(holding.shares, holding.shares % 1 !== 0 ? 3 : 0)} shares
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-white font-bold text-lg">
                                        {formatCurrency(convertCurrency(holding.marketValue, currency, exchangeRates), currency)}
                                    </div>
                                    <div className="text-xs text-slate-400">
                                        {formatCurrency(convertCurrency(holding.currentPrice, currency, exchangeRates), currency)} / share
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between bg-slate-700/20 p-3 rounded-xl">
                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Return</span>
                                <div className="flex items-center gap-2">
                                    {isPositive && <TrendingUp className="w-4 h-4 text-emerald-400" />}
                                    {isNegative && <TrendingDown className="w-4 h-4 text-red-400" />}
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-slate-400'}`}>
                                            {formatCurrency(convertCurrency(holding.unrealizedGain, currency, exchangeRates), currency)}
                                        </div>
                                        <div className={`text-[10px] ${isPositive ? 'text-emerald-400/70' : isNegative ? 'text-red-400/70' : 'text-slate-500'}`}>
                                            {formatPercentage(holding.unrealizedGainPercent)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
