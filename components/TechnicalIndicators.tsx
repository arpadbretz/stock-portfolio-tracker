'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    calculateSMA,
    calculateEMA,
    calculateRSI,
    calculateMACD,
    calculateBollingerBands,
    interpretRSI,
    interpretMACD,
} from '@/lib/technical-indicators';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    ComposedChart,
    Bar,
    Area,
} from 'recharts';
import { Activity, TrendingUp, TrendingDown, Minus, Settings2, ChevronDown, ChevronUp } from 'lucide-react';

interface HistoricalData {
    date: string;
    close: number;
    open?: number;
    high?: number;
    low?: number;
    volume?: number;
}

interface TechnicalIndicatorsProps {
    historicalData: HistoricalData[];
    symbol: string;
}

type IndicatorType = 'sma' | 'ema' | 'rsi' | 'macd' | 'bollinger';

const INDICATOR_CONFIG = {
    sma: { label: 'SMA', periods: [20, 50, 200], colors: ['#10b981', '#3b82f6', '#f59e0b'] },
    ema: { label: 'EMA', periods: [12, 26], colors: ['#8b5cf6', '#ec4899'] },
    rsi: { label: 'RSI', period: 14, color: '#f59e0b' },
    macd: { label: 'MACD', fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    bollinger: { label: 'Bollinger Bands', period: 20, stdDev: 2, color: '#6366f1' },
};

export default function TechnicalIndicators({ historicalData, symbol }: TechnicalIndicatorsProps) {
    const [activeIndicators, setActiveIndicators] = useState<IndicatorType[]>(['rsi', 'macd']);
    const [isExpanded, setIsExpanded] = useState(true);
    const [showSettings, setShowSettings] = useState(false);

    const closePrices = useMemo(() => historicalData.map(d => d.close), [historicalData]);

    // Calculate all indicators
    const indicators = useMemo(() => {
        if (closePrices.length < 30) return null;

        const rsi = calculateRSI(closePrices, 14);
        const macd = calculateMACD(closePrices, 12, 26, 9);
        const sma20 = calculateSMA(closePrices, 20);
        const sma50 = calculateSMA(closePrices, 50);
        const ema12 = calculateEMA(closePrices, 12);
        const ema26 = calculateEMA(closePrices, 26);
        const bollinger = calculateBollingerBands(closePrices, 20, 2);

        return {
            rsi,
            macd,
            sma20,
            sma50,
            ema12,
            ema26,
            bollinger,
        };
    }, [closePrices]);

    if (!indicators || historicalData.length < 30) {
        return (
            <div className="bg-card border border-border rounded-[32px] p-8 text-center">
                <Activity className="text-muted-foreground mx-auto mb-4" size={48} />
                <p className="text-muted-foreground">Insufficient data for technical analysis</p>
                <p className="text-sm text-muted-foreground/70 mt-2">Need at least 30 days of historical data</p>
            </div>
        );
    }

    // Prepare chart data
    const rsiData = historicalData.map((d, i) => ({
        date: d.date,
        rsi: indicators.rsi[i],
    })).slice(-90); // Last 90 days

    const macdData = historicalData.map((d, i) => ({
        date: d.date,
        macd: indicators.macd.macd[i],
        signal: indicators.macd.signal[i],
        histogram: indicators.macd.histogram[i],
    })).slice(-90);

    // Current indicator values
    const currentRSI = indicators.rsi[indicators.rsi.length - 1];
    const currentMACD = indicators.macd.macd[indicators.macd.macd.length - 1];
    const currentSignal = indicators.macd.signal[indicators.macd.signal.length - 1];

    const rsiInterpretation = currentRSI ? interpretRSI(currentRSI) : null;
    const macdInterpretation = currentMACD !== null && currentSignal !== null
        ? interpretMACD(currentMACD, currentSignal)
        : null;

    const toggleIndicator = (indicator: IndicatorType) => {
        setActiveIndicators(prev =>
            prev.includes(indicator)
                ? prev.filter(i => i !== indicator)
                : [...prev, indicator]
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-[32px] overflow-hidden"
        >
            {/* Header */}
            <div
                className="p-6 border-b border-border flex items-center justify-between cursor-pointer"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-pink-500/20 flex items-center justify-center">
                        <Activity className="text-violet-400" size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-lg">Technical Indicators</h3>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                            RSI, MACD, Moving Averages
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowSettings(!showSettings); }}
                        className="p-2 hover:bg-muted rounded-xl transition-colors"
                    >
                        <Settings2 size={18} className="text-muted-foreground" />
                    </button>
                    {isExpanded ? (
                        <ChevronUp size={20} className="text-muted-foreground" />
                    ) : (
                        <ChevronDown size={20} className="text-muted-foreground" />
                    )}
                </div>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex flex-wrap gap-2">
                        {(Object.keys(INDICATOR_CONFIG) as IndicatorType[]).map(indicator => (
                            <button
                                key={indicator}
                                onClick={() => toggleIndicator(indicator)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeIndicators.includes(indicator)
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                {INDICATOR_CONFIG[indicator].label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isExpanded && (
                <div className="p-6 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* RSI Card */}
                        {activeIndicators.includes('rsi') && currentRSI && (
                            <div className="bg-muted/30 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground font-bold">RSI (14)</span>
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${rsiInterpretation?.signal === 'overbought' ? 'bg-rose-500/10 text-rose-500' :
                                        rsiInterpretation?.signal === 'oversold' ? 'bg-emerald-500/10 text-emerald-500' :
                                            'bg-muted text-muted-foreground'
                                        }`}>
                                        {rsiInterpretation?.signal === 'overbought' && <TrendingDown size={12} />}
                                        {rsiInterpretation?.signal === 'oversold' && <TrendingUp size={12} />}
                                        {rsiInterpretation?.signal === 'neutral' && <Minus size={12} />}
                                        {rsiInterpretation?.signal.toUpperCase()}
                                    </div>
                                </div>
                                <div className="text-3xl font-black mb-2">{currentRSI.toFixed(1)}</div>
                                <p className="text-xs text-muted-foreground">{rsiInterpretation?.description}</p>

                                {/* RSI Gauge */}
                                <div className="mt-4 h-2 bg-muted rounded-full relative overflow-hidden">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500"
                                        style={{ width: '100%' }}
                                    />
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-foreground"
                                        style={{ left: `${currentRSI}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                                    <span>Oversold (30)</span>
                                    <span>Overbought (70)</span>
                                </div>
                            </div>
                        )}

                        {/* MACD Card */}
                        {activeIndicators.includes('macd') && currentMACD !== null && (
                            <div className="bg-muted/30 rounded-2xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-sm text-muted-foreground font-bold">MACD (12,26,9)</span>
                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${macdInterpretation?.signal === 'bullish' ? 'bg-emerald-500/10 text-emerald-500' :
                                        macdInterpretation?.signal === 'bearish' ? 'bg-rose-500/10 text-rose-500' :
                                            'bg-muted text-muted-foreground'
                                        }`}>
                                        {macdInterpretation?.signal === 'bullish' && <TrendingUp size={12} />}
                                        {macdInterpretation?.signal === 'bearish' && <TrendingDown size={12} />}
                                        {macdInterpretation?.signal === 'neutral' && <Minus size={12} />}
                                        {macdInterpretation?.signal.toUpperCase()}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">MACD Line</div>
                                        <div className={`text-xl font-black ${currentMACD >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {currentMACD.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">Signal Line</div>
                                        <div className="text-xl font-black text-muted-foreground">
                                            {currentSignal?.toFixed(2) || '-'}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground mt-3">{macdInterpretation?.description}</p>
                            </div>
                        )}
                    </div>

                    {/* RSI Chart */}
                    {activeIndicators.includes('rsi') && (
                        <div>
                            <h4 className="text-sm font-bold mb-4 text-muted-foreground">RSI (14-period)</h4>
                            <div className="h-40">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={rsiData}>
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            tickFormatter={(v) => v.toString()}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                            }}
                                            formatter={(value) => [typeof value === 'number' ? value.toFixed(2) : '-', 'RSI']}
                                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                        />
                                        <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                                        <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                                        <ReferenceLine y={50} stroke="var(--muted)" strokeDasharray="1 3" />
                                        <Line
                                            type="monotone"
                                            dataKey="rsi"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            dot={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {/* MACD Chart */}
                    {activeIndicators.includes('macd') && (
                        <div>
                            <h4 className="text-sm font-bold mb-4 text-muted-foreground">MACD (12, 26, 9)</h4>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={macdData}>
                                        <XAxis
                                            dataKey="date"
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                            tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--card)',
                                                border: '1px solid var(--border)',
                                                borderRadius: '12px',
                                            }}
                                            formatter={(value, name) => [typeof value === 'number' ? value.toFixed(2) : '-', String(name).toUpperCase()]}
                                            labelFormatter={(date) => new Date(date).toLocaleDateString()}
                                        />
                                        <ReferenceLine y={0} stroke="var(--muted)" strokeDasharray="3 3" />
                                        <Bar
                                            dataKey="histogram"
                                            fill="var(--primary)"
                                            opacity={0.5}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="macd"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={false}
                                            name="MACD"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="signal"
                                            stroke="#ef4444"
                                            strokeWidth={2}
                                            dot={false}
                                            name="Signal"
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
