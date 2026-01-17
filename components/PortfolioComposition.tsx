'use client';

import { Holding, CurrencyCode } from '@/types/portfolio';
import { formatCurrency, formatPercentage, convertCurrency } from '@/lib/portfolio';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';

interface PortfolioCompositionProps {
    holdings: Holding[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    isLoading?: boolean;
}

export default function PortfolioComposition({ holdings, currency, exchangeRates, isLoading }: PortfolioCompositionProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse flex items-center gap-4">
                        <div className="w-10 h-10 bg-muted rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-3 bg-muted rounded w-1/4"></div>
                            <div className="h-2 bg-muted rounded w-full"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // Sort by weight/allocation
    const data = [...holdings].sort((a, b) => (b.allocation || 0) - (a.allocation || 0));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2 md:px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground pb-2 border-b border-border/50">
                <div className="flex-1">Asset</div>
                <div className="w-16 text-right">Weight</div>
                <div className="w-24 text-right hidden sm:block">Gain/Loss</div>
            </div>

            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {data.map((holding) => {
                    const isPositive = holding.unrealizedGain > 0;
                    const isNegative = holding.unrealizedGain < 0;
                    const convertedGain = convertCurrency(holding.unrealizedGain, currency, exchangeRates);

                    return (
                        <div key={holding.ticker} className="flex items-center justify-between gap-3 group px-2 md:px-4">
                            {/* Asset Info */}
                            <div className="flex-1 flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary font-black text-xs shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                                    {holding.ticker}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-black text-sm truncate">{holding.ticker}</p>
                                    <p className="text-[10px] text-muted-foreground font-bold uppercase truncate">{holding.sector || 'Equities'}</p>
                                </div>
                            </div>

                            {/* Weight Bar */}
                            <div className="w-16 flex flex-col items-end gap-1.5 shrink-0">
                                <span className="text-xs font-black">{(holding.allocation || 0).toFixed(2)}%</span>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${holding.allocation || 0}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="h-full bg-primary"
                                    />
                                </div>
                            </div>

                            {/* Gain/Loss */}
                            <div className="w-24 text-right shrink-0 hidden sm:block">
                                <div className={`flex items-center justify-end gap-1 font-black text-sm ${isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-muted-foreground'}`}>
                                    {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
                                    <span>{formatCurrency(convertedGain, currency)}</span>
                                </div>
                                <p className={`text-[10px] font-bold ${isPositive ? 'text-emerald-500/60' : isNegative ? 'text-rose-500/60' : 'text-muted-foreground/50'}`}>
                                    {formatPercentage(holding.unrealizedGainPercent)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
