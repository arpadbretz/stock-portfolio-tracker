import { Holding, CurrencyCode } from '@/types/portfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as ChartIcon } from 'lucide-react';
import { formatCurrency, convertCurrency } from '@/lib/portfolio';

interface PerformanceChartProps {
    holdings: Holding[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    isLoading?: boolean;
}

const COLORS = [
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#f43f5e', // rose-500
    '#6366f1', // indigo-500
    '#d946ef', // fuchsia-500
];

export default function PerformanceChart({ holdings, currency, exchangeRates, isLoading }: PerformanceChartProps) {
    if (isLoading) {
        return (
            <div className="h-[300px] flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground text-xs animate-pulse font-black uppercase tracking-widest">Calculating...</p>
            </div>
        );
    }

    if (holdings.length === 0) {
        return (
            <div className="h-[300px] flex flex-col justify-center items-center text-center">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <ChartIcon size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">No Data</h3>
            </div>
        );
    }

    const data = holdings
        .map(h => ({
            name: h.ticker,
            value: convertCurrency(h.marketValue, currency, exchangeRates),
            percentage: h.allocation || 0
        }))
        .sort((a, b) => b.value - a.value);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center h-full min-h-[350px]">
            <div className="h-full min-h-[300px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={6}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-card/90 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl">
                                            <p className="text-foreground font-black mb-1 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }}></div>
                                                {data.name}
                                            </p>
                                            <p className="text-primary text-sm font-black">{formatCurrency(data.value, currency)}</p>
                                            <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">{data.percentage.toFixed(1)}% Weight</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Assets</span>
                    <span className="text-2xl font-black text-foreground">{data.length}</span>
                </div>
            </div>

            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {data.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 border border-transparent hover:border-border transition-all group/item">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-3 h-3 rounded-full flex-shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.2)]"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-foreground font-black text-sm uppercase tracking-tight group-hover/item:text-primary transition-colors">{item.name}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-black text-foreground">{formatCurrency(item.value, currency)}</div>
                            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{(item.percentage).toFixed(1)}%</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
