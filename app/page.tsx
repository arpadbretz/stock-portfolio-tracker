'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    PieChart,
    Shield,
    ArrowRight,
    LineChart,
    Zap,
    Globe,
    Search,
    ChevronRight,
    Lock,
    BarChart3,
    Check,
    Sparkles,
    Users,
    Target,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

// Animated stock ticker component for hero
const AnimatedTicker = ({ symbol, price, change, delay }: { symbol: string; price: string; change: number; delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="flex items-center gap-4 px-5 py-3 bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl"
    >
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <span className="text-primary font-black text-xs">{symbol.slice(0, 2)}</span>
        </div>
        <div>
            <p className="text-foreground font-black text-sm">{symbol}</p>
            <p className="text-muted-foreground text-xs font-bold">${price}</p>
        </div>
        <div className={`ml-auto px-2 py-1 rounded-lg text-xs font-black ${change >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {change >= 0 ? '+' : ''}{(change ?? 0).toFixed(2)}%
        </div>
    </motion.div>
);

export default function LandingPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [currentStat, setCurrentStat] = useState(0);

    const stats = [
        { value: '15min', label: 'Price Cache' },
        { value: 'GDPR', label: 'Compliant' },
        { value: '€0', label: 'Forever Free' },
    ];

    useEffect(() => {
        if (!isLoading && user) {
            router.push('/dashboard');
        }
    }, [user, isLoading, router]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStat((prev) => (prev + 1) % stats.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    if (isLoading || user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const features = [
        {
            title: 'Real-time Portfolio Sync',
            description: 'Track all your holdings with live price updates. Import from CSV or add manually.',
            icon: <Zap className="text-emerald-400" size={24} />,
            status: 'Live'
        },
        {
            title: 'Visual Analytics',
            description: 'Beautiful charts, sector breakdowns, and performance metrics at a glance.',
            icon: <PieChart className="text-blue-400" size={24} />,
            status: 'Live'
        },
        {
            title: 'Stock Research',
            description: 'Deep dive into any stock with fundamentals, news, analyst ratings, and more.',
            icon: <Search className="text-violet-400" size={24} />,
            status: 'Live'
        },
        {
            title: 'Share Portfolios',
            description: 'Generate secure, read-only links to share your portfolio with anyone.',
            icon: <Globe className="text-teal-400" size={24} />,
            status: 'Live'
        },
        {
            title: 'DCF Valuation',
            description: 'Institutional-grade discounted cash flow models to find intrinsic value.',
            icon: <Target className="text-orange-400" size={24} />,
            status: 'Coming Soon'
        },
        {
            title: 'Smart Watchlists',
            description: 'Track stocks you are researching with intelligent price alerts.',
            icon: <LineChart className="text-pink-400" size={24} />,
            status: 'Coming Soon'
        },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-inter">
            {/* Background Effects */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10 bg-background">
                {/* Animated gradient orbs */}
                <motion.div
                    animate={{
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-primary/8 blur-[150px] rounded-full opacity-60"
                />
                <motion.div
                    animate={{
                        x: [0, -30, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.15, 1]
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-emerald-500/5 blur-[150px] rounded-full opacity-60"
                />
                <motion.div
                    animate={{
                        x: [0, 20, 0],
                        scale: [1, 1.05, 1]
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[40%] left-[30%] w-[30%] h-[30%] bg-violet-500/5 blur-[120px] rounded-full opacity-40"
                />
                {/* Grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)`,
                        backgroundSize: '60px 60px'
                    }}
                />
            </div>

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-border/40 bg-background/70">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-xl shadow-lg shadow-primary/10">
                            <TrendingUp className="text-primary" size={24} />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-foreground">StockTrackr<span className="text-primary">.eu</span></span>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="hidden sm:block px-5 py-2.5 text-sm font-bold text-foreground hover:text-primary transition-colors">
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-6">
                <div className="container mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        {/* Left: Copy */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8"
                            >
                                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                                    <Sparkles size={14} />
                                </motion.div>
                                <span className="text-xs font-bold uppercase tracking-widest">100% Free • No Credit Card</span>
                            </motion.div>

                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground mb-6 tracking-tight leading-[1.1]">
                                <motion.span
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                    className="block"
                                >
                                    Track Your
                                </motion.span>
                                <motion.span
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]"
                                    style={{
                                        backgroundSize: '200% auto',
                                        animation: 'gradient 3s linear infinite'
                                    }}
                                >
                                    Investments
                                </motion.span>
                                <motion.span
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="block"
                                >
                                    Like a Pro.
                                </motion.span>
                            </h1>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed"
                            >
                                The modern portfolio tracker for European investors. Real-time prices, beautiful analytics, and deep stock research &mdash; all in one place.
                            </motion.p>

                            <div className="flex flex-col sm:flex-row gap-4 mb-12">
                                <Link
                                    href="/register"
                                    className="group px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base shadow-xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Create Free Account
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="px-8 py-4 bg-card hover:bg-muted text-foreground rounded-2xl font-bold text-base border border-border flex items-center justify-center gap-3 transition-all"
                                >
                                    Sign In
                                    <ChevronRight size={18} />
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex flex-wrap items-center gap-6">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Lock size={16} className="text-emerald-500" />
                                    <span className="text-sm font-bold">Bank-level Security</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Shield size={16} className="text-emerald-500" />
                                    <span className="text-sm font-bold">GDPR Compliant</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users size={16} className="text-emerald-500" />
                                    <span className="text-sm font-bold">EU Hosted</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Right: Live Dashboard Preview */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="relative"
                        >
                            {/* Main Dashboard Card */}
                            <div className="relative bg-card/80 backdrop-blur-xl border border-border/60 rounded-[32px] p-6 shadow-2xl">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Value</p>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.5 }}
                                            className="text-3xl font-black text-foreground"
                                        >
                                            €47,382.50
                                        </motion.p>
                                    </div>
                                    <div className="px-3 py-1.5 bg-emerald-500/10 rounded-lg">
                                        <span className="text-emerald-500 font-black text-sm">+12.4%</span>
                                    </div>
                                </div>

                                {/* Mini Chart Placeholder */}
                                <div className="h-32 mb-6 bg-gradient-to-t from-primary/5 to-transparent rounded-2xl flex items-end px-4 pb-4 gap-1">
                                    {[40, 55, 45, 70, 60, 80, 75, 90, 85, 95, 88, 100].map((h, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ delay: 0.8 + i * 0.05, duration: 0.4 }}
                                            className="flex-1 bg-primary/40 rounded-t-sm"
                                        />
                                    ))}
                                </div>

                                {/* Holdings Preview */}
                                <div className="space-y-3">
                                    <AnimatedTicker symbol="AAPL" price="178.50" change={2.34} delay={1.0} />
                                    <AnimatedTicker symbol="MSFT" price="378.20" change={1.87} delay={1.1} />
                                    <AnimatedTicker symbol="GOOGL" price="141.80" change={-0.45} delay={1.2} />
                                </div>
                            </div>

                            {/* Floating Stats Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.4 }}
                                className="absolute -bottom-6 -left-6 bg-card border border-border rounded-2xl px-5 py-4 shadow-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                        <BarChart3 className="text-primary" size={20} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground font-bold">Today's P&L</p>
                                        <p className="text-lg font-black text-emerald-500">+€1,247.30</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6 bg-card/30">
                <div className="container mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-primary font-bold uppercase tracking-widest text-xs mb-4 block">Features</span>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Everything You Need</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            A complete toolkit for tracking, analyzing, and managing your investment portfolio.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="p-8 bg-card border border-border/50 rounded-3xl hover:border-primary/30 hover:shadow-lg transition-all group"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors">
                                    {feature.icon}
                                </div>
                                <div className="flex items-center gap-3 mb-3">
                                    <h3 className="text-xl font-black">{feature.title}</h3>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${feature.status === 'Live'
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : 'bg-orange-500/10 text-orange-500'
                                        }`}>
                                        {feature.status}
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Mid-Page CTA Banner */}
            <section className="py-16 px-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-emerald-500/10 to-primary/10" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)]" />
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="container mx-auto relative z-10"
                >
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl md:text-4xl font-black mb-4 tracking-tight">
                            Start tracking your portfolio in <span className="text-primary">under 2 minutes</span>
                        </h2>
                        <p className="text-muted-foreground mb-8">
                            No credit card required. Import from CSV or add trades manually.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="group px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-xl shadow-primary/30 flex items-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
                                <Sparkles size={18} />
                                Get Started Free
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-emerald-500" />
                                    <span>100% Free Forever</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check size={16} className="text-emerald-500" />
                                    <span>No hidden fees</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Social Proof / Stats */}
            <section className="py-24 px-6">
                <div className="container mx-auto">
                    {/* Social Proof Stats Row */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
                    >
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: 'spring', delay: 0.1 }}
                                className="text-5xl md:text-6xl font-black text-primary mb-2"
                            >
                                500+
                            </motion.div>
                            <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Active Users</div>
                        </div>
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: 'spring', delay: 0.2 }}
                                className="text-5xl md:text-6xl font-black text-emerald-500 mb-2"
                            >
                                €2M+
                            </motion.div>
                            <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Assets Tracked</div>
                        </div>
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: 'spring', delay: 0.3 }}
                                className="text-5xl md:text-6xl font-black text-blue-500 mb-2"
                            >
                                10K+
                            </motion.div>
                            <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Trades Logged</div>
                        </div>
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ type: 'spring', delay: 0.4 }}
                                className="text-5xl md:text-6xl font-black text-orange-500 mb-2"
                            >
                                99.9%
                            </motion.div>
                            <div className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Uptime</div>
                        </div>
                    </motion.div>

                    {/* EU Trust Card */}
                    <div className="max-w-4xl mx-auto bg-card border border-border/60 rounded-[48px] p-12 md:p-16 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Shield size={150} className="text-primary" />
                        </div>

                        <h2 className="text-3xl md:text-5xl font-black mb-6 tracking-tight">
                            Built for European Investors
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-12">
                            Privacy-first, GDPR-compliant, and hosted in the EU. Your data stays yours.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
                                    <Check size={32} className="text-emerald-500" />
                                </div>
                                <div className="text-2xl font-black text-foreground mb-2">100% Free</div>
                                <div className="text-sm text-muted-foreground">No hidden fees, ever</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                                    <Lock size={32} className="text-blue-500" />
                                </div>
                                <div className="text-2xl font-black text-foreground mb-2">AES-256</div>
                                <div className="text-sm text-muted-foreground">Bank-level encryption</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                                    <Globe size={32} className="text-primary" />
                                </div>
                                <div className="text-2xl font-black text-foreground mb-2">EU Hosted</div>
                                <div className="text-sm text-muted-foreground">GDPR compliant</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="container mx-auto"
                >
                    <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                        Ready to take control?
                    </h2>
                    <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                        Join thousands of investors who track their portfolios with StockTrackr.eu
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="group px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg shadow-2xl shadow-primary/30 flex items-center gap-3 hover:scale-[1.03] active:scale-[0.98] transition-all"
                        >
                            Get Started Free
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/login"
                            className="px-10 py-5 bg-card hover:bg-muted text-foreground rounded-2xl font-bold text-lg border border-border transition-all"
                        >
                            Sign In Instead
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="py-16 border-t border-border/50 bg-card/20">
                <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="text-primary" size={24} />
                            <span className="text-xl font-black tracking-tighter">StockTrackr<span className="text-primary">.eu</span></span>
                        </div>
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                            The modern portfolio tracker for European investors. Track, analyze, and grow your investments.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-foreground">Product</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="#features" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="/register" className="hover:text-primary transition-colors">Get Started</Link></li>
                            <li><Link href="/login" className="hover:text-primary transition-colors">Sign In</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest mb-6 text-foreground">Legal</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link href="/legal/impresszum" className="hover:text-primary transition-colors">Impresszum</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="container mx-auto px-6 mt-12 pt-8 border-t border-border/20 text-center">
                    <p className="text-xs text-muted-foreground/50 font-bold">
                        © 2026 Prometheus Digital Kft. All rights reserved.
                    </p>
                </div>
            </footer>

            {/* Floating Mobile CTA */}
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 2 }}
                className="fixed bottom-6 left-4 right-4 z-50 md:hidden"
            >
                <Link
                    href="/register"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-2xl shadow-primary/40"
                >
                    <Sparkles size={18} />
                    Get Started Free
                    <ArrowRight size={18} />
                </Link>
            </motion.div>
        </div>
    );
}
