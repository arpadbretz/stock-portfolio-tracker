'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
    Star,
    Palette
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface Portfolio {
    id: string;
    name: string;
    description: string;
    color: string;
    is_default?: boolean; // We'll compute this from API response
}

const COLORS = [
    '#10b981', // emerald-500
    '#3b82f6', // blue-500
    '#6366f1', // indigo-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#f43f5e', // rose-500
    '#f97316', // orange-500
    '#eab308', // yellow-500
];

export default function ManagePortfolios() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [defaultPortfolioId, setDefaultPortfolioId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    // Form States
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#10b981'
    });

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchPortfolios();
        }
    }, [user, authLoading, router]);

    const fetchPortfolios = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/portfolios');
            if (response.ok) {
                const data = await response.json();
                setPortfolios(data.portfolios || []);
                setDefaultPortfolioId(data.defaultPortfolioId);
            }
        } catch (error) {
            console.error('Error fetching portfolios:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/portfolios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await fetchPortfolios();
                setShowCreate(false);
                resetForm();
            }
        } catch (error) {
            console.error('Error creating portfolio:', error);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingId) return;

        try {
            const response = await fetch('/api/portfolios', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolioId: editingId,
                    ...formData
                })
            });

            if (response.ok) {
                await fetchPortfolios();
                setEditingId(null);
                resetForm();
            }
        } catch (error) {
            console.error('Error updating portfolio:', error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This will delete ALL trades associated with this portfolio. This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/portfolios?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchPortfolios();
            } else {
                const data = await response.json();
                alert(data.error || 'Failed to delete portfolio');
            }
        } catch (error) {
            console.error('Error deleting portfolio:', error);
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const response = await fetch('/api/portfolios', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolioId: id,
                    setAsDefault: true
                })
            });

            if (response.ok) {
                setDefaultPortfolioId(id);
            }
        } catch (error) {
            console.error('Error setting default portfolio:', error);
        }
    };

    const startEditing = (portfolio: Portfolio) => {
        setEditingId(portfolio.id);
        setFormData({
            name: portfolio.name,
            description: portfolio.description || '',
            color: portfolio.color || '#10b981'
        });
        setShowCreate(false);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            color: '#10b981'
        });
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0f172a]">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Manage Portfolios</h1>
                    </div>
                    {!showCreate && !editingId && (
                        <button
                            onClick={() => {
                                setShowCreate(true);
                                resetForm();
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-emerald-500/20"
                        >
                            <Plus size={20} />
                            <span>Create New</span>
                        </button>
                    )}
                </div>

                {/* Create/Edit Form */}
                {(showCreate || editingId) && (
                    <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 animate-in fade-in slide-in-from-top-4">
                        <h2 className="text-xl font-bold text-white mb-6">
                            {showCreate ? 'Create New Portfolio' : 'Edit Portfolio'}
                        </h2>
                        <form onSubmit={showCreate ? handleCreate : handleUpdate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Portfolio Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="My Growth Portfolio"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Description (Optional)</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        placeholder="Long-term investments..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Color Label</label>
                                    <div className="flex flex-wrap gap-3">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color: c })}
                                                className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${formData.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110' : ''
                                                    }`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
                                >
                                    {showCreate ? 'Create Portfolio' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreate(false);
                                        setEditingId(null);
                                        resetForm();
                                    }}
                                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Portfolios List */}
                <div className="grid gap-4">
                    {portfolios.map((portfolio) => (
                        <div
                            key={portfolio.id}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${portfolio.id === defaultPortfolioId
                                    ? 'bg-slate-800/80 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
                                    : 'bg-slate-800/40 border-slate-700 hover:border-slate-600'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white/50"
                                    style={{ backgroundColor: `${portfolio.color}20` }} // 20% opacity
                                >
                                    <div
                                        className="w-4 h-4 rounded-full"
                                        style={{ backgroundColor: portfolio.color }}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-lg font-bold text-white">{portfolio.name}</h3>
                                        {portfolio.id === defaultPortfolioId && (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                                DEFAULT
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        {portfolio.description || 'No description'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {portfolio.id !== defaultPortfolioId && (
                                    <button
                                        onClick={() => handleSetDefault(portfolio.id)}
                                        className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-yellow-400 transition-colors group"
                                        title="Set as Default"
                                    >
                                        <Star size={20} className="group-hover:fill-current" />
                                    </button>
                                )}
                                <button
                                    onClick={() => startEditing(portfolio)}
                                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-blue-400 transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={20} />
                                </button>
                                {portfolios.length > 1 && (
                                    <button
                                        onClick={() => handleDelete(portfolio.id, portfolio.name)}
                                        className="p-2 rounded-lg text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
