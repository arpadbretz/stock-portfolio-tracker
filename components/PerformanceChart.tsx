import { Holding, CurrencyCode } from '@/types/portfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, convertCurrency } from '@/lib/portfolio';

interface PerformanceChartProps {
    holdings: Holding[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    isLoading?: boolean;
}

const COLORS = [
    '#10b981', // emerald-500
    '#06b6d4', // cyan-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#d946ef', // fuchsia-500
    '#f43f5e', // rose-500
    '#f59e0b', // amber-500
];

export default function PerformanceChart({ holdings, currency, exchangeRates, isLoading }: PerformanceChartProps) {
    if (isLoading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 flex flex-col h-full">
                <h2 className="text-xl font-semibold text-white mb-6">Allocation</h2>
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-48 h-48 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin"></div>
                </div>
            </div>
        );
    }

    if (holdings.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 flex flex-col h-full">
                <h2 className="text-xl font-semibold text-white mb-6">Allocation</h2>
                <div className="flex-1 flex items-center justify-center text-slate-500">
                    No data to display
                </div>
            </div>
        );
    }

    const data = holdings.map(h => ({
        name: h.ticker,
        value: convertCurrency(h.marketValue, currency, exchangeRates),
    }));

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 flex flex-col h-full">
            <h2 className="text-xl font-semibold text-white mb-2">Portfolio Allocation</h2>
            <p className="text-slate-400 text-sm mb-6">Market value distribution by symbol</p>

            <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: '#f8fafc',
                            }}
                            formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value, currency) : ''}
                        />
                        <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value) => <span className="text-slate-300 text-xs font-medium">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

