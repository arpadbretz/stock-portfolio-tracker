'use client';

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    LineChart,
    Line,
    Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

interface FinancialDataPoint {
    year: number;
    value: number;
}

interface EPSDataPoint {
    quarter: string;
    actual: number;
    estimate: number;
}

interface FinancialHealthChartsProps {
    revenue: FinancialDataPoint[];
    netIncome: FinancialDataPoint[];
    eps: EPSDataPoint[];
    symbol: string;
}

export default function FinancialHealthCharts({ revenue, netIncome, eps, symbol }: FinancialHealthChartsProps) {
    // Combine Revenue and Net Income for the comparison chart
    const combinedHistory = revenue.map(rev => {
        const ni = netIncome.find(n => n.year === rev.year);
        return {
            year: rev.year,
            revenue: rev.value,
            netIncome: ni ? ni.value : 0,
        };
    }).slice(-10); // Show last 10 years

    const formatCurrency = (val: number) => {
        if (Math.abs(val) >= 1e12) return `$${(val / 1e12).toFixed(1)}T`;
        if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
        if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
        return `$${val.toLocaleString()}`;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Revenue vs Net Income Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-[40px] p-8"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <BarChart3 className="text-primary" size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black">Financial Health</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Annual Revenue & Net Income</p>
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={combinedHistory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="year"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                tickFormatter={formatCurrency}
                            />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    backdropFilter: 'blur(12px)',
                                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                }}
                                formatter={(val: any) => [formatCurrency(val || 0), '']}
                            />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            />
                            <Bar
                                dataKey="revenue"
                                name="Revenue"
                                fill="url(#colorRevenue)"
                                radius={[6, 6, 0, 0]}
                                barSize={30}
                            />
                            <Bar
                                dataKey="netIncome"
                                name="Net Income"
                                fill="#10b981"
                                radius={[6, 6, 0, 0]}
                                barSize={30}
                            />
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Earnings History (EPS) Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border border-border rounded-[40px] p-8"
            >
                <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-violet-500/10 rounded-2xl">
                        <Activity className="text-violet-500" size={20} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black">Earnings History</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">EPS: Actual vs Estimate</p>
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={eps.slice(-8)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis
                                dataKey="quarter"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    backdropFilter: 'blur(12px)'
                                }}
                            />
                            <Legend
                                iconType="circle"
                                wrapperStyle={{ paddingTop: '20px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="estimate"
                                name="Estimate"
                                stroke="#64748b"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ r: 4, fill: '#64748b' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="actual"
                                name="Actual"
                                stroke="#a855f7"
                                strokeWidth={3}
                                dot={(props: any) => {
                                    const { cx, cy, payload } = props;
                                    const beat = payload.actual >= payload.estimate;
                                    return (
                                        <circle
                                            cx={cx}
                                            cy={cy}
                                            r={6}
                                            fill={beat ? '#10b981' : '#f43f5e'}
                                            stroke="none"
                                        />
                                    );
                                }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}
