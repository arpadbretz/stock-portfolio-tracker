'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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
    Target,
    AlertCircle,
    Save,
    FolderOpen,
    Trash2,
    Settings2,
    Zap,
    ChevronDown,
    ChevronUp,
    X,
    Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

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
    // Advanced inputs
    customGrowthRates: number[];
    costOfEquity: number;
    costOfDebt: number;
    taxRate: number;
    debtRatio: number;
    equityRatio: number;
    riskFreeRate: number;
    beta: number;
    marketRiskPremium: number;
    cashAndEquivalents: number;
    totalDebt: number;
    scenarioType: 'base' | 'bull' | 'bear';
    notes: string;
}

interface DCFResult {
    intrinsicValue: number;
    fairValue: number;
    upside: number;
    isUndervalued: boolean;
    projectedCashFlows: { year: number; cashFlow: number; presentValue: number }[];
    terminalValue: number;
    terminalPresentValue: number;
    enterpriseValue: number;
    equityValue: number;
}

interface SavedAnalysis {
    id: string;
    symbol: string;
    name: string;
    intrinsic_value: number;
    fair_value: number;
    upside_percent: number;
    is_advanced: boolean;
    updated_at: string;
}

const defaultInputs: DCFInputs = {
    symbol: '',
    currentPrice: 0,
    freeCashFlow: 0,
    growthRateYear1to5: 15,
    growthRateYear6to10: 8,
    terminalGrowthRate: 2.5,
    discountRate: 10,
    sharesOutstanding: 0,
    marginOfSafety: 25,
    customGrowthRates: [15, 14, 13, 12, 11, 10, 9, 8, 7, 6],
    costOfEquity: 10,
    costOfDebt: 5,
    taxRate: 21,
    debtRatio: 30,
    equityRatio: 70,
    riskFreeRate: 4.5,
    beta: 1.0,
    marketRiskPremium: 5.5,
    cashAndEquivalents: 0,
    totalDebt: 0,
    scenarioType: 'base',
    notes: '',
};

function DCFCalculatorContent() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSymbol = searchParams.get('symbol') || '';

    const [inputs, setInputs] = useState<DCFInputs>({ ...defaultInputs, symbol: initialSymbol });
    const [result, setResult] = useState<DCFResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [stockName, setStockName] = useState('');

    // Mode and UI state
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const [showSavedModal, setShowSavedModal] = useState(false);
    const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [user, authLoading, router]);

    const fetchSavedAnalyses = useCallback(async () => {
        try {
            const res = await fetch('/api/dcf');
            const data = await res.json();
            if (data.success) {
                setSavedAnalyses(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch saved analyses:', err);
        }
    }, []);

    useEffect(() => {
        if (user) {
            fetchSavedAnalyses();
        }
    }, [user, fetchSavedAnalyses]);

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
                    freeCashFlow: data.freeCashflow ? data.freeCashflow / 1e9 : 0,
                    sharesOutstanding: data.marketCap && data.price ? Math.round(data.marketCap / data.price / 1e6) : 0,
                    cashAndEquivalents: data.totalCash ? data.totalCash / 1e9 : 0,
                    totalDebt: data.totalDebt ? data.totalDebt / 1e9 : 0,
                    beta: data.beta || 1.0,
                }));
            }
        } catch (err) {
            console.error('Failed to fetch stock data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateWACC = () => {
        if (isAdvancedMode) {
            const { costOfEquity, costOfDebt, taxRate, debtRatio, equityRatio } = inputs;
            return (equityRatio / 100 * costOfEquity) + (debtRatio / 100 * costOfDebt * (1 - taxRate / 100));
        }
        return inputs.discountRate;
    };

    const calculateDCF = () => {
        const {
            currentPrice,
            freeCashFlow,
            sharesOutstanding,
            marginOfSafety,
            customGrowthRates,
            cashAndEquivalents,
            totalDebt,
        } = inputs;

        if (!freeCashFlow || !sharesOutstanding) return;

        const wacc = calculateWACC();
        const projectedCashFlows: { year: number; cashFlow: number; presentValue: number }[] = [];
        let currentCF = freeCashFlow;
        let totalPV = 0;

        // 10-year projection
        for (let year = 1; year <= 10; year++) {
            let growthRate: number;
            if (isAdvancedMode) {
                growthRate = customGrowthRates[year - 1] || 5;
            } else {
                growthRate = year <= 5 ? inputs.growthRateYear1to5 : inputs.growthRateYear6to10;
            }

            currentCF = currentCF * (1 + growthRate / 100);
            const pv = currentCF / Math.pow(1 + wacc / 100, year);
            projectedCashFlows.push({ year, cashFlow: currentCF, presentValue: pv });
            totalPV += pv;
        }

        // Terminal Value
        const terminalCF = currentCF * (1 + inputs.terminalGrowthRate / 100);
        const terminalValue = terminalCF / (wacc / 100 - inputs.terminalGrowthRate / 100);
        const terminalPV = terminalValue / Math.pow(1 + wacc / 100, 10);
        totalPV += terminalPV;

        // Enterprise Value
        const enterpriseValue = totalPV;

        // Equity Value (with advanced adjustments)
        let equityValue = totalPV;
        if (isAdvancedMode) {
            equityValue = enterpriseValue + cashAndEquivalents - totalDebt;
        }

        // Per-share value
        const intrinsicValue = (equityValue * 1000) / sharesOutstanding;
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
            enterpriseValue,
            equityValue,
        });
    };

    const handleSave = async () => {
        if (!saveName.trim() || !result) return;

        setIsSaving(true);
        try {
            const res = await fetch('/api/dcf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: inputs.symbol,
                    name: saveName,
                    currentPrice: inputs.currentPrice,
                    freeCashFlow: inputs.freeCashFlow,
                    sharesOutstanding: inputs.sharesOutstanding,
                    growthRateYear1to5: inputs.growthRateYear1to5,
                    growthRateYear6to10: inputs.growthRateYear6to10,
                    terminalGrowthRate: inputs.terminalGrowthRate,
                    discountRate: inputs.discountRate,
                    marginOfSafety: inputs.marginOfSafety,
                    isAdvanced: isAdvancedMode,
                    customGrowthRates: isAdvancedMode ? inputs.customGrowthRates : null,
                    costOfEquity: inputs.costOfEquity,
                    costOfDebt: inputs.costOfDebt,
                    taxRate: inputs.taxRate,
                    debtRatio: inputs.debtRatio,
                    equityRatio: inputs.equityRatio,
                    riskFreeRate: inputs.riskFreeRate,
                    beta: inputs.beta,
                    marketRiskPremium: inputs.marketRiskPremium,
                    cashAndEquivalents: inputs.cashAndEquivalents,
                    totalDebt: inputs.totalDebt,
                    scenarioType: inputs.scenarioType,
                    intrinsicValue: result.intrinsicValue,
                    fairValue: result.fairValue,
                    upsidePercent: result.upside,
                    notes: inputs.notes,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setShowSaveDialog(false);
                setSaveName('');
                fetchSavedAnalyses();
                toast.success('Analysis saved!', { description: saveName });
            } else {
                toast.error('Failed to save analysis');
            }
        } catch (err) {
            console.error('Failed to save:', err);
            toast.error('Failed to save analysis');
        } finally {
            setIsSaving(false);
        }
    };

    const loadAnalysis = async (analysis: any) => {
        setInputs({
            symbol: analysis.symbol,
            currentPrice: analysis.current_price || 0,
            freeCashFlow: analysis.free_cash_flow || 0,
            sharesOutstanding: analysis.shares_outstanding || 0,
            growthRateYear1to5: analysis.growth_rate_1_5 || 15,
            growthRateYear6to10: analysis.growth_rate_6_10 || 8,
            terminalGrowthRate: analysis.terminal_growth_rate || 2.5,
            discountRate: analysis.discount_rate || 10,
            marginOfSafety: analysis.margin_of_safety || 25,
            customGrowthRates: analysis.custom_growth_rates || defaultInputs.customGrowthRates,
            costOfEquity: analysis.cost_of_equity || 10,
            costOfDebt: analysis.cost_of_debt || 5,
            taxRate: analysis.tax_rate || 21,
            debtRatio: analysis.debt_ratio || 30,
            equityRatio: analysis.equity_ratio || 70,
            riskFreeRate: analysis.risk_free_rate || 4.5,
            beta: analysis.beta || 1.0,
            marketRiskPremium: analysis.market_risk_premium || 5.5,
            cashAndEquivalents: analysis.cash_and_equivalents || 0,
            totalDebt: analysis.total_debt || 0,
            scenarioType: analysis.scenario_type || 'base',
            notes: analysis.notes || '',
        });
        setIsAdvancedMode(analysis.is_advanced || false);
        setStockName(analysis.name || analysis.symbol);
        setShowSavedModal(false);
        toast.success('Analysis loaded', { description: analysis.name || analysis.symbol });
    };

    const deleteAnalysis = async (id: string) => {
        try {
            await fetch(`/api/dcf?id=${id}`, { method: 'DELETE' });
            fetchSavedAnalyses();
        } catch (err) {
            console.error('Failed to delete:', err);
        }
    };

    const handleInputChange = (field: keyof DCFInputs, value: string | number | number[]) => {
        setInputs(prev => ({
            ...prev,
            [field]: typeof value === 'string' && field !== 'symbol' && field !== 'notes' && field !== 'scenarioType'
                ? parseFloat(value) || 0
                : value,
        }));
    };

    const handleCustomGrowthChange = (index: number, value: string) => {
        const newRates = [...inputs.customGrowthRates];
        newRates[index] = parseFloat(value) || 0;
        setInputs(prev => ({ ...prev, customGrowthRates: newRates }));
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen text-foreground px-6 py-10 lg:px-12 max-w-[1600px] mx-auto">
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

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Mode Toggle */}
                    <button
                        onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${isAdvancedMode
                            ? 'bg-indigo-500 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                    >
                        <Settings2 size={16} />
                        {isAdvancedMode ? 'Advanced Mode' : 'Simple Mode'}
                    </button>

                    {/* Load Saved */}
                    <button
                        onClick={() => setShowSavedModal(true)}
                        className="px-4 py-2.5 rounded-xl font-bold text-sm bg-card border border-border hover:bg-muted transition-all flex items-center gap-2"
                    >
                        <FolderOpen size={16} />
                        Load Saved ({savedAnalyses.length})
                    </button>

                    {/* Save Button */}
                    {result && (
                        <button
                            onClick={() => setShowSaveDialog(true)}
                            className="px-4 py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground flex items-center gap-2"
                        >
                            <Save size={16} />
                            Save Analysis
                        </button>
                    )}
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
                                onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
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

                    {/* Simple Growth Assumptions */}
                    {!isAdvancedMode && (
                        <div className="bg-card border border-border rounded-3xl p-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Percent size={18} />
                                Growth Assumptions
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Growth Rate (Years 1-5)', field: 'growthRateYear1to5', min: 0, max: 50 },
                                    { label: 'Growth Rate (Years 6-10)', field: 'growthRateYear6to10', min: 0, max: 30 },
                                    { label: 'Terminal Growth Rate', field: 'terminalGrowthRate', min: 0, max: 5, step: 0.5 },
                                    { label: 'Discount Rate (WACC)', field: 'discountRate', min: 5, max: 20, step: 0.5 },
                                    { label: 'Margin of Safety', field: 'marginOfSafety', min: 0, max: 50, color: 'orange' },
                                ].map(({ label, field, min, max, step, color }) => (
                                    <div key={field}>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                {label}
                                            </label>
                                            <span className={`text-sm font-bold ${color === 'orange' ? 'text-orange-500' : 'text-primary'}`}>
                                                {(inputs as any)[field]}%
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min={min}
                                            max={max}
                                            step={step || 1}
                                            value={(inputs as any)[field]}
                                            onChange={(e) => handleInputChange(field as keyof DCFInputs, e.target.value)}
                                            className={`w-full ${color === 'orange' ? 'accent-orange-500' : 'accent-primary'}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Advanced Mode Sections */}
                    <AnimatePresence>
                        {isAdvancedMode && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-6 overflow-hidden"
                            >
                                {/* Custom Year-by-Year Growth */}
                                <div className="bg-card border border-indigo-500/30 rounded-3xl p-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-500">
                                        <Zap size={18} />
                                        Custom Growth Rates (Year-by-Year)
                                    </h3>
                                    <div className="grid grid-cols-5 gap-3">
                                        {inputs.customGrowthRates.map((rate, i) => (
                                            <div key={i}>
                                                <label className="text-[10px] font-bold text-muted-foreground block text-center mb-1">
                                                    Y{i + 1}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={rate}
                                                    onChange={(e) => handleCustomGrowthChange(i, e.target.value)}
                                                    className="w-full px-2 py-2 bg-muted border border-border rounded-lg text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* WACC Calculator */}
                                <div className="bg-card border border-indigo-500/30 rounded-3xl p-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-500">
                                        <Calculator size={18} />
                                        WACC Calculator
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                                                Risk-Free Rate (%)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={inputs.riskFreeRate}
                                                onChange={(e) => handleInputChange('riskFreeRate', e.target.value)}
                                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                                                Beta (β)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={inputs.beta}
                                                onChange={(e) => handleInputChange('beta', e.target.value)}
                                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                                                Market Risk Premium (%)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={inputs.marketRiskPremium}
                                                onChange={(e) => handleInputChange('marketRiskPremium', e.target.value)}
                                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                                                Cost of Debt (%)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={inputs.costOfDebt}
                                                onChange={(e) => handleInputChange('costOfDebt', e.target.value)}
                                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                                                Tax Rate (%)
                                            </label>
                                            <input
                                                type="number"
                                                value={inputs.taxRate}
                                                onChange={(e) => handleInputChange('taxRate', e.target.value)}
                                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                                                Debt Ratio (%)
                                            </label>
                                            <input
                                                type="number"
                                                value={inputs.debtRatio}
                                                onChange={(e) => {
                                                    const debt = parseFloat(e.target.value) || 0;
                                                    setInputs(prev => ({ ...prev, debtRatio: debt, equityRatio: 100 - debt }));
                                                }}
                                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 p-4 bg-indigo-500/10 rounded-xl">
                                        <p className="text-xs text-muted-foreground">
                                            Cost of Equity (CAPM) = {inputs.riskFreeRate}% + {inputs.beta} × {inputs.marketRiskPremium}% =
                                            <span className="text-indigo-500 font-bold ml-1">
                                                {(inputs.riskFreeRate + inputs.beta * inputs.marketRiskPremium).toFixed(2)}%
                                            </span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            WACC =
                                            <span className="text-indigo-500 font-bold ml-1">
                                                {calculateWACC().toFixed(2)}%
                                            </span>
                                        </p>
                                    </div>
                                </div>

                                {/* Balance Sheet Adjustments */}
                                <div className="bg-card border border-indigo-500/30 rounded-3xl p-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-500">
                                        <DollarSign size={18} />
                                        Balance Sheet Adjustments
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                                                Cash & Equivalents ($B)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={inputs.cashAndEquivalents || ''}
                                                onChange={(e) => handleInputChange('cashAndEquivalents', e.target.value)}
                                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1 block">
                                                Total Debt ($B)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={inputs.totalDebt || ''}
                                                onChange={(e) => handleInputChange('totalDebt', e.target.value)}
                                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-3">
                                        Equity Value = Enterprise Value + Cash - Debt
                                    </p>
                                </div>

                                {/* Terminal & Safety */}
                                <div className="bg-card border border-border rounded-3xl p-6">
                                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                        <Target size={18} />
                                        Terminal Value & Safety
                                    </h3>
                                    <div className="space-y-4">
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

                                {/* Notes */}
                                <div className="bg-card border border-border rounded-3xl p-6">
                                    <h3 className="text-lg font-bold mb-4">Notes</h3>
                                    <textarea
                                        value={inputs.notes}
                                        onChange={(e) => handleInputChange('notes', e.target.value)}
                                        placeholder="Add your investment thesis, key assumptions, or notes..."
                                        rows={4}
                                        className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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

                                {isAdvancedMode && (
                                    <div className="mt-6 pt-6 border-t border-border/50 grid grid-cols-2 gap-4 text-center">
                                        <div>
                                            <p className="text-lg font-black">${result.enterpriseValue.toFixed(2)}B</p>
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Enterprise Value</p>
                                        </div>
                                        <div>
                                            <p className="text-lg font-black">${result.equityValue.toFixed(2)}B</p>
                                            <p className="text-xs text-muted-foreground font-bold uppercase">Equity Value</p>
                                        </div>
                                    </div>
                                )}
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
                                                <th className="text-right py-2 font-bold text-muted-foreground">Growth</th>
                                                <th className="text-right py-2 font-bold text-muted-foreground">Cash Flow</th>
                                                <th className="text-right py-2 font-bold text-muted-foreground">Present Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {result.projectedCashFlows.map((cf, index) => (
                                                <tr key={cf.year} className="border-b border-border/50">
                                                    <td className="py-2 font-bold">Year {cf.year}</td>
                                                    <td className="py-2 text-right text-muted-foreground">
                                                        {isAdvancedMode
                                                            ? inputs.customGrowthRates[index]
                                                            : cf.year <= 5 ? inputs.growthRateYear1to5 : inputs.growthRateYear6to10
                                                        }%
                                                    </td>
                                                    <td className="py-2 text-right">${cf.cashFlow.toFixed(2)}B</td>
                                                    <td className="py-2 text-right text-primary font-bold">${cf.presentValue.toFixed(2)}B</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-muted/30">
                                                <td className="py-2 font-black">Terminal Value</td>
                                                <td className="py-2 text-right text-muted-foreground">{inputs.terminalGrowthRate}%</td>
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

            {/* Save Dialog Modal */}
            <AnimatePresence>
                {showSaveDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
                        onClick={() => setShowSaveDialog(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card border border-border rounded-3xl p-6 max-w-md w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-xl font-bold mb-4">Save Analysis</h3>
                            <input
                                type="text"
                                value={saveName}
                                onChange={(e) => setSaveName(e.target.value)}
                                placeholder="Name your analysis (e.g., AAPL Base Case)"
                                className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/30 mb-4"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowSaveDialog(false)}
                                    className="flex-1 px-4 py-3 bg-muted text-muted-foreground rounded-xl font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !saveName.trim()}
                                    className="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    Save
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Saved Analyses Modal */}
            <AnimatePresence>
                {showSavedModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
                        onClick={() => setShowSavedModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-card border border-border rounded-3xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Saved Analyses</h3>
                                <button onClick={() => setShowSavedModal(false)} className="p-2 hover:bg-muted rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>

                            {savedAnalyses.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    <FolderOpen className="mx-auto mb-3" size={40} />
                                    <p>No saved analyses yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {savedAnalyses.map((analysis) => (
                                        <div
                                            key={analysis.id}
                                            className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                                        >
                                            <button
                                                onClick={() => loadAnalysis(analysis)}
                                                className="flex-1 text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="font-black">{analysis.symbol}</span>
                                                    <span className="text-muted-foreground text-sm">{analysis.name}</span>
                                                    {analysis.is_advanced && (
                                                        <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full font-bold">
                                                            ADVANCED
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    Intrinsic: ${analysis.intrinsic_value?.toFixed(2)} ·
                                                    <span className={analysis.upside_percent >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
                                                        {' '}{analysis.upside_percent >= 0 ? '+' : ''}{analysis.upside_percent?.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => deleteAnalysis(analysis.id)}
                                                className="p-2 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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
