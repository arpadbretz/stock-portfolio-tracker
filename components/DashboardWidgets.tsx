'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Settings2,
    GripVertical,
    X,
    Plus,
    RotateCcw,
    Save,
    Eye,
    EyeOff,
    Wallet,
    TrendingUp,
    PieChart,
    Activity,
    Clock,
    BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

// Layout type for widget positions
interface Layout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
}

export interface WidgetConfig {
    id: string;
    title: string;
    icon: React.ReactNode;
    defaultSize: { w: number; h: number };
    minSize?: { w: number; h: number };
    component: string;
    visible: boolean;
}

interface DashboardWidgetLayoutProps {
    children: React.ReactNode[];
    widgetConfigs: WidgetConfig[];
    onLayoutChange?: (layouts: { [key: string]: Layout[] }) => void;
}

const STORAGE_KEY = 'dashboard-widget-layout';
const VISIBILITY_KEY = 'dashboard-widget-visibility';

// Default layouts for different breakpoints
const DEFAULT_LAYOUTS: { [key: string]: Layout[] } = {
    lg: [
        { i: 'portfolio-value', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
        { i: 'total-invested', x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
        { i: 'daily-pnl', x: 8, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
        { i: 'total-gain', x: 0, y: 3, w: 6, h: 4, minW: 3, minH: 3 },
        { i: 'holdings', x: 6, y: 3, w: 6, h: 8, minW: 4, minH: 4 },
        { i: 'sector-allocation', x: 0, y: 7, w: 6, h: 5, minW: 3, minH: 3 },
        { i: 'recent-trades', x: 0, y: 12, w: 12, h: 5, minW: 4, minH: 3 },
    ],
    md: [
        { i: 'portfolio-value', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
        { i: 'total-invested', x: 4, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
        { i: 'daily-pnl', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 2 },
        { i: 'total-gain', x: 4, y: 3, w: 4, h: 4, minW: 3, minH: 3 },
        { i: 'holdings', x: 0, y: 6, w: 8, h: 6, minW: 4, minH: 4 },
        { i: 'sector-allocation', x: 0, y: 12, w: 8, h: 5, minW: 3, minH: 3 },
        { i: 'recent-trades', x: 0, y: 17, w: 8, h: 5, minW: 4, minH: 3 },
    ],
    sm: [
        { i: 'portfolio-value', x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 2 },
        { i: 'total-invested', x: 0, y: 3, w: 6, h: 3, minW: 3, minH: 2 },
        { i: 'daily-pnl', x: 0, y: 6, w: 6, h: 3, minW: 3, minH: 2 },
        { i: 'total-gain', x: 0, y: 9, w: 6, h: 4, minW: 3, minH: 3 },
        { i: 'holdings', x: 0, y: 13, w: 6, h: 6, minW: 3, minH: 4 },
        { i: 'sector-allocation', x: 0, y: 19, w: 6, h: 5, minW: 3, minH: 3 },
        { i: 'recent-trades', x: 0, y: 24, w: 6, h: 5, minW: 3, minH: 3 },
    ],
};

export function useDashboardLayout() {
    const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>(DEFAULT_LAYOUTS);
    const [visibility, setVisibility] = useState<{ [key: string]: boolean }>({});
    const [isCustomizing, setIsCustomizing] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    // Load saved layout from localStorage
    useEffect(() => {
        try {
            const savedLayout = localStorage.getItem(STORAGE_KEY);
            const savedVisibility = localStorage.getItem(VISIBILITY_KEY);

            if (savedLayout) {
                setLayouts(JSON.parse(savedLayout));
            }
            if (savedVisibility) {
                setVisibility(JSON.parse(savedVisibility));
            }
        } catch (e) {
            console.error('Failed to load dashboard layout:', e);
        }
        setHasLoaded(true);
    }, []);

    // Save layout to localStorage
    const saveLayout = useCallback((newLayouts: { [key: string]: Layout[] }) => {
        setLayouts(newLayouts);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayouts));
        } catch (e) {
            console.error('Failed to save dashboard layout:', e);
        }
    }, []);

    // Toggle widget visibility
    const toggleWidgetVisibility = useCallback((widgetId: string) => {
        setVisibility(prev => {
            const newVisibility = { ...prev, [widgetId]: !prev[widgetId] };
            try {
                localStorage.setItem(VISIBILITY_KEY, JSON.stringify(newVisibility));
            } catch (e) {
                console.error('Failed to save visibility:', e);
            }
            return newVisibility;
        });
    }, []);

    // Reset to default layout
    const resetLayout = useCallback(() => {
        setLayouts(DEFAULT_LAYOUTS);
        setVisibility({});
        try {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(VISIBILITY_KEY);
        } catch (e) {
            console.error('Failed to reset layout:', e);
        }
        toast.success('Dashboard reset to default layout');
    }, []);

    // Check if widget is visible
    const isWidgetVisible = useCallback((widgetId: string) => {
        return visibility[widgetId] !== false; // Default to visible
    }, [visibility]);

    return {
        layouts,
        saveLayout,
        isCustomizing,
        setIsCustomizing,
        toggleWidgetVisibility,
        isWidgetVisible,
        resetLayout,
        hasLoaded,
    };
}

interface WidgetWrapperProps {
    id: string;
    title: string;
    icon: React.ReactNode;
    isCustomizing: boolean;
    onHide?: () => void;
    children: React.ReactNode;
}

export function WidgetWrapper({ id, title, icon, isCustomizing, onHide, children }: WidgetWrapperProps) {
    return (
        <div className="h-full w-full relative group">
            {isCustomizing && (
                <div className="absolute inset-0 border-2 border-dashed border-primary/50 rounded-[32px] pointer-events-none z-10" />
            )}
            {isCustomizing && (
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20">
                    <div className="flex items-center gap-2 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-border cursor-move">
                        <GripVertical size={14} className="text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground">{title}</span>
                    </div>
                    {onHide && (
                        <button
                            onClick={onHide}
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg transition-colors"
                        >
                            <EyeOff size={12} className="text-rose-500" />
                        </button>
                    )}
                </div>
            )}
            {children}
        </div>
    );
}

interface CustomizationPanelProps {
    isOpen: boolean;
    onClose: () => void;
    widgetConfigs: WidgetConfig[];
    isWidgetVisible: (id: string) => boolean;
    toggleWidgetVisibility: (id: string) => void;
    onReset: () => void;
}

export function CustomizationPanel({
    isOpen,
    onClose,
    widgetConfigs,
    isWidgetVisible,
    toggleWidgetVisibility,
    onReset,
}: CustomizationPanelProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="fixed top-20 right-6 z-50 bg-card border border-border rounded-2xl shadow-2xl shadow-black/20 p-6 w-80"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Settings2 className="text-primary" size={20} />
                        <h3 className="font-black">Customize Dashboard</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition-colors">
                        <X size={18} className="text-muted-foreground" />
                    </button>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                    Drag widgets to rearrange. Toggle visibility below.
                </p>

                <div className="space-y-2 mb-6">
                    {widgetConfigs.map((widget) => (
                        <button
                            key={widget.id}
                            onClick={() => toggleWidgetVisibility(widget.id)}
                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isWidgetVisible(widget.id)
                                ? 'bg-primary/10 border border-primary/20'
                                : 'bg-muted/30 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                {widget.icon}
                                <span className="font-bold text-sm">{widget.title}</span>
                            </div>
                            {isWidgetVisible(widget.id) ? (
                                <Eye size={16} className="text-primary" />
                            ) : (
                                <EyeOff size={16} className="text-muted-foreground" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onReset}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted hover:bg-muted/80 rounded-xl font-bold text-sm transition-colors"
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm transition-colors"
                    >
                        <Save size={14} />
                        Done
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Default widget configurations
export const DEFAULT_WIDGET_CONFIGS: WidgetConfig[] = [
    {
        id: 'portfolio-value',
        title: 'Portfolio Value',
        icon: <Wallet size={16} className="text-emerald-500" />,
        defaultSize: { w: 4, h: 3 },
        component: 'PortfolioValue',
        visible: true,
    },
    {
        id: 'total-invested',
        title: 'Total Invested',
        icon: <TrendingUp size={16} className="text-blue-500" />,
        defaultSize: { w: 4, h: 3 },
        component: 'TotalInvested',
        visible: true,
    },
    {
        id: 'daily-pnl',
        title: 'Daily P&L',
        icon: <Activity size={16} className="text-violet-500" />,
        defaultSize: { w: 4, h: 3 },
        component: 'DailyPnL',
        visible: true,
    },
    {
        id: 'total-gain',
        title: 'Total Gain',
        icon: <BarChart3 size={16} className="text-orange-500" />,
        defaultSize: { w: 6, h: 4 },
        component: 'TotalGain',
        visible: true,
    },
    {
        id: 'holdings',
        title: 'Holdings',
        icon: <PieChart size={16} className="text-pink-500" />,
        defaultSize: { w: 6, h: 8 },
        component: 'Holdings',
        visible: true,
    },
    {
        id: 'sector-allocation',
        title: 'Sector Allocation',
        icon: <PieChart size={16} className="text-cyan-500" />,
        defaultSize: { w: 6, h: 5 },
        component: 'SectorAllocation',
        visible: true,
    },
    {
        id: 'recent-trades',
        title: 'Recent Trades',
        icon: <Clock size={16} className="text-amber-500" />,
        defaultSize: { w: 12, h: 5 },
        component: 'RecentTrades',
        visible: true,
    },
];
