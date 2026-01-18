'use client';

import { motion } from 'framer-motion';
import {
    TrendingUp,
    TrendingDown,
    Building2,
    Users,
    Globe,
    DollarSign,
    BarChart3,
    PieChart,
    Target,
    Shield,
    Zap,
    ExternalLink,
    Newspaper,
} from 'lucide-react';

interface OverviewTabProps {
    stock: any;
    chartData: any[];
    selectedRange: string;
    setSelectedRange: (range: string) => void;
    chartLoading: boolean;
    formatLargeNumber: (num: number) => string;
    formatPercent: (num: number | null) => string;
    analysts: any;
    news: any;
    TIME_RANGES: string[];
    rangeChange: number;
    rangeChangePercent: number;
    ChartComponent: React.ReactNode;
}

export default function OverviewTab({
    stock,
    chartData,
    selectedRange,
    setSelectedRange,
    chartLoading,
    formatLargeNumber,
    formatPercent,
    analysts,
    news,
    TIME_RANGES,
    rangeChange,
    rangeChangePercent,
    ChartComponent,
}: OverviewTabProps) {
    const isPositive = rangeChange >= 0;

    return (
        <div className="space-y-8">
            {/* Price Chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-[40px] p-8"
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
                    {ChartComponent}
                </div>
            </motion.div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Market Cap"
                    value={formatLargeNumber(stock.marketCap)}
                    icon={<Building2 size={18} />}
                />
                <StatCard
                    label="Volume"
                    value={stock.volume?.toLocaleString() || '—'}
                    icon={<BarChart3 size={18} />}
                />
                <StatCard
                    label="52W High"
                    value={`$${stock.fiftyTwoWeekHigh?.toFixed(2)}`}
                    icon={<TrendingUp size={18} />}
                    color="emerald"
                />
                <StatCard
                    label="52W Low"
                    value={`$${stock.fiftyTwoWeekLow?.toFixed(2)}`}
                    icon={<TrendingDown size={18} />}
                    color="rose"
                />
            </div>

            {/* Analyst Estimates */}
            {analysts && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-card border border-border rounded-[40px] p-8"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-violet-500/10 rounded-2xl">
                            <Users className="text-violet-500" size={20} />
                        </div>
                        <h3 className="text-xl font-black">Analyst Estimates</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Ratings */}
                        {analysts.ratings && (
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Ratings Distribution</p>
                                <div className="space-y-2">
                                    {['strongBuy', 'buy', 'hold', 'sell', 'strongSell'].map((rating) => {
                                        const value = analysts.ratings[rating] || 0;
                                        const total = Object.values(analysts.ratings as Record<string, number>).reduce((a: number, b: number) => a + b, 0);
                                        const percent = total > 0 ? (value / total) * 100 : 0;
                                        const colors: Record<string, string> = {
                                            strongBuy: 'bg-emerald-500',
                                            buy: 'bg-emerald-400',
                                            hold: 'bg-amber-500',
                                            sell: 'bg-rose-400',
                                            strongSell: 'bg-rose-500',
                                        };
                                        const labels: Record<string, string> = {
                                            strongBuy: 'Strong Buy',
                                            buy: 'Buy',
                                            hold: 'Hold',
                                            sell: 'Sell',
                                            strongSell: 'Strong Sell',
                                        };
                                        return (
                                            <div key={rating} className="flex items-center gap-3">
                                                <span className="text-xs font-bold w-24 text-muted-foreground">{labels[rating]}</span>
                                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${colors[rating]} rounded-full transition-all`}
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-black w-8">{value}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Price Target */}
                        {analysts.priceTarget && (
                            <div className="p-6 bg-muted/30 rounded-2xl">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Price Target</p>
                                <div className="text-4xl font-black mb-4">${analysts.priceTarget.mean?.toFixed(2)}</div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
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

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Valuation */}
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

                {/* Financials Summary */}
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

                {/* Risk */}
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
                        <MetricRow label="Avg Volume" value={stock.avgVolume?.toLocaleString()} />
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

            {/* Company Profile */}
            {stock.description && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="bg-card border border-border rounded-[40px] p-8"
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

            {/* Latest News Preview */}
            {news && news.news && news.news.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card border border-border rounded-[40px] p-8"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-2xl">
                                <Newspaper className="text-blue-500" size={20} />
                            </div>
                            <h3 className="text-xl font-black">Latest News</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">See all in Filings & News tab</span>
                    </div>

                    <div className="space-y-4">
                        {news.news.slice(0, 3).map((item: any, idx: number) => (
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
                                            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
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
                                </div>
                            </a>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}

// Helper Components
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
