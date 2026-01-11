'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    LineChart,
    Database,
    Settings,
    Upload,
    Menu,
    X,
    TrendingUp,
    Briefcase,
    Search,
    Bell,
    Calculator,
    Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/components/auth/AuthProvider';
import ThemeToggle from '@/components/ThemeToggle';
import UserButton from '@/components/auth/UserButton';

const links = [
    { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} />, status: 'active' },
    { name: 'Stock Research', href: '/dashboard/stocks', icon: <Search size={20} />, status: 'active' },
    { name: 'Watchlist', href: '/dashboard/watchlist', icon: <LineChart size={20} />, status: 'active' },
    { name: 'Price Alerts', href: '/dashboard/alerts', icon: <Bell size={20} />, status: 'active' },
    { name: 'DCF Calculator', href: '/dashboard/dcf', icon: <Calculator size={20} />, status: 'active' },
    { name: 'Portfolios', href: '/dashboard/portfolios/manage', icon: <Briefcase size={20} />, status: 'active' },
    { name: 'Import Data', href: '/dashboard/import', icon: <Upload size={20} />, status: 'active' },
    { name: 'Admin', href: '/dashboard/admin', icon: <Crown size={20} />, status: 'active' },
    { name: 'Account', href: '/dashboard/account', icon: <Settings size={20} />, status: 'active' },
];

export default function Navigation() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [triggeredAlerts, setTriggeredAlerts] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Fetch triggered alerts for notification bell
    useEffect(() => {
        const fetchTriggeredAlerts = async () => {
            try {
                const res = await fetch('/api/alerts');
                const data = await res.json();
                if (data.success) {
                    // Check which alerts are triggered based on current price
                    const alertsWithPrices = await Promise.all(
                        data.data.map(async (alert: any) => {
                            try {
                                const priceRes = await fetch(`/api/stock/${alert.symbol}`);
                                const priceData = await priceRes.json();
                                const currentPrice = priceData.price;
                                const isTriggered = alert.condition === 'above'
                                    ? currentPrice >= alert.target_price
                                    : currentPrice <= alert.target_price;
                                return { ...alert, currentPrice, isTriggered };
                            } catch {
                                return { ...alert, isTriggered: false };
                            }
                        })
                    );
                    setTriggeredAlerts(alertsWithPrices.filter((a: any) => a.isTriggered));
                }
            } catch (err) {
                console.error('Failed to fetch alerts:', err);
            }
        };
        if (user) {
            fetchTriggeredAlerts();
            const interval = setInterval(fetchTriggeredAlerts, 60000); // Check every minute
            return () => clearInterval(interval);
        }
    }, [user]);

    if (!user) return null;

    return (
        <>
            {/* Mobile Header Architecture */}
            <div className="lg:hidden fixed top-0 w-full h-20 bg-card/80 backdrop-blur-xl border-b border-border/50 z-50 flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <div className="p-1 bg-primary/20 rounded-lg">
                        <TrendingUp className="text-primary" size={20} />
                    </div>
                    <span className="text-xl font-black tracking-tighter">StockTrackr<span className="text-primary truncate">.eu</span></span>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary"
                    >
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Desktop Command Center Sidebar */}
            <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-full w-72 bg-card border-r border-border/60 z-40 shadow-2xl shadow-black/5">
                <div className="p-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="p-2 bg-primary/20 rounded-[14px]">
                            <TrendingUp className="text-primary" size={28} />
                        </div>
                        <span className="text-2xl font-black tracking-tighter">StockTrackr<span className="text-primary">.eu</span></span>
                    </div>

                    <nav className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-4 px-2">Main Terminal</p>
                        {links.map((link) => (
                            <div key={link.name} className="relative group">
                                <Link
                                    href={link.href}
                                    className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm font-black tracking-tight transition-all relative overflow-hidden ${pathname === link.href
                                        ? 'bg-primary text-primary-foreground shadow-xl shadow-primary/20'
                                        : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                                        } ${link.status === 'soon' ? 'opacity-40 cursor-not-allowed group-hover:opacity-60 transition-opacity' : ''}`}
                                >
                                    <div className={`transition-transform duration-300 ${pathname === link.href ? '' : 'group-hover:scale-110'}`}>
                                        {link.icon}
                                    </div>
                                    <span>{link.name}</span>
                                    {link.status === 'soon' && (
                                        <span className="ml-auto text-[8px] bg-muted/20 px-1.5 py-0.5 rounded-md font-black backdrop-blur-md">SOON</span>
                                    )}
                                </Link>
                                {pathname === link.href && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="absolute -left-2 w-1.5 h-8 bg-primary rounded-r-full top-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                                    />
                                )}
                            </div>
                        ))}
                    </nav>
                </div>

                <div className="mt-auto p-8 border-t border-border/40 space-y-6 bg-muted/20">
                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-border hover:bg-muted transition-all"
                        >
                            <div className="relative">
                                <Bell size={18} className={triggeredAlerts.length > 0 ? 'text-orange-500' : 'text-muted-foreground'} />
                                {triggeredAlerts.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] font-black text-white flex items-center justify-center">
                                        {triggeredAlerts.length}
                                    </span>
                                )}
                            </div>
                            <span className="text-sm font-bold">Notifications</span>
                            {triggeredAlerts.length > 0 && (
                                <span className="ml-auto text-xs font-bold text-orange-500">{triggeredAlerts.length} alerts</span>
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
                                >
                                    {triggeredAlerts.length === 0 ? (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            No triggered alerts
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-border">
                                            {triggeredAlerts.map((alert) => (
                                                <Link
                                                    key={alert.id}
                                                    href={`/dashboard/ticker/${alert.symbol}`}
                                                    onClick={() => setShowNotifications(false)}
                                                    className="block p-4 hover:bg-muted transition-colors"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-black">{alert.symbol}</span>
                                                        <span className="text-xs font-bold text-orange-500">TRIGGERED</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {alert.condition === 'above' ? '↑' : '↓'} ${alert.target_price.toFixed(2)}
                                                        <span className="ml-2">Now: ${alert.currentPrice?.toFixed(2)}</span>
                                                    </div>
                                                </Link>
                                            ))}
                                            <Link
                                                href="/dashboard/alerts"
                                                onClick={() => setShowNotifications(false)}
                                                className="block p-3 text-center text-xs font-bold text-primary hover:bg-primary/10"
                                            >
                                                View All Alerts →
                                            </Link>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center justify-between">
                        <UserButton />
                        <ThemeToggle />
                    </div>
                </div>
            </aside>

            {/* Mobile Drawer Context */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-md z-[55]"
                        />
                        <motion.div
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="lg:hidden fixed inset-y-0 left-0 w-[300px] bg-card z-[60] shadow-3xl p-10 border-r border-border/50"
                        >
                            <div className="flex items-center gap-3 mb-12">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <TrendingUp className="text-primary" size={24} />
                                </div>
                                <span className="text-2xl font-black tracking-tighter">StockTrackr<span className="text-primary truncate">.eu</span></span>
                            </div>

                            <nav className="space-y-4">
                                {links.map((link) => (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        className={`flex items-center gap-5 px-6 py-4 rounded-[24px] transition-all ${pathname === link.href
                                            ? 'bg-primary text-primary-foreground shadow-2xl shadow-primary/30'
                                            : 'text-muted-foreground hover:bg-muted'
                                            } ${link.status === 'soon' ? 'opacity-40' : ''}`}
                                    >
                                        <div className={pathname === link.href ? '' : 'transition-transform group-active:scale-95'}>
                                            {link.icon}
                                        </div>
                                        <span className="font-black tracking-tight">{link.name}</span>
                                        {link.status === 'soon' && (
                                            <span className="ml-auto text-[8px] uppercase font-black px-2 py-1 bg-muted rounded-lg">Soon</span>
                                        )}
                                    </Link>
                                ))}
                            </nav>

                            <div className="absolute bottom-10 left-10 right-10 pt-10 border-t border-border/50">
                                <UserButton />
                                <div className="mt-8 flex justify-center opacity-50 text-[10px] font-black uppercase tracking-widest">
                                    V.1.0 Operational
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
