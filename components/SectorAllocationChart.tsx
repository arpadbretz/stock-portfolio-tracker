import { Holding, CurrencyCode } from '@/types/portfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, convertCurrency } from '@/lib/portfolio';

interface SectorAllocationChartProps {
    holdings: Holding[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    isLoading?: boolean;
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

export default function SectorAllocationChart({ holdings, currency, exchangeRates, isLoading }: SectorAllocationChartProps) {
    if (isLoading) {
        return (
            <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-3xl h-[400px] flex flex-col justify-center items-center">
                <div className="w-16 h-16 rounded-full border-4 border-slate-700 border-t-blue-500 animate-spin mb-4"></div>
                <p className="text-slate-400 animate-pulse">Analyzing sectors...</p>
            </div>
        );
    }

    if (holdings.length === 0) {
        return (
            <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-3xl h-[400px] flex flex-col justify-center items-center text-center">
                <div className="bg-slate-700/30 p-4 rounded-full mb-4">
                    <PieChart size={32} className="text-slate-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">No Sector Data</h3>
                <p className="text-slate-500 max-w-[200px]">Add trades to see your sector diversification.</p>
            </div>
        );
    }

    // Group holdings by sector
    const sectorMap = new Map<string, number>();
    holdings.forEach(h => {
        const sector = h.sector || 'Unknown';
        const value = convertCurrency(h.marketValue, currency, exchangeRates);
        sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);
    });

    const data = Array.from(sectorMap.entries())
        .map(([name, value]) => ({
            name,
            value,
            percentage: (value / Array.from(sectorMap.values()).reduce((a, b) => a + b, 0)) * 100
        }))
        .sort((a, b) => b.value - a.value);

    const totalValue = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 p-8 rounded-3xl overflow-hidden relative group">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight mb-1">Sector Diversification</h2>
                    <p className="text-slate-400 text-sm">Allocation by market sector</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="h-[300px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={75}
                                outerRadius={105}
                                paddingAngle={4}
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
                                            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-2xl">
                                                <p className="text-white font-bold mb-1 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }}></span>
                                                    {data.name}
                                                </p>
                                                <p className="text-blue-400 text-sm font-bold">{formatCurrency(data.value, currency)}</p>
                                                <p className="text-slate-500 text-xs mt-1">{data.percentage.toFixed(1)}% of portfolio</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-slate-500 text-xs uppercase font-bold tracking-widest">Sectors</span>
                        <span className="text-2xl font-bold text-white">{data.length}</span>
                    </div>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {data.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition-colors group/item">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                />
                                <span className="text-white font-semibold group-hover/item:text-blue-400 transition-colors uppercase tracking-wider text-sm">{item.name}</span>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-slate-200">{formatCurrency(item.value, currency)}</div>
                                <div className="text-xs text-slate-500 font-medium">{item.percentage.toFixed(1)}%</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
