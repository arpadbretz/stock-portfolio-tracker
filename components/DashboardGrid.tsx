'use client';

import { useMemo, ReactNode, useState, useCallback } from 'react';
import { motion, Reorder, useDragControls } from 'framer-motion';
import {
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
    Layers,
    Maximize2,
    Minimize2,
} from 'lucide-react';

// ============ TYPES ============
export interface WidgetDefinition {
    id: string;
    title: string;
    icon: ReactNode;
    category: 'core' | 'portfolio' | 'market' | 'tools';
    defaultLayout: {
        w: number;
        h: number;
        minW?: number;
        minH?: number;
        maxW?: number;
        maxH?: number;
    };
}

export interface WidgetLayout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
}

interface DashboardGridProps {
    isEditing: boolean;
    layouts: { [key: string]: WidgetLayout[] };
    visibleWidgets: string[];
    onLayoutChange: (layouts: { [key: string]: WidgetLayout[] }) => void;
    onRemoveWidget: (widgetId: string) => void;
    onResizeWidget?: (widgetId: string, size: 'small' | 'medium' | 'large') => void;
    renderWidget: (widgetId: string) => ReactNode;
    widgetRegistry: WidgetDefinition[];
}

// ============ WIDGET DEFINITIONS ============
export const WIDGET_DEFINITIONS: WidgetDefinition[] = [
    // Core Metrics
    {
        id: 'portfolio-value',
        title: 'Portfolio Value',
        icon: <Wallet size={18} className="text-emerald-500" />,
        category: 'core',
        defaultLayout: { w: 3, h: 4, minW: 2, minH: 3 },
    },
    {
        id: 'total-invested',
        title: 'Total Invested',
        icon: <BarChart3 size={18} className="text-blue-500" />,
        category: 'core',
        defaultLayout: { w: 3, h: 4, minW: 2, minH: 3 },
    },
    {
        id: 'daily-pnl',
        title: "Today's P&L",
        icon: <TrendingUp size={18} className="text-amber-500" />,
        category: 'core',
        defaultLayout: { w: 3, h: 4, minW: 2, minH: 3 },
    },
    {
        id: 'total-gain',
        title: 'Total Gain/Loss',
        icon: <Activity size={18} className="text-purple-500" />,
        category: 'core',
        defaultLayout: { w: 6, h: 4, minW: 3, minH: 3 },
    },
    // Portfolio Widgets
    {
        id: 'holdings',
        title: 'Holdings',
        icon: <Layers size={18} className="text-indigo-500" />,
        category: 'portfolio',
        defaultLayout: { w: 6, h: 8, minW: 4, minH: 5 },
    },
    {
        id: 'sector-allocation',
        title: 'Sector Allocation',
        icon: <PieChart size={18} className="text-cyan-500" />,
        category: 'portfolio',
        defaultLayout: { w: 6, h: 6, minW: 3, minH: 4 },
    },
    {
        id: 'recent-trades',
        title: 'Recent Trades',
        icon: <Clock size={18} className="text-orange-500" />,
        category: 'portfolio',
        defaultLayout: { w: 6, h: 6, minW: 4, minH: 4 },
    },
    {
        id: 'top-performers',
        title: 'Top Performers',
        icon: <TrendingUp size={18} className="text-emerald-500" />,
        category: 'portfolio',
        defaultLayout: { w: 3, h: 5, minW: 2, minH: 4 },
    },
    {
        id: 'worst-performers',
        title: 'Worst Performers',
        icon: <TrendingDown size={18} className="text-rose-500" />,
        category: 'portfolio',
        defaultLayout: { w: 3, h: 5, minW: 2, minH: 4 },
    },
    // Market Widgets
    {
        id: 'market-overview',
        title: 'Market Overview',
        icon: <Globe size={18} className="text-blue-500" />,
        category: 'market',
        defaultLayout: { w: 4, h: 4, minW: 3, minH: 3 },
    },
    {
        id: 'watchlist-mini',
        title: 'Watchlist',
        icon: <Star size={18} className="text-yellow-500" />,
        category: 'market',
        defaultLayout: { w: 3, h: 5, minW: 2, minH: 4 },
    },
    {
        id: 'market-news',
        title: 'Market News',
        icon: <Newspaper size={18} className="text-slate-500" />,
        category: 'market',
        defaultLayout: { w: 4, h: 6, minW: 3, minH: 4 },
    },
    {
        id: 'upcoming-earnings',
        title: 'Upcoming Earnings',
        icon: <Calendar size={18} className="text-violet-500" />,
        category: 'market',
        defaultLayout: { w: 3, h: 4, minW: 2, minH: 3 },
    },
    // Tool Widgets
    {
        id: 'quick-actions',
        title: 'Quick Actions',
        icon: <Zap size={18} className="text-amber-500" />,
        category: 'tools',
        defaultLayout: { w: 2, h: 3, minW: 2, minH: 2 },
    },
    {
        id: 'price-alerts',
        title: 'Price Alerts',
        icon: <Bell size={18} className="text-rose-500" />,
        category: 'tools',
        defaultLayout: { w: 3, h: 4, minW: 2, minH: 3 },
    },
    {
        id: 'dividend-tracker',
        title: 'Dividend Tracker',
        icon: <DollarSign size={18} className="text-green-500" />,
        category: 'tools',
        defaultLayout: { w: 3, h: 4, minW: 2, minH: 3 },
    },
    {
        id: 'performance-chart',
        title: 'Performance Chart',
        icon: <Activity size={18} className="text-pink-500" />,
        category: 'tools',
        defaultLayout: { w: 6, h: 5, minW: 4, minH: 4 },
    },
];

// Size class mapping
const SIZE_CLASSES: Record<string, string> = {
    'portfolio-value': 'col-span-1 row-span-1',
    'total-invested': 'col-span-1 row-span-1',
    'daily-pnl': 'col-span-1 row-span-1',
    'total-gain': 'col-span-2 row-span-1',
    'holdings': 'col-span-2 row-span-2',
    'sector-allocation': 'col-span-1 row-span-2',
    'recent-trades': 'col-span-2 row-span-2',
    'top-performers': 'col-span-1 row-span-1',
    'worst-performers': 'col-span-1 row-span-1',
    'market-overview': 'col-span-2 row-span-1',
    'watchlist-mini': 'col-span-1 row-span-1',
    'market-news': 'col-span-1 row-span-2',
    'upcoming-earnings': 'col-span-1 row-span-1',
    'quick-actions': 'col-span-1 row-span-1',
    'price-alerts': 'col-span-1 row-span-1',
    'dividend-tracker': 'col-span-1 row-span-1',
    'performance-chart': 'col-span-2 row-span-2',
};

// ============ WIDGET CARD WRAPPER ============
interface WidgetCardProps {
    id: string;
    title: string;
    icon: ReactNode;
    isEditing: boolean;
    onRemove: () => void;
    sizeClass: string;
    children: ReactNode;
}

function WidgetCard({ id, title, icon, isEditing, onRemove, sizeClass, children }: WidgetCardProps) {
    const controls = useDragControls();

    // Height mapping based on row span
    const getMinHeight = () => {
        if (sizeClass.includes('row-span-2')) return 'min-h-[400px]';
        return 'min-h-[200px]';
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
                ${sizeClass} ${getMinHeight()}
                bg-card border rounded-[24px] overflow-hidden relative
                transition-all duration-200
                ${isEditing ? 'border-primary/40 shadow-lg shadow-primary/10 cursor-move' : 'border-border/60 shadow-xl shadow-black/5'}
            `}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-sm">
                <div className="flex items-center gap-2.5">
                    {isEditing && (
                        <div
                            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
                            onPointerDown={(e) => controls.start(e)}
                        >
                            <GripVertical size={14} />
                        </div>
                    )}
                    {icon}
                    <span className="font-bold text-xs uppercase tracking-wide">{title}</span>
                </div>
                {isEditing && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            onRemove();
                        }}
                        className="w-6 h-6 rounded-full bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-500 transition-colors"
                    >
                        <Minus size={12} />
                    </motion.button>
                )}
            </div>

            {/* Content */}
            <div className="p-4 h-[calc(100%-48px)] overflow-auto custom-scrollbar">
                {children}
            </div>

            {/* Edit mode overlay */}
            {isEditing && (
                <div className="absolute inset-0 pointer-events-none rounded-[24px] border-2 border-dashed border-primary/30 bg-primary/[0.02]" />
            )}
        </motion.div>
    );
}

// ============ MAIN DASHBOARD GRID ============
export default function DashboardGrid({
    isEditing,
    layouts,
    visibleWidgets,
    onLayoutChange,
    onRemoveWidget,
    renderWidget,
    widgetRegistry = WIDGET_DEFINITIONS,
}: DashboardGridProps) {
    // Get ordered widgets - use saved order from layouts if available
    const orderedWidgets = useMemo(() => {
        if (layouts?.lg && layouts.lg.length > 0) {
            // Sort by saved positions
            const sorted = [...visibleWidgets].sort((a, b) => {
                const posA = layouts.lg.find(l => l.i === a);
                const posB = layouts.lg.find(l => l.i === b);
                if (!posA || !posB) return 0;
                if (posA.y !== posB.y) return posA.y - posB.y;
                return posA.x - posB.x;
            });
            return sorted;
        }
        return visibleWidgets;
    }, [layouts, visibleWidgets]);

    // Handle reorder
    const handleReorder = useCallback((newOrder: string[]) => {
        // Generate new layouts based on order
        let currentX = 0;
        let currentY = 0;
        const maxCols = 4;

        const newLayouts: WidgetLayout[] = newOrder.map((widgetId) => {
            const def = widgetRegistry.find(w => w.id === widgetId);
            const sizeClass = SIZE_CLASSES[widgetId] || 'col-span-1 row-span-1';
            const colSpan = sizeClass.includes('col-span-2') ? 2 : 1;
            const rowSpan = sizeClass.includes('row-span-2') ? 2 : 1;

            // Check if widget fits in current row
            if (currentX + colSpan > maxCols) {
                currentX = 0;
                currentY += 1;
            }

            const layout: WidgetLayout = {
                i: widgetId,
                x: currentX,
                y: currentY,
                w: colSpan,
                h: rowSpan,
            };

            currentX += colSpan;

            return layout;
        });

        onLayoutChange({ lg: newLayouts, md: newLayouts, sm: newLayouts });
    }, [widgetRegistry, onLayoutChange]);

    if (visibleWidgets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6">
                    <Layers size={40} className="text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-black mb-2">No Widgets Visible</h3>
                <p className="text-muted-foreground max-w-sm">
                    Click the settings icon and use "Add Widget" to customize your dashboard.
                </p>
            </div>
        );
    }

    return (
        <div className="dashboard-grid">
            <Reorder.Group
                axis="y"
                values={orderedWidgets}
                onReorder={handleReorder}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-auto"
                style={{ display: 'grid' }}
            >
                {orderedWidgets.map((widgetId) => {
                    const def = widgetRegistry.find(w => w.id === widgetId);
                    if (!def) return null;

                    const sizeClass = SIZE_CLASSES[widgetId] || 'col-span-1 row-span-1';

                    return (
                        <Reorder.Item
                            key={widgetId}
                            value={widgetId}
                            dragListener={isEditing}
                            className={sizeClass}
                            style={{ gridColumn: sizeClass.includes('col-span-2') ? 'span 2' : 'span 1' }}
                        >
                            <WidgetCard
                                id={widgetId}
                                title={def.title}
                                icon={def.icon}
                                isEditing={isEditing}
                                onRemove={() => onRemoveWidget(widgetId)}
                                sizeClass=""
                            >
                                {renderWidget(widgetId)}
                            </WidgetCard>
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: hsl(var(--muted-foreground) / 0.2);
                    border-radius: 3px;
                }
                
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: hsl(var(--muted-foreground) / 0.3);
                }
            `}</style>
        </div>
    );
}
