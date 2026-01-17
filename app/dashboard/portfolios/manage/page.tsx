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
    EyeOff
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

    const fetchPortfolioDetails = async (id: string) => {
        try {
            setIsLoadingDetails(true);
            const response = await fetch(`/api/portfolio?id=${id}`);
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
        <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">

            {/* --- SLIM SIDEBAR: Portfolio Multi-Viewer --- */}
            <aside className="w-full md:w-20 lg:w-64 border-b md:border-b-0 md:border-r border-border bg-card/10 backdrop-blur-3xl md:h-screen sticky top-0 z-40 p-4 lg:p-6 flex flex-row md:flex-col items-center md:items-stretch overflow-x-auto md:overflow-visible transition-all duration-300 gap-4 md:gap-0 no-scrollbar">
                <div className="flex items-center gap-3 md:mb-10 shrink-0">
                    <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                        <LayoutGrid size={20} />
                    </div>
                    <div className="hidden lg:block overflow-hidden">
                        <h1 className="font-black text-lg tracking-tight truncate">Command</h1>
                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest truncate">{portfolios.length} Vaults</p>
                    </div>
                </div>

                <div className="flex-1 flex flex-row md:flex-col gap-4 md:gap-4 md:space-y-4 overflow-x-auto md:overflow-y-auto md:mb-6 custom-scrollbar p-2 md:px-1">

                    {portfolios.map(portfolio => (
                        <button
                            key={portfolio.id}
                            onClick={() => setSelectedPortfolioId(portfolio.id)}
                            title={portfolio.name}
                            className={`group relative flex items-center transition-all shrink-0 ${selectedPortfolioId === portfolio.id ? 'opacity-100 scale-100' : 'opacity-60 hover:opacity-100 scale-95'}`}
                        >
                            <div
                                className={`w-12 h-12 lg:w-10 lg:h-10 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 transition-all shadow-lg ${selectedPortfolioId === portfolio.id ? 'ring-2 ring-primary ring-offset-4 ring-offset-background' : ''}`}
                                style={{ backgroundColor: portfolio.color }}
                            >
                                {portfolio.name.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="hidden lg:block ml-4 text-left overflow-hidden">
                                <p className={`font-black text-xs truncate ${selectedPortfolioId === portfolio.id ? 'text-foreground' : 'text-muted-foreground'}`}>{portfolio.name}</p>
                                <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-tighter">Select Vault</p>
                            </div>
                            {selectedPortfolioId === portfolio.id && (
                                <motion.div layoutId="bar-indicator" className="absolute -left-5 top-0 bottom-0 w-1.5 bg-primary rounded-r-full" />
                            )}
                        </button>
                    ))}

                    <button
                        onClick={() => { setShowCreate(true); resetForm(); }}
                        title="Initialize New Vault"
                        className="w-12 h-12 lg:w-10 lg:h-10 border-2 border-dashed border-border rounded-2xl flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-all shrink-0 group"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                <div className="hidden lg:block pt-6 border-t border-border/50">
                    <div className="p-4 bg-primary/5 rounded-3xl border border-primary/10">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-2">Vault Security</p>
                        <div className="flex items-center gap-2">
                            <Lock size={12} className="text-muted-foreground" />
                            <span className="text-[10px] font-bold text-muted-foreground underline">Encrypted Connection</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- MAIN AREA: Deep Analytics --- */}
            <main className="flex-1 p-4 md:p-8 lg:p-12 overflow-y-auto h-screen scrollbar-hide">
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
                                        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
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

                            <div className="flex items-center gap-3 self-end lg:self-auto">
                                <button
                                    onClick={() => setShowAddTrade(true)}
                                    className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <Plus size={18} />
                                    Add Trade
                                </button>
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
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                {/* LEFT COLUMN: Core Stats & Holdings */}
                                <div className="lg:col-span-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Performance Metric Cards */}
                                        <div className="p-6 md:p-8 rounded-[40px] bg-card border border-border shadow-sm flex flex-col justify-between group overflow-hidden relative">
                                            <div>
                                                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                                    <DollarSign size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Net Liquidation</span>
                                                </div>
                                                <div className="text-3xl lg:text-5xl font-black tracking-tighter mb-4 blur-stealth break-all md:break-normal">
                                                    {formatCurrency(convertedMarketValue, currency)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-black text-xs ${convertedGain >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                    {convertedGain >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                                    {formatCurrency(convertedGain, currency)}
                                                </div>
                                                <div className={`font-black text-xs ${convertedGain >= 0 ? 'text-emerald-500/60' : 'text-rose-500/60'}`}>
                                                    {formatPercentage(portfolioData.summary.totalGainPercent)}
                                                </div>
                                            </div>
                                            <Activity size={100} className="absolute -right-4 -bottom-4 text-primary opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rotate-12" />
                                        </div>

                                        <div className="p-6 md:p-8 rounded-[40px] bg-card border border-border shadow-sm flex flex-col justify-between group">
                                            <div>
                                                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                                    <Zap size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Asset Alpha</span>
                                                </div>
                                                <div className="text-3xl lg:text-5xl font-black tracking-tighter mb-4">
                                                    {portfolioData.holdings.length}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-full font-black text-xs">
                                                    {new Set(portfolioData.holdings.map(h => h.sector)).size || 1} Sectors
                                                </div>
                                                <div className="text-muted-foreground font-black text-[10px] uppercase tracking-widest hidden md:block">
                                                    High Diversification
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dip Finder Chart Integration */}
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

                                    {/* Extensive Holdings Table */}
                                    <HoldingsTable
                                        holdings={portfolioData.holdings}
                                        currency={currency}
                                        exchangeRates={exchangeRates}
                                        isLoading={isLoadingDetails}
                                    />
                                </div>

                                {/* RIGHT COLUMN: Deep Composition & Insights */}
                                <div className="lg:col-span-4 space-y-8">
                                    <div className="p-6 md:p-8 rounded-[40px] bg-card border border-border shadow-sm min-h-[500px]">
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

                                    {/* Action Card */}
                                    <div className="p-10 rounded-[48px] bg-gradient-to-br from-primary via-indigo-600 to-accent text-primary-foreground shadow-2xl shadow-primary/30 relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6">
                                                <ExternalLink size={24} />
                                            </div>
                                            <h3 className="text-3xl font-black mb-3 leading-tight">Maximize Alpha Yields</h3>
                                            <p className="text-sm font-medium opacity-80 mb-8 leading-relaxed">
                                                Your current allocation shows sector strength. Evaluate new research pipelines.
                                            </p>
                                            <button
                                                onClick={() => router.push('/dashboard/stocks')}
                                                className="w-full py-4 bg-white text-primary rounded-[24px] font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10"
                                            >
                                                Scout Markets
                                            </button>
                                        </div>
                                        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                                    </div>
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
            </main>

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
                            <div className="absolute top-6 right-6 z-10">
                                <button onClick={() => setShowAddTrade(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                                    <X size={20} />
                                </button>
                            </div>
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
