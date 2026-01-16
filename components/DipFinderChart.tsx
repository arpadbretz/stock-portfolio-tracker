'use client';

import { Holding, CurrencyCode } from '@/types/portfolio';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingDown } from 'lucide-react';
import { formatPercentage } from '@/lib/portfolio';

interface DipFinderChartProps {
    holdings: Holding[];
    isLoading?: boolean;
}

export default function DipFinderChart({ holdings, isLoading }: DipFinderChartProps) {
    if (isLoading) {
        return (
            <div className="h-full flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground text-[10px] animate-pulse font-black uppercase tracking-widest">Scanning Dips...</p>
            </div>
        );
    }

    if (holdings.length === 0) {
        return (
            <div className="h-full flex flex-col justify-center items-center text-center opacity-50">
                <TrendingDown size={32} className="mb-4 text-muted-foreground" />
                <p className="text-xs font-black uppercase tracking-widest">No Positions Found</p>
            </div>
        );
    }

    // Sort by performance (worst to best)
    const data = holdings
        .map(h => ({
            name: h.ticker,
            value: h.unrealizedGainPercent,
        }))
        .sort((a, b) => a.value - b.value);

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--muted-foreground)' }}
                        interval={0}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--muted-foreground)' }}
                        tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const val = payload[0].value as number;
                                return (
                                    <div className="bg-card/90 backdrop-blur-xl border border-border p-3 rounded-xl shadow-2xl z-50">
                                        <p className="text-foreground font-black text-xs mb-1 uppercase tracking-tight">{payload[0].payload.name}</p>
                                        <p className={`text-lg font-black ${val >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {formatPercentage(val)}
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.value >= 0 ? '#10b981' : '#f43f5e'}
                                fillOpacity={0.8}
                            />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
