'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
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
    Check,
    X,
    Briefcase,
    LayoutGrid
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';

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
    const { user, isLoading: authLoading } = useAuth();
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
                await fetchPortfolios();
                setShareModalOpen(false);
            }
        } catch (error) {
            console.error('Error regenerating token:', error);
        }
    };

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
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-10">
            <div className="max-w-5xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-primary mb-1">
                            <Briefcase size={18} />
                            <span className="text-sm font-bold tracking-wider uppercase">Vault Management</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Your Portfolios</h1>
                    </div>
                    {!showCreate && !editingId && (
                        <button
                            onClick={() => {
                                setShowCreate(true);
                                resetForm();
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            <Plus size={20} />
                            <span>Create New Portfolio</span>
                        </button>
                    )}
                </header>

                <AnimatePresence>
                    {(showCreate || editingId) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -20 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -20 }}
                            className="mb-12 overflow-hidden"
                        >
                            <div className="bg-card border-2 border-primary/30 rounded-[40px] p-8 shadow-2xl relative">
                                <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                    {showCreate ? 'Identity & Configuration' : 'Update Portfolio'}
                                </h2>
                                <form onSubmit={showCreate ? handleCreate : handleUpdate} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-3 block px-1">Display Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-5 py-4 bg-muted border border-border rounded-2xl text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                placeholder="Equity Growth Alpha"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-3 block px-1">Visual Label</label>
                                            <div className="flex flex-wrap gap-4 p-4 bg-muted border border-border rounded-2xl">
                                                {COLORS.map((c) => (
                                                    <button
                                                        key={c}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, color: c })}
                                                        className={`w-8 h-8 rounded-full transition-all hover:scale-125 ${formData.color === c ? 'ring-4 ring-primary/20 scale-125' : 'opacity-60'}`}
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-3 block px-1">Strategic Objective (Optional)</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-5 py-4 bg-muted border border-border rounded-2xl text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                                            placeholder="Focused on high-growth tech stocks and emerging markets..."
                                        />
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="submit"
                                            className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                        >
                                            {showCreate ? 'Initialize Portfolio' : 'Commit Changes'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreate(false);
                                                setEditingId(null);
                                                resetForm();
                                            }}
                                            className="px-8 py-4 bg-muted text-muted-foreground border border-border rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-card hover:text-foreground transition-all"
                                        >
                                            Discard
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {portfolios.map((portfolio) => (
                        <motion.div
                            key={portfolio.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ y: -5 }}
                            className={`group relative p-8 rounded-[40px] border transition-all ${portfolio.id === defaultPortfolioId
                                ? 'bg-card border-primary/30 shadow-2xl shadow-primary/5'
                                : 'bg-card border-border shadow-sm'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div
                                        className="w-16 h-16 rounded-3xl flex items-center justify-center shrink-0 shadow-inner"
                                        style={{ backgroundColor: `${portfolio.color}15` }}
                                    >
                                        <div
                                            className="w-6 h-6 rounded-xl animate-pulse"
                                            style={{ backgroundColor: portfolio.color, boxShadow: `0 0 20px ${portfolio.color}40` }}
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black tracking-tight">{portfolio.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            {portfolio.id === defaultPortfolioId && (
                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Default</span>
                                            )}
                                            {portfolio.is_public ? (
                                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                                                    <Globe size={10} /> Public
                                                </span>
                                            ) : (
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border flex items-center gap-1">
                                                    <Lock size={10} /> Private
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openShareModal(portfolio)} className="p-2.5 rounded-xl bg-muted border border-border text-muted-foreground hover:text-primary transition-all shadow-sm">
                                        <Share2 size={16} />
                                    </button>
                                    <button onClick={() => startEditing(portfolio)} className="p-2.5 rounded-xl bg-muted border border-border text-muted-foreground hover:text-emerald-500 transition-all shadow-sm">
                                        <Edit2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground leading-relaxed mb-8 h-10 overflow-hidden line-clamp-2">
                                {portfolio.description || 'Strategically manage your equity positions and tracking objectives.'}
                            </p>

                            <div className="flex items-center justify-between pt-6 border-t border-border/50">
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mb-1">Status</span>
                                    <span className="text-xs font-bold text-foreground capitalize">Operational</span>
                                </div>
                                {portfolio.id !== defaultPortfolioId ? (
                                    <button
                                        onClick={() => handleSetDefault(portfolio.id)}
                                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
                                    >
                                        <Star size={14} />
                                        Make Default
                                    </button>
                                ) : (
                                    <div className="text-primary">
                                        <LayoutGrid size={20} />
                                    </div>
                                )}
                            </div>

                            {/* Delete overlay for safety */}
                            {portfolios.length > 1 && (
                                <button
                                    onClick={() => handleDelete(portfolio.id, portfolio.name)}
                                    className="absolute -top-2 -right-2 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg shadow-rose-500/30"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Premium Share Modal */}
            <AnimatePresence>
                {shareModalOpen && selectedPortfolio && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShareModalOpen(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-card border border-border rounded-[48px] shadow-2xl p-10 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div>
                                    <div className="flex items-center gap-2 text-primary mb-1">
                                        <Share2 size={18} />
                                        <span className="text-xs font-bold tracking-widest uppercase">Visibility Hub</span>
                                    </div>
                                    <h3 className="text-2xl font-black">Publish Portfolio</h3>
                                </div>
                                <button onClick={() => setShareModalOpen(false)} className="p-3 bg-muted rounded-2xl text-muted-foreground">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div
                                    className={`p-6 rounded-[32px] border transition-all flex items-center justify-between gap-6 cursor-pointer ${selectedPortfolio.is_public ? 'bg-primary/5 border-primary/30 shadow-inner' : 'bg-muted/50 border-border'}`}
                                    onClick={() => handleToggleShare(selectedPortfolio)}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-2xl shadow-sm ${selectedPortfolio.is_public ? 'bg-primary text-white' : 'bg-card text-muted-foreground'}`}>
                                            {selectedPortfolio.is_public ? <Globe size={24} /> : <Lock size={24} />}
                                        </div>
                                        <div>
                                            <p className="font-black text-sm">{selectedPortfolio.is_public ? 'Public Access Enabled' : 'Private Mode Active'}</p>
                                            <p className="text-xs text-muted-foreground font-bold mt-0.5">{selectedPortfolio.is_public ? 'ReadOnly visibility for externals' : 'Locked to your secure account'}</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative transition-all ${selectedPortfolio.is_public ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${selectedPortfolio.is_public ? 'left-7' : 'left-1'}`} />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {selectedPortfolio.is_public && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-4"
                                        >
                                            <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest px-1">Distributed Sync Link</label>
                                            <div className="flex gap-2 p-2 bg-muted rounded-[24px] border border-border">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={getShareLink(selectedPortfolio.share_token)}
                                                    className="flex-1 bg-transparent border-none outline-none px-4 text-xs font-bold text-foreground"
                                                />
                                                <button
                                                    onClick={() => copyToClipboard(getShareLink(selectedPortfolio.share_token))}
                                                    className="p-3 bg-card border border-border rounded-2xl transition-all active:scale-90"
                                                >
                                                    {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                                                </button>
                                                <a
                                                    href={getShareLink(selectedPortfolio.share_token)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-3 bg-card border border-border rounded-2xl"
                                                >
                                                    <ExternalLink size={18} />
                                                </a>
                                            </div>

                                            <button
                                                onClick={() => handleRegenerateToken(selectedPortfolio)}
                                                className="w-fit flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-rose-500 transition-colors mx-auto pt-4"
                                            >
                                                <RefreshCw size={12} />
                                                Invalidate & Regenerate Link
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
