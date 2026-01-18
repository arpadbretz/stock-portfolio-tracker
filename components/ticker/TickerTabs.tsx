'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    BarChart3,
    Target,
    Activity,
    FileText
} from 'lucide-react';

export type TickerTab = 'overview' | 'financials' | 'valuation' | 'technicals' | 'filings';

interface TickerTabsProps {
    activeTab: TickerTab;
    onTabChange: (tab: TickerTab) => void;
}

const TABS: { id: TickerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
    { id: 'financials', label: 'Financials', icon: <BarChart3 size={16} /> },
    { id: 'valuation', label: 'Valuation', icon: <Target size={16} /> },
    { id: 'technicals', label: 'Technicals', icon: <Activity size={16} /> },
    { id: 'filings', label: 'Filings & News', icon: <FileText size={16} /> },
];

export default function TickerTabs({ activeTab, onTabChange }: TickerTabsProps) {
    return (
        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border mb-8 -mx-6 px-6 lg:-mx-12 lg:px-12">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-2">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
