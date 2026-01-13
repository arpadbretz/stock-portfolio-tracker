'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2,
    X,
    Plus,
    RotateCcw,
    Minus,
    Maximize2,
    Minimize2,
    GripVertical,
    Wallet,
    TrendingUp,
    TrendingDown,
    PieChart,
    Clock,
    BarChart3,
    Globe,
    Star,
    Newspaper,
    Calendar,
    DollarSign,
    Activity,
    Bell,
    Zap,
    Eye,
    Target,
    Layers,
} from 'lucide-react';
import { toast } from 'sonner';

// ============ TYPES ============
export interface WidgetConfig {
    id: string;
    title: string;
    description: string;
    icon: ReactNode;
    category: 'core' | 'portfolio' | 'market' | 'tools';
    defaultSize: 'small' | 'medium' | 'large' | 'wide' | 'tall';
    minW: number;
    minH: number;
    maxW?: number;
    maxH?: number;
}

interface WidgetState {
    visible: boolean;
    size: 'small' | 'medium' | 'large' | 'wide' | 'tall';
}

// ============ CONSTANTS ============
const STORAGE_KEY = 'dashboard-widget-layouts-v2';
const VISIBILITY_KEY = 'dashboard-widget-visibility-v2';

// Size presets for widgets
const SIZE_PRESETS = {
    small: { w: 3, h: 3 },
    medium: { w: 4, h: 4 },
    large: { w: 6, h: 5 },
    wide: { w: 8, h: 3 },
    tall: { w: 4, h: 6 },
};

// ============ WIDGET REGISTRY ============
export const WIDGET_REGISTRY: WidgetConfig[] = [
    // Core Widgets
    {
        id: 'portfolio-value',
        title: 'Portfolio Value',
        description: 'Total market value of your portfolio',
        icon: <Wallet size={18} className="text-emerald-500" />,
        category: 'core',
        defaultSize: 'medium',
        minW: 3,
        minH: 3,
    },
    {
        id: 'total-invested',
        title: 'Total Invested',
        description: 'Total capital deployed',
        icon: <BarChart3 size={18} className="text-blue-500" />,
        category: 'core',
        defaultSize: 'medium',
        minW: 3,
        minH: 3,
    },
    {
        id: 'daily-pnl',
        title: "Today's P&L",
        description: 'Profit/loss for today',
        icon: <TrendingUp size={18} className="text-amber-500" />,
        category: 'core',
        defaultSize: 'medium',
        minW: 3,
        minH: 3,
    },
    {
        id: 'total-gain',
        title: 'Total Gain/Loss',
        description: 'All-time performance',
        icon: <Activity size={18} className="text-purple-500" />,
        category: 'core',
        defaultSize: 'wide',
        minW: 4,
        minH: 3,
    },
    // Portfolio Widgets
    {
        id: 'holdings',
        title: 'Holdings',
        description: 'Your stock positions',
        icon: <Layers size={18} className="text-indigo-500" />,
        category: 'portfolio',
        defaultSize: 'large',
        minW: 4,
        minH: 4,
    },
    {
        id: 'sector-allocation',
        title: 'Sector Allocation',
        description: 'Portfolio breakdown by sector',
        icon: <PieChart size={18} className="text-cyan-500" />,
        category: 'portfolio',
        defaultSize: 'medium',
        minW: 3,
        minH: 3,
    },
    {
        id: 'recent-trades',
        title: 'Recent Trades',
        description: 'Your latest transactions',
        icon: <Clock size={18} className="text-orange-500" />,
        category: 'portfolio',
        defaultSize: 'large',
        minW: 4,
        minH: 4,
    },
    {
        id: 'top-performers',
        title: 'Top Performers',
        description: 'Best performing stocks',
        icon: <TrendingUp size={18} className="text-emerald-500" />,
        category: 'portfolio',
        defaultSize: 'medium',
        minW: 3,
        minH: 3,
    },
    {
        id: 'worst-performers',
        title: 'Worst Performers',
        description: 'Underperforming stocks',
        icon: <TrendingDown size={18} className="text-rose-500" />,
        category: 'portfolio',
        defaultSize: 'medium',
        minW: 3,
        minH: 3,
    },
    // Market Widgets
    {
        id: 'market-overview',
        title: 'Market Overview',
        description: 'Major indices status',
        icon: <Globe size={18} className="text-blue-500" />,
        category: 'market',
        defaultSize: 'wide',
        minW: 4,
        minH: 3,
    },
    {
        id: 'watchlist-mini',
        title: 'Watchlist',
        description: 'Quick view of watched stocks',
        icon: <Star size={18} className="text-yellow-500" />,
        category: 'market',
        defaultSize: 'medium',
        minW: 3,
        minH: 3,
    },
    {
        id: 'market-news',
        title: 'Market News',
        description: 'Latest financial news',
        icon: <Newspaper size={18} className="text-slate-500" />,
        category: 'market',
        defaultSize: 'tall',
        minW: 3,
        minH: 4,
    },
    {
        id: 'upcoming-earnings',
        title: 'Upcoming Earnings',
        description: 'Earnings calendar for holdings',
        icon: <Calendar size={18} className="text-violet-500" />,
        category: 'market',
        defaultSize: 'medium',
        minW: 3,
        minH: 3,
    },
    // Tool Widgets
    {
        id: 'quick-actions',
        title: 'Quick Actions',
        description: 'Fast access to common tasks',
        icon: <Zap size={18} className="text-amber-500" />,
        category: 'tools',
        defaultSize: 'small',
        minW: 2,
        minH: 2,
    },
    {
        id: 'price-alerts',
        title: 'Price Alerts',
        description: 'Active price alerts',
        icon: <Bell size={18} className="text-rose-500" />,
        category: 'tools',
        defaultSize: 'medium',
        minW: 3,
        minH: 3,
    },
    {
        id: 'dividend-tracker',
        title: 'Dividend Tracker',
        description: 'Upcoming dividends',
        icon: <DollarSign size={18} className="text-green-500" />,
        category: 'tools',
        defaultSize: 'medium',
        minW: 3,
        minH: 3,
    },
    {
        id: 'performance-chart',
        title: 'Performance Chart',
        description: 'Portfolio value over time',
        icon: <Target size={18} className="text-pink-500" />,
        category: 'tools',
        defaultSize: 'large',
        minW: 4,
        minH: 4,
    },
];

// Default visible widgets
const DEFAULT_VISIBLE = [
    'portfolio-value',
    'total-invested',
    'daily-pnl',
    'total-gain',
    'holdings',
    'sector-allocation',
    'recent-trades',
];

// ============ HOOK ============
export function useWidgetSystem() {
    const [layouts, setLayouts] = useState<Record<string, unknown[]>>({});
    const [widgetStates, setWidgetStates] = useState<{ [key: string]: WidgetState }>({});
    const [isEditing, setIsEditing] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Initialize default states
    useEffect(() => {
        const savedLayouts = localStorage.getItem(STORAGE_KEY);
        const savedStates = localStorage.getItem(VISIBILITY_KEY);

        if (savedLayouts) {
            try {
                setLayouts(JSON.parse(savedLayouts));
            } catch (e) {
                console.error('Failed to parse saved layouts:', e);
            }
        }

        if (savedStates) {
            try {
                setWidgetStates(JSON.parse(savedStates));
            } catch (e) {
                console.error('Failed to parse saved states:', e);
            }
        } else {
            // Initialize with defaults
            const defaultStates: { [key: string]: WidgetState } = {};
            WIDGET_REGISTRY.forEach(widget => {
                defaultStates[widget.id] = {
                    visible: DEFAULT_VISIBLE.includes(widget.id),
                    size: widget.defaultSize,
                };
            });
            setWidgetStates(defaultStates);
        }

        setHasLoaded(true);
    }, []);

    // Save layouts (placeholder for future drag-drop support)
    const saveLayouts = useCallback((newLayouts: Record<string, unknown[]>) => {
        setLayouts(newLayouts);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayouts));
    }, []);

    // Toggle widget visibility
    const toggleWidget = useCallback((widgetId: string) => {
        setWidgetStates(prev => {
            const newStates = {
                ...prev,
                [widgetId]: {
                    ...prev[widgetId],
                    visible: !prev[widgetId]?.visible,
                },
            };
            localStorage.setItem(VISIBILITY_KEY, JSON.stringify(newStates));

            const widget = WIDGET_REGISTRY.find(w => w.id === widgetId);
            if (newStates[widgetId]?.visible) {
                toast.success(`Added "${widget?.title}" to dashboard`);
            } else {
                toast.success(`Removed "${widget?.title}" from dashboard`);
            }

            return newStates;
        });
    }, []);

    // Remove widget (same as toggle off)
    const removeWidget = useCallback((widgetId: string) => {
        setWidgetStates(prev => {
            const newStates = {
                ...prev,
                [widgetId]: {
                    ...prev[widgetId],
                    visible: false,
                },
            };
            localStorage.setItem(VISIBILITY_KEY, JSON.stringify(newStates));

            const widget = WIDGET_REGISTRY.find(w => w.id === widgetId);
            toast.success(`Removed "${widget?.title}"`);

            return newStates;
        });
    }, []);

    // Add widget
    const addWidget = useCallback((widgetId: string) => {
        setWidgetStates(prev => {
            const widget = WIDGET_REGISTRY.find(w => w.id === widgetId);
            const newStates = {
                ...prev,
                [widgetId]: {
                    visible: true,
                    size: widget?.defaultSize || 'medium',
                },
            };
            localStorage.setItem(VISIBILITY_KEY, JSON.stringify(newStates));
            toast.success(`Added "${widget?.title}" to dashboard`);
            return newStates;
        });
    }, []);

    // Reset to defaults
    const resetLayout = useCallback(() => {
        const defaultStates: { [key: string]: WidgetState } = {};
        WIDGET_REGISTRY.forEach(widget => {
            defaultStates[widget.id] = {
                visible: DEFAULT_VISIBLE.includes(widget.id),
                size: widget.defaultSize,
            };
        });
        setWidgetStates(defaultStates);
        setLayouts({});
        localStorage.removeItem(STORAGE_KEY);
        localStorage.setItem(VISIBILITY_KEY, JSON.stringify(defaultStates));
        toast.success('Dashboard reset to default');
    }, []);

    // Check if widget is visible
    const isWidgetVisible = useCallback((widgetId: string) => {
        return widgetStates[widgetId]?.visible ?? DEFAULT_VISIBLE.includes(widgetId);
    }, [widgetStates]);

    // Get visible widgets
    const visibleWidgets = WIDGET_REGISTRY.filter(w => isWidgetVisible(w.id));
    const hiddenWidgets = WIDGET_REGISTRY.filter(w => !isWidgetVisible(w.id));

    return {
        layouts,
        saveLayouts,
        widgetStates,
        isEditing,
        setIsEditing,
        toggleWidget,
        removeWidget,
        addWidget,
        resetLayout,
        isWidgetVisible,
        visibleWidgets,
        hiddenWidgets,
        hasLoaded,
    };
}

// ============ WIDGET WRAPPER ============
interface WidgetWrapperProps {
    id: string;
    title: string;
    icon: ReactNode;
    isEditing: boolean;
    onRemove: () => void;
    children: ReactNode;
}

export function WidgetWrapper({ id, title, icon, isEditing, onRemove, children }: WidgetWrapperProps) {
    return (
        <div className="h-full w-full bg-card border border-border rounded-[28px] overflow-hidden relative group">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    {isEditing && (
                        <div className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors widget-drag-handle">
                            <GripVertical size={16} />
                        </div>
                    )}
                    {icon}
                    <span className="font-bold text-sm">{title}</span>
                </div>
                {isEditing && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={onRemove}
                        className="w-6 h-6 rounded-full bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-500 transition-colors"
                    >
                        <Minus size={14} />
                    </motion.button>
                )}
            </div>
            {/* Content */}
            <div className="p-5 h-[calc(100%-57px)] overflow-auto">
                {children}
            </div>

            {/* Edit mode overlay */}
            {isEditing && (
                <div className="absolute inset-0 bg-primary/5 pointer-events-none rounded-[28px] border-2 border-dashed border-primary/30" />
            )}
        </div>
    );
}

// ============ WIDGET GALLERY ============
interface WidgetGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    hiddenWidgets: WidgetConfig[];
    onAddWidget: (widgetId: string) => void;
    onReset: () => void;
}

export function WidgetGallery({ isOpen, onClose, hiddenWidgets, onAddWidget, onReset }: WidgetGalleryProps) {
    const categories = [
        { id: 'core', label: 'Core Metrics', icon: <Activity size={16} /> },
        { id: 'portfolio', label: 'Portfolio', icon: <Layers size={16} /> },
        { id: 'market', label: 'Market', icon: <Globe size={16} /> },
        { id: 'tools', label: 'Tools', icon: <Zap size={16} /> },
    ];

    const widgetsByCategory = categories.map(cat => ({
        ...cat,
        widgets: hiddenWidgets.filter(w => w.category === cat.id),
    }));

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 400 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 400 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 overflow-hidden flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Plus size={20} className="text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="font-black text-lg">Add Widgets</h2>
                                        <p className="text-xs text-muted-foreground">
                                            {hiddenWidgets.length} available
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-muted rounded-xl transition-colors"
                                >
                                    <X size={20} className="text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        {/* Widget List */}
                        <div className="flex-1 overflow-auto p-6 space-y-6">
                            {hiddenWidgets.length === 0 ? (
                                <div className="text-center py-12">
                                    <Eye size={48} className="mx-auto text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground font-medium">All widgets are visible!</p>
                                    <p className="text-sm text-muted-foreground/70 mt-1">
                                        Remove widgets from your dashboard to see them here
                                    </p>
                                </div>
                            ) : (
                                widgetsByCategory.map(category => (
                                    category.widgets.length > 0 && (
                                        <div key={category.id}>
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-muted-foreground">{category.icon}</span>
                                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                                    {category.label}
                                                </span>
                                            </div>
                                            <div className="space-y-2">
                                                {category.widgets.map(widget => (
                                                    <motion.button
                                                        key={widget.id}
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => {
                                                            onAddWidget(widget.id);
                                                            onClose();
                                                        }}
                                                        className="w-full flex items-center gap-4 p-4 bg-muted/30 hover:bg-muted/50 border border-border hover:border-primary/30 rounded-2xl transition-all text-left group"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center border border-border group-hover:border-primary/30 transition-colors">
                                                            {widget.icon}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-sm">{widget.title}</div>
                                                            <div className="text-xs text-muted-foreground">{widget.description}</div>
                                                        </div>
                                                        <Plus size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border">
                            <button
                                onClick={() => {
                                    onReset();
                                    onClose();
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl font-bold text-sm transition-colors"
                            >
                                <RotateCcw size={16} />
                                Reset to Default Layout
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ============ EDIT MODE TOOLBAR ============
interface EditToolbarProps {
    isEditing: boolean;
    onToggleEdit: () => void;
    onOpenGallery: () => void;
    hiddenCount: number;
}

export function EditToolbar({ isEditing, onToggleEdit, onOpenGallery, hiddenCount }: EditToolbarProps) {
    return (
        <AnimatePresence>
            {isEditing && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/20"
                >
                    <div className="flex items-center gap-2 pr-4 border-r border-border">
                        <Settings2 size={18} className="text-primary" />
                        <span className="font-bold text-sm">Edit Mode</span>
                    </div>

                    <button
                        onClick={onOpenGallery}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-sm transition-colors"
                    >
                        <Plus size={16} />
                        Add Widget
                        {hiddenCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-primary text-primary-foreground rounded-md text-xs">
                                {hiddenCount}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={onToggleEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-xl font-bold text-sm transition-colors"
                    >
                        Done
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
