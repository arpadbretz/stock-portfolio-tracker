'use client';

import { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2,
    X,
    Plus,
    RotateCcw,
    Minus,
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
    Layers,
    Cloud,
    CloudOff,
    Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ============ TYPES ============
// Custom layout type (compatible with DashboardGrid)
export interface WidgetLayout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

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

interface CloudPreferences {
    layouts: { [key: string]: WidgetLayout[] } | null;
    visibility: { [key: string]: WidgetState } | null;
}

// ============ CONSTANTS ============
// Fallback to localStorage if cloud fails
const STORAGE_KEY_LAYOUTS = 'dashboard-widget-layouts-v3';
const STORAGE_KEY_VISIBILITY = 'dashboard-widget-visibility-v3';

// Debounce delay for cloud saves (don't save on every micro-change)
const CLOUD_SAVE_DEBOUNCE_MS = 1500;

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
        icon: <Activity size={18} className="text-pink-500" />,
        category: 'tools',
        defaultSize: 'large',
        minW: 4,
        minH: 4,
    },
];

// Default visible widgets for new users
const DEFAULT_VISIBLE = [
    'portfolio-value',
    'total-invested',
    'daily-pnl',
    'total-gain',
    'top-performers',
    'worst-performers',
    'holdings',
    'sector-allocation',
];

// ============ CLOUD SYNC HOOK ============
function useCloudSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncError, setLastSyncError] = useState<string | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const loadFromCloud = useCallback(async (): Promise<CloudPreferences | null> => {
        try {
            const response = await fetch('/api/widget-preferences');
            if (!response.ok) {
                throw new Error('Failed to load preferences');
            }
            const data = await response.json();
            if (data.success) {
                return {
                    layouts: data.layouts,
                    visibility: data.visibility,
                };
            }
            return null;
        } catch (error) {
            console.error('Cloud load error:', error);
            setLastSyncError('Failed to load from cloud');
            return null;
        }
    }, []);

    const saveToCloud = useCallback(async (
        layouts: { [key: string]: WidgetLayout[] } | null,
        visibility: { [key: string]: WidgetState } | null
    ) => {
        // Clear any pending save
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce the save
        saveTimeoutRef.current = setTimeout(async () => {
            setIsSyncing(true);
            setLastSyncError(null);
            try {
                const response = await fetch('/api/widget-preferences', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ layouts, visibility }),
                });

                if (!response.ok) {
                    throw new Error('Failed to save preferences');
                }

                const data = await response.json();
                if (!data.success) {
                    throw new Error(data.error || 'Unknown error');
                }
            } catch (error) {
                console.error('Cloud save error:', error);
                setLastSyncError('Failed to save to cloud');
                // Fallback: save to localStorage
                try {
                    if (layouts) localStorage.setItem(STORAGE_KEY_LAYOUTS, JSON.stringify(layouts));
                    if (visibility) localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(visibility));
                } catch (e) {
                    console.error('LocalStorage fallback failed:', e);
                }
            } finally {
                setIsSyncing(false);
            }
        }, CLOUD_SAVE_DEBOUNCE_MS);
    }, []);

    return { loadFromCloud, saveToCloud, isSyncing, lastSyncError };
}

// ============ MAIN HOOK ============
export function useWidgetSystem() {
    const [layouts, setLayouts] = useState<{ [key: string]: WidgetLayout[] }>({});
    const [widgetStates, setWidgetStates] = useState<{ [key: string]: WidgetState }>({});
    const [isEditing, setIsEditing] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const { loadFromCloud, saveToCloud, isSyncing, lastSyncError } = useCloudSync();

    // Initialize - load from cloud first, fallback to localStorage
    useEffect(() => {
        const initialize = async () => {
            // Try cloud first
            const cloudData = await loadFromCloud();

            if (cloudData) {
                if (cloudData.layouts) {
                    setLayouts(cloudData.layouts);
                }
                if (cloudData.visibility) {
                    setWidgetStates(cloudData.visibility);
                } else {
                    // Initialize defaults if no visibility saved
                    initializeDefaults();
                }
            } else {
                // Fallback to localStorage
                try {
                    const savedLayouts = localStorage.getItem(STORAGE_KEY_LAYOUTS);
                    const savedStates = localStorage.getItem(STORAGE_KEY_VISIBILITY);

                    if (savedLayouts) {
                        setLayouts(JSON.parse(savedLayouts));
                    }
                    if (savedStates) {
                        setWidgetStates(JSON.parse(savedStates));
                    } else {
                        initializeDefaults();
                    }
                } catch (e) {
                    console.error('Failed to parse localStorage:', e);
                    initializeDefaults();
                }
            }

            setHasLoaded(true);
        };

        const initializeDefaults = () => {
            const defaultStates: { [key: string]: WidgetState } = {};
            WIDGET_REGISTRY.forEach(widget => {
                defaultStates[widget.id] = {
                    visible: DEFAULT_VISIBLE.includes(widget.id),
                    size: widget.defaultSize,
                };
            });
            setWidgetStates(defaultStates);
        };

        initialize();
    }, [loadFromCloud]);

    // Save layouts to cloud when they change
    const saveLayouts = useCallback((newLayouts: { [key: string]: WidgetLayout[] }) => {
        setLayouts(newLayouts);
        // Also save locally for instant feedback
        try {
            localStorage.setItem(STORAGE_KEY_LAYOUTS, JSON.stringify(newLayouts));
        } catch (e) {
            console.error('LocalStorage save failed:', e);
        }
        // Sync to cloud (debounced)
        saveToCloud(newLayouts, null);
    }, [saveToCloud]);

    // Toggle widget visibility
    const toggleWidget = useCallback((widgetId: string) => {
        setWidgetStates(prev => {
            const widget = WIDGET_REGISTRY.find(w => w.id === widgetId);
            const newStates = {
                ...prev,
                [widgetId]: {
                    ...prev[widgetId],
                    visible: !prev[widgetId]?.visible,
                    size: prev[widgetId]?.size || widget?.defaultSize || 'medium',
                },
            };

            // Save locally
            try {
                localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(newStates));
            } catch (e) {
                console.error('LocalStorage save failed:', e);
            }

            // Sync to cloud
            saveToCloud(null, newStates);

            if (newStates[widgetId]?.visible) {
                toast.success(`Added "${widget?.title}" to dashboard`);
            } else {
                toast.success(`Removed "${widget?.title}" from dashboard`);
            }

            return newStates;
        });
    }, [saveToCloud]);

    // Remove widget
    const removeWidget = useCallback((widgetId: string) => {
        setWidgetStates(prev => {
            const newStates = {
                ...prev,
                [widgetId]: {
                    ...prev[widgetId],
                    visible: false,
                },
            };

            try {
                localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(newStates));
            } catch (e) {
                console.error('LocalStorage save failed:', e);
            }

            saveToCloud(null, newStates);

            const widget = WIDGET_REGISTRY.find(w => w.id === widgetId);
            toast.success(`Removed "${widget?.title}"`);

            return newStates;
        });
    }, [saveToCloud]);

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

            try {
                localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(newStates));
            } catch (e) {
                console.error('LocalStorage save failed:', e);
            }

            saveToCloud(null, newStates);
            toast.success(`Added "${widget?.title}" to dashboard`);

            return newStates;
        });
    }, [saveToCloud]);

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

        // Clear local storage
        try {
            localStorage.removeItem(STORAGE_KEY_LAYOUTS);
            localStorage.setItem(STORAGE_KEY_VISIBILITY, JSON.stringify(defaultStates));
        } catch (e) {
            console.error('LocalStorage clear failed:', e);
        }

        // Sync to cloud
        saveToCloud({}, defaultStates);
        toast.success('Dashboard reset to default');
    }, [saveToCloud]);

    // Check if widget is visible
    const isWidgetVisible = useCallback((widgetId: string) => {
        return widgetStates[widgetId]?.visible ?? DEFAULT_VISIBLE.includes(widgetId);
    }, [widgetStates]);

    // Get visible/hidden widgets
    const visibleWidgets = WIDGET_REGISTRY.filter(w => isWidgetVisible(w.id));
    const hiddenWidgets = WIDGET_REGISTRY.filter(w => !isWidgetVisible(w.id));
    const visibleWidgetIds = visibleWidgets.map(w => w.id);

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
        visibleWidgetIds,
        hiddenWidgets,
        hasLoaded,
        isSyncing,
        lastSyncError,
    };
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
    isSyncing?: boolean;
}

export function EditToolbar({ isEditing, onToggleEdit, onOpenGallery, hiddenCount, isSyncing }: EditToolbarProps) {
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
                        {isSyncing && (
                            <Loader2 size={14} className="animate-spin text-muted-foreground" />
                        )}
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
