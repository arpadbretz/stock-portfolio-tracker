'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    Trash2,
    Edit2,
    Share2,
    Globe,
    Lock,
    Copy,
    RefreshCw,
    ExternalLink,
    Check,
    X,
    Briefcase,
    LayoutGrid,
    Activity,
    Zap,
    ChevronRight,
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart,
    Settings,
    MoreVertical
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import AssetAllocationChart from '@/components/AssetAllocationChart';
import HoldingsTable from '@/components/HoldingsTable';
import { formatCurrency, formatPercentage } from '@/lib/portfolio';
import { Holding, PortfolioSummary } from '@/types/portfolio';

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

function PortfolioCommandCenterContent() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // -- State: Portfolios --
    const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
    const [isLoadingList, setIsLoadingList] = useState(true);

    // -- State: Selected Portfolio Data --
    const [portfolioData, setPortfolioData] = useState<{
        holdings: Holding[];
        summary: PortfolioSummary;
    } | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // -- State: Modals & Forms --
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [shareModalOpen, setShareModalOpen] = useState(false);
    const [selectedPortfolioForAction, setSelectedPortfolioForAction] = useState<Portfolio | null>(null);
    const [copied, setCopied] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#10b981'
    });

    // -- Effects --

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchPortfolios();
        }
    }, [user, authLoading, router]);

    // When selected ID changes, fetch details
    useEffect(() => {
        if (selectedPortfolioId) {
            fetchPortfolioDetails(selectedPortfolioId);
        }
    }, [selectedPortfolioId]);

    // -- Data Fetching --

    const fetchPortfolios = async () => {
        try {
            setIsLoadingList(true);
            const response = await fetch('/api/portfolios');
            if (response.ok) {
                const data = await response.json();
                const list = data.portfolios || [];
                setPortfolios(list);

                // Determine selection: URL param -> Default -> First
                const paramId = searchParams.get('id');
                const defaultId = data.defaultPortfolioId;

                if (paramId && list.find((p: Portfolio) => p.id === paramId)) {
                    setSelectedPortfolioId(paramId);
                } else if (defaultId && list.find((p: Portfolio) => p.id === defaultId)) {
                    setSelectedPortfolioId(defaultId);
                } else if (list.length > 0) {
                    setSelectedPortfolioId(list[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching portfolios:', error);
        } finally {
            setIsLoadingList(false);
        }
    };

    const fetchPortfolioDetails = async (id: string) => {
        try {
            setIsLoadingDetails(true);
            const response = await fetch(`/api/portfolio?id=${id}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setPortfolioData({
                        holdings: result.data.holdings,
                        summary: result.data.summary
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching portfolio details:', error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    // -- Handlers: CRUD --

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/portfolios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await fetchPortfolios(); // Refresh list
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
        if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;

        try {
            const response = await fetch(`/api/portfolios?id=${id}`, { method: 'DELETE' });
            if (response.ok) {
                // If we deleted the selected one, clear selection or select another
                if (selectedPortfolioId === id) {
                    setSelectedPortfolioId(null);
                }
                await fetchPortfolios();
            }
        } catch (error) {
            console.error('Error deleting portfolio:', error);
        }
    };

    // -- Handlers: Actions --

    const handleShare = (portfolio: Portfolio) => {
        setSelectedPortfolioForAction(portfolio);
        setShareModalOpen(true);
    };

    const handleEdit = (portfolio: Portfolio) => {
        setEditingId(portfolio.id);
        setFormData({
            name: portfolio.name,
            description: portfolio.description || '',
            color: portfolio.color || '#10b981'
        });
        setShowCreate(false);
    };

    const handleToggleShare = async (portfolio: Portfolio) => {
        try {
            const newIsPublic = !portfolio.is_public;
            const response = await fetch('/api/portfolios', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ portfolioId: portfolio.id, isPublic: newIsPublic })
            });

            if (response.ok) {
                const updated = { ...portfolio, is_public: newIsPublic };
                // Update local list state optimistically
                setPortfolios(portfolios.map(p => p.id === portfolio.id ? updated : p));
                setSelectedPortfolioForAction(updated);
            }
        } catch (error) {
            console.error('Error toggling share:', error);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const resetForm = () => {
        setFormData({ name: '', description: '', color: '#10b981' });
    };

    // -- Render Helpers --

    const selectedPortfolio = portfolios.find(p => p.id === selectedPortfolioId);

    if (authLoading || (isLoadingList && portfolios.length === 0)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">

            {/* --- SIDEBAR: Portfolio List --- */}
            <aside className="w-full md:w-80 border-b md:border-b-0 md:border-r border-border bg-card/30 md:min-h-screen p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-8 px-2">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                        <LayoutGrid size={20} />
                    </div>
                    <div>
                        <h1 className="font-black text-lg tracking-tight">Portfolios</h1>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{portfolios.length} Vaults Active</p>
                    </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto mb-6">
                    {portfolios.map(portfolio => (
                        <button
                            key={portfolio.id}
                            onClick={() => setSelectedPortfolioId(portfolio.id)}
                            className={`w-full group text-left p-4 rounded-[24px] border transition-all relative overflow-hidden ${selectedPortfolioId === portfolio.id
                                ? 'bg-background border-primary/30 shadow-xl shadow-primary/5'
                                : 'bg-transparent border-transparent hover:bg-muted/50 hover:border-border/50'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full shadow-lg shadow-${portfolio.color}/50`} style={{ backgroundColor: portfolio.color }} />
                                    <span className={`font-black text-sm ${selectedPortfolioId === portfolio.id ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                        {portfolio.name}
                                    </span>
                                </div>
                                {portfolio.is_public && <Globe size={12} className="text-muted-foreground" />}
                            </div>
                            {selectedPortfolioId === portfolio.id && (
                                <motion.div layoutId="active-indicator" className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                            )}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => { setShowCreate(true); resetForm(); }}
                    className="w-full py-4 bg-primary/10 border border-primary/20 text-primary rounded-[20px] font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={16} />
                    Create New
                </button>
            </aside>

            {/* --- MAIN AREA: Details & Analytics --- */}
            <main className="flex-1 p-6 md:p-10 overflow-y-auto h-screen scrollbar-hide">
                {selectedPortfolio ? (
                    <motion.div
                        key={selectedPortfolio.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="max-w-6xl mx-auto space-y-8"
                    >
                        {/* Header Row */}
                        <header className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="px-3 py-1 rounded-full border border-border bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedPortfolio.color }} />
                                        {selectedPortfolio.is_public ? 'Public' : 'Private'}
                                    </div>
                                    {selectedPortfolio.is_default && (
                                        <div className="px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-black uppercase tracking-widest text-primary">
                                            Default
                                        </div>
                                    )}
                                </div>
                                <h2 className="text-4xl font-black tracking-tighter mb-2">{selectedPortfolio.name}</h2>
                                <p className="text-muted-foreground font-medium max-w-2xl">
                                    {selectedPortfolio.description || "No strategic summary provided."}
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <button onClick={() => handleShare(selectedPortfolio)} className="p-3 rounded-2xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                                    <Share2 size={18} />
                                </button>
                                <button onClick={() => handleEdit(selectedPortfolio)} className="p-3 rounded-2xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all">
                                    <Settings size={18} />
                                </button>
                                {portfolios.length > 1 && (
                                    <button onClick={() => handleDelete(selectedPortfolio.id, selectedPortfolio.name)} className="p-3 rounded-2xl border border-border hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                        </header>

                        {/* KPIS & Charts Grid */}
                        {portfolioData ? (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Total Value Cards */}
                                <div className="lg:col-span-2 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-8 rounded-[32px] bg-card border border-border shadow-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                                <DollarSign size={16} />
                                                <span className="text-xs font-black uppercase tracking-widest">Net Liquidation Value</span>
                                            </div>
                                            <div className="text-4xl font-black tracking-tighter mb-2">
                                                {formatCurrency(portfolioData.summary.totalMarketValue, 'USD')}
                                            </div>
                                            <div className={`flex items-center gap-2 text-sm font-bold ${portfolioData.summary.totalGain >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                {portfolioData.summary.totalGain >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                                <span>{formatCurrency(portfolioData.summary.totalGain, 'USD')}</span>
                                                <span className="opacity-60">({formatPercentage(portfolioData.summary.totalGainPercent)})</span>
                                            </div>
                                        </div>

                                        <div className="p-8 rounded-[32px] bg-card border border-border shadow-sm relative overflow-hidden">
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                                    <Activity size={16} />
                                                    <span className="text-xs font-black uppercase tracking-widest">Active Positions</span>
                                                </div>
                                                <div className="text-4xl font-black tracking-tighter mb-2">
                                                    {portfolioData.holdings.length}
                                                </div>
                                                <div className="text-sm font-bold text-muted-foreground">
                                                    Across {new Set(portfolioData.holdings.map(h => h.sector)).size} Sectors
                                                </div>
                                            </div>
                                            <div className="absolute right-0 bottom-0 p-6 opacity-5">
                                                <Briefcase size={80} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Holdings Table */}
                                    <HoldingsTable
                                        holdings={portfolioData.holdings}
                                        currency="USD"
                                        exchangeRates={{ USD: 1, EUR: 0.92, HUF: 350 }}
                                        isLoading={isLoadingDetails}
                                    />
                                </div>

                                {/* Asset Allocation - Stickyish on desktop */}
                                <div className="space-y-6">
                                    <div className="p-8 rounded-[32px] bg-card border border-border shadow-sm min-h-[400px]">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-black text-lg">Allocation</h3>
                                            <PieChart size={18} className="text-muted-foreground" />
                                        </div>
                                        <div className="h-[300px]">
                                            <AssetAllocationChart
                                                holdings={portfolioData.holdings}
                                                currency="USD"
                                                exchangeRates={{ USD: 1, EUR: 0.92, HUF: 350 }}
                                                isLoading={isLoadingDetails}
                                                size="small"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-8 rounded-[32px] bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-2xl shadow-primary/20">
                                        <Zap size={24} className="mb-4" />
                                        <h3 className="text-xl font-black mb-2">Research Pipeline</h3>
                                        <p className="text-sm font-medium opacity-90 mb-6">
                                            Identify new opportunities to diversify this portfolio.
                                        </p>
                                        <button
                                            onClick={() => router.push('/dashboard/stocks')}
                                            className="w-full py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/30 transition-all"
                                        >
                                            Scout Assets
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-50">
                        <Briefcase size={48} className="mb-4" />
                        <h2 className="text-2xl font-black tracking-tight">Select a Portfolio</h2>
                        <p className="text-sm font-bold uppercase tracking-widest mt-2">Access your vault analytics</p>
                    </div>
                )}
            </main>

            {/* --- MODALS --- */}

            {/* Create / Edit Modal */}
            <AnimatePresence>
                {(showCreate || editingId) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative w-full max-w-lg bg-card border border-border rounded-[48px] shadow-2xl p-10"
                        >
                            <h2 className="text-2xl font-black mb-8">
                                {showCreate ? 'Initialize Portfolio' : 'Configure Portfolio'}
                            </h2>
                            <form onSubmit={showCreate ? handleCreate : handleUpdate} className="space-y-6">
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-3 block px-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-muted border border-border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="e.g. High Growth Tech"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-3 block px-1">Color Label</label>
                                    <div className="flex flex-wrap gap-3">
                                        {COLORS.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color: c })}
                                                className={`w-8 h-8 rounded-full transition-all hover:scale-110 ${formData.color === c ? 'ring-4 ring-primary/20 scale-110' : 'opacity-40 hover:opacity-100'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-3 block px-1">Summary</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-muted border border-border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                                        placeholder="Strategic goals..."
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] transition-all">
                                        Save Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}
                                        className="px-8 py-4 bg-muted text-muted-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-muted/80 transition-all"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Share Modal */}
            <AnimatePresence>
                {shareModalOpen && selectedPortfolioForAction && (
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
                            className="relative w-full max-w-lg bg-card border border-border rounded-[48px] shadow-2xl p-10"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black">Visibility Settings</h3>
                                <button onClick={() => setShareModalOpen(false)} className="p-2 bg-muted rounded-full">
                                    <X size={18} />
                                </button>
                            </div>

                            <div
                                onClick={() => handleToggleShare(selectedPortfolioForAction)}
                                className={`p-6 rounded-[32px] border transition-all cursor-pointer flex items-center justify-between gap-4 mb-6 ${selectedPortfolioForAction.is_public ? 'bg-primary/5 border-primary/20' : 'bg-muted border-transparent'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${selectedPortfolioForAction.is_public ? 'bg-primary text-white' : 'bg-card text-muted-foreground'}`}>
                                        {selectedPortfolioForAction.is_public ? <Globe size={20} /> : <Lock size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-black text-sm">{selectedPortfolioForAction.is_public ? 'Publicly Visible' : 'Private Vault'}</p>
                                        <p className="text-[10px] text-muted-foreground font-bold">{selectedPortfolioForAction.is_public ? 'Anyone with the link can view' : 'Only you can access'}</p>
                                    </div>
                                </div>
                                <div className={`w-10 h-6 rounded-full relative transition-all ${selectedPortfolioForAction.is_public ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${selectedPortfolioForAction.is_public ? 'left-5' : 'left-1'}`} />
                                </div>
                            </div>

                            {selectedPortfolioForAction.is_public && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                    <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest px-1">Secure Link</label>
                                    <div className="flex gap-2 p-2 bg-muted rounded-[24px] border border-border">
                                        <input
                                            readOnly
                                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${selectedPortfolioForAction.share_token}`}
                                            className="flex-1 bg-transparent border-none outline-none px-4 text-xs font-bold"
                                        />
                                        <button onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${selectedPortfolioForAction.share_token}`)} className="p-3 bg-card rounded-2xl hover:scale-105 transition-all">
                                            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
}

export default function PortfolioCommandCenter() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <PortfolioCommandCenterContent />
        </Suspense>
    );
}
