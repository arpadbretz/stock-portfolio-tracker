'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit2,
    Star,
    Share2,
    Globe,
    Lock,
    Copy,
    RefreshCw,
    ExternalLink,
    Check
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

interface Portfolio {
    id: string;
    name: string;
    description: string;
    color: string;
    is_public: boolean;
    share_token: string;
    is_default?: boolean;
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

    // Sharing Modal State
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
    const [copied, setCopied] = useState(false);

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

    const handleToggleShare = async (portfolio: Portfolio) => {
        try {
            const newIsPublic = !portfolio.is_public;
            const response = await fetch('/api/portfolios', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolioId: portfolio.id,
                    isPublic: newIsPublic
                })
            });

            if (response.ok) {
                // Update local state directly for speed
                const updated = { ...portfolio, is_public: newIsPublic };
                setPortfolios(portfolios.map(p => p.id === portfolio.id ? updated : p));
                setSelectedPortfolio(updated);
            }
        } catch (error) {
            console.error('Error toggling share:', error);
        }
    };

    const handleRegenerateToken = async (portfolio: Portfolio) => {
        if (!confirm('This will invalidate the previous share link. Anyone with the old link will lose access. Continue?')) {
            return;
        }

        try {
            const response = await fetch('/api/portfolios', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolioId: portfolio.id,
                    regenerateToken: true
                })
            });

            if (response.ok) {
                // We need to fetch full list to get the new token (api returns success: true, not the object usually)
                await fetchPortfolios();
                // We'd need to re-select the portfolio to update the modal
                // Since fetchPortfolios is async and we need to find the updated one:
                // For now, let's close modal or re-fetch.
                setShareModalOpen(false); // Close to be safe, user can reopen
            }
        } catch (error) {
            console.error('Error regenerating token:', error);
        }
    };

    // Helper to get share link
    const getShareLink = (token: string) => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/shared/${token}`;
        }
        return '';
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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

    const openShareModal = (portfolio: Portfolio) => {
        setSelectedPortfolio(portfolio);
        setShareModalOpen(true);
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
                                        {portfolio.is_public && (
                                            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                                <Globe size={10} /> PUBLIC
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        {portfolio.description || 'No description'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => openShareModal(portfolio)}
                                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-blue-400 transition-colors"
                                    title="Share Settings"
                                >
                                    <Share2 size={20} />
                                </button>
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
                                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-emerald-400 transition-colors"
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

            {/* Share Modal */}
            {shareModalOpen && selectedPortfolio && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in-95">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Share2 size={24} className="text-emerald-400" />
                                Share Portfolio
                            </h3>
                            <button
                                onClick={() => setShareModalOpen(false)}
                                className="p-1 rounded-lg hover:bg-slate-700 text-slate-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Toggle */}
                            <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${selectedPortfolio.is_public ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                                        {selectedPortfolio.is_public ? <Globe size={24} /> : <Lock size={24} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">
                                            {selectedPortfolio.is_public ? 'Publicly Accessible' : 'Private Portfolio'}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {selectedPortfolio.is_public ? 'Anyone with the link can view' : 'Only you can see this'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleToggleShare(selectedPortfolio)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${selectedPortfolio.is_public ? 'bg-emerald-500' : 'bg-slate-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${selectedPortfolio.is_public ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Link Section */}
                            {selectedPortfolio.is_public && (
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-400">Share Link</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={getShareLink(selectedPortfolio.share_token)}
                                            className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-slate-300 text-sm focus:outline-none"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(getShareLink(selectedPortfolio.share_token))}
                                            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
                                            title="Copy Link"
                                        >
                                            {copied ? <Check size={20} className="text-emerald-400" /> : <Copy size={20} />}
                                        </button>
                                        <a
                                            href={getShareLink(selectedPortfolio.share_token)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors border border-slate-600"
                                            title="Open Link"
                                        >
                                            <ExternalLink size={20} />
                                        </a>
                                    </div>

                                    <div className="pt-4 border-t border-slate-700">
                                        <button
                                            onClick={() => handleRegenerateToken(selectedPortfolio)}
                                            className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1 transition-colors"
                                        >
                                            <RefreshCw size={12} />
                                            Regenerate Share Link (Revoke old links)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
