import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Edit2, X } from 'lucide-react';
import { Trade } from '@/types/portfolio';

const tradeSchema = z.object({
    ticker: z.string().min(1, 'Ticker is required').max(10, 'Ticker too long'),
    action: z.enum(['BUY', 'SELL']),
    quantity: z.number().positive('Quantity must be positive'),
    pricePerShare: z.number().positive('Price must be positive'),
    fees: z.number().min(0, 'Fees cannot be negative'),
    notes: z.string().optional(),
});

type TradeFormValues = z.infer<typeof tradeSchema>;

interface AddTradeFormProps {
    onTradeAdded: () => void;
    editTrade?: Trade | null;
    onCancel?: () => void;
}

export default function AddTradeForm({ onTradeAdded, editTrade, onCancel }: AddTradeFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const isEditing = !!editTrade;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TradeFormValues>({
        resolver: zodResolver(tradeSchema),
        defaultValues: {
            ticker: '',
            action: 'BUY',
            quantity: undefined,
            pricePerShare: undefined,
            fees: 0,
            notes: '',
        },
    });

    useEffect(() => {
        if (editTrade) {
            reset({
                ticker: editTrade.ticker,
                action: editTrade.action,
                quantity: editTrade.quantity,
                pricePerShare: editTrade.pricePerShare,
                fees: editTrade.fees,
                notes: editTrade.notes || '',
            });
        }
    }, [editTrade, reset]);

    const onSubmit = async (data: TradeFormValues) => {
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const url = isEditing ? `/api/trades/${editTrade.id}` : '/api/trades';
            const method = isEditing ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || `Failed to ${isEditing ? 'update' : 'add'} trade`);
            }

            setSuccess(true);
            reset();
            onTradeAdded();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    {isEditing ? (
                        <Edit2 className="w-5 h-5 text-blue-400" />
                    ) : (
                        <Plus className="w-5 h-5 text-emerald-400" />
                    )}
                    {isEditing ? 'Edit Trade' : 'Add Trade'}
                </h2>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Ticker */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Ticker Symbol
                        </label>
                        <input
                            {...register('ticker')}
                            type="text"
                            placeholder="AAPL"
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all uppercase"
                            disabled={isLoading}
                        />
                        {errors.ticker && (
                            <p className="text-red-400 text-xs mt-1">{errors.ticker.message}</p>
                        )}
                    </div>

                    {/* Action */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Action
                        </label>
                        <select
                            {...register('action')}
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                        >
                            <option value="BUY">Buy</option>
                            <option value="SELL">Sell</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    {/* Quantity */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Quantity
                        </label>
                        <input
                            {...register('quantity', { valueAsNumber: true })}
                            type="number"
                            step="0.001"
                            placeholder="10"
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                        />
                        {errors.quantity && (
                            <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>
                        )}
                    </div>

                    {/* Price Per Share */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Price/Share ($)
                        </label>
                        <input
                            {...register('pricePerShare', { valueAsNumber: true })}
                            type="number"
                            step="0.01"
                            placeholder="150.00"
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                        />
                        {errors.pricePerShare && (
                            <p className="text-red-400 text-xs mt-1">{errors.pricePerShare.message}</p>
                        )}
                    </div>

                    {/* Fees */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">
                            Fees ($)
                        </label>
                        <input
                            {...register('fees', { valueAsNumber: true })}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                            disabled={isLoading}
                        />
                    </div>
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                        Notes (optional)
                    </label>
                    <input
                        {...register('notes')}
                        type="text"
                        placeholder="e.g., Q1 investment"
                        className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        disabled={isLoading}
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="bg-emerald-500/10 border border-emerald-500/50 rounded-lg px-4 py-3 text-emerald-400 text-sm">
                        Trade {isEditing ? 'updated' : 'added'} successfully!
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-3">
                    {isEditing && onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-all duration-200"
                        >
                            Cancel
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`flex-[2] py-3 px-4 bg-gradient-to-r ${isEditing ? 'from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/25' : 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-emerald-500/25'
                            } text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {isEditing ? 'Updating...' : 'Adding Trade...'}
                            </>
                        ) : (
                            <>
                                {isEditing ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                {isEditing ? 'Update Trade' : 'Add Trade'}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

