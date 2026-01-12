'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    PieChart,
    TrendingUp,
    Bell,
    Star,
    FileText,
    Search,
    Plus,
    ArrowRight,
    Sparkles,
    Wallet,
    BarChart3,
    Upload,
} from 'lucide-react';

interface EmptyStateProps {
    type: 'holdings' | 'trades' | 'watchlist' | 'alerts' | 'search' | 'portfolios' | 'reports';
    title?: string;
    description?: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}

const EMPTY_STATE_CONFIG = {
    holdings: {
        icon: PieChart,
        title: 'No Holdings Yet',
        description: 'Add your first trade to start tracking your portfolio performance and see detailed analytics.',
        actionLabel: 'Add Your First Trade',
        iconColor: 'text-emerald-500',
        bgGradient: 'from-emerald-500/20 to-teal-500/20',
        tips: [
            'Import trades from a CSV file for bulk upload',
            'Add individual trades manually',
            'Track stocks, ETFs, and more',
        ],
    },
    trades: {
        icon: TrendingUp,
        title: 'No Trade History',
        description: 'Your trade history will appear here once you log your first buy or sell transaction.',
        actionLabel: 'Log Your First Trade',
        iconColor: 'text-blue-500',
        bgGradient: 'from-blue-500/20 to-indigo-500/20',
        tips: [
            'Track buy and sell transactions',
            'Calculate average cost basis automatically',
            'View realized gains and losses',
        ],
    },
    watchlist: {
        icon: Star,
        title: 'Your Watchlist is Empty',
        description: 'Add stocks you want to monitor. Get quick access to prices, news, and alerts for stocks you\'re interested in.',
        actionLabel: 'Browse Stocks',
        iconColor: 'text-amber-500',
        bgGradient: 'from-amber-500/20 to-orange-500/20',
        tips: [
            'Track stocks before buying',
            'Set price alerts for opportunities',
            'Monitor multiple stocks at once',
        ],
    },
    alerts: {
        icon: Bell,
        title: 'No Price Alerts',
        description: 'Set up price alerts to get notified when stocks hit your target price. Never miss an opportunity.',
        actionLabel: 'Create Your First Alert',
        iconColor: 'text-violet-500',
        bgGradient: 'from-violet-500/20 to-purple-500/20',
        tips: [
            'Get notified via email',
            'Set above or below price targets',
            'Track your watched stocks',
        ],
    },
    search: {
        icon: Search,
        title: 'No Results Found',
        description: 'We couldn\'t find any stocks matching your search. Try a different ticker or company name.',
        actionLabel: 'Clear Search',
        iconColor: 'text-slate-500',
        bgGradient: 'from-slate-500/20 to-gray-500/20',
        tips: [
            'Try using the stock ticker (e.g., AAPL)',
            'Check for typos in your search',
            'Search by full company name',
        ],
    },
    portfolios: {
        icon: Wallet,
        title: 'Create Your First Portfolio',
        description: 'Organize your investments across multiple portfolios. Track different strategies or accounts separately.',
        actionLabel: 'Create Portfolio',
        iconColor: 'text-pink-500',
        bgGradient: 'from-pink-500/20 to-rose-500/20',
        tips: [
            'Separate retirement from trading accounts',
            'Track different investment strategies',
            'Compare portfolio performance',
        ],
    },
    reports: {
        icon: BarChart3,
        title: 'No Reports Available',
        description: 'Generate detailed reports once you have trades in your portfolio. Track performance, returns, and more.',
        actionLabel: 'Add Trades First',
        iconColor: 'text-cyan-500',
        bgGradient: 'from-cyan-500/20 to-sky-500/20',
        tips: [
            'View total returns over time',
            'Analyze sector allocation',
            'Export data for tax purposes',
        ],
    },
};

export default function EmptyState({
    type,
    title,
    description,
    actionLabel,
    actionHref,
    onAction
}: EmptyStateProps) {
    const config = EMPTY_STATE_CONFIG[type];
    const Icon = config.icon;

    const displayTitle = title || config.title;
    const displayDescription = description || config.description;
    const displayActionLabel = actionLabel || config.actionLabel;

    // Default action routes
    const defaultRoutes: Record<string, string> = {
        holdings: '/dashboard',
        trades: '/dashboard',
        watchlist: '/dashboard/stocks',
        alerts: '/dashboard/alerts',
        search: '/dashboard/stocks',
        portfolios: '/dashboard/portfolios/manage',
        reports: '/dashboard',
    };

    const href = actionHref || defaultRoutes[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-[32px] p-8 md:p-12 text-center"
        >
            {/* Icon */}
            <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1 }}
                className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br ${config.bgGradient} flex items-center justify-center mx-auto mb-6`}
            >
                <Icon size={40} className={config.iconColor} />
            </motion.div>

            {/* Title */}
            <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-3xl font-black mb-3"
            >
                {displayTitle}
            </motion.h3>

            {/* Description */}
            <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground max-w-md mx-auto mb-8 text-sm md:text-base"
            >
                {displayDescription}
            </motion.p>

            {/* Tips */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-muted/30 rounded-2xl p-6 max-w-sm mx-auto mb-8"
            >
                <div className="flex items-center gap-2 mb-4 justify-center">
                    <Sparkles size={16} className="text-primary" />
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quick Tips</span>
                </div>
                <ul className="space-y-2 text-left">
                    {config.tips.map((tip, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <span className="text-primary mt-1">•</span>
                            {tip}
                        </li>
                    ))}
                </ul>
            </motion.div>

            {/* Action Button */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                {onAction ? (
                    <button
                        onClick={onAction}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                        <Plus size={18} />
                        {displayActionLabel}
                        <ArrowRight size={18} />
                    </button>
                ) : (
                    <Link
                        href={href}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    >
                        <Plus size={18} />
                        {displayActionLabel}
                        <ArrowRight size={18} />
                    </Link>
                )}
            </motion.div>

            {/* Import Option for holdings/trades */}
            {(type === 'holdings' || type === 'trades') && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-6"
                >
                    <Link
                        href="/dashboard/import"
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Upload size={16} />
                        or import from CSV
                    </Link>
                </motion.div>
            )}
        </motion.div>
    );
}

// Inline empty state for smaller sections
interface InlineEmptyStateProps {
    message: string;
    icon?: React.ReactNode;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function InlineEmptyState({ message, icon, action }: InlineEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            {icon && (
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    {icon}
                </div>
            )}
            <p className="text-muted-foreground text-sm mb-4">{message}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="text-sm font-bold text-primary hover:underline"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}
