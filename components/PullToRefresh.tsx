'use client';

import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
    children: ReactNode;
    onRefresh: () => Promise<void>;
    threshold?: number;
}

export default function PullToRefresh({ children, onRefresh, threshold = 80 }: PullToRefreshProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startY = useRef(0);
    const isPulling = useRef(false);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (containerRef.current?.scrollTop === 0) {
            startY.current = e.touches[0].clientY;
            isPulling.current = true;
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isPulling.current || isRefreshing) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY.current;

        if (diff > 0 && containerRef.current?.scrollTop === 0) {
            // Apply resistance to pull
            const resistance = 0.5;
            const newDistance = Math.min(diff * resistance, threshold * 1.5);
            setPullDistance(newDistance);

            // Prevent default scrolling when pulling
            if (newDistance > 10) {
                e.preventDefault();
            }
        }
    }, [isRefreshing, threshold]);

    const handleTouchEnd = useCallback(async () => {
        if (!isPulling.current) return;
        isPulling.current = false;

        if (pullDistance >= threshold && !isRefreshing) {
            setIsRefreshing(true);
            setPullDistance(threshold * 0.75); // Keep indicator visible

            try {
                await onRefresh();
            } finally {
                setIsRefreshing(false);
                setPullDistance(0);
            }
        } else {
            setPullDistance(0);
        }
    }, [pullDistance, threshold, isRefreshing, onRefresh]);

    const progress = Math.min(pullDistance / threshold, 1);
    const rotation = progress * 360;

    return (
        <div
            ref={containerRef}
            className="h-full overflow-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Pull indicator */}
            <AnimatePresence>
                {(pullDistance > 0 || isRefreshing) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-center py-4 -mb-8"
                        style={{ paddingTop: pullDistance }}
                    >
                        <motion.div
                            className={`p-3 rounded-full ${progress >= 1 || isRefreshing
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                            animate={{
                                rotate: isRefreshing ? 360 : rotation,
                                scale: progress >= 1 ? 1.1 : 1,
                            }}
                            transition={{
                                rotate: isRefreshing
                                    ? { duration: 1, repeat: Infinity, ease: 'linear' }
                                    : { duration: 0 },
                            }}
                        >
                            <RefreshCw size={20} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Children content */}
            <motion.div
                animate={{
                    y: pullDistance > 0 ? pullDistance * 0.3 : 0,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                {children}
            </motion.div>
        </div>
    );
}
