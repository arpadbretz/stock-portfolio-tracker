'use client';

import { motion } from 'framer-motion';
import { CSSProperties } from 'react';

interface SkeletonProps {
    className?: string;
    style?: CSSProperties;
}

// Base skeleton shimmer effect
export function Skeleton({ className = '', style }: SkeletonProps) {
    return (
        <div
            className={`relative overflow-hidden bg-muted rounded-lg ${className}`}
            style={style}
        >
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            />
        </div>
    );
}

// Text line skeleton
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
                />
            ))}
        </div>
    );
}

// Stat card skeleton
export function SkeletonStatCard({ className = '' }: SkeletonProps) {
    return (
        <div className={`bg-card border border-border rounded-3xl p-6 ${className}`}>
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-20" />
        </div>
    );
}

// Holdings row skeleton
export function SkeletonHoldingsRow() {
    return (
        <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div>
                    <Skeleton className="h-5 w-16 mb-2" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-3 w-16" />
                </div>
                <div className="text-right">
                    <Skeleton className="h-5 w-24 mb-2" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
        </div>
    );
}

// Chart skeleton
export function SkeletonChart({ className = '' }: SkeletonProps) {
    return (
        <div className={`bg-card border border-border rounded-3xl p-6 ${className}`}>
            <div className="flex items-center justify-between mb-6">
                <Skeleton className="h-6 w-32" />
                <div className="flex gap-2">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-8 w-14 rounded-lg" />
                    ))}
                </div>
            </div>
            <div className="relative h-64">
                <div className="absolute inset-0 flex items-end justify-around gap-2">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            className="flex-1"
                            style={{ height: `${30 + Math.random() * 60}%` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Table skeleton
export function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex gap-4 p-3 border-b border-border">
                {Array.from({ length: columns }).map((_, i) => (
                    <Skeleton key={i} className={`h-4 ${i === 0 ? 'w-8' : 'flex-1'}`} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIdx) => (
                <div key={rowIdx} className="flex gap-4 p-3 border-b border-border/50">
                    {Array.from({ length: columns }).map((_, colIdx) => (
                        <Skeleton key={colIdx} className={`h-4 ${colIdx === 0 ? 'w-8' : 'flex-1'}`} />
                    ))}
                </div>
            ))}
        </div>
    );
}

// Dashboard page skeleton
export function SkeletonDashboard() {
    return (
        <div className="min-h-screen px-6 py-10 lg:px-12 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <Skeleton className="h-4 w-32 mb-3" />
                    <Skeleton className="h-10 w-64" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="h-10 w-32 rounded-xl" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {[1, 2, 3, 4].map((i) => (
                    <SkeletonStatCard key={i} className="rounded-2xl p-5" />
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <SkeletonChart />
                </div>
                <div className="bg-card border border-border rounded-3xl p-6">
                    <Skeleton className="h-6 w-32 mb-6" />
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <SkeletonHoldingsRow key={i} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Ticker page skeleton
export function SkeletonTickerPage() {
    return (
        <div className="min-h-screen px-6 py-10 lg:px-12 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-10">
                <Skeleton className="w-16 h-16 rounded-2xl" />
                <div>
                    <Skeleton className="h-8 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="ml-auto flex items-end flex-col">
                    <Skeleton className="h-10 w-32 mb-2" />
                    <Skeleton className="h-5 w-24" />
                </div>
            </div>

            {/* Chart */}
            <SkeletonChart className="mb-6" />

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div key={i} className="bg-card border border-border rounded-2xl p-4">
                        <Skeleton className="h-3 w-20 mb-2" />
                        <Skeleton className="h-6 w-24" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Watchlist skeleton
export function SkeletonWatchlist() {
    return (
        <div className="min-h-screen px-6 py-10 lg:px-12 max-w-[1400px] mx-auto">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <Skeleton className="h-4 w-24 mb-3" />
                    <Skeleton className="h-10 w-48" />
                </div>
                <Skeleton className="h-12 w-32 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-card border border-border rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-6 rounded" />
                        </div>
                        <Skeleton className="h-8 w-24 mb-2" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                ))}
            </div>
        </div>
    );
}
