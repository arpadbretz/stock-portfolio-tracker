'use client';

import { useState, useEffect } from 'react';
import { Target, Loader2, TrendingUp, Calculator, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/shared/Modal';

interface QuickDCFModalProps {
    isOpen: boolean;
    onClose: () => void;
    symbol: string;
    currentPrice: number;
}

export default function QuickDCFModal({
    isOpen,
    onClose,
    symbol,
    currentPrice
}: QuickDCFModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [fcf, setFcf] = useState<number>(0);
    const [shares, setShares] = useState<number>(0);
    const [growth, setGrowth] = useState<number>(15);
    const [discount, setDiscount] = useState<number>(10);
    const [result, setResult] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, symbol]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/stock/${symbol}`);
            const response = await res.json();

            // Handle new API format: { success: true, data: { ... } }
            const data = response.success ? response.data : response;

            // Get FCF from cash flow statement if available, otherwise use financialData field
            const latestCashFlow = data.cashFlow && data.cashFlow.length > 0
                ? data.cashFlow[data.cashFlow.length - 1]
                : null;
            const freeCashFlow = latestCashFlow?.freeCashflow || data.freeCashflow || 0;
            setFcf(freeCashFlow);

            // Get shares outstanding
            setShares(data.sharesOutstanding || (data.marketCap && data.price ? data.marketCap / data.price : 0));

            // Estimate growth rate from historical revenue
            if (data.incomeStatement && data.incomeStatement.length >= 2) {
                const statements = data.incomeStatement;
                const oldestRevenue = statements[0]?.totalRevenue;
                const latestRevenue = statements[statements.length - 1]?.totalRevenue;
                if (oldestRevenue && latestRevenue && oldestRevenue > 0) {
                    const years = statements.length - 1;
                    const cagr = (Math.pow(latestRevenue / oldestRevenue, 1 / years) - 1) * 100;
                    setGrowth(Math.min(Math.max(cagr, 5), 30)); // Clamp between 5-30%
                }
            }

            if (!freeCashFlow) {
                toast.error("Low data for DCF", { description: "We couldn't find Free Cash Flow for this stock." });
            }
        } catch (err) {
            console.error('DCF data fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const calculateDCF = () => {
        if (!fcf || !shares) return;

        // Simplified DCF logic
        const growthRate = growth / 100;
        const discountRate = discount / 100;
        const terminalGrowth = 0.025; // 2.5% perpetual

        let totalPV = 0;
        let runningFCF = fcf;

        // 10 year projection
        for (let i = 1; i <= 10; i++) {
            runningFCF *= (1 + growthRate);
            const pv = runningFCF / Math.pow(1 + discountRate, i);
            totalPV += pv;
        }

        // Terminal value
        const terminalValue = (runningFCF * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
        const terminalPV = terminalValue / Math.pow(1 + discountRate, 10);

        const enterpriseValue = totalPV + terminalPV;
        const intrinsicValue = enterpriseValue / shares;

        setResult(intrinsicValue);
    };

    useEffect(() => {
        if (fcf && shares) calculateDCF();
    }, [fcf, shares, growth, discount]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Quick Valuation: ${symbol}`}
            maxWidth="max-w-xl"
        >
            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Crunching numbers...</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Visual Result */}
                    <div className={`p-8 rounded-[32px] border text-center transition-all ${result && result > currentPrice ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-rose-500/5 border-rose-500/30'}`}>
                        <div className="mb-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Intrinsic Value</span>
                        </div>
                        <div className="text-6xl font-black tracking-tighter mb-4">
                            {result ? `$${result.toFixed(2)}` : 'N/A'}
                        </div>
                        {result && (
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm ${result > currentPrice ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                {result > currentPrice ? '+' : ''}{((result - currentPrice) / currentPrice * 100).toFixed(1)}% Upside
                            </div>
                        )}
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Growth (Next 10y)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={growth}
                                    onChange={(e) => setGrowth(parseFloat(e.target.value))}
                                    className="w-full pl-6 pr-12 py-4 bg-muted border border-border rounded-2xl font-black text-xl"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-muted-foreground">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Discount Rate (WACC)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={discount}
                                    onChange={(e) => setDiscount(parseFloat(e.target.value))}
                                    className="w-full pl-6 pr-12 py-4 bg-muted border border-border rounded-2xl font-black text-xl"
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-muted-foreground">%</span>
                            </div>
                        </div>
                    </div>

                    {!result && (
                        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500 text-xs font-bold">
                            Missing financial data for an automated projection.
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-card border border-border text-foreground rounded-[24px] font-black text-lg hover:bg-muted transition-all"
                        >
                            Close Preview
                        </button>
                        <a
                            href={`/dashboard/dcf?symbol=${symbol}`}
                            className="w-full py-3 text-primary text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:gap-3 transition-all"
                        >
                            Go to Advanced DCF <ArrowRight size={12} />
                        </a>
                    </div>
                </div>
            )}
        </Modal>
    );
}
