'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    TrendingUp,
    PieChart,
    Shield,
    Layers,
    ArrowRight,
    LineChart,
    Zap,
    Globe,
    Database,
    Search,
    ChevronRight,
    Lock,
    BarChart3
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function LandingPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

    useEffect(() => {
        if (!isLoading && user) {
            router.push('/dashboard');
        }
    }, [user, isLoading, router]);

    if (isLoading || user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const features = [
        {
            title: 'Real-time Intelligence',
            description: 'Live precision data for global equities. Sync your portfolio across every device instantly.',
            icon: <Zap className="text-emerald-400" />,
            status: 'Operational'
        },
        {
            title: 'Visual Core',
            description: 'Stunning sector heatmaps and performance distribution metrics for deep insight.',
            icon: <PieChart className="text-blue-400" />,
            status: 'Operational'
        },
        {
            title: 'Intrinsic Valuation',
            description: 'Institutional-grade DCF models to identify undervaluation and margin of safety.',
            icon: <Database className="text-indigo-400" />,
            status: 'Coming Soon'
        },
        {
            title: 'Neural Watchlists',
            description: 'Intelligent alerts and automated tracking for your highest conviction ideas.',
            icon: <LineChart className="text-violet-400" />,
            status: 'Coming Soon'
        },
        {
            title: 'Collaborative Alpha',
            description: 'Securely share your investment thesis with private or public read-only links.',
            icon: <Globe className="text-teal-400" />,
            status: 'Operational'
        },
        {
            title: 'Fundamental Engine',
            description: 'Direct integration with financial filings and real-time news aggregation.',
            icon: <Search className="text-pink-400" />,
            status: 'Coming Soon'
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden font-inter">
            {/* Background Architecture */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden -z-10 bg-background">
                <div
                    className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] bg-primary/5 blur-[120px] rounded-full opacity-50"
                />
                <div
                    className="absolute bottom-0 -right-[10%] w-[70%] h-[70%] bg-accent/5 blur-[120px] rounded-full opacity-50"
                />
            </div>

            {/* Navigation Layer */}
            <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-border/40 bg-background/50">
                <div className="container mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-10">
                        <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-primary/20 rounded-xl shadow-lg shadow-primary/10">
                                <TrendingUp className="text-primary" size={26} />
                            </div>
                            <span className="text-2xl font-black tracking-tighter text-foreground">StockTrackr<span className="text-primary">.eu</span></span>
                        </div>

                        {/* Desktop Marketing Menu */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="#features" className="text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">Platform</Link>
                            <div className="flex items-center gap-2 group cursor-pointer">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Valuation</span>
                                <span className="text-[8px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-black">BETA</span>
                            </div>
                            <div className="flex items-center gap-2 group cursor-pointer">
                                <span className="text-xs font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">Watchlist</span>
                                <span className="text-[8px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-black">SOON</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/login" className="hidden sm:block text-xs font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors">
                            Client Login
                        </Link>
                        <Link
                            href="/register"
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Open Free Account
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Deployment */}
            <section className="pt-48 pb-32 relative px-6">
                <motion.div
                    style={{ opacity, scale }}
                    className="container mx-auto text-center"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 text-muted-foreground mb-10 backdrop-blur-sm">
                            <Lock size={14} className="text-primary" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional Grade Security Protocol</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-foreground mb-10 tracking-tighter leading-[0.85]">
                            Evolve your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto] animate-gradient text-glow-primary">Investments.</span>
                        </h1>

                        <p className="text-lg md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-16 leading-relaxed font-medium">
                            Automate your tracking, analyze with deep fundamental intelligence, and master
                            valuation models. <span className="text-foreground font-black">StockTrackr.eu</span> is built for the professional mindset.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <Link
                                href="/register"
                                className="group w-full sm:w-auto px-10 py-5 bg-primary text-primary-foreground rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 hover:scale-[1.03] active:scale-[0.98] transition-all"
                            >
                                Start Building Your Portfolio
                                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/login"
                                className="w-full sm:w-auto px-10 py-5 bg-card hover:bg-muted/80 text-foreground rounded-[24px] font-black text-sm uppercase tracking-widest border border-border shadow-sm transition-all"
                            >
                                Exploration Mode
                            </Link>
                        </div>
                    </motion.div>

                    {/* Dashboard Visualizer */}
                    <motion.div
                        initial={{ opacity: 0, y: 100, rotateX: 20 }}
                        animate={{ opacity: 1, y: 0, rotateX: 0 }}
                        transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
                        className="mt-32 max-w-6xl mx-auto relative perspective-2000"
                    >
                        <div className="absolute -inset-4 bg-primary/20 rounded-[64px] blur-[100px] opacity-30 animate-pulse"></div>
                        <div className="relative bg-card border-[3px] border-border/80 rounded-[48px] overflow-hidden shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                            <img
                                src="https://images.unsplash.com/photo-1644659510777-49dfc3fbc3df?q=75&w=1200&auto=format&fit=crop"
                                alt="Next Gen Dashboard"
                                className="w-full h-auto object-cover opacity-90"
                                loading="eager"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-transparent to-transparent"></div>

                            {/* Floating UI Elements */}
                            <div className="absolute bottom-12 left-12 right-12 flex flex-col items-center">
                                <div className="p-8 bg-background/40 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl max-w-md w-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-primary">Live Performance</span>
                                        <TrendingUp size={16} className="text-primary" />
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full w-full mb-2 overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: "78%" }}
                                            transition={{ duration: 2, delay: 1 }}
                                            className="h-full bg-primary"
                                        />
                                    </div>
                                    <p className="text-xl font-black text-white">+24.5% <span className="text-xs text-white/50 ml-1">YTD</span></p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </section>

            {/* Core Capabilities */}
            <section id="features" className="py-40 px-6">
                <div className="container mx-auto">
                    <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-8">
                        <div className="max-w-xl">
                            <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Architectural Features</span>
                            <h2 className="text-4xl md:text-6xl font-black tracking-tighter leading-[0.9]">Forged for high precision management.</h2>
                        </div>
                        <div className="text-muted-foreground text-sm font-medium max-w-xs">
                            We've eliminated the friction of traditional tracking tools. Built for speed, accuracy, and depth.
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                viewport={{ once: true }}
                                className="p-10 bg-card border border-border/50 rounded-[48px] shadow-sm hover:shadow-2xl hover:border-primary/20 hover:-translate-y-2 transition-all group"
                            >
                                <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-8 group-hover:bg-primary/10 transition-colors shadow-inner">
                                    {feature.icon}
                                </div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-2xl font-black tracking-tight">{feature.title}</h3>
                                    <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${feature.status === 'Operational' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500'
                                        }`}>
                                        {feature.status}
                                    </span>
                                </div>
                                <p className="text-muted-foreground text-sm leading-relaxed font-medium">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Verification Section */}
            <section className="py-40 px-6 bg-card/30 relative">
                <div className="container mx-auto">
                    <div className="max-w-5xl mx-auto bg-background border border-border/60 rounded-[64px] p-12 md:p-24 relative overflow-hidden text-center shadow-2xl">
                        <div className="absolute top-0 right-0 p-10 opacity-5 rotate-12">
                            <Shield size={200} className="text-primary" />
                        </div>

                        <div className="p-4 bg-primary/10 rounded-3xl w-fit mx-auto mb-10">
                            <BarChart3 className="text-primary" size={40} />
                        </div>

                        <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">Secure. Scalable. Precise.</h2>
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-16 leading-relaxed">
                            Stop using fragmented spreadsheets. Consolidate your investment lifecycle into
                            one unified powerhouse. Join the top percentile of European investors.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                            <div className="flex flex-col items-center">
                                <div className="text-3xl font-black mb-1">99.9%</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Uptime</div>
                            </div>
                            <div className="w-px h-10 bg-border hidden sm:block"></div>
                            <div className="flex flex-col items-center">
                                <div className="text-3xl font-black mb-1">AES-256</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Encryption</div>
                            </div>
                            <div className="w-px h-10 bg-border hidden sm:block"></div>
                            <div className="flex flex-col items-center">
                                <div className="text-3xl font-black mb-1">EUR-LOC</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cloud Sync</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Closing CTA */}
            <section className="py-40 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="container mx-auto"
                >
                    <h2 className="text-5xl md:text-7xl font-black tracking-tighter mb-10">Ready to command your capital?</h2>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-4 px-12 py-6 bg-primary text-primary-foreground rounded-[32px] font-black text-lg uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.05] active:scale-[0.98] transition-all"
                    >
                        Create My Account
                        <ArrowRight size={24} />
                    </Link>
                </motion.div>
            </section>

            <footer className="py-20 border-t border-border/50 bg-card/20 pb-32 md:pb-20">
                <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-2 mb-8">
                            <TrendingUp className="text-primary" size={26} />
                            <span className="text-2xl font-black tracking-tighter">StockTrackr<span className="text-primary">.eu</span></span>
                        </div>
                        <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-sm">
                            Next-generation equity intelligence for the sophisticated European investor.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-8 text-foreground">Infrastructure</h4>
                        <ul className="space-y-4 text-sm font-bold text-muted-foreground">
                            <li><Link href="#features" className="hover:text-primary transition-colors">Platform Engine</Link></li>
                            <li><span className="opacity-50 cursor-not-allowed">Valuation API</span></li>
                            <li><span className="opacity-50 cursor-not-allowed">Neural Links</span></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest mb-8 text-foreground">Compliance</h4>
                        <ul className="space-y-4 text-sm font-bold text-muted-foreground">
                            <li><Link href="/legal/privacy" className="hover:text-primary transition-colors">Privacy Node</Link></li>
                            <li><Link href="/legal/terms" className="hover:text-primary transition-colors">Rights & Terms</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="container mx-auto px-6 mt-20 pt-8 border-t border-border/20 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                        © 2026 Prometheus Digital Kft. All rights reserved.
                    </p>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    background-size: 200% auto;
                    animation: gradient 10s ease infinite;
                }
                .text-glow-primary {
                    text-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
                }
                .perspective-2000 {
                    perspective: 2000px;
                }
            `}</style>
        </div >
    );
}
