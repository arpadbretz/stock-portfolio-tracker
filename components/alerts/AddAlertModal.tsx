'use client';

import { useState } from 'react';
import { Bell, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/shared/Modal';

interface AddAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    symbol: string;
    currentPrice: number;
    onSuccess?: () => void;
}

export default function AddAlertModal({
    isOpen,
    onClose,
    symbol,
    currentPrice,
    onSuccess
}: AddAlertModalProps) {
    const [targetPrice, setTargetPrice] = useState(currentPrice.toString());
    const [condition, setCondition] = useState<'above' | 'below'>(
        parseFloat(targetPrice) > currentPrice ? 'above' : 'below'
    );
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!targetPrice) return;

        setIsCreating(true);

        try {
            const res = await fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    symbol: symbol.toUpperCase(),
                    target_price: parseFloat(targetPrice),
                    condition: condition,
                }),
            });

            const data = await res.json();

            if (data.success) {
                toast.success('Alert created!', {
                    description: `You'll be notified when ${symbol.toUpperCase()} goes ${condition} $${targetPrice}`
                });
                if (onSuccess) onSuccess();
                onClose();
            } else {
                toast.error('Failed to create alert', { description: data.error });
            }
        } catch (err) {
            toast.error('Failed to create alert');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Set Price Alert for ${symbol}`}
        >
            <form onSubmit={handleCreateAlert} className="space-y-6">
                <div className="p-4 bg-muted rounded-2xl border border-border flex items-center justify-between">
                    <div>
                        <p className="text-xs text-muted-foreground font-black uppercase tracking-widest">Current Price</p>
                        <p className="text-2xl font-black">${currentPrice.toFixed(2)}</p>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-xl">
                        <Bell className="text-orange-500" size={24} />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                            Notify me when price goes...
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setCondition('above')}
                                className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-bold transition-all border ${condition === 'above'
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-lg shadow-emerald-500/10'
                                    : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                <TrendingUp size={18} />
                                Above
                            </button>
                            <button
                                type="button"
                                onClick={() => setCondition('below')}
                                className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-bold transition-all border ${condition === 'below'
                                    ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-lg shadow-rose-500/10'
                                    : 'bg-muted border-border text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                <TrendingDown size={18} />
                                Below
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">
                            Target Price ($)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={targetPrice}
                            onChange={(e) => {
                                setTargetPrice(e.target.value);
                                // Auto-select condition based on price relation
                                const newPrice = parseFloat(e.target.value);
                                if (!isNaN(newPrice)) {
                                    setCondition(newPrice > currentPrice ? 'above' : 'below');
                                }
                            }}
                            className="w-full px-6 py-4 bg-muted border border-border rounded-2xl font-black text-xl focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                            placeholder="0.00"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isCreating}
                    className="w-full py-5 bg-primary text-primary-foreground rounded-[24px] font-black text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-primary/20 transition-all disabled:opacity-50"
                >
                    {isCreating ? (
                        <>
                            <Loader2 size={24} className="animate-spin" />
                            Creating Alert...
                        </>
                    ) : (
                        <>
                            Create Alert
                        </>
                    )}
                </button>
            </form>
        </Modal>
    );
}
