'use client';

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ChevronLeft,
    Search,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Wallet,
    History,
    Edit3,
    Trash2,
    Save,
    X,
    TrendingUp,
    TrendingDown,
    Plus,
    Activity,
    CreditCard
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useUserPreferences } from '@/components/providers/UserPreferencesProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency, formatNumber, formatPercentage, convertCurrency } from '@/lib/portfolio';
import { CurrencyCode, Holding, Trade } from '@/types/portfolio';
import TradeHistory, { UnifiedTransaction } from '@/components/TradeHistory';
import AddTradeForm from '@/components/AddTradeForm';
import { CashTransactionModal } from '@/components/CashTransactionModal';
import { toast } from 'sonner';

function EditPositionsContent() {
    const { user, isLoading: authLoading } = useAuth();
    const { preferredCurrency: currency, exchangeRates } = useUserPreferences();
    const router = useRouter();
    const searchParams = useSearchParams();
    const portfolioIdFromUrl = searchParams.get('id');

    const [portfolioId, setPortfolioId] = useState<string | null>(portfolioIdFromUrl);
    const [holdings, setHoldings] = useState<Holding[]>([]);
    const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
    const [cashBalances, setCashBalances] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);

    const [editingTrade, setEditingTrade] = useState<any>(null);
    const [currentHolding, setCurrentHolding] = useState<Holding | null>(null);
    const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
    const [isCashModalOpen, setIsCashModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'positions' | 'ledger' | 'cash'>('positions');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = useCallback(async () => {
        if (!portfolioId) return;
        setIsLoading(true);
        try {
            const [portRes, transRes] = await Promise.all([
                fetch(`/api/portfolio?id=${portfolioId}`),
                fetch(`/api/portfolio/transactions?portfolioId=${portfolioId}&limit=500`)
            ]);

            const portData = await portRes.json();
            const transData = await transRes.json();

            if (portData.success) {
                setHoldings(portData.data.summary.holdings);
                setCashBalances(portData.data.summary.cashBalances || {});
            }
            if (transData.success) {
                setTransactions(transData.data);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load portfolio data');
        } finally {
            setIsLoading(false);
        }
    }, [portfolioId]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user && portfolioId) {
            fetchData();
        } else if (user && !portfolioId) {
            // Find default portfolio
            fetch('/api/portfolios')
                .then(res => res.json())
                .then(data => {
                    if (data.portfolios && data.portfolios.length > 0) {
                        setPortfolioId(data.portfolios[0].id);
                    }
                });
        }
    }, [user, authLoading, router, portfolioId, fetchData]);

    const handleSellHolding = (holding: Holding) => {
        setCurrentHolding(holding);
        setEditingTrade({
            ticker: holding.ticker,
            action: 'SELL',
            quantity: holding.shares,
            pricePerShare: holding.currentPrice,
            currency: 'USD',
            adjustCash: true
        });
        setIsAddTradeOpen(true);
    };

    const handleCashTransaction = async (tx: any) => {
        try {
            const res = await fetch('/api/cash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...tx,
                    portfolio_id: portfolioId
                })
            });
            const result = await res.json();
            if (result.success) {
                setIsCashModalOpen(false);
                fetchData();
                toast.success('Cash balance updated');
            }
        } catch (err) {
            console.error('Failed to add cash tx:', err);
            toast.error('Failed to update cash balance');
        }
    };

    if (isLoading && holdings.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const filteredHoldings = holdings.filter(h =>
        h.ticker.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => router.back()}
                            className="p-3 hover:bg-muted rounded-2xl transition-all group"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-black tracking-tight">Portfolio Manager</h1>
                            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">Edit Positions & Ledger</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center bg-muted rounded-2xl p-1 border border-border">
                            {(['positions', 'cash', 'ledger'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                setEditingTrade(null);
                                setIsAddTradeOpen(true);
                            }}
                            className="p-3 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                {/* Search Bar (Only for positions and ledger) */}
                {activeTab !== 'cash' && (
                    <div className="relative mb-10">
                        <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by ticker or action..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-card border border-border rounded-[28px] pl-14 pr-6 py-5 text-lg font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
                        />
                    </div>
                )}

                <AnimatePresence mode="wait">
                    {activeTab === 'positions' && (
                        <motion.div
                            key="positions"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        >
                            {filteredHoldings.map((holding) => (
                                <div key={holding.ticker} className="bg-card border border-border rounded-[32px] p-6 group hover:border-primary/30 transition-all shadow-sm relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-black text-sm">
                                                {holding.ticker}
                                            </div>
                                            <div>
                                                <div className="font-black text-lg">{holding.ticker}</div>
                                                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Active Position</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-xl">{formatCurrency(convertCurrency(holding.marketValue, currency, exchangeRates), currency)}</div>
                                            <div className={`text-[10px] font-black uppercase ${holding.unrealizedGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {formatPercentage(holding.unrealizedGainPercent)} Return
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-muted/50 p-3 rounded-2xl">
                                            <div className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-1">Quantity</div>
                                            <div className="font-bold text-sm">{formatNumber(holding.shares, 3)}</div>
                                        </div>
                                        <div className="bg-muted/50 p-3 rounded-2xl">
                                            <div className="text-[8px] text-muted-foreground font-black uppercase tracking-widest mb-1">Avg Cost</div>
                                            <div className="font-bold text-sm truncate">{formatCurrency(convertCurrency(holding.avgCostBasis, currency, exchangeRates), currency)}</div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setSearchTerm(holding.ticker);
                                                setActiveTab('ledger');
                                            }}
                                            className="flex-1 py-3 bg-muted hover:bg-primary hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            <History size={14} />
                                            History
                                        </button>
                                        <button
                                            onClick={() => handleSellHolding(holding)}
                                            className="flex-1 py-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                        >
                                            <DollarSign size={14} />
                                            Sell Position
                                        </button>
                                    </div>

                                    <Activity size={80} className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12" />
                                </div>
                            ))}

                            {filteredHoldings.length === 0 && (
                                <div className="col-span-full py-20 text-center">
                                    <div className="w-20 h-20 bg-muted rounded-[32px] flex items-center justify-center mx-auto mb-6">
                                        <Activity size={32} className="text-muted-foreground" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight mb-2">No Matching Positions</h2>
                                    <p className="text-muted-foreground text-xs font-black uppercase tracking-widest">Adjust your search or add new trades</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'cash' && (
                        <motion.div
                            key="cash"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="max-w-3xl mx-auto space-y-6"
                        >
                            {Object.entries(cashBalances).map(([c, balance]) => (
                                <div key={c} className="bg-card border border-border rounded-[40px] p-8 flex items-center justify-between group hover:border-emerald-500/30 transition-all shadow-sm overflow-hidden relative">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Wallet size={32} />
                                        </div>
                                        <div>
                                            <div className="text-3xl font-black tracking-tighter">{formatCurrency(balance, c as any)}</div>
                                            <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{c} Liquid Capital</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsCashModalOpen(true)}
                                        className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Adjust Balance
                                    </button>
                                    <TrendingUp size={120} className="absolute -right-6 -bottom-6 opacity-[0.03] text-emerald-500 rotate-12" />
                                </div>
                            ))}

                            {Object.keys(cashBalances).length === 0 && (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-muted rounded-[32px] flex items-center justify-center mx-auto mb-6">
                                        <CreditCard size={32} className="text-muted-foreground" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight mb-2">No Cash Balances Found</h2>
                                    <button
                                        onClick={() => setIsCashModalOpen(true)}
                                        className="mt-4 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all"
                                    >
                                        Initialize Cash Reservoir
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {activeTab === 'ledger' && (
                        <motion.div
                            key="ledger"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <TradeHistory
                                transactions={transactions}
                                currency={currency}
                                exchangeRates={exchangeRates}
                                onTradeDeleted={fetchData}
                                onTradeEdit={(trade) => {
                                    if (trade.type === 'stock') {
                                        const holding = holdings.find(h => h.ticker === trade.ticker);
                                        setCurrentHolding(holding || null);
                                    }
                                    setEditingTrade(trade);
                                    setIsAddTradeOpen(true);
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Modals */}
            <AnimatePresence>
                {isAddTradeOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddTradeOpen(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-card border border-border rounded-[40px] shadow-2xl p-2"
                        >
                            <div className="absolute top-6 right-6 z-10">
                                <button onClick={() => setIsAddTradeOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6">
                                <AddTradeForm
                                    portfolioId={portfolioId || ''}
                                    editTrade={editingTrade}
                                    avgCostBasis={currentHolding?.avgCostBasis}
                                    onTradeAdded={() => {
                                        setIsAddTradeOpen(false);
                                        setCurrentHolding(null);
                                        fetchData();
                                    }}
                                    onCancel={() => {
                                        setIsAddTradeOpen(false);
                                        setCurrentHolding(null);
                                    }}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isCashModalOpen && (
                    <CashTransactionModal
                        onClose={() => setIsCashModalOpen(false)}
                        onSubmit={handleCashTransaction}
                        currency={currency}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

export default function EditPositionsPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <EditPositionsContent />
        </Suspense>
    );
}
