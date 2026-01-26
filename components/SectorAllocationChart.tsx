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
    size?: 'small' | 'medium' | 'large';
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
    cashBalances,
    size = 'medium'
}: SectorAllocationChartProps) {
    if (isLoading) {
        return (
            <div className="h-full flex flex-col justify-center items-center">
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
            const valueInTarget = (bal / rate) * (exchangeRates[currency] || 1);
            cashData.push({ name: `${curr} Cash`, value: valueInTarget });
            totalCashValue += valueInTarget;
        });
    }

    const totalPortfolioValue = totalStockValue + totalCashValue;

    if (totalPortfolioValue === 0) {
        return (
            <div className="h-full flex flex-col justify-center items-center text-center">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <ChartIcon size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">No Portfolio Data</h3>
            </div>
        );
    }

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

    const isLarge = size === 'large';
    const isMedium = size === 'medium';

    return (
        <div className={`h-full flex ${isLarge ? 'flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-10' : 'flex-row gap-4'} items-center`}>
            {/* Chart Container */}
            <div className={`${isLarge ? 'w-full' : 'w-1/2'} flex items-center justify-center`}>
                <div className={`relative w-full ${isLarge ? 'max-w-[320px]' : 'max-w-[180px]'} aspect-square`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={innerData}
                                cx="50%"
                                cy="50%"
                                innerRadius={isLarge ? "35%" : "30%"}
                                outerRadius={isLarge ? "50%" : "45%"}
                                dataKey="value"
                                stroke="rgba(0,0,0,0.1)"
                                strokeWidth={1}
                            >
                                {innerData.map((entry, index) => (
                                    <Cell key={`inner-${index}`} fill={entry.color} />
                                ))}
                            </Pie>

                            <Pie
                                data={outerData}
                                cx="50%"
                                cy="50%"
                                innerRadius={isLarge ? "55%" : "50%"}
                                outerRadius={isLarge ? "85%" : "80%"}
                                dataKey="value"
                                stroke="none"
                                paddingAngle={isLarge ? 2 : 1}
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
                                            <div className="bg-card/95 backdrop-blur-2xl border border-white/10 p-3 rounded-xl shadow-2xl ring-1 ring-white/5 z-50">
                                                <p className="text-foreground font-black text-xs mb-1 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: data.color }}></div>
                                                    {data.name}
                                                </p>
                                                <p className="text-primary text-sm font-black">{formatCurrency(data.value, currency)}</p>
                                                <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest mt-1">
                                                    {percentage.toFixed(1)}% of Portfolio
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
                        <span className="text-muted-foreground text-[8px] font-black uppercase tracking-widest opacity-60">Total</span>
                        <div className={`${isLarge ? 'text-lg' : 'text-[10px]'} font-black text-foreground truncate max-w-full px-2`}>
                            {formatCurrency(totalPortfolioValue, currency)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend with Progress Bars */}
            <div className={`${isLarge ? 'w-full' : 'w-1/2'} space-y-3 ${isLarge ? 'max-h-[380px]' : 'max-h-full'} overflow-y-auto pr-1 custom-scrollbar`}>
                {!isLarge && (
                    <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/40 pb-1 mb-2">
                        Sectors
                    </div>
                )}
                {outerData.map((item, index) => (
                    <div key={item.name} className="group cursor-default">
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div
                                    className="w-2 h-2 rounded-[2px] flex-shrink-0"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span className={`font-bold text-muted-foreground truncate ${isLarge ? 'text-xs' : 'text-[9px]'}`}>
                                    {item.name}
                                </span>
                            </div>
                            <span className={`font-black text-foreground ${isLarge ? 'text-xs' : 'text-[9px]'}`}>
                                {((item.value / totalPortfolioValue) * 100).toFixed(1)}%
                            </span>
                        </div>
                        <div className={`w-full bg-muted/30 rounded-full overflow-hidden ${isLarge ? 'h-1.5' : 'h-1'}`}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.value / totalPortfolioValue) * 100}%` }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: item.color }}
                            />
                        </div>
                        {isLarge && (
                            <div className="text-[10px] text-muted-foreground/60 font-bold mt-1 ml-4 flex justify-between">
                                <span>{item.type}</span>
                                <span>{formatCurrency(item.value, currency)}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

