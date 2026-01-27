'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    X,
    DollarSign,
    TrendingUp,
    Receipt,
    RefreshCw,
    PiggyBank,
    Banknote,
} from 'lucide-react';
import { CurrencyCode, CashTransaction, CashTransactionType } from '@/types/portfolio';
import { toast } from 'sonner';

interface CashTransactionModalProps {
    onClose: () => void;
    onSubmit: (transaction: Partial<CashTransaction>) => void;
    currency: CurrencyCode;
    editTransaction?: any; // Add this
}

export function CashTransactionModal({ onClose, onSubmit, currency, editTransaction }: CashTransactionModalProps) {
    const [transactionType, setTransactionType] = useState<CashTransactionType>(
        editTransaction?.action as CashTransactionType || 'DEPOSIT'
    );
    const [amount, setAmount] = useState(editTransaction?.total?.toString() || '');
    const [description, setDescription] = useState(editTransaction?.description || '');
    const [ticker, setTicker] = useState(editTransaction?.ticker === 'CASH' ? '' : editTransaction?.ticker || '');
    const [transactionDate, setTransactionDate] = useState(
        editTransaction?.timestamp ? new Date(editTransaction.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    );
    const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>(editTransaction?.currency || currency);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const transactionTypes: { type: CashTransactionType; label: string; icon: typeof Wallet; color: string }[] = [
        { type: 'DEPOSIT', label: 'Deposit', icon: PiggyBank, color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
        { type: 'WITHDRAWAL', label: 'Withdrawal', icon: Banknote, color: 'bg-rose-500/10 text-rose-500 border-rose-500/30' },
        { type: 'DIVIDEND', label: 'Dividend', icon: DollarSign, color: 'bg-blue-500/10 text-blue-500 border-blue-500/30' },
        { type: 'INTEREST', label: 'Interest', icon: TrendingUp, color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30' },
        { type: 'FEE', label: 'Fee', icon: Receipt, color: 'bg-orange-500/10 text-orange-500 border-orange-500/30' },
        { type: 'TAX', label: 'Tax', icon: Receipt, color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
        { type: 'ADJUSTMENT', label: 'Adjustment', icon: RefreshCw, color: 'bg-purple-500/10 text-purple-500 border-purple-500/30' },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit({
                transaction_type: transactionType,
                amount: parseFloat(amount),
                currency: selectedCurrency,
                ticker: ticker || undefined,
                description: description || undefined,
                transaction_date: new Date(transactionDate).toISOString(),
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const showTickerField = ['DIVIDEND', 'INTEREST'].includes(transactionType);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-black">Add Cash Transaction</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {/* Transaction Type */}
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                            Transaction Type
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {transactionTypes.slice(0, 4).map(({ type, label, icon: Icon, color }) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setTransactionType(type)}
                                    className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${transactionType === type
                                        ? color + ' border-current shadow-lg'
                                        : 'border-border/50 hover:border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Icon size={16} />
                                    <span className="text-[10px] font-bold">{label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {transactionTypes.slice(4).map(({ type, label, icon: Icon, color }) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setTransactionType(type)}
                                    className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${transactionType === type
                                        ? color + ' border-current shadow-lg'
                                        : 'border-border/50 hover:border-border text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <Icon size={16} />
                                    <span className="text-[10px] font-bold">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount & Currency */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                                Amount
                            </label>
                            <div className="relative">
                                <DollarSign size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/30 border border-border/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-lg font-bold"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                                Currency
                            </label>
                            <select
                                value={selectedCurrency}
                                onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
                                className="w-full px-3 py-3 rounded-xl bg-muted/30 border border-border/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                            >
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                                <option value="HUF">HUF</option>
                            </select>
                        </div>
                    </div>

                    {/* Ticker (for dividends/interest) */}
                    {showTickerField && (
                        <div>
                            <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                                Stock Ticker (Optional)
                            </label>
                            <input
                                type="text"
                                value={ticker}
                                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                placeholder="e.g., AAPL"
                                className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                            />
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                            Date
                        </label>
                        <input
                            type="date"
                            value={transactionDate}
                            onChange={(e) => setTransactionDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                            Description (Optional)
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Monthly deposit"
                            className="w-full px-4 py-3 rounded-xl bg-muted/30 border border-border/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 font-bold"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting || !amount}
                        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-black text-sm uppercase tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? 'Adding...' : 'Add Transaction'}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

export default CashTransactionModal;
