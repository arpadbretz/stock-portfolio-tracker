'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    PieChart,
    Wallet,
    ArrowUpDown,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    Legend,
    LineChart,
    Line,
} from 'recharts';

interface FinancialsTabProps {
    symbol: string;
    stock: any;
}

type FinancialView = 'income' | 'balance' | 'cashflow';
type TimeFrame = 'annual' | 'quarterly';

export default function FinancialsTab({ symbol, stock }: FinancialsTabProps) {
    const [view, setView] = useState<FinancialView>('income');
    const [timeFrame, setTimeFrame] = useState<TimeFrame>('annual');
    const [isLoading, setIsLoading] = useState(true);
    const [financialData, setFinancialData] = useState<any>(null);
    const [expandedSection, setExpandedSection] = useState<string | null>('revenue');

    useEffect(() => {
        const fetchFinancials = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/stock/${symbol}/financials?type=${view}&period=${timeFrame}`);
                const data = await res.json();
                if (data.success) {
                    setFinancialData(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch financials:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFinancials();
    }, [symbol, view, timeFrame]);

    const formatCurrency = (val: number) => {
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
        if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
        return `$${val.toFixed(0)}`;
    };

    const formatPercent = (val: number) => `${(val * 100).toFixed(1)}%`;

    // Use existing stock data for charts
    const revenueData = stock?.incomeStatement?.slice(0, 10).reverse().map((item: any) => ({
        year: new Date(item.endDate).getFullYear(),
        revenue: item.totalRevenue,
        netIncome: item.netIncome,
        grossProfit: item.grossProfit,
        operatingIncome: item.operatingIncome,
    })) || [];

    const balanceData = stock?.balanceSheet?.slice(0, 10).reverse().map((item: any) => ({
        year: new Date(item.endDate).getFullYear(),
        totalAssets: item.totalAssets,
        totalLiabilities: item.totalLiabilities,
        totalEquity: item.totalStockholderEquity,
        cash: item.cash,
        longTermDebt: item.longTermDebt,
    })) || [];

    const cashFlowData = stock?.cashFlow?.slice(0, 10).reverse().map((item: any) => ({
        year: new Date(item.endDate).getFullYear(),
        operatingCashFlow: item.operatingCashflow,
        capex: item.capitalExpenditures,
        freeCashFlow: item.freeCashflow,
        dividends: item.dividendsPaid,
    })) || [];

    return (
        <div className="space-y-8">
            {/* View Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center bg-muted/50 p-1 rounded-2xl">
                    {(['income', 'balance', 'cashflow'] as FinancialView[]).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${view === v
                                ? 'bg-card text-foreground shadow-lg'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {v === 'income' ? 'Income Statement' : v === 'balance' ? 'Balance Sheet' : 'Cash Flow'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center bg-muted/50 p-1 rounded-xl">
                    {(['annual', 'quarterly'] as TimeFrame[]).map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeFrame(tf)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${timeFrame === tf
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Income Statement View */}
            {view === 'income' && (
                <>
                    {/* Revenue & Earnings Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-[40px] p-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <TrendingUp className="text-emerald-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Revenue & Earnings</h3>
                                <p className="text-sm text-muted-foreground">Historical growth trends</p>
                            </div>
                        </div>

                        {revenueData.length > 0 ? (
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={formatCurrency} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '16px',
                                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                            }}
                                            formatter={(value) => [formatCurrency(value as number), '']}
                                            labelStyle={{ fontWeight: 900 }}
                                        />
                                        <Legend />
                                        <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="netIncome" name="Net Income" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                No income data available
                            </div>
                        )}
                    </motion.div>

                    {/* Margins Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border rounded-[40px] p-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-violet-500/10 rounded-2xl">
                                <PieChart className="text-violet-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Profitability Margins</h3>
                                <p className="text-sm text-muted-foreground">Margin trends over time</p>
                            </div>
                        </div>

                        {revenueData.length > 0 ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueData.map((d: any) => ({
                                        ...d,
                                        grossMargin: d.revenue ? (d.grossProfit / d.revenue) * 100 : 0,
                                        operatingMargin: d.revenue ? (d.operatingIncome / d.revenue) * 100 : 0,
                                        netMargin: d.revenue ? (d.netIncome / d.revenue) * 100 : 0,
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '16px',
                                            }}
                                            formatter={(value) => [`${(value as number).toFixed(1)}%`, '']}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="grossMargin" name="Gross Margin" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="operatingMargin" name="Operating Margin" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                                        <Line type="monotone" dataKey="netMargin" name="Net Margin" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                No margin data available
                            </div>
                        )}
                    </motion.div>

                    {/* Income Statement Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-border rounded-[40px] p-8 overflow-hidden"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <BarChart3 className="text-blue-500" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Income Statement Details</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground sticky left-0 bg-card">Metric</th>
                                        {revenueData.slice(-5).map((d: any) => (
                                            <th key={d.year} className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                                                {d.year}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {[
                                        { key: 'revenue', label: 'Total Revenue' },
                                        { key: 'grossProfit', label: 'Gross Profit' },
                                        { key: 'operatingIncome', label: 'Operating Income' },
                                        { key: 'netIncome', label: 'Net Income' },
                                    ].map((row) => (
                                        <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 font-bold sticky left-0 bg-card">{row.label}</td>
                                            {revenueData.slice(-5).map((d: any) => (
                                                <td key={d.year} className="py-3 px-4 text-right font-bold tabular-nums">
                                                    {d[row.key] ? formatCurrency(d[row.key]) : '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Balance Sheet View */}
            {view === 'balance' && (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-[40px] p-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <Wallet className="text-indigo-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Assets vs Liabilities</h3>
                                <p className="text-sm text-muted-foreground">Financial position over time</p>
                            </div>
                        </div>

                        {balanceData.length > 0 ? (
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={balanceData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={formatCurrency} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '16px',
                                            }}
                                            formatter={(value) => [formatCurrency(value as number), '']}
                                        />
                                        <Legend />
                                        <Bar dataKey="totalAssets" name="Total Assets" fill="#10b981" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="totalLiabilities" name="Total Liabilities" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="totalEquity" name="Shareholders' Equity" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                No balance sheet data available
                            </div>
                        )}
                    </motion.div>

                    {/* Balance Sheet Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border rounded-[40px] p-8 overflow-hidden"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-amber-500/10 rounded-2xl">
                                <ArrowUpDown className="text-amber-500" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Balance Sheet Details</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground sticky left-0 bg-card">Metric</th>
                                        {balanceData.slice(-5).map((d: any) => (
                                            <th key={d.year} className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                                                {d.year}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {[
                                        { key: 'totalAssets', label: 'Total Assets' },
                                        { key: 'cash', label: 'Cash & Equivalents' },
                                        { key: 'totalLiabilities', label: 'Total Liabilities' },
                                        { key: 'longTermDebt', label: 'Long-Term Debt' },
                                        { key: 'totalEquity', label: "Shareholders' Equity" },
                                    ].map((row) => (
                                        <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 font-bold sticky left-0 bg-card">{row.label}</td>
                                            {balanceData.slice(-5).map((d: any) => (
                                                <td key={d.year} className="py-3 px-4 text-right font-bold tabular-nums">
                                                    {d[row.key] ? formatCurrency(d[row.key]) : '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Cash Flow View */}
            {view === 'cashflow' && (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border rounded-[40px] p-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <DollarSign className="text-emerald-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">Cash Flow Trends</h3>
                                <p className="text-sm text-muted-foreground">Operating, investing, and free cash flow</p>
                            </div>
                        </div>

                        {cashFlowData.length > 0 ? (
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={cashFlowData}>
                                        <defs>
                                            <linearGradient id="colorOCF" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorFCF" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={formatCurrency} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '16px',
                                            }}
                                            formatter={(value) => [formatCurrency(value as number), '']}
                                        />
                                        <Legend />
                                        <Area type="monotone" dataKey="operatingCashFlow" name="Operating Cash Flow" stroke="#10b981" fill="url(#colorOCF)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="freeCashFlow" name="Free Cash Flow" stroke="#3b82f6" fill="url(#colorFCF)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                No cash flow data available
                            </div>
                        )}
                    </motion.div>

                    {/* Cash Flow Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border rounded-[40px] p-8 overflow-hidden"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-violet-500/10 rounded-2xl">
                                <BarChart3 className="text-violet-500" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Cash Flow Details</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground sticky left-0 bg-card">Metric</th>
                                        {cashFlowData.slice(-5).map((d: any) => (
                                            <th key={d.year} className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                                                {d.year}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {[
                                        { key: 'operatingCashFlow', label: 'Operating Cash Flow' },
                                        { key: 'capex', label: 'Capital Expenditures' },
                                        { key: 'freeCashFlow', label: 'Free Cash Flow' },
                                        { key: 'dividends', label: 'Dividends Paid' },
                                    ].map((row) => (
                                        <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 font-bold sticky left-0 bg-card">{row.label}</td>
                                            {cashFlowData.slice(-5).map((d: any) => (
                                                <td key={d.year} className={`py-3 px-4 text-right font-bold tabular-nums ${row.key === 'capex' && d[row.key] < 0 ? 'text-rose-500' : ''}`}>
                                                    {d[row.key] ? formatCurrency(Math.abs(d[row.key])) : '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </>
            )}
        </div>
    );
}
