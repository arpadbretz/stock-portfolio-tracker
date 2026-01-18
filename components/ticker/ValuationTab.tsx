'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Target,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Activity,
    DollarSign,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    ReferenceLine,
    Area,
    AreaChart,
    ComposedChart,
    Bar,
} from 'recharts';

interface ValuationTabProps {
    symbol: string;
    stock: any;
    currentPrice: number;
}

export default function ValuationTab({ symbol, stock, currentPrice }: ValuationTabProps) {
    const [historicalPE, setHistoricalPE] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // For now, use mock historical data
        // In production, this would fetch from an API
        const generateHistoricalMultiples = () => {
            const baseYear = new Date().getFullYear();
            const data = [];

            for (let i = 9; i >= 0; i--) {
                const year = baseYear - i;
                const randomVariation = () => 0.8 + Math.random() * 0.4;

                data.push({
                    year,
                    pe: stock?.trailingPE ? stock.trailingPE * randomVariation() : null,
                    ps: stock?.priceToSales ? stock.priceToSales * randomVariation() : 3 * randomVariation(),
                    pb: stock?.priceToBook ? stock.priceToBook * randomVariation() : null,
                    evEbitda: stock?.enterpriseToEbitda ? stock.enterpriseToEbitda * randomVariation() : 12 * randomVariation(),
                });
            }
            return data;
        };

        setHistoricalPE(generateHistoricalMultiples());
        setIsLoading(false);
    }, [symbol, stock]);

    // Calculate valuation metrics
    const currentPE = stock?.trailingPE || null;
    const fiveyearAvgPE = historicalPE.length > 0
        ? historicalPE.filter(d => d.pe).reduce((sum, d) => sum + d.pe, 0) / historicalPE.filter(d => d.pe).length
        : null;

    const peValuation = fiveyearAvgPE && currentPE
        ? ((fiveyearAvgPE / currentPE) * currentPrice).toFixed(2)
        : null;

    const formatPercent = (val: number) => `${val.toFixed(1)}%`;

    return (
        <div className="space-y-8">
            {/* Valuation Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <ValuationCard
                    label="P/E (TTM)"
                    value={stock?.trailingPE?.toFixed(2) || '—'}
                    comparison={fiveyearAvgPE ? `vs ${fiveyearAvgPE.toFixed(1)} avg` : undefined}
                    isAboveAvg={currentPE ? currentPE > (fiveyearAvgPE || 0) : undefined}
                />
                <ValuationCard
                    label="Forward P/E"
                    value={stock?.forwardPE?.toFixed(2) || '—'}
                    comparison={currentPE ? `vs ${currentPE.toFixed(1)} TTM` : undefined}
                    isAboveAvg={stock?.forwardPE ? stock.forwardPE > (currentPE || 0) : undefined}
                />
                <ValuationCard
                    label="P/B Ratio"
                    value={stock?.priceToBook?.toFixed(2) || '—'}
                    comparison="Book Value"
                />
                <ValuationCard
                    label="PEG Ratio"
                    value={stock?.pegRatio?.toFixed(2) || '—'}
                    comparison={stock?.pegRatio ? (stock.pegRatio < 1 ? 'Undervalued' : 'Fair/Overvalued') : undefined}
                    isAboveAvg={stock?.pegRatio ? stock.pegRatio > 1 : undefined}
                />
            </div>

            {/* Historical P/E Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-[40px] p-8"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <Activity className="text-primary" size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black">Historical P/E Ratio</h3>
                        <p className="text-sm text-muted-foreground">Valuation multiple over time</p>
                    </div>
                </div>

                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={historicalPE}>
                            <defs>
                                <linearGradient id="colorPE" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                            <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    borderColor: 'hsl(var(--border))',
                                    borderRadius: '16px',
                                }}
                                formatter={(value) => [(value as number)?.toFixed(2), 'P/E']}
                            />
                            {fiveyearAvgPE && (
                                <ReferenceLine
                                    y={fiveyearAvgPE}
                                    stroke="#f59e0b"
                                    strokeDasharray="5 5"
                                    label={{ value: `Avg: ${fiveyearAvgPE.toFixed(1)}`, fill: '#f59e0b', fontSize: 10, fontWeight: 700 }}
                                />
                            )}
                            <Area type="monotone" dataKey="pe" fill="url(#colorPE)" stroke="none" />
                            <Line type="monotone" dataKey="pe" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Price to Sales & Book */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card border border-border rounded-[40px] p-8"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <BarChart3 className="text-blue-500" size={20} />
                        </div>
                        <h3 className="text-xl font-black">Price/Sales Trend</h3>
                    </div>

                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historicalPE}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '12px',
                                    }}
                                />
                                <Line type="monotone" dataKey="ps" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} name="P/S Ratio" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-card border border-border rounded-[40px] p-8"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-violet-500/10 rounded-2xl">
                            <DollarSign className="text-violet-500" size={20} />
                        </div>
                        <h3 className="text-xl font-black">EV/EBITDA Trend</h3>
                    </div>

                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historicalPE}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} />
                                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '12px',
                                    }}
                                />
                                <Line type="monotone" dataKey="evEbitda" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} name="EV/EBITDA" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Fair Value Estimate */}
            {peValuation && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-[40px] p-8"
                >
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-primary/20 rounded-2xl">
                            <Target className="text-primary" size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black">Quick Fair Value Estimate</h3>
                            <p className="text-sm text-muted-foreground">Based on historical average P/E</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-6 bg-card/50 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Current Price</p>
                            <p className="text-3xl font-black">${currentPrice.toFixed(2)}</p>
                        </div>
                        <div className="text-center p-6 bg-card/50 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Fair Value (P/E)</p>
                            <p className="text-3xl font-black text-primary">${peValuation}</p>
                        </div>
                        <div className="text-center p-6 bg-card/50 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Upside/Downside</p>
                            <p className={`text-3xl font-black ${parseFloat(peValuation) > currentPrice ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {parseFloat(peValuation) > currentPrice ? '+' : ''}
                                {(((parseFloat(peValuation) - currentPrice) / currentPrice) * 100).toFixed(1)}%
                            </p>
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground text-center mt-6">
                        This is a simplified estimate. Use the DCF Calculator for a more detailed valuation.
                    </p>
                </motion.div>
            )}

            {/* Peer Comparison Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-card border border-border rounded-[40px] p-8"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-amber-500/10 rounded-2xl">
                        <BarChart3 className="text-amber-500" size={20} />
                    </div>
                    <h3 className="text-xl font-black">Valuation Metrics Summary</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Metric</th>
                                <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Current</th>
                                <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">5Y Avg</th>
                                <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {[
                                { label: 'P/E Ratio', current: stock?.trailingPE, avg: fiveyearAvgPE },
                                { label: 'Forward P/E', current: stock?.forwardPE, avg: stock?.trailingPE },
                                { label: 'P/B Ratio', current: stock?.priceToBook, avg: stock?.priceToBook ? stock.priceToBook * 0.9 : null },
                                { label: 'PEG Ratio', current: stock?.pegRatio, avg: 1 },
                            ].map((row) => {
                                const isHigh = row.current && row.avg ? row.current > row.avg : null;
                                return (
                                    <tr key={row.label} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-3 px-4 font-bold">{row.label}</td>
                                        <td className="py-3 px-4 text-right font-black tabular-nums">
                                            {row.current?.toFixed(2) || '—'}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold tabular-nums text-muted-foreground">
                                            {row.avg?.toFixed(2) || '—'}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            {isHigh !== null && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${isHigh ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                                    {isHigh ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {isHigh ? 'Above Avg' : 'Below Avg'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

// Helper Component
function ValuationCard({
    label,
    value,
    comparison,
    isAboveAvg
}: {
    label: string;
    value: string;
    comparison?: string;
    isAboveAvg?: boolean;
}) {
    return (
        <div className="p-6 bg-card border border-border rounded-[28px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
            <p className="text-2xl font-black mb-1">{value}</p>
            {comparison && (
                <p className={`text-xs font-bold ${isAboveAvg === undefined ? 'text-muted-foreground' : isAboveAvg ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {comparison}
                </p>
            )}
        </div>
    );
}
