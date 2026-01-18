'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { trackTickerView } from '@/lib/analytics';
import { useAuth } from '@/components/auth/AuthProvider';
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    Star,
    Check,
    Loader2,
    Bell,
    X,
    ShoppingCart,
    Target,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import AddAlertModal from '@/components/alerts/AddAlertModal';
import QuickDCFModal from '@/components/dcf/QuickDCFModal';
import { useHotkeys } from '@/hooks/useHotkeys';
import TickerTabs, { TickerTab } from '@/components/ticker/TickerTabs';
import OverviewTab from '@/components/ticker/OverviewTab';
import FinancialsTab from '@/components/ticker/FinancialsTab';
import ValuationTab from '@/components/ticker/ValuationTab';
import TechnicalsTab from '@/components/ticker/TechnicalsTab';
import FilingsTab from '@/components/ticker/FilingsTab';
import { useSearchParams, useRouter } from 'next/navigation';

interface StockData {
    symbol: string;
    name: string;
    exchange: string;
    currency: string;
    price: number;
    previousClose: number;
    open: number;
    dayHigh: number;
    dayLow: number;
    change: number;
    changePercent: number;
    volume: number;
    avgVolume: number;
    marketCap: number;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
    trailingPE: number | null;
    forwardPE: number | null;
    priceToBook: number | null;
    pegRatio: number | null;
    dividendYield: number | null;
    dividendRate: number | null;
    beta: number | null;
    eps: number | null;
    revenueGrowth: number | null;
    profitMargin: number | null;
    operatingMargin: number | null;
    returnOnEquity: number | null;
    debtToEquity: number | null;
    currentRatio: number | null;
    freeCashflow: number | null;
    sector: string | null;
    industry: string | null;
    employees: number | null;
    website: string | null;
    description: string | null;
    earningsDate: string | null;
    shortRatio: number | null;
    shortPercentOfFloat: number | null;
    sharesShort: number | null;
    sharesShortPriorMonth: number | null;
    incomeStatement: any[];
    balanceSheet: any[];
    cashFlow: any[];
}

interface ChartDataPoint {
    date: string;
    close: number;
}

const TIME_RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y', '5Y'];

export default function TickerPage({ params }: { params: Promise<{ symbol: string }> }) {
    const resolvedParams = use(params);
    const symbol = resolvedParams.symbol.toUpperCase();
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const router = useRouter();

    // Get initial tab from URL or default to overview
    const initialTab = (searchParams.get('tab') as TickerTab) || 'overview';

    const [stock, setStock] = useState<StockData | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [selectedRange, setSelectedRange] = useState('1M');
    const [isLoading, setIsLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analysts, setAnalysts] = useState<any>(null);
    const [insiders, setInsiders] = useState<any>(null);
    const [institutions, setInstitutions] = useState<any>(null);
    const [news, setNews] = useState<any>(null);
    const [filings, setFilings] = useState<any>(null);
    const [isInWatchlist, setIsInWatchlist] = useState(false);
    const [watchlistLoading, setWatchlistLoading] = useState(false);

    // Active tab state
    const [activeTab, setActiveTab] = useState<TickerTab>(initialTab);

    // Quick Trade modal state
    const [showQuickTrade, setShowQuickTrade] = useState(false);
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [tradeQuantity, setTradeQuantity] = useState('');
    const [tradePrice, setTradePrice] = useState('');
    const [isSubmittingTrade, setIsSubmittingTrade] = useState(false);
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [selectedPortfolio, setSelectedPortfolio] = useState<string>('');

    // Alert modal state
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

    // DCF modal state
    const [isDCFModalOpen, setIsDCFModalOpen] = useState(false);

    // Keyboard Shortcuts
    useHotkeys('a', () => setIsAlertModalOpen(true));
    useHotkeys('d', () => setIsDCFModalOpen(true));
    useHotkeys('t', () => openQuickTrade());

    // Update URL when tab changes
    const handleTabChange = (tab: TickerTab) => {
        setActiveTab(tab);
        const url = new URL(window.location.href);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url.toString());
    };

    // Track ticker view
    useEffect(() => {
        trackTickerView(symbol, user?.id || null);
    }, [symbol, user]);

    // Check if in watchlist
    useEffect(() => {
        const checkWatchlist = async () => {
            try {
                const res = await fetch('/api/watchlist');
                const data = await res.json();
                if (data.success) {
                    setIsInWatchlist(data.data.some((item: any) => item.symbol === symbol));
                }
            } catch (err) {
                console.error('Watchlist check error:', err);
            }
        };
        if (user) checkWatchlist();
    }, [symbol, user]);

    const handleWatchlistToggle = async () => {
        setWatchlistLoading(true);
        try {
            if (isInWatchlist) {
                await fetch(`/api/watchlist?symbol=${symbol}`, { method: 'DELETE' });
                setIsInWatchlist(false);
                toast.success('Removed from watchlist');
            } else {
                await fetch('/api/watchlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        symbol,
                        name: stock?.name,
                        added_price: stock?.price,
                    }),
                });
                setIsInWatchlist(true);
                toast.success('Added to watchlist');
            }
        } catch (err) {
            console.error('Watchlist toggle error:', err);
            toast.error('Failed to update watchlist');
        } finally {
            setWatchlistLoading(false);
        }
    };

    // Fetch user portfolios for quick trade
    useEffect(() => {
        const fetchPortfolios = async () => {
            if (!user) return;
            try {
                const res = await fetch('/api/portfolios');
                const data = await res.json();
                if (data.success && data.data.length > 0) {
                    setPortfolios(data.data);
                    setSelectedPortfolio(data.data[0].id);
                }
            } catch (err) {
                console.error('Failed to fetch portfolios:', err);
            }
        };
        fetchPortfolios();
    }, [user]);

    const openQuickTrade = () => {
        if (stock) {
            setTradePrice(stock.price.toFixed(2));
            setShowQuickTrade(true);
        }
    };

    const handleQuickTrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPortfolio || !tradeQuantity || !tradePrice) return;

        setIsSubmittingTrade(true);
        try {
            const res = await fetch('/api/trades', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    portfolio_id: selectedPortfolio,
                    symbol,
                    type: tradeType,
                    quantity: parseFloat(tradeQuantity),
                    price: parseFloat(tradePrice),
                    date: new Date().toISOString().split('T')[0],
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(`${tradeType === 'buy' ? 'Bought' : 'Sold'} ${tradeQuantity} shares of ${symbol}`);
                setShowQuickTrade(false);
                setTradeQuantity('');
            } else {
                toast.error(data.error || 'Trade failed');
            }
        } catch (err) {
            toast.error('Failed to execute trade');
        } finally {
            setIsSubmittingTrade(false);
        }
    };

    // Fetch stock data
    useEffect(() => {
        const fetchStock = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/stock/${symbol}`);
                const data = await res.json();
                if (data.success) {
                    setStock(data.data);
                } else {
                    setError(data.error || 'Failed to fetch stock');
                }
            } catch (err) {
                setError('Failed to load stock data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStock();
    }, [symbol]);

    // Fetch chart data based on selected range
    useEffect(() => {
        const fetchChart = async () => {
            setChartLoading(true);
            try {
                const res = await fetch(`/api/stock/${symbol}/history?range=${selectedRange}`);
                const data = await res.json();
                if (data.success) {
                    setChartData(data.data);
                }
            } catch (err) {
                console.error('Chart fetch error:', err);
            } finally {
                setChartLoading(false);
            }
        };
        fetchChart();
    }, [symbol, selectedRange]);

    // Fetch additional data (analysts, news, etc.)
    useEffect(() => {
        const fetchAdditionalData = async () => {
            try {
                const [analystsRes, insidersRes, institutionsRes, newsRes, filingsRes] = await Promise.all([
                    fetch(`/api/stock/${symbol}/analysts`),
                    fetch(`/api/stock/${symbol}/insiders`),
                    fetch(`/api/stock/${symbol}/institutions`),
                    fetch(`/api/stock/${symbol}/news`),
                    fetch(`/api/stock/${symbol}/filings`),
                ]);

                const [analystsData, insidersData, institutionsData, newsData, filingsData] = await Promise.all([
                    analystsRes.json(),
                    insidersRes.json(),
                    institutionsRes.json(),
                    newsRes.json(),
                    filingsRes.json(),
                ]);

                if (analystsData.success) setAnalysts(analystsData.data);
                if (insidersData.success) setInsiders(insidersData.data);
                if (institutionsData.success) setInstitutions(institutionsData.data);
                if (newsData.success) setNews(newsData.data);
                if (filingsData.success) setFilings(filingsData.data);
            } catch (err) {
                console.error('Additional data fetch error:', err);
            }
        };
        fetchAdditionalData();
    }, [symbol]);

    // Calculate range change
    const rangeChange = chartData.length > 0
        ? chartData[chartData.length - 1].close - chartData[0].close
        : 0;
    const rangeChangePercent = chartData.length > 0 && chartData[0].close !== 0
        ? (rangeChange / chartData[0].close) * 100
        : 0;

    const formatLargeNumber = (num: number) => {
        if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        return `$${num.toLocaleString()}`;
    };

    const formatPercent = (num: number | null) => {
        if (num === null) return '—';
        return `${(num * 100).toFixed(2)}%`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-muted border-t-primary rounded-full animate-spin mb-6" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-sm">Loading {symbol}...</p>
            </div>
        );
    }

    if (error || !stock) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <div className="text-center">
                    <h1 className="text-4xl font-black mb-4">Stock Not Found</h1>
                    <p className="text-muted-foreground mb-8">We couldn't find data for "{symbol}"</p>
                    <Link
                        href="/dashboard/stocks"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black"
                    >
                        <ArrowLeft size={18} />
                        Back to Search
                    </Link>
                </div>
            </div>
        );
    }

    const isPositive = rangeChange >= 0;

    // Chart component to pass to OverviewTab
    const ChartComponent = chartLoading ? (
        <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
    ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
                <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(val) => {
                        const date = new Date(val);
                        return selectedRange === '1D' || selectedRange === '5D'
                            ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }}
                />
                <YAxis
                    domain={['auto', 'auto']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    tickFormatter={(val) => `$${val.toFixed(0)}`}
                    width={60}
                />
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                                <div className="bg-card/95 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl">
                                    <p className="text-xs text-muted-foreground mb-1">
                                        {new Date(data.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                                    </p>
                                    <p className="text-xl font-black">${data.close.toFixed(2)}</p>
                                </div>
                            );
                        }
                        return null;
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="close"
                    stroke={isPositive ? '#10b981' : '#f43f5e'}
                    strokeWidth={3}
                    fill="url(#colorPrice)"
                />
            </AreaChart>
        </ResponsiveContainer>
    ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
            No chart data available
        </div>
    );

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="flex flex-col gap-8 mb-6">
                <Link
                    href="/dashboard/stocks"
                    className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors w-fit group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Stock Search</span>
                </Link>

                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter">{stock.symbol}</h1>
                            {stock.sector && (
                                <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-black uppercase tracking-widest text-primary">
                                    {stock.sector}
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground text-lg">{stock.name}</p>
                        <p className="text-muted-foreground text-xs mt-1">{stock.exchange} · {stock.currency}</p>
                    </div>

                    <div className="text-left lg:text-right">
                        <div className="text-5xl font-black mb-2">
                            ${stock.price.toFixed(2)}
                        </div>
                        <div className={`flex items-center gap-2 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            <span className="font-black">
                                {isPositive ? '+' : ''}{rangeChange.toFixed(2)} ({isPositive ? '+' : ''}{rangeChangePercent.toFixed(2)}%)
                            </span>
                            <span className="text-xs text-muted-foreground font-bold ml-2">
                                {selectedRange}
                            </span>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            {/* Add to Watchlist Button */}
                            <button
                                onClick={handleWatchlistToggle}
                                disabled={watchlistLoading}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${isInWatchlist
                                    ? 'bg-primary/10 text-primary border border-primary/30'
                                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border'
                                    }`}
                            >
                                {watchlistLoading ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : isInWatchlist ? (
                                    <><Check size={14} /> Watching</>
                                ) : (
                                    <><Star size={14} /> Watch</>
                                )}
                            </button>

                            {/* Set Price Alert Button */}
                            <button
                                onClick={() => setIsAlertModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-orange-500/10 text-orange-500 border border-orange-500/30 hover:bg-orange-500/20 transition-all"
                            >
                                <Bell size={14} />
                                Alert
                                <kbd className="hidden sm:inline-flex ml-1 opacity-40 text-[10px]">A</kbd>
                            </button>

                            {/* DCF Calculator Button */}
                            <button
                                onClick={() => setIsDCFModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-indigo-500/10 text-indigo-500 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all"
                            >
                                <Target size={14} />
                                DCF
                                <kbd className="hidden sm:inline-flex ml-1 opacity-40 text-[10px]">D</kbd>
                            </button>

                            {/* Quick Trade Button */}
                            {user && (
                                <button
                                    onClick={openQuickTrade}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
                                >
                                    <ShoppingCart size={14} />
                                    Trade
                                    <kbd className="hidden sm:inline-flex ml-1 opacity-40 text-[10px]">T</kbd>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <TickerTabs activeTab={activeTab} onTabChange={handleTabChange} />

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && (
                        <OverviewTab
                            stock={stock}
                            chartData={chartData}
                            selectedRange={selectedRange}
                            setSelectedRange={setSelectedRange}
                            chartLoading={chartLoading}
                            formatLargeNumber={formatLargeNumber}
                            formatPercent={formatPercent}
                            analysts={analysts}
                            news={news}
                            TIME_RANGES={TIME_RANGES}
                            rangeChange={rangeChange}
                            rangeChangePercent={rangeChangePercent}
                            ChartComponent={ChartComponent}
                        />
                    )}
                    {activeTab === 'financials' && (
                        <FinancialsTab symbol={symbol} stock={stock} />
                    )}
                    {activeTab === 'valuation' && (
                        <ValuationTab symbol={symbol} stock={stock} currentPrice={stock.price} />
                    )}
                    {activeTab === 'technicals' && (
                        <TechnicalsTab symbol={symbol} stock={stock} chartData={chartData} />
                    )}
                    {activeTab === 'filings' && (
                        <FilingsTab
                            stock={stock}
                            news={news}
                            insiders={insiders}
                            institutions={institutions}
                            filings={filings}
                            formatLargeNumber={formatLargeNumber}
                        />
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Modals */}
            {stock && (
                <>
                    <AddAlertModal
                        isOpen={isAlertModalOpen}
                        onClose={() => setIsAlertModalOpen(false)}
                        symbol={symbol}
                        currentPrice={stock.price}
                    />
                    <QuickDCFModal
                        isOpen={isDCFModalOpen}
                        onClose={() => setIsDCFModalOpen(false)}
                        symbol={symbol}
                        currentPrice={stock.price}
                    />
                </>
            )}

            {/* Quick Trade Modal */}
            <AnimatePresence>
                {showQuickTrade && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowQuickTrade(false)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-card border border-border rounded-3xl p-6 z-50 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black">Quick Trade - {symbol}</h3>
                                <button onClick={() => setShowQuickTrade(false)} className="p-2 hover:bg-muted rounded-xl">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleQuickTrade} className="space-y-4">
                                {/* Trade Type */}
                                <div className="flex gap-2 p-1 bg-muted rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setTradeType('buy')}
                                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${tradeType === 'buy'
                                            ? 'bg-emerald-500 text-white'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Buy
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTradeType('sell')}
                                        className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${tradeType === 'sell'
                                            ? 'bg-rose-500 text-white'
                                            : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                    >
                                        Sell
                                    </button>
                                </div>

                                {/* Portfolio Select */}
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                                        Portfolio
                                    </label>
                                    <select
                                        value={selectedPortfolio}
                                        onChange={(e) => setSelectedPortfolio(e.target.value)}
                                        className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold"
                                    >
                                        {portfolios.map((p) => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Quantity */}
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                                        Shares
                                    </label>
                                    <input
                                        type="number"
                                        value={tradeQuantity}
                                        onChange={(e) => setTradeQuantity(e.target.value)}
                                        placeholder="0"
                                        step="0.0001"
                                        className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold text-lg"
                                        required
                                    />
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">
                                        Price per Share
                                    </label>
                                    <input
                                        type="number"
                                        value={tradePrice}
                                        onChange={(e) => setTradePrice(e.target.value)}
                                        step="0.01"
                                        className="w-full px-4 py-3 bg-muted border border-border rounded-xl font-bold text-lg"
                                        required
                                    />
                                </div>

                                {/* Total */}
                                {tradeQuantity && tradePrice && (
                                    <div className="p-4 bg-muted/50 rounded-xl">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Total Value</span>
                                            <span className="text-xl font-black">
                                                ${(parseFloat(tradeQuantity) * parseFloat(tradePrice)).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={isSubmittingTrade || !tradeQuantity || !tradePrice}
                                    className={`w-full py-4 rounded-xl font-black text-white transition-all ${tradeType === 'buy'
                                        ? 'bg-emerald-500 hover:bg-emerald-600'
                                        : 'bg-rose-500 hover:bg-rose-600'
                                        } disabled:opacity-50`}
                                >
                                    {isSubmittingTrade ? (
                                        <Loader2 className="animate-spin mx-auto" size={20} />
                                    ) : (
                                        `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${tradeQuantity || 0} Shares`
                                    )}
                                </button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
