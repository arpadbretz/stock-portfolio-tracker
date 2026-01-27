'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Wallet,
    Plus,
    Minus,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    TrendingUp,
    Clock,
    X,
    ChevronDown,
    Banknote,
    PiggyBank,
    Receipt,
    RefreshCw,
} from 'lucide-react';
import { formatCurrency, convertCurrency } from '@/lib/portfolio';
import { CurrencyCode, CashTransaction, CashTransactionType, CashBalanceData } from '@/types/portfolio';
import { toast } from 'sonner';

import { CashTransactionModal } from './CashTransactionModal';

// ============ CASH BALANCE WIDGET ============
interface CashBalanceWidgetProps {
    portfolioId?: string;
    currency?: CurrencyCode;
    exchangeRates?: Record<string, number>;
    isStealthMode?: boolean;
    expanded?: boolean;
    onBalanceChange?: (balance: number) => void;
}

export function CashBalanceWidget({
    portfolioId,
    currency = 'USD',
    exchangeRates = { USD: 1 },
    isStealthMode = false,
    expanded = false,
    onBalanceChange,
}: CashBalanceWidgetProps) {
    const [data, setData] = useState<CashBalanceData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    const fetchCashData = useCallback(async () => {
        if (!portfolioId) return;

        try {
            const res = await fetch(`/api/cash?portfolio_id=${portfolioId}`);
            const result = await res.json();

            if (result.success) {
                setData(result.data);
                onBalanceChange?.(result.data.cashBalance);
            }
        } catch (error) {
            console.error('Failed to fetch cash data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [portfolioId, onBalanceChange]);

    useEffect(() => {
        fetchCashData();
    }, [fetchCashData]);

    const handleAddTransaction = async (transaction: Partial<CashTransaction>) => {
        try {
            const res = await fetch('/api/cash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...transaction,
                    portfolio_id: portfolioId,
                }),
            });

            const result = await res.json();

            if (result.success) {
                toast.success('Transaction added successfully');
                fetchCashData();
                setShowAddModal(false);
            } else {
                toast.error(result.error || 'Failed to add transaction');
            }
        } catch (error) {
            toast.error('Failed to add transaction');
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                <div className="h-20 bg-muted/50 rounded-xl animate-pulse" />
                <div className="grid grid-cols-2 gap-2">
                    <div className="h-16 bg-muted/50 rounded-xl animate-pulse" />
                    <div className="h-16 bg-muted/50 rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    if (!portfolioId) {
        return (
            <div className="text-center py-8">
                <Wallet size={32} className="mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No portfolio selected</p>
            </div>
        );
    }

    const cashBalance = data?.cashBalance || 0;
    const totalDeposits = data?.totalDeposits || 0;
    const totalWithdrawals = data?.totalWithdrawals || 0;
    const totalDividends = data?.totalDividends || 0;

    return (
        <div className="space-y-4">
            {/* Main Balance Card */}
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Wallet size={20} className="text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cash Balance</p>
                            <p className={`text-2xl font-black ${isStealthMode ? 'blur-stealth' : ''}`}>
                                {formatCurrency(convertCurrency(cashBalance, currency, exchangeRates), currency)}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="p-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <Plus size={20} />
                    </button>
                </div>

                {/* Currency Breakdown */}
                {data?.cashBalances && Object.values(data.cashBalances).some(b => b !== 0) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(data.cashBalances).map(([curr, bal]) => (
                            bal !== 0 && (
                                <div key={curr} className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/10 text-[10px] font-bold">
                                    <span className="text-muted-foreground mr-1">{curr}:</span>
                                    <span className={isStealthMode ? 'blur-stealth' : ''}>
                                        {formatCurrency(bal, curr as CurrencyCode)}
                                    </span>
                                </div>
                            )
                        ))}
                    </div>
                )}

                {/* Quick Stats */}
                {expanded && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                        <div className="p-2 rounded-xl bg-background/50 border border-border/30">
                            <div className="flex items-center gap-1 text-emerald-500 mb-1">
                                <ArrowUpRight size={12} />
                                <span className="text-[10px] font-bold uppercase">Deposits</span>
                            </div>
                            <p className={`text-sm font-black ${isStealthMode ? 'blur-stealth' : ''}`}>
                                {formatCurrency(convertCurrency(totalDeposits, currency, exchangeRates), currency)}
                            </p>
                        </div>
                        <div className="p-2 rounded-xl bg-background/50 border border-border/30">
                            <div className="flex items-center gap-1 text-rose-500 mb-1">
                                <ArrowDownRight size={12} />
                                <span className="text-[10px] font-bold uppercase">Withdrawals</span>
                            </div>
                            <p className={`text-sm font-black ${isStealthMode ? 'blur-stealth' : ''}`}>
                                {formatCurrency(convertCurrency(totalWithdrawals, currency, exchangeRates), currency)}
                            </p>
                        </div>
                        <div className="p-2 rounded-xl bg-background/50 border border-border/30">
                            <div className="flex items-center gap-1 text-blue-500 mb-1">
                                <DollarSign size={12} />
                                <span className="text-[10px] font-bold uppercase">Dividends</span>
                            </div>
                            <p className={`text-sm font-black ${isStealthMode ? 'blur-stealth' : ''}`}>
                                {formatCurrency(convertCurrency(totalDividends, currency, exchangeRates), currency)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Recent Transactions */}
            {expanded && data?.transactions && data.transactions.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="flex items-center justify-between w-full p-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <span className="flex items-center gap-2">
                            <Clock size={14} />
                            Recent Transactions
                        </span>
                        <ChevronDown size={14} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showHistory && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="space-y-2 pt-2">
                                    {data.transactions.slice(0, 5).map((tx) => (
                                        <CashTransactionRow
                                            key={tx.id}
                                            transaction={tx}
                                            currency={currency}
                                            exchangeRates={exchangeRates}
                                            isStealthMode={isStealthMode}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* Add Transaction Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <CashTransactionModal
                        onClose={() => setShowAddModal(false)}
                        onSubmit={handleAddTransaction}
                        currency={currency}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ============ TRANSACTION ROW ============
interface TransactionRowProps {
    transaction: CashTransaction;
    currency: CurrencyCode;
    exchangeRates: Record<string, number>;
    isStealthMode?: boolean;
}

function CashTransactionRow({ transaction, currency, exchangeRates, isStealthMode }: TransactionRowProps) {
    const { transaction_type, amount, description, transaction_date, ticker } = transaction;

    const getTypeConfig = (type: CashTransactionType) => {
        switch (type) {
            case 'DEPOSIT':
                return { icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Deposit' };
            case 'WITHDRAWAL':
                return { icon: ArrowDownRight, color: 'text-rose-500', bg: 'bg-rose-500/10', label: 'Withdrawal' };
            case 'DIVIDEND':
                return { icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Dividend' };
            case 'INTEREST':
                return { icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-500/10', label: 'Interest' };
            case 'FEE':
                return { icon: Receipt, color: 'text-orange-500', bg: 'bg-orange-500/10', label: 'Fee' };
            case 'TAX':
                return { icon: Receipt, color: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Tax' };
            case 'ADJUSTMENT':
                return { icon: RefreshCw, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Adjustment' };
            default:
                return { icon: Wallet, color: 'text-muted-foreground', bg: 'bg-muted/50', label: type };
        }
    };

    const config = getTypeConfig(transaction_type);
    const Icon = config.icon;
    const isPositive = ['DEPOSIT', 'DIVIDEND', 'INTEREST'].includes(transaction_type) ||
        (transaction_type === 'ADJUSTMENT' && amount > 0);

    return (
        <div className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/30">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                    <Icon size={14} className={config.color} />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{config.label}</span>
                        {ticker && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-muted/50 text-muted-foreground">
                                {ticker}
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {description || new Date(transaction_date).toLocaleDateString()}
                    </p>
                </div>
            </div>
            <div className={`text-sm font-black ${isStealthMode ? 'blur-stealth' : ''} ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {isPositive ? '+' : ''}{formatCurrency(convertCurrency(Math.abs(amount), currency, exchangeRates), currency)}
            </div>
        </div>
    );
}

export default CashBalanceWidget;
