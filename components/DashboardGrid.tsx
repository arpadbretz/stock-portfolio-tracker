'use client';

import { useMemo, ReactNode, useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
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
    Square,
} from 'lucide-react';

// ============ TYPES ============
export type WidgetSize = 'small' | 'medium' | 'large';

export interface WidgetDefinition {
    id: string;
    title: string;
    icon: ReactNode;
    category: 'core' | 'portfolio' | 'market' | 'tools';
    defaultSize: WidgetSize;
    allowedSizes: WidgetSize[];
}

export interface WidgetLayout {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    size?: WidgetSize;
}

interface DashboardGridProps {
    isEditing: boolean;
    layouts: { [key: string]: WidgetLayout[] };
    visibleWidgets: string[];
    widgetSizes: { [widgetId: string]: WidgetSize };
    onLayoutChange: (layouts: { [key: string]: WidgetLayout[] }) => void;
    onRemoveWidget: (widgetId: string) => void;
    onResizeWidget: (widgetId: string, size: WidgetSize) => void;
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
        defaultSize: 'medium',
        allowedSizes: ['small', 'medium', 'large'],
    },
    {
        id: 'total-invested',
        title: 'Total Invested',
        icon: <BarChart3 size={18} className="text-blue-500" />,
        category: 'core',
        defaultSize: 'medium',
        allowedSizes: ['small', 'medium', 'large'],
    },
    {
        id: 'daily-pnl',
        title: "Today's P&L",
        icon: <TrendingUp size={18} className="text-amber-500" />,
        category: 'core',
        defaultSize: 'medium',
        allowedSizes: ['small', 'medium', 'large'],
    },
    {
        id: 'total-gain',
        title: 'Total Gain/Loss',
        icon: <Activity size={18} className="text-purple-500" />,
        category: 'core',
        defaultSize: 'large',
        allowedSizes: ['medium', 'large'],
    },
    // Portfolio Widgets
    {
        id: 'holdings',
        title: 'Holdings',
        icon: <Layers size={18} className="text-indigo-500" />,
        category: 'portfolio',
        defaultSize: 'large',
        allowedSizes: ['medium', 'large'],
    },
    {
        id: 'sector-allocation',
        title: 'Sector Allocation',
        icon: <PieChart size={18} className="text-cyan-500" />,
        category: 'portfolio',
        defaultSize: 'medium',
        allowedSizes: ['small', 'medium', 'large'],
    },
    {
        id: 'recent-trades',
        title: 'Recent Trades',
        icon: <Clock size={18} className="text-orange-500" />,
        category: 'portfolio',
        defaultSize: 'large',
        allowedSizes: ['medium', 'large'],
    },
    {
        id: 'top-performers',
        title: 'Top Performers',
        icon: <TrendingUp size={18} className="text-emerald-500" />,
        category: 'portfolio',
        defaultSize: 'medium',
        allowedSizes: ['small', 'medium', 'large'],
    },
    {
        id: 'worst-performers',
        title: 'Worst Performers',
        icon: <TrendingDown size={18} className="text-rose-500" />,
        category: 'portfolio',
        defaultSize: 'medium',
        allowedSizes: ['small', 'medium', 'large'],
    },
    // Market Widgets
    {
        id: 'market-overview',
        title: 'Market Overview',
        icon: <Globe size={18} className="text-blue-500" />,
        category: 'market',
        defaultSize: 'large',
        allowedSizes: ['medium', 'large'],
    },
    {
        id: 'watchlist-mini',
        title: 'Watchlist',
        icon: <Star size={18} className="text-yellow-500" />,
        category: 'market',
        defaultSize: 'medium',
        allowedSizes: ['small', 'medium', 'large'],
    },
    {
        id: 'market-news',
        title: 'Market News',
        icon: <Newspaper size={18} className="text-slate-500" />,
        category: 'market',
        defaultSize: 'large',
        allowedSizes: ['medium', 'large'],
    },
    {
        id: 'upcoming-earnings',
        title: 'Upcoming Earnings',
        icon: <Calendar size={18} className="text-violet-500" />,
        category: 'market',
        defaultSize: 'medium',
        allowedSizes: ['small', 'medium', 'large'],
    },
    // Tool Widgets
    {
        id: 'quick-actions',
        title: 'Quick Actions',
        icon: <Zap size={18} className="text-amber-500" />,
        category: 'tools',
        defaultSize: 'small',
        allowedSizes: ['small', 'medium'],
    },
    {
        id: 'price-alerts',
        title: 'Price Alerts',
        icon: <Bell size={18} className="text-rose-500" />,
        category: 'tools',
        defaultSize: 'medium',
        allowedSizes: ['small', 'medium', 'large'],
    },
    {
        id: 'dividend-tracker',
        title: 'Dividend Tracker',
        icon: <DollarSign size={18} className="text-green-500" />,
        category: 'tools',
        defaultSize: 'medium',
        allowedSizes: ['small', 'medium', 'large'],
    },
    {
        id: 'performance-chart',
        title: 'Performance Chart',
        icon: <Activity size={18} className="text-pink-500" />,
        category: 'tools',
        defaultSize: 'large',
        allowedSizes: ['medium', 'large'],
    },
];

// Size classes and heights
const SIZE_CONFIG: Record<WidgetSize, { colSpan: string; height: string }> = {
    small: { colSpan: 'col-span-1', height: 'h-[220px]' },
    medium: { colSpan: 'col-span-1', height: 'h-[300px]' },
    large: { colSpan: 'col-span-1 lg:col-span-2', height: 'h-[400px]' },
};

// ============ DRAGGABLE WIDGET CARD ============
interface DraggableWidgetCardProps {
    id: string;
    index: number;
    title: string;
    icon: ReactNode;
    size: WidgetSize;
    allowedSizes: WidgetSize[];
    isEditing: boolean;
    onRemove: () => void;
    onResize: (size: WidgetSize) => void;
    onDragEnd: (fromIndex: number, toIndex: number) => void;
    totalWidgets: number;
    children: ReactNode;
}

function DraggableWidgetCard({
    id,
    index,
    title,
    icon,
    size,
    allowedSizes,
    isEditing,
    onRemove,
    onResize,
    onDragEnd,
    totalWidgets,
    children,
}: DraggableWidgetCardProps) {
    const [isDragging, setIsDragging] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const config = SIZE_CONFIG[size];

    const handleDragEnd = useCallback(
        (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
            setIsDragging(false);

            // Calculate which position we dragged to based on movement
            const threshold = 100; // pixels needed to move to swap
            const moveAmount = Math.round(info.offset.y / threshold);

            if (moveAmount !== 0) {
                const newIndex = Math.max(0, Math.min(totalWidgets - 1, index + moveAmount));
                if (newIndex !== index) {
                    onDragEnd(index, newIndex);
                }
            }
        },
        [index, totalWidgets, onDragEnd]
    );

    return (
        <motion.div
            ref={cardRef}
            layout
            layoutId={id}
            drag={isEditing ? "y" : false}
            dragSnapToOrigin
            dragElastic={0.1}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.02, zIndex: 50, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={`${config.colSpan} ${config.height}`}
        >
            <div
                className={`
                    h-full w-full bg-card border rounded-[24px] overflow-hidden relative
                    transition-all duration-200
                    ${isEditing ? 'border-primary/40 shadow-lg shadow-primary/10' : 'border-border/60 shadow-xl shadow-black/5'}
                    ${isDragging ? 'cursor-grabbing' : isEditing ? 'cursor-grab' : ''}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2.5">
                        {isEditing && (
                            <div className="text-muted-foreground hover:text-foreground transition-colors touch-none">
                                <GripVertical size={14} />
                            </div>
                        )}
                        {icon}
                        <span className="font-bold text-xs uppercase tracking-wide">{title}</span>
                    </div>
                    {isEditing && (
                        <div className="flex items-center gap-1.5">
                            {/* Size toggle buttons */}
                            <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
                                {allowedSizes.includes('small') && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onResize('small'); }}
                                        className={`p-1.5 rounded-md transition-colors ${size === 'small' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        title="Small"
                                    >
                                        <Minimize2 size={12} />
                                    </button>
                                )}
                                {allowedSizes.includes('medium') && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onResize('medium'); }}
                                        className={`p-1.5 rounded-md transition-colors ${size === 'medium' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        title="Medium"
                                    >
                                        <Square size={12} />
                                    </button>
                                )}
                                {allowedSizes.includes('large') && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onResize('large'); }}
                                        className={`p-1.5 rounded-md transition-colors ${size === 'large' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                                        title="Large (2 columns)"
                                    >
                                        <Maximize2 size={12} />
                                    </button>
                                )}
                            </div>
                            {/* Remove button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                className="w-7 h-7 rounded-full bg-rose-500/10 hover:bg-rose-500/20 flex items-center justify-center text-rose-500 transition-colors"
                            >
                                <Minus size={14} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 h-[calc(100%-52px)] overflow-auto custom-scrollbar">
                    {children}
                </div>

                {/* Edit mode overlay */}
                {isEditing && !isDragging && (
                    <div className="absolute inset-0 pointer-events-none rounded-[24px] border-2 border-dashed border-primary/20" />
                )}
            </div>
        </motion.div>
    );
}

// ============ MAIN DASHBOARD GRID ============
export default function DashboardGrid({
    isEditing,
    layouts,
    visibleWidgets,
    widgetSizes,
    onLayoutChange,
    onRemoveWidget,
    onResizeWidget,
    renderWidget,
    widgetRegistry = WIDGET_DEFINITIONS,
}: DashboardGridProps) {
    // Get ordered widgets from layouts or use visible widgets order
    const [orderedWidgets, setOrderedWidgets] = useState<string[]>([]);

    // Initialize order from layouts or visibleWidgets
    useEffect(() => {
        if (layouts?.lg && layouts.lg.length > 0) {
            const sorted = [...visibleWidgets].sort((a, b) => {
                const posA = layouts.lg.find(l => l.i === a);
                const posB = layouts.lg.find(l => l.i === b);
                if (!posA || !posB) return 0;
                if (posA.y !== posB.y) return posA.y - posB.y;
                return posA.x - posB.x;
            });
            setOrderedWidgets(sorted);
        } else {
            setOrderedWidgets(visibleWidgets);
        }
    }, [layouts, visibleWidgets]);

    // Handle reorder after drag
    const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
        const newOrder = [...orderedWidgets];
        const [removed] = newOrder.splice(fromIndex, 1);
        newOrder.splice(toIndex, 0, removed);

        setOrderedWidgets(newOrder);

        // Generate new layout positions
        const newLayouts: WidgetLayout[] = newOrder.map((widgetId, idx) => ({
            i: widgetId,
            x: idx % 2,
            y: Math.floor(idx / 2),
            w: 1,
            h: 1,
            size: widgetSizes[widgetId],
        }));

        onLayoutChange({ lg: newLayouts, md: newLayouts, sm: newLayouts });
    }, [orderedWidgets, widgetSizes, onLayoutChange]);

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
            {isEditing && (
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-xl text-center">
                    <p className="text-sm text-primary font-medium">
                        ✨ Edit Mode: Drag widgets to reorder • Use size buttons to resize • Click minus to remove
                    </p>
                </div>
            )}

            <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-auto"
            >
                <AnimatePresence mode="popLayout">
                    {orderedWidgets.map((widgetId, index) => {
                        const def = widgetRegistry.find(w => w.id === widgetId);
                        if (!def) return null;

                        const size = widgetSizes[widgetId] || def.defaultSize;

                        return (
                            <DraggableWidgetCard
                                key={widgetId}
                                id={widgetId}
                                index={index}
                                title={def.title}
                                icon={def.icon}
                                size={size}
                                allowedSizes={def.allowedSizes}
                                isEditing={isEditing}
                                onRemove={() => onRemoveWidget(widgetId)}
                                onResize={(newSize) => onResizeWidget(widgetId, newSize)}
                                onDragEnd={handleReorder}
                                totalWidgets={orderedWidgets.length}
                            >
                                {renderWidget(widgetId)}
                            </DraggableWidgetCard>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

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
