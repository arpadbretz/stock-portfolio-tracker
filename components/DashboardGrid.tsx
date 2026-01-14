'use client';

import { useMemo, ReactNode, useState, useCallback, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    UniqueIdentifier,
    MeasuringStrategy,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
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
    renderWidget: (widgetId: string, size: WidgetSize) => ReactNode;
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
        id: 'asset-allocation',
        title: 'Allocation',
        icon: <Layers size={18} className="text-pink-500" />,
        category: 'portfolio',
        defaultSize: 'medium',
        allowedSizes: ['small', 'medium', 'large'],
    },
    {
        id: 'performance-line',
        title: 'Performance',
        icon: <Activity size={18} className="text-emerald-500" />,
        category: 'portfolio',
        defaultSize: 'large',
        allowedSizes: ['medium', 'large'],
    },
];

// Size classes and heights
const SIZE_CONFIG: Record<WidgetSize, { colSpan: string; rowSpan: string; height: string; gridSpan: number }> = {
    small: { colSpan: 'col-span-1', rowSpan: 'row-span-2', height: 'h-[148px]', gridSpan: 1 },
    medium: { colSpan: 'col-span-1', rowSpan: 'row-span-4', height: 'h-[312px]', gridSpan: 1 },
    large: { colSpan: 'col-span-1 lg:col-span-2', rowSpan: 'row-span-6', height: 'h-[476px]', gridSpan: 2 },
};

// ============ SORTABLE WIDGET CARD ============
interface SortableWidgetCardProps {
    id: string;
    title: string;
    icon: ReactNode;
    size: WidgetSize;
    allowedSizes: WidgetSize[];
    isEditing: boolean;
    onRemove: () => void;
    onResize: (size: WidgetSize) => void;
    children: ReactNode;
}

function SortableWidgetCard({
    id,
    title,
    icon,
    size,
    allowedSizes,
    isEditing,
    onRemove,
    onResize,
    children,
}: SortableWidgetCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1000 : undefined,
    };

    const config = SIZE_CONFIG[size];

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            layout
            layoutId={id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
                opacity: isDragging ? 0.8 : 1,
                scale: isDragging ? 1.02 : 1,
            }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`${config.colSpan} ${config.rowSpan} ${config.height} transition-all duration-200`}
        >
            <div
                className={`
                    h-full w-full bg-card border rounded-[24px] overflow-hidden relative
                    transition-all duration-200
                    ${isEditing ? 'border-primary/40 shadow-lg shadow-primary/10' : 'border-border/60 shadow-xl shadow-black/5'}
                    ${isDragging ? 'shadow-2xl shadow-primary/30 ring-2 ring-primary/40' : ''}
                `}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-card/80 backdrop-blur-sm">
                    <div className="flex items-center gap-2.5">
                        {isEditing && (
                            <div
                                {...attributes}
                                {...listeners}
                                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-primary transition-colors touch-none p-1 -ml-1 rounded hover:bg-primary/10"
                            >
                                <GripVertical size={16} />
                            </div>
                        )}
                        {icon}
                        <span className="font-bold text-xs uppercase tracking-wide">{title}</span>
                    </div>
                    {isEditing && (
                        <div className="flex items-center gap-2">
                            {/* Size toggle buttons */}
                            <div className="flex items-center bg-muted/50 rounded-lg p-0.5 border border-border/50">
                                {allowedSizes.includes('small') && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onResize('small'); }}
                                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${size === 'small'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`}
                                        title="Small"
                                    >
                                        S
                                    </button>
                                )}
                                {allowedSizes.includes('medium') && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onResize('medium'); }}
                                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${size === 'medium'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`}
                                        title="Medium"
                                    >
                                        M
                                    </button>
                                )}
                                {allowedSizes.includes('large') && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onResize('large'); }}
                                        className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${size === 'large'
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`}
                                        title="Large (2 columns)"
                                    >
                                        L
                                    </button>
                                )}
                            </div>
                            {/* Remove button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove();
                                }}
                                className="w-7 h-7 rounded-full bg-rose-500/10 hover:bg-rose-500 hover:text-white flex items-center justify-center text-rose-500 transition-all"
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

                {/* Edit mode indicator */}
                {isEditing && !isDragging && (
                    <div className="absolute inset-0 pointer-events-none rounded-[24px] border-2 border-dashed border-primary/20" />
                )}
            </div>
        </motion.div>
    );
}

// ============ DRAG OVERLAY CARD ============
function DragOverlayCard({
    title,
    icon,
    size,
}: {
    title: string;
    icon: ReactNode;
    size: WidgetSize;
}) {
    const config = SIZE_CONFIG[size];

    return (
        <div className={`${config.height} w-80 max-w-md`}>
            <div className="h-full w-full bg-card border-2 border-primary rounded-[24px] shadow-2xl shadow-primary/40 rotate-2">
                <div className="flex items-center gap-2.5 px-4 py-3 border-b border-border/40 bg-card">
                    <GripVertical size={16} className="text-primary" />
                    {icon}
                    <span className="font-bold text-xs uppercase tracking-wide">{title}</span>
                </div>
                <div className="p-4 flex items-center justify-center h-[calc(100%-52px)]">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <motion.div
                            animate={{ y: [0, -5, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                            <Layers size={32} className="text-primary/50" />
                        </motion.div>
                        <span className="text-sm font-medium">Drop to reposition</span>
                    </div>
                </div>
            </div>
        </div>
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
    const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
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

    // Setup dnd-kit sensors with better activation constraints
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10, // 10px movement before drag starts
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = orderedWidgets.indexOf(active.id as string);
            const newIndex = orderedWidgets.indexOf(over.id as string);

            const newOrder = arrayMove(orderedWidgets, oldIndex, newIndex);
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
        }
    }, [orderedWidgets, widgetSizes, onLayoutChange]);

    const activeWidget = activeId ? widgetRegistry.find(w => w.id === activeId) : null;

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
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-xl">
                            <Layers size={18} className="text-primary" />
                        </div>
                        <div>
                            <p className="font-bold text-sm text-foreground">Edit Mode Active</p>
                            <p className="text-xs text-muted-foreground">
                                Drag widgets to reorder • Use S/M/L buttons to resize • Click ✕ to remove
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                measuring={{
                    droppable: {
                        strategy: MeasuringStrategy.Always,
                    },
                }}
            >
                {/* @ts-ignore - React 19 types support varies by environment */}
                <SortableContext items={orderedWidgets} strategy={rectSortingStrategy}>
                    <motion.div
                        layout
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 grid-flow-row-dense auto-rows-[68px] gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {orderedWidgets.map((widgetId) => {
                                const def = widgetRegistry.find(w => w.id === widgetId);
                                if (!def) return null;

                                const size = widgetSizes[widgetId] || def.defaultSize;

                                return (
                                    <SortableWidgetCard
                                        key={widgetId}
                                        id={widgetId}
                                        title={def.title}
                                        icon={def.icon}
                                        size={size}
                                        allowedSizes={def.allowedSizes}
                                        isEditing={isEditing}
                                        onRemove={() => onRemoveWidget(widgetId)}
                                        onResize={(newSize) => onResizeWidget(widgetId, newSize)}
                                    >
                                        {renderWidget(widgetId, size)}
                                    </SortableWidgetCard>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                </SortableContext>

                {/* Drag Overlay - Shows floating card while dragging */}
                {/* @ts-ignore - React 19 types support varies by environment */}
                <DragOverlay dropAnimation={{
                    duration: 200,
                    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                }}>
                    {activeId && activeWidget ? (
                        <DragOverlayCard
                            title={activeWidget.title}
                            icon={activeWidget.icon}
                            size={widgetSizes[activeId as string] || activeWidget.defaultSize}
                        />
                    ) : null}
                </DragOverlay>
            </DndContext>

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
