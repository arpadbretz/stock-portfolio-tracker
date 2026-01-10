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
    Building2,
    Users,
    Globe,
    DollarSign,
    BarChart3,
    PieChart,
    Activity,
    Target,
    Shield,
    Zap,
    Calendar,
    ExternalLink,
    Plus,
    ChevronRight,
    FileText,
    Wallet,
    ArrowUpDown,
    Newspaper,
    UserCheck,
    Briefcase,
    FileCheck,
    TrendingDownIcon,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';

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

    const [stock, setStock] = useState<StockData | null>(null);
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [selectedRange, setSelectedRange] = useState('1M');
    const [isLoading, setIsLoading] = useState(true);
    const [chartLoading, setChartLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeFinancialTab, setActiveFinancialTab] = useState<'income' | 'balance' | 'cashflow'>('income');
    const [fundamentals, setFundamentals] = useState<any>(null);
    const [selectedFundamental, setSelectedFundamental] = useState('revenue');
    const [analysts, setAnalysts] = useState<any>(null);
    const [insiders, setInsiders] = useState<any>(null);
    const [institutions, setInstitutions] = useState<any>(null);
    const [news, setNews] = useState<any>(null);
    const [filings, setFilings] = useState<any>(null);

    // Track ticker view
    useEffect(() => {
        trackTickerView(symbol, user?.id || null);
    }, [symbol, user]);

    // Calculate range-specific gain/loss
    const rangeChange = chartData.length >= 2
        ? chartData[chartData.length - 1].close - chartData[0].close
        : stock?.change || 0;
    const rangeChangePercent = chartData.length >= 2
        ? ((chartData[chartData.length - 1].close - chartData[0].close) / chartData[0].close) * 100
        : stock?.changePercent || 0;

    useEffect(() => {
        const fetchStock = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await fetch(`/api/stock/${symbol}`);
                if (!res.ok) throw new Error('Stock not found');
                const data = await res.json();
                setStock(data);
            } catch (err) {
                setError('Unable to load stock data');
            } finally {
                setIsLoading(false);
            }
        };
        fetchStock();
    }, [symbol]);

    useEffect(() => {
        const fetchChart = async () => {
            setChartLoading(true);
            try {
                const rangeMap: Record<string, string> = {
                    '1D': '1d', '5D': '5d', '1M': '1mo', '3M': '3mo',
                    '6M': '6mo', '1Y': '1y', '5Y': '5y'
                };
                const res = await fetch(`/api/stock/${symbol}/chart?range=${rangeMap[selectedRange]}`);
                if (res.ok) {
                    const data = await res.json();
                    setChartData(data.data || []);
                }
            } catch (err) {
                console.error('Chart error:', err);
            } finally {
                setChartLoading(false);
            }
        };
        if (symbol) fetchChart();
    }, [symbol, selectedRange]);

    useEffect(() => {
        const fetchFundamentals = async () => {
            try {
                const res = await fetch(`/api/stock/${symbol}/fundamentals`);
                if (res.ok) {
                    const data = await res.json();
                    setFundamentals(data);
                }
            } catch (err) {
                console.error('Fundamentals error:', err);
            }
        };
        if (symbol) fetchFundamentals();
    }, [symbol]);

    useEffect(() => {
        const fetchAnalysts = async () => {
            try {
                const res = await fetch(`/api/stock/${symbol}/analysts`);
                if (res.ok) {
                    const data = await res.json();
                    setAnalysts(data);
                }
            } catch (err) {
                console.error('Analysts error:', err);
            }
        };
        if (symbol) fetchAnalysts();
    }, [symbol]);

    useEffect(() => {
        const fetchInsiders = async () => {
            try {
                const res = await fetch(`/api/stock/${symbol}/insiders`);
                if (res.ok) {
                    const data = await res.json();
                    setInsiders(data);
                }
            } catch (err) {
                console.error('Insiders error:', err);
            }
        };
        if (symbol) fetchInsiders();
    }, [symbol]);

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const res = await fetch(`/api/stock/${symbol}/institutions`);
                if (res.ok) {
                    const data = await res.json();
                    setInstitutions(data);
                }
            } catch (err) {
                console.error('Institutions error:', err);
            }
        };
        if (symbol) fetchInstitutions();
    }, [symbol]);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                const res = await fetch(`/api/stock/${symbol}/news`);
                if (res.ok) {
                    const data = await res.json();
                    setNews(data);
                }
            } catch (err) {
                console.error('News error:', err);
            }
        };
        if (symbol) fetchNews();
    }, [symbol]);

    useEffect(() => {
        const fetchFilings = async () => {
            try {
                const res = await fetch(`/api/stock/${symbol}/filings`);
                if (res.ok) {
                    const data = await res.json();
                    setFilings(data);
                }
            } catch (err) {
                console.error('Filings error:', err);
            }
        };
        if (symbol) fetchFilings();
    }, [symbol]);

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

    return (
        <div className="min-h-screen bg-background pb-20">
            <div className="max-w-7xl mx-auto px-6 py-10">
                {/* Header */}
                <div className="flex flex-col gap-8 mb-10">
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
                        </div>
                    </div>
                </div>

                {/* Price Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-[40px] p-8 mb-8"
                >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <h2 className="text-xl font-black">Price History</h2>
                        <div className="flex flex-wrap gap-2">
                            {TIME_RANGES.map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setSelectedRange(range)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedRange === range
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                        }`}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="h-[300px] md:h-[400px]">
                        {chartLoading ? (
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
                                                        <p className="text-foreground font-black text-lg">${data.close.toFixed(2)}</p>
                                                        <p className="text-muted-foreground text-xs">
                                                            {new Date(data.date).toLocaleDateString('en-US', {
                                                                month: 'short', day: 'numeric', year: 'numeric'
                                                            })}
                                                        </p>
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
                                        strokeWidth={2}
                                        fill="url(#colorPrice)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-muted-foreground">
                                No chart data available
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Market Cap" value={formatLargeNumber(stock.marketCap)} icon={<DollarSign size={18} />} />
                    <StatCard label="Volume" value={stock.volume.toLocaleString()} icon={<BarChart3 size={18} />} />
                    <StatCard label="52W High" value={`$${stock.fiftyTwoWeekHigh.toFixed(2)}`} icon={<TrendingUp size={18} />} color="emerald" />
                    <StatCard label="52W Low" value={`$${stock.fiftyTwoWeekLow.toFixed(2)}`} icon={<TrendingDown size={18} />} color="rose" />
                </div>

                {/* Analyst Ratings */}
                {analysts && analysts.totalAnalysts > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="bg-card border border-border rounded-[40px] p-8 mb-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-amber-500/10 rounded-2xl">
                                <Target className="text-amber-500" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Analyst Ratings</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* Recommendation */}
                            <div className="text-center">
                                <div className={`text-4xl font-black mb-2 ${analysts.recommendation === 'Strong Buy' || analysts.recommendation === 'Buy'
                                    ? 'text-emerald-500'
                                    : analysts.recommendation === 'Hold'
                                        ? 'text-amber-500'
                                        : 'text-rose-500'
                                    }`}>
                                    {analysts.recommendation}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Based on {analysts.totalAnalysts} analyst{analysts.totalAnalysts !== 1 ? 's' : ''}
                                </p>
                            </div>

                            {/* Rating Breakdown */}
                            <div className="space-y-3">
                                <RatingBar label="Strong Buy" count={analysts.breakdown?.strongBuy || 0} total={analysts.totalAnalysts} color="emerald" />
                                <RatingBar label="Buy" count={analysts.breakdown?.buy || 0} total={analysts.totalAnalysts} color="green" />
                                <RatingBar label="Hold" count={analysts.breakdown?.hold || 0} total={analysts.totalAnalysts} color="amber" />
                                <RatingBar label="Sell" count={analysts.breakdown?.sell || 0} total={analysts.totalAnalysts} color="orange" />
                                <RatingBar label="Strong Sell" count={analysts.breakdown?.strongSell || 0} total={analysts.totalAnalysts} color="rose" />
                            </div>

                            {/* Price Target */}
                            {analysts.priceTarget?.mean && (
                                <div className="text-center">
                                    <div className="text-3xl font-black mb-1">${analysts.priceTarget.mean.toFixed(2)}</div>
                                    <p className="text-sm text-muted-foreground mb-4">Average Price Target</p>
                                    <div className="flex justify-center gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Low: </span>
                                            <span className="font-bold">${analysts.priceTarget.low?.toFixed(2)}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">High: </span>
                                            <span className="font-bold">${analysts.priceTarget.high?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    {analysts.priceTarget.upside !== null && (
                                        <div className={`mt-4 text-lg font-black ${analysts.priceTarget.upside >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {analysts.priceTarget.upside >= 0 ? '+' : ''}{analysts.priceTarget.upside.toFixed(1)}% Upside
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Detailed Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Valuation Metrics */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-card border border-border rounded-[40px] p-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Target className="text-primary" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Valuation</h3>
                        </div>
                        <div className="space-y-4">
                            <MetricRow label="P/E Ratio (TTM)" value={stock.trailingPE?.toFixed(2)} />
                            <MetricRow label="Forward P/E" value={stock.forwardPE?.toFixed(2)} />
                            <MetricRow label="PEG Ratio" value={stock.pegRatio?.toFixed(2)} />
                            <MetricRow label="Price/Book" value={stock.priceToBook?.toFixed(2)} />
                            <MetricRow label="EPS (TTM)" value={stock.eps ? `$${stock.eps.toFixed(2)}` : null} />
                        </div>
                    </motion.div>

                    {/* Financials */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-card border border-border rounded-[40px] p-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-accent/10 rounded-2xl">
                                <PieChart className="text-accent" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Financials</h3>
                        </div>
                        <div className="space-y-4">
                            <MetricRow label="Profit Margin" value={formatPercent(stock.profitMargin)} />
                            <MetricRow label="Operating Margin" value={formatPercent(stock.operatingMargin)} />
                            <MetricRow label="Return on Equity" value={formatPercent(stock.returnOnEquity)} />
                            <MetricRow label="Revenue Growth" value={formatPercent(stock.revenueGrowth)} />
                            <MetricRow label="Free Cash Flow" value={stock.freeCashflow ? formatLargeNumber(stock.freeCashflow) : null} />
                        </div>
                    </motion.div>

                    {/* Risk Metrics */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-border rounded-[40px] p-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-rose-500/10 rounded-2xl">
                                <Shield className="text-rose-500" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Risk & Health</h3>
                        </div>
                        <div className="space-y-4">
                            <MetricRow label="Beta" value={stock.beta?.toFixed(2)} />
                            <MetricRow label="Debt/Equity" value={stock.debtToEquity?.toFixed(2)} />
                            <MetricRow label="Current Ratio" value={stock.currentRatio?.toFixed(2)} />
                            <MetricRow label="Avg Volume" value={stock.avgVolume.toLocaleString()} />
                        </div>
                    </motion.div>

                    {/* Dividends */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-card border border-border rounded-[40px] p-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                <Zap className="text-emerald-500" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Dividends & Earnings</h3>
                        </div>
                        <div className="space-y-4">
                            <MetricRow label="Dividend Yield" value={stock.dividendYield ? `${(stock.dividendYield * 100).toFixed(2)}%` : 'N/A'} />
                            <MetricRow label="Annual Dividend" value={stock.dividendRate ? `$${stock.dividendRate.toFixed(2)}` : 'N/A'} />
                            <MetricRow label="Next Earnings" value={stock.earningsDate ? new Date(stock.earningsDate).toLocaleDateString() : 'N/A'} />
                        </div>
                    </motion.div>
                </div>

                {/* News Feed */}
                {news && news.news && news.news.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-card border border-border rounded-[40px] p-8 mt-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <Newspaper className="text-blue-500" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Latest News</h3>
                        </div>

                        <div className="space-y-4">
                            {news.news.slice(0, 10).map((item: any, idx: number) => (
                                <a
                                    key={item.uuid || idx}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex gap-4">
                                        {item.thumbnail && (
                                            <img
                                                src={item.thumbnail}
                                                alt=""
                                                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-sm mb-1 group-hover:text-primary transition-colors line-clamp-2">
                                                {item.title}
                                            </h4>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="font-bold">{item.publisher}</span>
                                                {item.providerPublishTime && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{new Date(item.providerPublishTime).toLocaleDateString()}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Insider Trading */}
                {insiders && insiders.transactions && insiders.transactions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="bg-card border border-border rounded-[40px] p-8 mt-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-purple-500/10 rounded-2xl">
                                <UserCheck className="text-purple-500" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Insider Trading Activity</h3>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Insider</th>
                                        <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Transaction</th>
                                        <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Shares</th>
                                        <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Value</th>
                                        <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {insiders.transactions.slice(0, 10).map((txn: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-xs">{txn.filerName}</div>
                                                <div className="text-[10px] text-muted-foreground">{txn.filerRelation}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="text-xs">{txn.transactionText}</span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold tabular-nums">
                                                {txn.shares ? txn.shares.toLocaleString() : '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold tabular-nums">
                                                {txn.moneyText || '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                                                {txn.startDate ? new Date(txn.startDate).toLocaleDateString() : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Institutional Ownership */}
                {institutions && institutions.institutions && institutions.institutions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-card border border-border rounded-[40px] p-8 mt-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <Briefcase className="text-indigo-500" size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-black">Institutional Ownership</h3>
                                {institutions.breakdown && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {institutions.breakdown.institutionsPercentHeld
                                            ? `${(institutions.breakdown.institutionsPercentHeld * 100).toFixed(1)}% held by ${institutions.breakdown.institutionsCount || 0} institutions`
                                            : 'Ownership data available'
                                        }
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Institution</th>
                                        <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Shares</th>
                                        <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">% Held</th>
                                        <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Value</th>
                                        <th className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {institutions.institutions.slice(0, 15).map((inst: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 font-bold">{inst.organization}</td>
                                            <td className="py-3 px-4 text-right font-bold tabular-nums">
                                                {inst.position ? inst.position.toLocaleString() : '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold tabular-nums">
                                                {inst.pctHeld ? `${(inst.pctHeld * 100).toFixed(2)}%` : '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold tabular-nums">
                                                {inst.value ? formatLargeNumber(inst.value) : '—'}
                                            </td>
                                            <td className="py-3 px-4 text-right text-xs text-muted-foreground">
                                                {inst.reportDate ? new Date(inst.reportDate).toLocaleDateString() : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* Short Interest */}
                {stock && (stock.shortRatio || stock.shortPercentOfFloat) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.32 }}
                        className="bg-card border border-border rounded-[40px] p-8 mt-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-rose-500/10 rounded-2xl">
                                <TrendingDownIcon className="text-rose-500" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Short Interest</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {stock.shortRatio && (
                                <div className="p-4 bg-muted/30 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Days to Cover</p>
                                    <p className="text-2xl font-black">{stock.shortRatio.toFixed(2)}</p>
                                </div>
                            )}
                            {stock.shortPercentOfFloat && (
                                <div className="p-4 bg-muted/30 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">% of Float</p>
                                    <p className="text-2xl font-black">{(stock.shortPercentOfFloat * 100).toFixed(2)}%</p>
                                </div>
                            )}
                            {stock.sharesShort && (
                                <div className="p-4 bg-muted/30 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Shares Short</p>
                                    <p className="text-2xl font-black">{(stock.sharesShort / 1e6).toFixed(2)}M</p>
                                </div>
                            )}
                            {stock.sharesShortPriorMonth && (
                                <div className="p-4 bg-muted/30 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Prior Month</p>
                                    <p className="text-2xl font-black">{(stock.sharesShortPriorMonth / 1e6).toFixed(2)}M</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* SEC Filings */}
                {filings && filings.filings && filings.filings.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.33 }}
                        className="bg-card border border-border rounded-[40px] p-8 mt-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-green-500/10 rounded-2xl">
                                <FileCheck className="text-green-500" size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black">SEC Filings</h3>
                                <p className="text-sm text-muted-foreground mt-1">CIK: {filings.cik}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {filings.filings.slice(0, 10).map((filing: any, idx: number) => (
                                <a
                                    key={idx}
                                    href={filing.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border/50 hover:border-primary/30 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`px-3 py-1 rounded-lg text-xs font-black ${filing.form === '10-K' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                            filing.form === '10-Q' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                                                filing.form === '8-K' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                                    'bg-muted text-muted-foreground border border-border'
                                            }`}>
                                            {filing.form}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm group-hover:text-primary transition-colors">
                                                {filing.description || filing.form}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Filed: {new Date(filing.filingDate).toLocaleDateString()}
                                                {filing.reportDate && ` • Report: ${new Date(filing.reportDate).toLocaleDateString()}`}
                                            </p>
                                        </div>
                                    </div>
                                    <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </a>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Company Profile */}
                {stock.description && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="bg-card border border-border rounded-[40px] p-8 mt-8"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Building2 className="text-primary" size={20} />
                            </div>
                            <h3 className="text-xl font-black">About {stock.name}</h3>
                        </div>

                        <div className="flex flex-wrap gap-6 mb-6">
                            {stock.industry && (
                                <div className="flex items-center gap-2 text-sm">
                                    <BarChart3 size={14} className="text-muted-foreground" />
                                    <span className="text-muted-foreground">Industry:</span>
                                    <span className="font-bold">{stock.industry}</span>
                                </div>
                            )}
                            {stock.employees && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Users size={14} className="text-muted-foreground" />
                                    <span className="text-muted-foreground">Employees:</span>
                                    <span className="font-bold">{stock.employees.toLocaleString()}</span>
                                </div>
                            )}
                            {stock.website && (
                                <a
                                    href={stock.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-primary hover:underline"
                                >
                                    <Globe size={14} />
                                    Visit Website
                                    <ExternalLink size={12} />
                                </a>
                            )}
                        </div>

                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {stock.description}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, color = 'primary' }: { label: string; value: string; icon: React.ReactNode; color?: string }) {
    const colorClasses: Record<string, string> = {
        primary: 'bg-primary/10 text-primary',
        emerald: 'bg-emerald-500/10 text-emerald-500',
        rose: 'bg-rose-500/10 text-rose-500',
    };

    return (
        <div className="p-6 bg-card border border-border rounded-[28px]">
            <div className={`p-2 w-fit rounded-xl mb-4 ${colorClasses[color]}`}>
                {icon}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
            <p className="text-lg font-black">{value}</p>
        </div>
    );
}

function MetricRow({ label, value }: { label: string; value: string | null | undefined }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-border/50 last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="font-black">{value ?? '—'}</span>
        </div>
    );
}

function FinancialTable({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No financial data available
            </div>
        );
    }

    // Get all unique keys from the data
    const allKeys = new Set<string>();
    data.forEach(item => {
        Object.keys(item).forEach(key => {
            if (key !== 'endDate' && key !== 'maxAge') allKeys.add(key);
        });
    });

    const formatValue = (val: any) => {
        if (val === null || val === undefined) return '—';
        if (typeof val === 'number') {
            if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
            if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
            return `$${val.toLocaleString()}`;
        }
        return val;
    };

    const getLabel = (key: string) => {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    };

    const importantKeys = [
        'totalRevenue', 'grossProfit', 'operatingIncome', 'netIncome',
        'totalAssets', 'totalLiabilities', 'totalStockholderEquity',
        'operatingCashflow', 'capitalExpenditures', 'freeCashflow'
    ];

    const displayKeys = importantKeys.filter(key => allKeys.has(key));
    if (displayKeys.length === 0) {
        displayKeys.push(...Array.from(allKeys).slice(0, 8));
    }

    return (
        <table className="w-full text-sm">
            <thead>
                <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">Metric</th>
                    {data.slice(0, 4).map((item, i) => (
                        <th key={i} className="text-right py-3 px-4 font-black uppercase tracking-widest text-[10px] text-muted-foreground">
                            {item.endDate ? new Date(item.endDate).getFullYear() : `FY-${i + 1}`}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {displayKeys.map(key => (
                    <tr key={key} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-bold">{getLabel(key)}</td>
                        {data.slice(0, 4).map((item, i) => (
                            <td key={i} className="text-right py-3 px-4 tabular-nums">
                                {formatValue(item[key])}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function RatingBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const colorClasses: Record<string, string> = {
        emerald: 'bg-emerald-500',
        green: 'bg-green-500',
        amber: 'bg-amber-500',
        orange: 'bg-orange-500',
        rose: 'bg-rose-500',
    };

    return (
        <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold w-20 text-muted-foreground">{label}</span>
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClasses[color]} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <span className="text-xs font-black w-6 text-right">{count}</span>
        </div>
    );
}
