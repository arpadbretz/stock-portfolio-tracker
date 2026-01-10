'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import {
    Calculator,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Percent,
    Info,
    RefreshCw,
    Search,
    ChevronRight,
    Target,
    AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

interface DCFInputs {
    symbol: string;
    currentPrice: number;
    freeCashFlow: number;
    growthRateYear1to5: number;
    growthRateYear6to10: number;
    terminalGrowthRate: number;
    discountRate: number;
    sharesOutstanding: number;
    marginOfSafety: number;
}

interface DCFResult {
    intrinsicValue: number;
    fairValue: number;
    upside: number;
    isUndervalued: boolean;
    projectedCashFlows: { year: number; cashFlow: number; presentValue: number }[];
    terminalValue: number;
    terminalPresentValue: number;
}

function DCFCalculatorContent() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSymbol = searchParams.get('symbol') || '';

    const [inputs, setInputs] = useState<DCFInputs>({
        symbol: initialSymbol,
        currentPrice: 0,
        freeCashFlow: 0,
        growthRateYear1to5: 15,
        growthRateYear6to10: 8,
        terminalGrowthRate: 2.5,
        discountRate: 10,
        sharesOutstanding: 0,
        marginOfSafety: 25,
    });

    const [result, setResult] = useState<DCFResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [stockName, setStockName] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const fetchStockData = async () => {
        if (!inputs.symbol) return;

        setIsLoading(true);
        try {
            const res = await fetch(`/api/stock/${inputs.symbol.toUpperCase()}`);
            const data = await res.json();

            if (data.price) {
                setStockName(data.name || inputs.symbol);
                setInputs(prev => ({
                    ...prev,
                    currentPrice: data.price || 0,
                    freeCashFlow: data.freeCashflow ? data.freeCashflow / 1e9 : 0, // Convert to billions
                    sharesOutstanding: data.marketCap && data.price ? Math.round(data.marketCap / data.price / 1e6) : 0, // Convert to millions
                }));
            }
        } catch (err) {
            console.error('Failed to fetch stock data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateDCF = () => {
        const {
            currentPrice,
            freeCashFlow, // in billions
            growthRateYear1to5,
            growthRateYear6to10,
            terminalGrowthRate,
            discountRate,
            sharesOutstanding, // in millions
            marginOfSafety,
        } = inputs;

        if (!freeCashFlow || !sharesOutstanding) {
            return;
        }

        const projectedCashFlows: { year: number; cashFlow: number; presentValue: number }[] = [];
        let currentCF = freeCashFlow;
        let totalPV = 0;

        // Years 1-5: High growth phase
        for (let year = 1; year <= 5; year++) {
            currentCF = currentCF * (1 + growthRateYear1to5 / 100);
            const pv = currentCF / Math.pow(1 + discountRate / 100, year);
            projectedCashFlows.push({ year, cashFlow: currentCF, presentValue: pv });
            totalPV += pv;
        }

        // Years 6-10: Slower growth phase
        for (let year = 6; year <= 10; year++) {
            currentCF = currentCF * (1 + growthRateYear6to10 / 100);
            const pv = currentCF / Math.pow(1 + discountRate / 100, year);
            projectedCashFlows.push({ year, cashFlow: currentCF, presentValue: pv });
            totalPV += pv;
        }

        // Terminal Value (Gordon Growth Model)
        const terminalCF = currentCF * (1 + terminalGrowthRate / 100);
        const terminalValue = terminalCF / (discountRate / 100 - terminalGrowthRate / 100);
        const terminalPV = terminalValue / Math.pow(1 + discountRate / 100, 10);
        totalPV += terminalPV;

        // Convert to per-share value
        const intrinsicValue = (totalPV * 1000) / sharesOutstanding; // billions to millions adjustment
        const fairValue = intrinsicValue * (1 - marginOfSafety / 100);
        const upside = ((intrinsicValue - currentPrice) / currentPrice) * 100;

        setResult({
            intrinsicValue,
            fairValue,
            upside,
            isUndervalued: currentPrice < fairValue,
            projectedCashFlows,
            terminalValue,
            terminalPresentValue: terminalPV,
        });
    };

    const handleInputChange = (field: keyof DCFInputs, value: string | number) => {
        setInputs(prev => ({
            ...prev,
            [field]: typeof value === 'string' ? (field === 'symbol' ? value.toUpperCase() : parseFloat(value) || 0) : value,
        }));
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-foreground px-6 py-10 lg:px-12 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                            <Calculator className="text-indigo-500" size={20} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Valuation Tool</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tight">
                        DCF <span className="text-primary">Calculator</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Calculate the intrinsic value of a stock using discounted cash flow analysis
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Section */}
                <div className="space-y-6">
                    {/* Stock Lookup */}
                    <div className="bg-card border border-border rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Search size={18} />
                            Stock Lookup
                        </h3>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={inputs.symbol}
                                onChange={(e) => handleInputChange('symbol', e.target.value)}
                                placeholder="Enter ticker (e.g., AAPL)"
                                className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <button
                                onClick={fetchStockData}
                                disabled={isLoading || !inputs.symbol}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                                Fetch
                            </button>
                        </div>
                        {stockName && (
                            <p className="text-sm text-muted-foreground mt-3">
                                <span className="text-foreground font-bold">{stockName}</span>
                                {inputs.currentPrice > 0 && (
                                    <span className="ml-2">Current Price: ${inputs.currentPrice.toFixed(2)}</span>
                                )}
                            </p>
                        )}
                    </div>

                    {/* Key Inputs */}
                    <div className="bg-card border border-border rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <DollarSign size={18} />
                            Key Financials
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                                    Current Price ($)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={inputs.currentPrice || ''}
                                    onChange={(e) => handleInputChange('currentPrice', e.target.value)}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                                    Free Cash Flow ($B)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={inputs.freeCashFlow || ''}
                                    onChange={(e) => handleInputChange('freeCashFlow', e.target.value)}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                                    Shares Outstanding (M)
                                </label>
                                <input
                                    type="number"
                                    value={inputs.sharesOutstanding || ''}
                                    onChange={(e) => handleInputChange('sharesOutstanding', e.target.value)}
                                    className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Growth Assumptions */}
                    <div className="bg-card border border-border rounded-3xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Percent size={18} />
                            Growth Assumptions
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Growth Rate (Years 1-5)
                                    </label>
                                    <span className="text-sm font-bold text-primary">{inputs.growthRateYear1to5}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={inputs.growthRateYear1to5}
                                    onChange={(e) => handleInputChange('growthRateYear1to5', e.target.value)}
                                    className="w-full accent-primary"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Growth Rate (Years 6-10)
                                    </label>
                                    <span className="text-sm font-bold text-primary">{inputs.growthRateYear6to10}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    value={inputs.growthRateYear6to10}
                                    onChange={(e) => handleInputChange('growthRateYear6to10', e.target.value)}
                                    className="w-full accent-primary"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Terminal Growth Rate
                                    </label>
                                    <span className="text-sm font-bold text-primary">{inputs.terminalGrowthRate}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="5"
                                    step="0.5"
                                    value={inputs.terminalGrowthRate}
                                    onChange={(e) => handleInputChange('terminalGrowthRate', e.target.value)}
                                    className="w-full accent-primary"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Discount Rate (WACC)
                                    </label>
                                    <span className="text-sm font-bold text-primary">{inputs.discountRate}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="20"
                                    step="0.5"
                                    value={inputs.discountRate}
                                    onChange={(e) => handleInputChange('discountRate', e.target.value)}
                                    className="w-full accent-primary"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                        Margin of Safety
                                    </label>
                                    <span className="text-sm font-bold text-orange-500">{inputs.marginOfSafety}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="50"
                                    value={inputs.marginOfSafety}
                                    onChange={(e) => handleInputChange('marginOfSafety', e.target.value)}
                                    className="w-full accent-orange-500"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={calculateDCF}
                        disabled={!inputs.freeCashFlow || !inputs.sharesOutstanding}
                        className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Calculator size={18} />
                        Calculate Intrinsic Value
                    </button>
                </div>

                {/* Results Section */}
                <div className="space-y-6">
                    {result ? (
                        <>
                            {/* Main Result Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`p-8 rounded-3xl border-2 ${result.isUndervalued
                                    ? 'bg-emerald-500/5 border-emerald-500/30'
                                    : 'bg-rose-500/5 border-rose-500/30'
                                    }`}
                            >
                                <div className="text-center mb-6">
                                    <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 ${result.isUndervalued
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-rose-500/10 text-rose-500'
                                        }`}>
                                        {result.isUndervalued ? (
                                            <><TrendingUp size={14} /> Potentially Undervalued</>
                                        ) : (
                                            <><TrendingDown size={14} /> Potentially Overvalued</>
                                        )}
                                    </div>
                                    <h2 className="text-5xl font-black mb-2">${result.intrinsicValue.toFixed(2)}</h2>
                                    <p className="text-muted-foreground">Intrinsic Value per Share</p>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-black">${inputs.currentPrice.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground font-bold uppercase">Current Price</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-orange-500">${result.fairValue.toFixed(2)}</p>
                                        <p className="text-xs text-muted-foreground font-bold uppercase">Fair Value</p>
                                        <p className="text-[10px] text-muted-foreground">(with {inputs.marginOfSafety}% safety)</p>
                                    </div>
                                    <div>
                                        <p className={`text-2xl font-black ${result.upside >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {result.upside >= 0 ? '+' : ''}{result.upside.toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-muted-foreground font-bold uppercase">Upside</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Cash Flow Projections */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-card border border-border rounded-3xl p-6"
                            >
                                <h3 className="text-lg font-bold mb-4">Projected Cash Flows</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left py-2 font-bold text-muted-foreground">Year</th>
                                                <th className="text-right py-2 font-bold text-muted-foreground">Cash Flow</th>
                                                <th className="text-right py-2 font-bold text-muted-foreground">Present Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.projectedCashFlows.map((cf) => (
                                                <tr key={cf.year} className="border-b border-border/50">
                                                    <td className="py-2 font-bold">Year {cf.year}</td>
                                                    <td className="py-2 text-right">${cf.cashFlow.toFixed(2)}B</td>
                                                    <td className="py-2 text-right text-primary font-bold">${cf.presentValue.toFixed(2)}B</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-muted/30">
                                                <td className="py-2 font-black">Terminal Value</td>
                                                <td className="py-2 text-right">${result.terminalValue.toFixed(2)}B</td>
                                                <td className="py-2 text-right text-primary font-black">${result.terminalPresentValue.toFixed(2)}B</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>

                            {/* Disclaimer */}
                            <div className="bg-muted/50 border border-border rounded-2xl p-4 flex items-start gap-3">
                                <AlertCircle className="text-muted-foreground shrink-0 mt-0.5" size={16} />
                                <p className="text-xs text-muted-foreground">
                                    <strong>Disclaimer:</strong> This DCF model is for educational purposes only.
                                    Intrinsic value calculations are highly sensitive to input assumptions.
                                    Always do your own research before making investment decisions.
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="bg-card border border-border rounded-3xl p-12 text-center">
                            <Calculator className="mx-auto text-muted-foreground mb-4" size={48} />
                            <h3 className="text-xl font-bold mb-2">Enter Stock Details</h3>
                            <p className="text-muted-foreground mb-6">
                                Search for a stock or enter financial data manually, then calculate the intrinsic value.
                            </p>
                            <div className="text-left bg-muted/30 rounded-xl p-4 text-sm">
                                <h4 className="font-bold mb-2 flex items-center gap-2">
                                    <Info size={14} /> How DCF Works
                                </h4>
                                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                                    <li>Project future free cash flows over 10 years</li>
                                    <li>Calculate terminal value for perpetual growth</li>
                                    <li>Discount all cash flows to present value</li>
                                    <li>Divide by shares outstanding for per-share value</li>
                                    <li>Apply margin of safety for conservative estimate</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function DCFCalculatorPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <DCFCalculatorContent />
        </Suspense>
    );
}
