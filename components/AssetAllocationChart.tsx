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
    'Information Technology': '#3b82f6',   // Blue
    'Financials': '#6366f1',               // Indigo
    'Healthcare': '#10b981',               // Emerald
    'Consumer Discretionary': '#f59e0b',   // Amber
    'Consumer Cyclical': '#f59e0b',        // Amber
    'Communication Services': '#8b5cf6',   // Violet
    'Industrials': '#06b6d4',               // Cyan
    'Energy': '#f43f5e',                   // Rose
    'Utilities': '#d946ef',                // Fuchsia
    'Materials': '#ec4899',                // Pink
    'Real Estate': '#14b8a6',              // Teal
    'Consumer Staples': '#84cc16',         // Lime
    'Unknown': '#64748b',                  // Slate
    'Cash': '#0ea5e9',                     // Sky (Distinct from Healthcare)
};

const CASH_COLORS: Record<string, string> = {
    'USD': '#0ea5e9', // Sky
    'EUR': '#2dd4bf', // Teal/Cyan
    'HUF': '#22c55e', // Green
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

    // Helper to generate distinctive shades of a base color
    const getShade = (hex: string, index: number, total: number) => {
        if (total <= 1) return hex;
        // Simple shade logic: vary luminosity based on index
        // Extract RGB (basic)
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);

        // Vary by +/- 25%
        const factor = 0.75 + (index / (total - 1)) * 0.5;
        const nr = Math.min(255, Math.max(0, Math.round(r * factor)));
        const ng = Math.min(255, Math.max(0, Math.round(g * factor)));
        const nb = Math.min(255, Math.max(0, Math.round(b * factor)));

        return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
    };

    sortedSectors.forEach(sector => {
        const percentage = (sector.value / totalValue) * 100;
        if (percentage < 0.1) return;

        innerData.push({
            name: sector.name,
            value: sector.value,
            color: sector.color
        });

        const sortedTickers = sector.tickers.sort((a, b) => b.value - a.value);
        sortedTickers.forEach((ticker, idx) => {
            outerData.push({
                name: ticker.name,
                value: ticker.value,
                parent: sector.name,
                color: sector.name === 'Cash'
                    ? (CASH_COLORS[ticker.name] || sector.color)
                    : getShade(sector.color, idx, sortedTickers.length)
            });
        });
    });

    // Fallback for non-sunburst mode (medium/small) - Use distinctive colors for each ticker
    const flatData = holdings.map((h, idx) => ({
        name: h.ticker,
        value: convertCurrency(h.marketValue, currency, exchangeRates),
        color: COLORS[idx % COLORS.length] // Use a broader palette for distinct tickers
    })).sort((a, b) => b.value - a.value);

    return (
        <div className={`h-full flex ${isLarge ? 'flex-col lg:grid lg:grid-cols-2 lg:gap-10' : 'flex-row gap-4'} items-center`}>
            {/* Chart Container */}
            <div className={`${isLarge ? 'w-full' : 'w-1/2'} flex items-center justify-center`}>
                <div className={`relative w-full ${isLarge ? 'max-w-[340px]' : 'max-w-[180px]'} aspect-square`}>
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
                                    innerRadius="50%"
                                    outerRadius="80%"
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {flatData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
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
                                                <p className="text-foreground font-black text-xs mb-1 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: data.color }}></div>
                                                    {data.name}
                                                    {data.parent && <span className="text-[9px] text-muted-foreground font-bold">({data.parent})</span>}
                                                </p>
                                                <p className="text-primary text-sm font-black">{formatCurrency(data.value, currency)}</p>
                                                <p className="text-muted-foreground text-[9px] font-black uppercase tracking-widest mt-1">
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
                        <span className="text-muted-foreground text-[8px] font-black uppercase tracking-widest opacity-60">
                            {isLarge ? 'Portfolio' : 'Tickers'}
                        </span>
                        <span className={`font-black text-foreground ${isLarge ? 'text-lg' : 'text-xs'}`}>
                            {isLarge ? formatCurrency(totalValue, currency) : flatData.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className={`${isLarge ? 'w-full' : 'w-1/2'} space-y-3 ${isLarge ? 'max-h-[380px]' : 'max-h-full'} overflow-y-auto pr-1 custom-scrollbar`}>
                {isLarge ? (
                    <>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/40 pb-2">
                            Asset & Sector Hierarchy
                        </div>
                        {sortedSectors.map((sector) => (
                            <div key={sector.name} className="space-y-1.5 border-l-2 border-border/20 pl-3 ml-1">
                                <div className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: sector.color }} />
                                        <span className="text-[10px] font-black uppercase tracking-tight text-foreground/80">{sector.name}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-muted-foreground">
                                        {((sector.value / totalValue) * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-1">
                                    {sector.tickers.sort((a, b) => b.value - a.value).map((ticker, idx) => (
                                        <div key={ticker.name} className="flex items-center justify-between py-0.5 group/ticker">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <div
                                                    className="w-1 h-1 rounded-full flex-shrink-0 opacity-40 group-hover/ticker:opacity-100 transition-opacity"
                                                    style={{ backgroundColor: sector.name === 'Cash' ? (CASH_COLORS[ticker.name] || sector.color) : getShade(sector.color, idx, sector.tickers.length) }}
                                                />
                                                <span className="text-[9px] font-bold text-muted-foreground truncate group-hover/ticker:text-foreground transition-colors">{ticker.name}</span>
                                            </div>
                                            <span className="text-[8px] font-black text-foreground/40 italic">
                                                {((ticker.value / totalValue) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                ) : (
                    <>
                        <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 border-b border-border/40 pb-1 mb-2">
                            Top Weights
                        </div>
                        {flatData.slice(0, 8).map((item) => (
                            <div key={item.name} className="flex items-center justify-between py-0.5 border-b border-border/10 last:border-0 border-dashed">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                                    <span className="text-[10px] font-black text-foreground/80 truncate">{item.name}</span>
                                </div>
                                <span className="text-[9px] font-black text-primary flex-shrink-0 ml-2">
                                    {((item.value / totalValue) * 100).toFixed(1)}%
                                </span>
                            </div>
                        ))}
                        {flatData.length > 8 && (
                            <div className="text-[8px] font-bold text-muted-foreground/60 text-center pt-1 italic">
                                +{flatData.length - 8} more positions
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
