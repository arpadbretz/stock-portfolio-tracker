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
    MoreVertical,
    BarChart3,
    Eye,
    EyeOff,
    Wallet
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useUserPreferences } from '@/components/providers/UserPreferencesProvider';
import { motion, AnimatePresence } from 'framer-motion';
import PortfolioComposition from '@/components/PortfolioComposition';
import DipFinderChart from '@/components/DipFinderChart';
import HoldingsTable from '@/components/HoldingsTable';
import AddTradeForm from '@/components/AddTradeForm';
import { formatCurrency, formatPercentage, convertCurrency } from '@/lib/portfolio';
import { Holding, PortfolioSummary } from '@/types/portfolio';
import PortfolioSwitcher from '@/components/PortfolioSwitcher';

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
    const { preferredCurrency: currency, exchangeRates, stealthMode, setStealthMode } = useUserPreferences();
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
    const [isSyncing, setIsSyncing] = useState(false);

    // -- State: Modals & Forms --
    const [showCreate, setShowCreate] = useState(false);
    const [showAddTrade, setShowAddTrade] = useState(false);
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

    const fetchPortfolioDetails = async (id: string, refresh = false) => {
        try {
            setIsLoadingDetails(true);
            const response = await fetch(`/api/portfolio?id=${id}&refresh=${refresh}`);
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setPortfolioData({
                        holdings: result.data.summary.holdings,
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

    const syncPortfolio = async (id: string) => {
        try {
            setIsSyncing(true);
            const response = await fetch(`/api/cron/sync-history?portfolioId=${id}`);
            if (response.ok) {
                // After history sync, refetch details to update UI with latest prices/stats
                await fetchPortfolioDetails(id, true);
            }
        } catch (error) {
            console.error('Error syncing portfolio:', error);
        } finally {
            setIsSyncing(false);
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

    // Converted summary values
    const convertedMarketValue = portfolioData ? convertCurrency(portfolioData.summary.totalMarketValue, currency, exchangeRates) : 0;
    const convertedGain = portfolioData ? convertCurrency(portfolioData.summary.totalGain, currency, exchangeRates) : 0;

    if (authLoading || (isLoadingList && portfolios.length === 0)) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* --- MAIN AREA: Deep Analytics --- */}
            <div className="space-y-10">
                {selectedPortfolio ? (
                    <motion.div
                        key={selectedPortfolio.id}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="max-w-7xl mx-auto space-y-10"
                    >
                        {/* Modernized Header */}
                        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                            <div className="relative group">
                                <div className="flex items-center gap-4 mb-4">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-2xl"
                                        style={{ backgroundColor: selectedPortfolio.color }}
                                    >
                                        {selectedPortfolio.name[0]}
                                    </div>
                                    <div>
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-5">
                                            <PortfolioSwitcher
                                                currentPortfolioId={selectedPortfolioId || ''}
                                                onPortfolioChange={(id) => setSelectedPortfolioId(id)}
                                            />
                                            <h2 className="text-3xl md:text-5xl font-black tracking-tighter truncate max-w-[200px] md:max-w-none">{selectedPortfolio.name}</h2>
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full border border-border text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground w-fit">
                                                {selectedPortfolio.is_public ? <Globe size={12} /> : <Lock size={12} />}
                                                {selectedPortfolio.is_public ? 'Public' : 'Private'}
                                            </div>
                                        </div>
                                        <p className="text-muted-foreground font-medium mt-1 text-xs md:text-sm lg:text-base max-w-lg">
                                            {selectedPortfolio.description || "Portfolio management initialized. Add trades to begin analysis."}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto">
                                <button
                                    onClick={() => selectedPortfolioId && syncPortfolio(selectedPortfolioId)}
                                    disabled={isSyncing}
                                    title="Sync History & Refresh Prices"
                                    className="p-3 bg-card border border-border rounded-2xl text-muted-foreground hover:text-primary transition-all shadow-lg active:scale-95 disabled:opacity-50 group"
                                >
                                    <RefreshCw size={20} className={isSyncing ? 'animate-spin text-primary' : 'group-hover:rotate-180 transition-transform duration-500'} />
                                </button>

                                <button
                                    onClick={() => setShowAddTrade(true)}
                                    className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    Add Trade
                                </button>

                                <Link
                                    href={`/dashboard/portfolios/manage/edit-positions?id=${selectedPortfolio.id}`}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Wallet size={18} />
                                    Manage Positions
                                </Link>

                                <div className="flex items-center bg-card/30 backdrop-blur-xl border border-border rounded-2xl p-1.5">
                                    <button onClick={() => handleShare(selectedPortfolio)} title="Share Settings" className="p-2.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all">
                                        <Share2 size={18} />
                                    </button>
                                    <button onClick={() => handleEdit(selectedPortfolio)} title="Vault Preferences" className="p-2.5 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all">
                                        <Settings size={18} />
                                    </button>
                                    <div className="w-px h-6 bg-border mx-1" />
                                    <button onClick={() => handleDelete(selectedPortfolio.id, selectedPortfolio.name)} title="Archive Vault" className="p-2.5 hover:bg-rose-500/10 rounded-xl text-muted-foreground hover:text-rose-500 transition-all">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </header>

                        {portfolioData ? (
                            <div className="space-y-10">
                                {/* Top Analytics Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                    {/* Stats & Tools Column */}
                                    <div className="lg:col-span-7 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Liquidation Value */}
                                            <div className="p-6 md:p-8 rounded-[40px] bg-card border border-border shadow-sm flex flex-col justify-between group overflow-hidden relative min-w-0 w-full">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                                        <DollarSign size={16} className="shrink-0" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate">Net Liquidation</span>
                                                    </div>
                                                    <div className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4 blur-stealth break-words min-w-0">
                                                        {formatCurrency(convertedMarketValue, currency)}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs whitespace-nowrap ${convertedGain >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                        {convertedGain >= 0 ? <TrendingUp size={14} className="shrink-0" /> : <TrendingDown size={14} className="shrink-0" />}
                                                        <span className="truncate">{formatCurrency(convertedGain, currency)}</span>
                                                    </div>
                                                    <div className={`font-black text-xs whitespace-nowrap ${convertedGain >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                                        {formatPercentage(portfolioData.summary.totalGainPercent)}
                                                    </div>
                                                </div>
                                                <Activity size={100} className="absolute -right-4 -bottom-4 text-primary opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12 pointer-events-none" />
                                            </div>

                                            {/* Asset Count */}
                                            <div className="p-6 md:p-8 rounded-[40px] bg-card border border-border shadow-sm flex flex-col justify-between group min-w-0 w-full">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                                        <Zap size={16} className="shrink-0" />
                                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] truncate">Asset Alpha</span>
                                                    </div>
                                                    <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter mb-4">
                                                        {portfolioData.holdings.length}
                                                    </div>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-full font-black text-xs whitespace-nowrap">
                                                        {new Set(portfolioData.holdings.map(h => h.sector)).size || 1} Sectors
                                                    </div>
                                                    <div className="text-muted-foreground font-black text-[10px] uppercase tracking-widest hidden sm:block truncate">
                                                        High Diversification
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dip Finder Chart */}
                                        <div className="p-6 md:p-8 rounded-[40px] bg-card border border-border shadow-sm">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="font-black text-xl tracking-tight">Dip Finder</h3>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Relative Holding Performance</p>
                                                </div>
                                                <div className="p-3 bg-muted rounded-2xl text-muted-foreground">
                                                    <BarChart3 size={20} />
                                                </div>
                                            </div>
                                            <div className="h-[240px]">
                                                <DipFinderChart holdings={portfolioData.holdings} isLoading={isLoadingDetails} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Composition Sidebar */}
                                    <div className="lg:col-span-5 p-6 md:p-8 rounded-[40px] bg-card border border-border shadow-sm min-h-[500px]">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h3 className="font-black text-xl tracking-tight">Composition</h3>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Weight & Unrealized Return</p>
                                            </div>
                                            <button
                                                onClick={() => setStealthMode(!stealthMode)}
                                                className={`p-3 rounded-2xl transition-all ${stealthMode ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                                                title={stealthMode ? "Disable Stealth Mode" : "Enable Stealth Mode"}
                                            >
                                                {stealthMode ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>
                                        <PortfolioComposition
                                            holdings={portfolioData.holdings}
                                            currency={currency}
                                            exchangeRates={exchangeRates}
                                            isLoading={isLoadingDetails}
                                        />
                                    </div>
                                </div>

                                {/* FULL WIDTH: Holdings Inventory */}
                                <div className="w-full">
                                    <div className="flex items-center gap-3 mb-6 px-2">
                                        <div className="w-1.5 h-6 bg-primary rounded-full" />
                                        <h3 className="font-black text-xl tracking-tight uppercase italic">Active Position Inventory</h3>
                                        <div className="flex-1 h-px bg-border ml-4" />
                                    </div>
                                    <HoldingsTable
                                        holdings={portfolioData.holdings}
                                        currency={currency}
                                        exchangeRates={exchangeRates}
                                        isLoading={isLoadingDetails}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center py-40">
                                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    <div className="h-[80vh] flex flex-col items-center justify-center text-center p-10">
                        <div className="w-24 h-24 bg-card/50 backdrop-blur-3xl rounded-[40px] border border-border flex items-center justify-center mb-8 shadow-2xl">
                            <Briefcase size={40} className="text-primary/40" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter mb-2 italic">Awaiting Authorization...</h2>
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground opacity-50">Select a secure vault to proceed</p>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}

            {/* Add Trade Modal */}
            <AnimatePresence>
                {showAddTrade && selectedPortfolioId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddTrade(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-card border border-border rounded-[40px] shadow-2xl p-2"
                        >
                            <div className="p-6">
                                <AddTradeForm
                                    portfolioId={selectedPortfolioId}
                                    onTradeAdded={() => {
                                        setShowAddTrade(false);
                                        fetchPortfolioDetails(selectedPortfolioId);
                                    }}
                                    onCancel={() => setShowAddTrade(false)}
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Create / Edit Portfolio Modal */}
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
                            <h2 className="text-3xl font-black mb-8 tracking-tight">
                                {showCreate ? 'Initialize Vault' : 'Reconfigure Vault'}
                            </h2>
                            <form onSubmit={showCreate ? handleCreate : handleUpdate} className="space-y-6">
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-3 block px-1">Vault Designation</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-muted border border-border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="e.g. Quantitative High-Growth"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-3 block px-1">Identity Color</label>
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
                                    <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-3 block px-1">Strategic Objective</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-muted border border-border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                                        placeholder="Describe the thesis for this portfolio..."
                                    />
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="submit" className="flex-1 py-4 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] shadow-lg shadow-primary/20 transition-all">
                                        Confirm Changes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setShowCreate(false); setEditingId(null); resetForm(); }}
                                        className="px-8 py-4 bg-muted text-muted-foreground rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-muted/80 transition-all"
                                    >
                                        Abort
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Visibility Settings Modal */}
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
                                <h3 className="text-3xl font-black tracking-tight">Access Control</h3>
                                <button onClick={() => setShareModalOpen(false)} className="p-2 bg-muted rounded-full hover:bg-muted/80 transition-all">
                                    <X size={18} />
                                </button>
                            </div>

                            <div
                                onClick={() => handleToggleShare(selectedPortfolioForAction)}
                                className={`p-8 rounded-[40px] border transition-all cursor-pointer flex items-center justify-between gap-4 mb-8 ${selectedPortfolioForAction.is_public ? 'bg-primary/5 border-primary/30 shadow-2xl shadow-primary/5' : 'bg-muted border-transparent'}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 rounded-2xl shadow-lg transition-all ${selectedPortfolioForAction.is_public ? 'bg-primary text-white scale-110' : 'bg-card text-muted-foreground'}`}>
                                        {selectedPortfolioForAction.is_public ? <Globe size={24} /> : <Lock size={24} />}
                                    </div>
                                    <div>
                                        <p className="font-black text-lg">{selectedPortfolioForAction.is_public ? 'Public Broadcaster' : 'Cold Storage Private'}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 opacity-60">
                                            {selectedPortfolioForAction.is_public ? 'Live link active' : 'Network access disabled'}
                                        </p>
                                    </div>
                                </div>
                                <div className={`w-12 h-7 rounded-full relative transition-all duration-300 ${selectedPortfolioForAction.is_public ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all shadow-xl ${selectedPortfolioForAction.is_public ? 'left-6' : 'left-1'}`} />
                                </div>
                            </div>

                            {selectedPortfolioForAction.is_public && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <label className="text-[10px] text-muted-foreground font-black uppercase tracking-widest px-2">Encrypted Sharing Payload</label>
                                    <div className="flex gap-2 p-2 bg-muted rounded-[28px] border border-border group focus-within:border-primary/30 transition-all">
                                        <input
                                            readOnly
                                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${selectedPortfolioForAction.share_token}`}
                                            className="flex-1 bg-transparent border-none outline-none px-4 text-xs font-black tracking-tight"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(`${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${selectedPortfolioForAction.share_token}`)}
                                            className="p-4 bg-card rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95"
                                        >
                                            {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                </motion.div>
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
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        }>
            <PortfolioCommandCenterContent />
        </Suspense>
    );
}
