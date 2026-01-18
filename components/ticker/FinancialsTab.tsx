'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    PieChart,
    Wallet,
    ArrowUpDown,
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

    const formatCurrency = (val: number) => {
        if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
        if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
        if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
        if (val >= 1e3) return `$${(val / 1e3).toFixed(1)}K`;
        return `$${val.toFixed(0)}`;
    };

    // Get the appropriate data based on timeframe
    const getIncomeData = () => {
        const data = timeFrame === 'quarterly'
            ? stock?.incomeStatementQuarterly
            : stock?.incomeStatement;
        return (data || []).slice(0, 10).reverse().map((item: any) => ({
            period: timeFrame === 'quarterly'
                ? new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                : new Date(item.endDate).getFullYear(),
            revenue: item.totalRevenue,
            costOfRevenue: item.costOfRevenue,
            grossProfit: item.grossProfit,
            operatingExpenses: item.operatingExpenses,
            operatingIncome: item.operatingIncome,
            netIncome: item.netIncome,
            ebit: item.ebit,
            ebitda: item.ebitda,
            researchDevelopment: item.researchDevelopment,
            sellingGeneralAdministrative: item.sellingGeneralAdministrative,
            interestExpense: item.interestExpense,
            incomeTaxExpense: item.incomeTaxExpense,
        }));
    };

    const getBalanceData = () => {
        const data = timeFrame === 'quarterly'
            ? stock?.balanceSheetQuarterly
            : stock?.balanceSheet;
        return (data || []).slice(0, 10).reverse().map((item: any) => ({
            period: timeFrame === 'quarterly'
                ? new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                : new Date(item.endDate).getFullYear(),
            totalAssets: item.totalAssets,
            totalCurrentAssets: item.totalCurrentAssets,
            cash: item.cash,
            shortTermInvestments: item.shortTermInvestments,
            netReceivables: item.netReceivables,
            inventory: item.inventory,
            propertyPlantEquipment: item.propertyPlantEquipment,
            goodwill: item.goodwill,
            intangibleAssets: item.intangibleAssets,
            totalLiabilities: item.totalLiabilities,
            totalCurrentLiabilities: item.totalCurrentLiabilities,
            accountsPayable: item.accountsPayable,
            shortTermDebt: item.shortTermDebt,
            longTermDebt: item.longTermDebt,
            totalDebt: item.totalDebt,
            totalStockholderEquity: item.totalStockholderEquity,
            retainedEarnings: item.retainedEarnings,
        }));
    };

    const getCashFlowData = () => {
        const data = timeFrame === 'quarterly'
            ? stock?.cashFlowQuarterly
            : stock?.cashFlow;
        return (data || []).slice(0, 10).reverse().map((item: any) => ({
            period: timeFrame === 'quarterly'
                ? new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                : new Date(item.endDate).getFullYear(),
            operatingCashflow: item.operatingCashflow,
            investingCashflow: item.investingCashflow,
            financingCashflow: item.financingCashflow,
            freeCashflow: item.freeCashflow,
            capitalExpenditures: item.capitalExpenditures,
            depreciation: item.depreciation,
            dividendsPaid: item.dividendsPaid,
            stockRepurchases: item.stockRepurchases,
            debtRepayment: item.debtRepayment,
            netChangeInCash: item.netChangeInCash,
        }));
    };

    const revenueData = getIncomeData();
    const balanceData = getBalanceData();
    const cashFlowData = getCashFlowData();

    // Check if we have any data
    const hasIncomeData = revenueData.some((d: any) => d.revenue || d.netIncome);
    const hasBalanceData = balanceData.some((d: any) => d.totalAssets || d.totalLiabilities);
    const hasCashFlowData = cashFlowData.some((d: any) => d.operatingCashflow || d.freeCashflow);

    return (
        <div className="space-y-8">
            {/* View Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center bg-muted/50 p-1 rounded-2xl overflow-x-auto">
                    {(['income', 'balance', 'cashflow'] as FinancialView[]).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${view === v
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
                                <p className="text-sm text-muted-foreground">
                                    {timeFrame === 'quarterly' ? 'Quarterly' : 'Annual'} performance
                                </p>
                            </div>
                        </div>

                        {hasIncomeData ? (
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
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
                                        <Bar dataKey="grossProfit" name="Gross Profit" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="operatingIncome" name="Operating Income" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                                        <Bar dataKey="netIncome" name="Net Income" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                No {timeFrame} income data available
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

                        {hasIncomeData ? (
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueData.map((d: any) => ({
                                        ...d,
                                        grossMargin: d.revenue && d.grossProfit ? (d.grossProfit / d.revenue) * 100 : null,
                                        operatingMargin: d.revenue && d.operatingIncome ? (d.operatingIncome / d.revenue) * 100 : null,
                                        netMargin: d.revenue && d.netIncome ? (d.netIncome / d.revenue) * 100 : null,
                                    }))}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                        <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(v) => `${v?.toFixed(0) || 0}%`} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--card))',
                                                borderColor: 'hsl(var(--border))',
                                                borderRadius: '16px',
                                            }}
                                            formatter={(value) => value ? [`${(value as number).toFixed(1)}%`, ''] : ['N/A', '']}
                                        />
                                        <Legend />
                                        <Line type="monotone" dataKey="grossMargin" name="Gross Margin" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                                        <Line type="monotone" dataKey="operatingMargin" name="Operating Margin" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} connectNulls />
                                        <Line type="monotone" dataKey="netMargin" name="Net Margin" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} connectNulls />
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
                                        {revenueData.slice(-5).map((d: any, i: number) => (
                                            <th key={i} className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground min-w-[100px]">
                                                {d.period}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {[
                                        { key: 'revenue', label: 'Total Revenue' },
                                        { key: 'costOfRevenue', label: 'Cost of Revenue' },
                                        { key: 'grossProfit', label: 'Gross Profit' },
                                        { key: 'researchDevelopment', label: 'R&D' },
                                        { key: 'sellingGeneralAdministrative', label: 'SG&A' },
                                        { key: 'operatingIncome', label: 'Operating Income' },
                                        { key: 'interestExpense', label: 'Interest Expense' },
                                        { key: 'incomeTaxExpense', label: 'Income Tax' },
                                        { key: 'netIncome', label: 'Net Income' },
                                    ].filter(row => revenueData.some((d: any) => d[row.key])).map((row) => (
                                        <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 font-bold sticky left-0 bg-card">{row.label}</td>
                                            {revenueData.slice(-5).map((d: any, i: number) => (
                                                <td key={i} className="py-3 px-4 text-right font-bold tabular-nums">
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
                                <p className="text-sm text-muted-foreground">
                                    {timeFrame === 'quarterly' ? 'Quarterly' : 'Annual'} financial position
                                </p>
                            </div>
                        </div>

                        {hasBalanceData ? (
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={balanceData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
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
                                        <Bar dataKey="totalStockholderEquity" name="Shareholders' Equity" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                No {timeFrame} balance sheet data available
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
                                        {balanceData.slice(-5).map((d: any, i: number) => (
                                            <th key={i} className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground min-w-[100px]">
                                                {d.period}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {[
                                        { key: 'totalAssets', label: 'Total Assets', section: 'assets' },
                                        { key: 'totalCurrentAssets', label: '  Current Assets', section: 'assets' },
                                        { key: 'cash', label: '    Cash & Equivalents', section: 'assets' },
                                        { key: 'netReceivables', label: '    Receivables', section: 'assets' },
                                        { key: 'inventory', label: '    Inventory', section: 'assets' },
                                        { key: 'propertyPlantEquipment', label: '  Property & Equipment', section: 'assets' },
                                        { key: 'goodwill', label: '  Goodwill', section: 'assets' },
                                        { key: 'totalLiabilities', label: 'Total Liabilities', section: 'liabs' },
                                        { key: 'totalCurrentLiabilities', label: '  Current Liabilities', section: 'liabs' },
                                        { key: 'accountsPayable', label: '    Accounts Payable', section: 'liabs' },
                                        { key: 'longTermDebt', label: '  Long-Term Debt', section: 'liabs' },
                                        { key: 'totalStockholderEquity', label: "Shareholders' Equity", section: 'equity' },
                                        { key: 'retainedEarnings', label: '  Retained Earnings', section: 'equity' },
                                    ].filter(row => balanceData.some((d: any) => d[row.key])).map((row) => (
                                        <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 font-bold sticky left-0 bg-card whitespace-pre">{row.label}</td>
                                            {balanceData.slice(-5).map((d: any, i: number) => (
                                                <td key={i} className="py-3 px-4 text-right font-bold tabular-nums">
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
                                <p className="text-sm text-muted-foreground">
                                    {timeFrame === 'quarterly' ? 'Quarterly' : 'Annual'} cash flows
                                </p>
                            </div>
                        </div>

                        {hasCashFlowData ? (
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
                                        <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
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
                                        <Area type="monotone" dataKey="operatingCashflow" name="Operating Cash Flow" stroke="#10b981" fill="url(#colorOCF)" strokeWidth={3} />
                                        <Area type="monotone" dataKey="freeCashflow" name="Free Cash Flow" stroke="#3b82f6" fill="url(#colorFCF)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                                No {timeFrame} cash flow data available
                            </div>
                        )}
                    </motion.div>

                    {/* Cash Flow Activities Breakdown */}
                    {hasCashFlowData && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border rounded-[40px] p-8"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-purple-500/10 rounded-2xl">
                                    <BarChart3 className="text-purple-500" size={20} />
                                </div>
                                <h3 className="text-xl font-black">Cash Flow by Activity</h3>
                            </div>

                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={cashFlowData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
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
                                        <Bar dataKey="operatingCashflow" name="Operating" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="investingCashflow" name="Investing" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="financingCashflow" name="Financing" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>
                    )}

                    {/* Cash Flow Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
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
                                        {cashFlowData.slice(-5).map((d: any, i: number) => (
                                            <th key={i} className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground min-w-[100px]">
                                                {d.period}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {[
                                        { key: 'operatingCashflow', label: 'Operating Cash Flow' },
                                        { key: 'depreciation', label: '  Depreciation' },
                                        { key: 'investingCashflow', label: 'Investing Cash Flow' },
                                        { key: 'capitalExpenditures', label: '  Capital Expenditures' },
                                        { key: 'financingCashflow', label: 'Financing Cash Flow' },
                                        { key: 'dividendsPaid', label: '  Dividends Paid' },
                                        { key: 'stockRepurchases', label: '  Stock Repurchases' },
                                        { key: 'freeCashflow', label: 'Free Cash Flow' },
                                        { key: 'netChangeInCash', label: 'Net Change in Cash' },
                                    ].filter(row => cashFlowData.some((d: any) => d[row.key])).map((row) => (
                                        <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 font-bold sticky left-0 bg-card whitespace-pre">{row.label}</td>
                                            {cashFlowData.slice(-5).map((d: any, i: number) => (
                                                <td key={i} className={`py-3 px-4 text-right font-bold tabular-nums ${row.key === 'capitalExpenditures' && d[row.key] < 0 ? 'text-rose-500' : ''}`}>
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
