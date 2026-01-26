import { Holding, CurrencyCode } from '@/types/portfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as ChartIcon } from 'lucide-react';
import { formatCurrency, convertCurrency } from '@/lib/portfolio';

interface PerformanceChartProps {
    holdings: Holding[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    isLoading?: boolean;
    size?: 'small' | 'medium' | 'large';
    cashBalance?: number;
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

export default function AssetAllocationChart({ holdings, currency, exchangeRates, isLoading, size = 'medium', cashBalance }: PerformanceChartProps) {
    if (isLoading) {
        return (
            <div className="h-full flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground text-xs animate-pulse font-black uppercase tracking-widest">Calculating...</p>
            </div>
        );
    }

    if (holdings.length === 0) {
        return (
            <div className="h-full flex flex-col justify-center items-center text-center">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <ChartIcon size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">No Data</h3>
            </div>
        );
    }

    const chartHoldings = [...holdings];
    const chartData = chartHoldings
        .map(h => ({
            name: h.ticker,
            value: convertCurrency(h.marketValue, currency, exchangeRates),
            percentage: h.allocation || 0
        }));

    // Add Cash if present
    if (cashBalance && cashBalance > 0) {
        const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0) + cashBalance;
        const cashValue = convertCurrency(cashBalance, currency, exchangeRates);
        const cashPercentage = totalValue > 0 ? (cashBalance / totalValue) * 100 : 0;

        chartData.push({
            name: 'CASH',
            value: cashValue,
            percentage: cashPercentage
        });
    }

    const data = chartData.sort((a, b) => b.value - a.value);

    const isLarge = size === 'large';

    return (
        <div className={`h-full flex flex-col ${isLarge ? 'lg:grid lg:grid-cols-2 lg:gap-6' : ''} items-center`}>
            {/* Chart Container */}
            <div className="w-full flex items-center justify-center">
                <div className={`relative w-full max-w-[240px] aspect-square`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="85%"
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
                                            <div className="bg-card/90 backdrop-blur-xl border border-border p-3 rounded-xl shadow-2xl z-50">
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
                        <span className="text-xl font-black text-foreground">{data.length}</span>
                    </div>
                </div>
            </div>

            {/* Legend - Only show if large */}
            {isLarge && (
                <div className="w-full space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar lg:mt-0 mt-4">
                    {data.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-2 rounded-xl bg-muted/20 border border-transparent hover:border-border/50 hover:bg-muted/40 transition-all group/item">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-foreground font-bold text-xs uppercase group-hover/item:text-primary transition-colors truncate">{item.name}</span>
                            </div>
                            <div className="text-right flex-shrink-0 ml-2">
                                <div className="text-xs font-black text-foreground">{item.percentage.toFixed(1)}%</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
