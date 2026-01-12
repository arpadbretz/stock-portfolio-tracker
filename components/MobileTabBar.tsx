'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Search,
    LineChart,
    Bell,
    User,
    Plus,
    X,
    Calculator,
    Briefcase,
    Upload,
} from 'lucide-react';

interface TabItem {
    name: string;
    href: string;
    icon: React.ReactNode;
}

const mainTabs: TabItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={22} /> },
    { name: 'Research', href: '/dashboard/stocks', icon: <Search size={22} /> },
    { name: 'Watchlist', href: '/dashboard/watchlist', icon: <LineChart size={22} /> },
    { name: 'Alerts', href: '/dashboard/alerts', icon: <Bell size={22} /> },
    { name: 'Account', href: '/dashboard/account', icon: <User size={22} /> },
];

const moreItems: TabItem[] = [
    { name: 'DCF Calculator', href: '/dashboard/dcf', icon: <Calculator size={20} /> },
    { name: 'Portfolios', href: '/dashboard/portfolios/manage', icon: <Briefcase size={20} /> },
    { name: 'Import Data', href: '/dashboard/import', icon: <Upload size={20} /> },
];

export default function MobileTabBar() {
    const pathname = usePathname();
    const [showMore, setShowMore] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Hide on scroll down, show on scroll up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }
            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    return (
        <>
            {/* More Menu Overlay */}
            <AnimatePresence>
                {showMore && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowMore(false)}
                            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="fixed bottom-24 left-4 right-4 bg-card border border-border rounded-3xl p-4 z-50 md:hidden shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-sm">More Options</h3>
                                <button
                                    onClick={() => setShowMore(false)}
                                    className="p-2 rounded-full hover:bg-muted"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {moreItems.map((item) => (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        onClick={() => setShowMore(false)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${isActive(item.href)
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {item.icon}
                                        <span className="text-[10px] font-bold">{item.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Tab Bar */}
            <motion.nav
                initial={{ y: 100 }}
                animate={{ y: isVisible ? 0 : 100 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            >
                <div className="mx-3 mb-3">
                    <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-[28px] shadow-2xl shadow-black/20 px-2 py-2">
                        <div className="flex items-center justify-around">
                            {mainTabs.slice(0, 2).map((tab) => (
                                <Link
                                    key={tab.name}
                                    href={tab.href}
                                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${isActive(tab.href)
                                            ? 'text-primary'
                                            : 'text-muted-foreground'
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl transition-all ${isActive(tab.href) ? 'bg-primary/10' : ''
                                        }`}>
                                        {tab.icon}
                                    </div>
                                    <span className="text-[9px] font-bold">{tab.name}</span>
                                </Link>
                            ))}

                            {/* Center Plus Button */}
                            <button
                                onClick={() => setShowMore(!showMore)}
                                className={`relative -mt-6 p-4 rounded-full shadow-lg transition-all ${showMore
                                        ? 'bg-primary text-primary-foreground rotate-45'
                                        : 'bg-primary text-primary-foreground'
                                    }`}
                            >
                                <Plus size={24} strokeWidth={2.5} />
                                <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                            </button>

                            {mainTabs.slice(2, 4).map((tab) => (
                                <Link
                                    key={tab.name}
                                    href={tab.href}
                                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${isActive(tab.href)
                                            ? 'text-primary'
                                            : 'text-muted-foreground'
                                        }`}
                                >
                                    <div className={`p-2 rounded-xl transition-all ${isActive(tab.href) ? 'bg-primary/10' : ''
                                        }`}>
                                        {tab.icon}
                                    </div>
                                    <span className="text-[9px] font-bold">{tab.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Spacer to prevent content from being hidden behind tab bar */}
            <div className="h-24 md:hidden" />
        </>
    );
}
