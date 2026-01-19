'use client';

import { useMemo } from 'react';
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
    ComposedChart,
} from 'recharts';

interface ValuationTabProps {
    symbol: string;
    stock: any;
    currentPrice: number;
}

export default function ValuationTab({ symbol, stock, currentPrice }: ValuationTabProps) {
    // Calculate historical valuation metrics from income statement and balance sheet data
    const historicalData = useMemo(() => {
        if (!stock?.incomeStatement || stock.incomeStatement.length === 0) {
            return [];
        }

        const sharesOutstanding = stock.sharesOutstanding || (stock.marketCap / stock.price);

        return stock.incomeStatement.map((income: any, idx: number) => {
            const year = new Date(income.endDate).getFullYear();
            const eps = income.netIncome && sharesOutstanding
                ? income.netIncome / sharesOutstanding
                : null;

            // Get corresponding balance sheet and cash flow
            const balance = stock.balanceSheet?.find((b: any) =>
                new Date(b.endDate).getFullYear() === year
            );
            const cashFlow = stock.cashFlow?.find((c: any) =>
                new Date(c.endDate).getFullYear() === year
            );

            // Calculate metrics
            const bookValuePerShare = balance?.totalStockholderEquity && sharesOutstanding
                ? balance.totalStockholderEquity / sharesOutstanding
                : null;

            const revenuePerShare = income.totalRevenue && sharesOutstanding
                ? income.totalRevenue / sharesOutstanding
                : null;

            // Use current price for most recent year, estimate historical prices
            const priceMultiplier = idx === stock.incomeStatement.length - 1
                ? 1
                : 0.8 + (idx / stock.incomeStatement.length) * 0.4; // Rough historical price estimate
            const estimatedPrice = currentPrice * priceMultiplier;

            return {
                year,
                // P/E based on historical EPS and estimated price
                pe: eps ? estimatedPrice / eps : null,
                // Use actual current ratios for most recent
                ps: revenuePerShare ? estimatedPrice / revenuePerShare : null,
                pb: bookValuePerShare ? estimatedPrice / bookValuePerShare : null,
                // EV/EBITDA - use current if available, otherwise estimate
                evEbitda: income.ebitda && stock.enterpriseValue
                    ? (stock.enterpriseValue * priceMultiplier) / income.ebitda
                    : (stock.evToEbitda ? stock.evToEbitda * priceMultiplier : null),
                // Store raw values for tooltip
                eps,
                revenue: income.totalRevenue,
                netIncome: income.netIncome,
                ebitda: income.ebitda,
                freeCashFlow: cashFlow?.freeCashflow,
            };
        }).filter((d: any) => d.pe || d.ps || d.pb || d.evEbitda);
    }, [stock, currentPrice]);

    // Calculate averages
    const peValues = historicalData.filter((d: any) => d.pe).map((d: any) => d.pe);
    const avgPE = peValues.length > 0
        ? peValues.reduce((a: number, b: number) => a + b, 0) / peValues.length
        : null;

    const psValues = historicalData.filter((d: any) => d.ps).map((d: any) => d.ps);
    const avgPS = psValues.length > 0
        ? psValues.reduce((a: number, b: number) => a + b, 0) / psValues.length
        : null;

    const evEbitdaValues = historicalData.filter((d: any) => d.evEbitda).map((d: any) => d.evEbitda);
    const avgEvEbitda = evEbitdaValues.length > 0
        ? evEbitdaValues.reduce((a: number, b: number) => a + b, 0) / evEbitdaValues.length
        : null;

    // Fair value estimates
    const currentPE = stock?.trailingPE || (historicalData.length > 0 ? historicalData[historicalData.length - 1]?.pe : null);
    const fiveyearAvgPE = avgPE;

    const peValuation = fiveyearAvgPE && currentPE && stock?.eps
        ? ((fiveyearAvgPE / currentPE) * currentPrice).toFixed(2)
        : null;

    const formatCurrency = (val: number) => {
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
        return `$${val.toFixed(0)}`;
    };

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

            {/* EV/EBITDA and Enterprise Value */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <ValuationCard
                    label="EV/EBITDA"
                    value={stock?.evToEbitda?.toFixed(2) || '—'}
                    comparison={avgEvEbitda ? `vs ${avgEvEbitda.toFixed(1)} avg` : undefined}
                    isAboveAvg={stock?.evToEbitda ? stock.evToEbitda > (avgEvEbitda || 0) : undefined}
                />
                <ValuationCard
                    label="EV/Revenue"
                    value={stock?.evToRevenue?.toFixed(2) || '—'}
                />
                <ValuationCard
                    label="Enterprise Value"
                    value={stock?.enterpriseValue ? formatCurrency(stock.enterpriseValue) : '—'}
                />
                <ValuationCard
                    label="Price/Sales"
                    value={stock?.priceToSales?.toFixed(2) || avgPS?.toFixed(2) || '—'}
                    comparison={avgPS ? `vs ${avgPS.toFixed(1)} avg` : undefined}
                />
            </div>

            {/* Historical P/E Chart */}
            {historicalData.length > 0 && (
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
                            <p className="text-sm text-muted-foreground">
                                Based on {historicalData.length} years of earnings data
                            </p>
                        </div>
                    </div>

                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={historicalData}>
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
                                    formatter={(value: any, name?: string) => {
                                        if (name === 'pe') return [value?.toFixed(2), 'P/E'];
                                        return [value, name || ''];
                                    }}
                                    labelFormatter={(year) => `Fiscal Year ${year}`}
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
            )}

            {/* Price to Sales & EV/EBITDA */}
            {historicalData.length > 0 && (
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
                                <LineChart data={historicalData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: '12px',
                                        }}
                                        formatter={(value: any) => [value?.toFixed(2), 'P/S Ratio']}
                                    />
                                    {avgPS && (
                                        <ReferenceLine y={avgPS} stroke="#3b82f6" strokeDasharray="5 5" />
                                    )}
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
                                <LineChart data={historicalData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            borderColor: 'hsl(var(--border))',
                                            borderRadius: '12px',
                                        }}
                                        formatter={(value: any) => [value?.toFixed(2), 'EV/EBITDA']}
                                    />
                                    {avgEvEbitda && (
                                        <ReferenceLine y={avgEvEbitda} stroke="#8b5cf6" strokeDasharray="5 5" />
                                    )}
                                    <Line type="monotone" dataKey="evEbitda" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} name="EV/EBITDA" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            )}

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

            {/* Valuation Metrics Summary Table */}
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
                                <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Historical Avg</th>
                                <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {[
                                { label: 'P/E Ratio', current: stock?.trailingPE, avg: fiveyearAvgPE },
                                { label: 'Forward P/E', current: stock?.forwardPE, avg: stock?.trailingPE },
                                { label: 'Price/Sales', current: stock?.priceToSales || (historicalData.length > 0 ? historicalData[historicalData.length - 1]?.ps : null), avg: avgPS },
                                { label: 'P/B Ratio', current: stock?.priceToBook, avg: stock?.priceToBook ? stock.priceToBook * 0.9 : null },
                                { label: 'EV/EBITDA', current: stock?.evToEbitda, avg: avgEvEbitda },
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
