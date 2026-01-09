'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Mail, Lock, CheckCircle2, ArrowRight, Github } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.refresh();
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Architectural Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[440px]"
            >
                {/* Brand Header */}
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center gap-3 mb-8 group">
                        <div className="p-2 bg-primary/20 rounded-xl group-hover:scale-110 transition-transform">
                            <TrendingUp className="text-primary" size={32} />
                        </div>
                        <span className="text-3xl font-black tracking-tighter">StockTrackr<span className="text-primary">.eu</span></span>
                    </Link>
                    <h1 className="text-4xl font-black tracking-tight mb-3">Secure Login.</h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Access your intelligence dashboard</p>
                </div>

                <div className="bg-card/40 backdrop-blur-3xl border border-border/50 p-10 rounded-[48px] shadow-2xl shadow-black/20">
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email Terminal</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-muted border border-border rounded-2xl text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    placeholder="operator@stocktrackr.eu"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Key</label>
                                <Link href="/forgot-password" opacity-60 className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-100 transition-opacity">
                                    Reset Protocol
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-muted border border-border rounded-2xl text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs font-bold text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-primary text-primary-foreground rounded-[24px] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Execute Login</span>
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative flex items-center justify-center mb-8">
                            <div className="w-full border-t border-border/50"></div>
                            <span className="absolute bg-card px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">OAuth Sync</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => { }} // Placeholder for now
                            className="w-full py-4 bg-muted border border-border rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-card transition-all flex items-center justify-center gap-3 group"
                        >
                            <Github size={20} className="group-hover:rotate-[360deg] transition-transform duration-500" />
                            Continue with GitHub
                        </button>
                    </div>
                </div>

                <div className="mt-10 text-center space-y-4">
                    <p className="text-muted-foreground text-xs font-medium">
                        New investigator?{' '}
                        <Link href="/register" className="text-primary font-black uppercase tracking-widest hover:underline underline-offset-4">
                            Establish Identity
                        </Link>
                    </p>
                    <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/30">
                        <Link href="/legal/privacy" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Privacy Protocol</Link>
                        <div className="w-1 h-1 bg-border rounded-full"></div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-500/70">
                            <CheckCircle2 size={10} />
                            <span>AES-256 Encrypted</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}