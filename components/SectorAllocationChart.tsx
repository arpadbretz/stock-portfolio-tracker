import { Holding, CurrencyCode } from '@/types/portfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as ChartIcon } from 'lucide-react';
import { formatCurrency, convertCurrency } from '@/lib/portfolio';

interface SectorAllocationChartProps {
    holdings: Holding[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    isLoading?: boolean;
    cashBalance?: number;
}

const COLORS = [
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#06b6d4', // cyan-500
    '#f43f5e', // rose-500
    '#6366f1', // indigo-500
    '#d946ef', // fuchsia-500
];

export default function SectorAllocationChart({ holdings, currency, exchangeRates, isLoading, cashBalance }: SectorAllocationChartProps) {
    if (isLoading) {
        return (
            <div className="h-[300px] flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground text-xs animate-pulse font-black uppercase tracking-widest">Analyzing Sectors...</p>
            </div>
        );
    }

    if (holdings.length === 0) {
        return (
            <div className="h-[300px] flex flex-col justify-center items-center text-center">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <ChartIcon size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">No Sector Data</h3>
            </div>
        );
    }

    const sectorMap = new Map<string, number>();
    holdings.forEach(h => {
        const sector = h.sector || 'Unknown';
        const value = convertCurrency(h.marketValue, currency, exchangeRates);
        sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);
    });

    // Add Cash as a sector
    if (cashBalance && cashBalance > 0) {
        const value = convertCurrency(cashBalance, currency, exchangeRates);
        sectorMap.set('Liquidity/Cash', (sectorMap.get('Liquidity/Cash') || 0) + value);
    }

    const totalPortfolioValue = Array.from(sectorMap.values()).reduce((a, b) => a + b, 0);

    const data = Array.from(sectorMap.entries())
        .map(([name, value]) => ({
            name,
            value,
            percentage: totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value);

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* Chart Container */}
            <div className="w-full flex items-center justify-center">
                <div className="relative w-full max-w-[280px] aspect-square">
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
                                            <div className="bg-card/90 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl">
                                                <p className="text-foreground font-black mb-1 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }}></div>
                                                    {data.name}
                                                </p>
                                                <p className="text-secondary text-sm font-black">{formatCurrency(data.value, currency)}</p>
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
                        <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Sectors</span>
                        <span className="text-2xl font-black text-foreground">{data.length}</span>
                    </div>
                </div>
            </div>

            {/* Legend with Progress Bars */}
            <div className="w-full space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                {data.map((item, index) => (
                    <div key={item.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-sm font-bold text-muted-foreground truncate">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                            width: `${item.percentage}%`,
                                            backgroundColor: COLORS[index % COLORS.length]
                                        }}
                                    />
                                </div>
                                <span className="text-sm font-black w-12 text-right">{item.percentage.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="text-xs text-muted-foreground font-bold ml-6">
                            {formatCurrency(item.value, currency)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
