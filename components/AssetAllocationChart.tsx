import { Holding, CurrencyCode } from '@/types/portfolio';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as ChartIcon } from 'lucide-react';
import { formatCurrency, convertCurrency } from '@/lib/portfolio';
import { motion } from 'framer-motion';

interface PerformanceChartProps {
    holdings: Holding[];
    currency: CurrencyCode;
    exchangeRates: Record<CurrencyCode, number>;
    isLoading?: boolean;
    size?: 'small' | 'medium' | 'large';
    cashBalance?: number;
    cashBalances?: Record<string, number>;
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
    '#ec4899', // pink-500
    '#14b8a6', // teal-500
];

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
    'Cash': '#10b981',
};

const CASH_COLORS: Record<string, string> = {
    'USD': '#0ea5e9',
    'EUR': '#2dd4bf',
    'HUF': '#22c55e',
};

export default function AssetAllocationChart({
    holdings,
    currency,
    exchangeRates,
    isLoading,
    size = 'medium',
    cashBalance,
    cashBalances
}: PerformanceChartProps) {
    if (isLoading) {
        return (
            <div className="h-full flex flex-col justify-center items-center">
                <div className="w-10 h-10 border-4 border-muted border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground text-xs animate-pulse font-black uppercase tracking-widest">Generating Allocation Map...</p>
            </div>
        );
    }

    if (holdings.length === 0 && (!cashBalance || cashBalance === 0)) {
        return (
            <div className="h-full flex flex-col justify-center items-center text-center">
                <div className="bg-muted p-4 rounded-full mb-4">
                    <ChartIcon size={24} className="text-muted-foreground" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground">No Allocation Data</h3>
            </div>
        );
    }

    const isLarge = size === 'large';

    // --- DATA PREP ---
    const sectorMap = new Map<string, { value: number; color: string; tickers: { name: string; value: number }[] }>();
    let totalValue = 0;

    // Process Holdings
    holdings.forEach(h => {
        const sector = h.sector || 'Unknown';
        const value = convertCurrency(h.marketValue, currency, exchangeRates);
        totalValue += value;

        if (!sectorMap.has(sector)) {
            sectorMap.set(sector, {
                value: 0,
                color: SECTOR_COLORS[sector] || COLORS[sectorMap.size % COLORS.length],
                tickers: []
            });
        }
        const data = sectorMap.get(sector)!;
        data.value += value;
        data.tickers.push({ name: h.ticker, value });
    });

    // Process Cash
    let cashData: { name: string; value: number }[] = [];
    let displayCashValue = 0;
    if (cashBalances && Object.keys(cashBalances).length > 0) {
        Object.entries(cashBalances).forEach(([curr, bal]) => {
            if (bal <= 0) return;
            // exchangeRates[curr] is rate TO USD. If currency is target, we want bal in target.
            // Bal_USD = bal / rate_curr
            // Bal_Target = Bal_USD * exchangeRates[currency]
            const valInTarget = (bal / (exchangeRates[curr as CurrencyCode] || 1)) * (exchangeRates[currency] || 1);
            cashData.push({ name: curr, value: valInTarget });
            displayCashValue += valInTarget;
        });
    } else if (cashBalance && cashBalance > 0) {
        displayCashValue = convertCurrency(cashBalance, currency, exchangeRates);
        cashData.push({ name: 'Cash', value: displayCashValue });
    }

    if (displayCashValue > 0) {
        totalValue += displayCashValue;
        sectorMap.set('Cash', {
            value: displayCashValue,
            color: SECTOR_COLORS['Cash'],
            tickers: cashData
        });
    }

    // --- CHART DATA GENERATION ---
    const innerData: any[] = [];
    const outerData: any[] = [];

    // Sort sectors by value
    const sortedSectors = Array.from(sectorMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.value - a.value);

    sortedSectors.forEach(sector => {
        const percentage = (sector.value / totalValue) * 100;
        if (percentage < 0.1) return; // Hide tiny slices

        innerData.push({
            name: sector.name,
            value: sector.value,
            color: sector.color
        });

        // Group tiny tickers within sector
        const sortedTickers = sector.tickers.sort((a, b) => b.value - a.value);
        let sectorCurrentValue = 0;

        sortedTickers.forEach(ticker => {
            const tickerPct = (ticker.value / totalValue) * 100;
            // If ticker is too small, we might want to group? 
            // For now, let's keep it simple and show them with sector shade
            outerData.push({
                name: ticker.name,
                value: ticker.value,
                parent: sector.name,
                color: sector.name === 'Cash'
                    ? (CASH_COLORS[ticker.name] || sector.color)
                    : sector.color // We could use varying shades here for more "wow"
            });
            sectorCurrentValue += ticker.value;
        });
    });

    // Fallback for non-sunburst mode (medium/small) - Focus on Stocks only
    const flatData = holdings.map(h => ({
        name: h.ticker,
        value: convertCurrency(h.marketValue, currency, exchangeRates),
        color: SECTOR_COLORS[h.sector || 'Unknown'] || COLORS[0]
    })).sort((a, b) => b.value - a.value);

    return (
        <div className={`h-full flex flex-col ${isLarge ? 'lg:grid lg:grid-cols-2 lg:gap-10' : ''} items-center`}>
            {/* Chart Container */}
            <div className="w-full flex items-center justify-center">
                <div className={`relative w-full ${isLarge ? 'max-w-[340px]' : 'max-w-[240px]'} aspect-square`}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            {isLarge ? (
                                <>
                                    {/* INNER RING: SECTORS */}
                                    <Pie
                                        data={innerData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="35%"
                                        outerRadius="55%"
                                        dataKey="value"
                                        stroke="rgba(0,0,0,0.1)"
                                        strokeWidth={1}
                                    >
                                        {innerData.map((entry, index) => (
                                            <Cell key={`inner-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    {/* OUTER RING: TICKERS */}
                                    <Pie
                                        data={outerData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="60%"
                                        outerRadius="88%"
                                        dataKey="value"
                                        stroke="none"
                                        paddingAngle={1}
                                    >
                                        {outerData.map((entry, index) => (
                                            <Cell
                                                key={`outer-${index}`}
                                                fill={entry.color}
                                                className="hover:opacity-80 transition-opacity cursor-pointer shadow-sm"
                                            />
                                        ))}
                                    </Pie>
                                </>
                            ) : (
                                <Pie
                                    data={flatData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="55%"
                                    outerRadius="85%"
                                    paddingAngle={4}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {flatData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color || COLORS[index % COLORS.length]}
                                            className="hover:opacity-80 transition-opacity cursor-pointer"
                                        />
                                    ))}
                                </Pie>
                            )}
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        const percentage = (data.value / totalValue) * 100;
                                        return (
                                            <div className="bg-card/95 backdrop-blur-xl border border-border/50 p-3 rounded-xl shadow-2xl z-50 ring-1 ring-white/10">
                                                <p className="text-foreground font-black mb-1 flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: data.color }}></div>
                                                    {data.name}
                                                    {data.parent && <span className="text-[10px] text-muted-foreground font-bold">({data.parent})</span>}
                                                </p>
                                                <p className="text-primary text-sm font-black">{formatCurrency(data.value, currency)}</p>
                                                <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest mt-1">
                                                    {percentage.toFixed(1)}% Weight
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
                        <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest opacity-60">
                            {isLarge ? 'Portfolio' : 'Tickers'}
                        </span>
                        <span className={`font-black text-foreground ${isLarge ? 'text-lg' : 'text-xl'}`}>
                            {isLarge ? formatCurrency(totalValue, currency) : flatData.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Legend - Detailed for large size */}
            {isLarge ? (
                <div className="w-full space-y-4 max-h-[380px] overflow-y-auto pr-3 custom-scrollbar lg:mt-0 mt-6">
                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/40 pb-2">
                        Asset & Sector Hierarchy
                    </div>
                    {sortedSectors.map((sector) => (
                        <div key={sector.name} className="space-y-1.5 border-l-2 border-border/20 pl-3 ml-1">
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: sector.color }} />
                                    <span className="text-xs font-black uppercase tracking-tight text-foreground/80">{sector.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-muted-foreground">
                                    {((sector.value / totalValue) * 100).toFixed(1)}%
                                </span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
                                {sector.tickers.sort((a, b) => b.value - a.value).map(ticker => (
                                    <div key={ticker.name} className="flex items-center justify-between py-0.5">
                                        <span className="text-[10px] font-bold text-muted-foreground truncate mr-2">{ticker.name}</span>
                                        <span className="text-[9px] font-black text-foreground/40 italic">
                                            {((ticker.value / totalValue) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="w-full mt-4 flex flex-wrap justify-center gap-2">
                    {/* For medium size, maybe just show top 5 in small badges or nothing to keep it clean */}
                    {flatData.slice(0, 6).map((item, idx) => (
                        <div key={item.name} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/30 border border-border/30">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-[9px] font-black">{item.name}</span>
                        </div>
                    ))}
                    {flatData.length > 6 && <span className="text-[9px] font-bold text-muted-foreground flex items-center">+{flatData.length - 6} more</span>}
                </div>
            )}
        </div>
    );
}
