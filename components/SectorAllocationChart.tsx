import { Holding, CurrencyCode } from '@/types/portfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as ChartIcon } from 'lucide-react';
import { formatCurrency, convertCurrency } from '@/lib/portfolio';
import { motion } from 'framer-motion';

interface SectorAllocationChartProps {
    holdings: Holding[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    isLoading?: boolean;
    cashBalance?: number;
    cashBalances?: Record<string, number>;
}

const SECTOR_COLORS: Record<string, string> = {
    'Information Technology': '#3b82f6',
    'Financials': '#6366f1',
    'Healthcare': '#10b981',
    'Consumer Discretionary': '#f59e0b',
    'Communication Services': '#8b5cf6',
    'Industrials': '#06b6d4',
    'Energy': '#f43f5e',
    'Utilities': '#d946ef',
    'Materials': '#ec4899',
    'Real Estate': '#14b8a6',
    'Consumer Staples': '#84cc16',
    'Unknown': '#64748b',
};

const CASH_COLORS: Record<string, string> = {
    'USD': '#0ea5e9',
    'EUR': '#2dd4bf',
    'HUF': '#22c55e',
};

export default function SectorAllocationChart({
    holdings,
    currency,
    exchangeRates,
    isLoading,
    cashBalances
}: SectorAllocationChartProps) {
    if (isLoading) {
        return (
            <div className="h-[300px] flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground text-xs animate-pulse font-black uppercase tracking-widest">Analyzing Sectors...</p>
            </div>
        );
    }

    // 1. Calculate Stocks Value & Sectors
    const sectorMap = new Map<string, number>();
    holdings.forEach(h => {
        const sector = h.sector || 'Unknown';
        const value = convertCurrency(h.marketValue, currency, exchangeRates);
        sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);
    });

    const totalStockValue = Array.from(sectorMap.values()).reduce((a, b) => a + b, 0);

    // 2. Calculate Cash Value & Currencies
    const cashData: { name: string; value: number }[] = [];
    let totalCashValue = 0;
    if (cashBalances) {
        Object.entries(cashBalances).forEach(([curr, bal]) => {
            if (bal <= 0) return;
            const rate = exchangeRates[curr as CurrencyCode] || 1;
            const value = bal / rate; // Normalized to USD (base) then to target? 
            // wait, exchangeRates[curr] is USD per CURR if USD=1. 
            // So Bal_USD = Bal / rate.
            // TargetValue = Bal_USD * exchangeRates[targetCurrency]
            const valueInTarget = (bal / rate) * (exchangeRates[currency] || 1);
            cashData.push({ name: `${curr} Cash`, value: valueInTarget });
            totalCashValue += valueInTarget;
        });
    }

    const totalPortfolioValue = totalStockValue + totalCashValue;

    if (totalPortfolioValue === 0) {
        return (
            <div className="h-[300px] flex flex-col justify-center items-center text-center">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <ChartIcon size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">No Portfolio Data</h3>
            </div>
        );
    }

    // --- DATA PREP FOR SUNBURST ---

    // Inner Ring: Asset Classes
    const innerData = [
        { name: 'Stocks', value: totalStockValue, color: '#3b82f6' },
        { name: 'Cash', value: totalCashValue, color: '#10b981' }
    ].filter(d => d.value > 0);

    // Outer Ring: Detailed Breakdown
    const outerData = [
        ...Array.from(sectorMap.entries())
            .map(([name, value]) => ({
                name,
                value,
                type: 'Stock',
                color: SECTOR_COLORS[name] || SECTOR_COLORS['Unknown']
            }))
            .sort((a, b) => b.value - a.value),
        ...cashData.map(d => ({
            name: d.name,
            value: d.value,
            type: 'Cash',
            color: CASH_COLORS[d.name.split(' ')[0]] || '#22c55e'
        }))
    ].filter(d => d.value > 0);

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-10 items-center">
            {/* Chart Container */}
            <div className="w-full flex items-center justify-center">
                <div className="relative w-full max-w-[320px] aspect-square">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            {/* INNER RING: ASSET CLASS */}
                            <Pie
                                data={innerData}
                                cx="50%"
                                cy="50%"
                                innerRadius="35%"
                                outerRadius="50%"
                                dataKey="value"
                                stroke="rgba(0,0,0,0.2)"
                                strokeWidth={2}
                            >
                                {innerData.map((entry, index) => (
                                    <Cell key={`inner-${index}`} fill={entry.color} />
                                ))}
                            </Pie>

                            {/* OUTER RING: SECTORS / CURRENCIES */}
                            <Pie
                                data={outerData}
                                cx="50%"
                                cy="50%"
                                innerRadius="55%"
                                outerRadius="85%"
                                dataKey="value"
                                stroke="none"
                                paddingAngle={2}
                            >
                                {outerData.map((entry, index) => (
                                    <Cell
                                        key={`outer-${index}`}
                                        fill={entry.color}
                                        className="hover:opacity-80 transition-opacity cursor-pointer"
                                    />
                                ))}
                            </Pie>

                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        const percentage = (data.value / totalPortfolioValue) * 100;
                                        return (
                                            <div className="bg-card/95 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl ring-1 ring-white/5">
                                                <p className="text-foreground font-black mb-1 flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: data.color }}></div>
                                                    {data.name}
                                                </p>
                                                <p className="text-secondary text-base font-black">{formatCurrency(data.value, currency)}</p>
                                                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">
                                                    {percentage.toFixed(1)}% of Net Worth
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-muted-foreground text-[9px] font-black uppercase tracking-widest opacity-60">Total Value</span>
                        <div className={`text-xl font-black text-foreground`}>
                            {formatCurrency(totalPortfolioValue, currency)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend with Progress Bars */}
            <div className="w-full space-y-4 max-h-[380px] overflow-y-auto pr-3 custom-scrollbar">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 mb-2 border-b border-border/50 pb-2">
                    Allocation Breakdown
                </div>
                {outerData.map((item, index) => (
                    <div key={item.name} className="group cursor-default">
                        <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div
                                    className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors truncate">
                                    {item.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-foreground">
                                    {((item.value / totalPortfolioValue) * 100).toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.value / totalPortfolioValue) * 100}%` }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 font-bold mt-1 ml-5.5 flex justify-between">
                            <span>{item.type}</span>
                            <span>{formatCurrency(item.value, currency)}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

