'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Mail, Lock, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [consent, setConsent] = useState(false);
    const [success, setSuccess] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!consent) {
            setError('Please accept the security protocol (Privacy Policy)');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Architectural Background */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
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
                    <h1 className="text-4xl font-black tracking-tight mb-3">Identity Setup.</h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Initialize your professional portfolio hub</p>
                </div>

                <div className="bg-card/40 backdrop-blur-3xl border border-border/50 p-10 rounded-[48px] shadow-2xl shadow-black/20 relative">
                    <AnimatePresence mode="wait">
                        {success ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-10"
                            >
                                <div className="w-20 h-20 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                                    <ShieldCheck className="text-emerald-500" size={40} />
                                </div>
                                <h2 className="text-2xl font-black mb-4">Verification Sent.</h2>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-8">
                                    We've dispatched a secure confirmation protocol to <span className="text-foreground font-black">{email}</span>. Please verify your identity to begin.
                                </p>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full py-4 bg-muted border border-border rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-card transition-all"
                                >
                                    Return to Login
                                </button>
                            </motion.div>
                        ) : (
                            <form onSubmit={handleRegister} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Establish Email</label>
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
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Create Passkey</label>
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

                                <div className="flex items-start gap-4 p-4 bg-muted/30 border border-border/50 rounded-2xl">
                                    <div className="pt-1">
                                        <input
                                            type="checkbox"
                                            id="consent"
                                            checked={consent}
                                            onChange={(e) => setConsent(e.target.checked)}
                                            className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary"
                                        />
                                    </div>
                                    <label htmlFor="consent" className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-muted-foreground/70 cursor-pointer select-none">
                                        I acknowledge the <Link href="/legal/privacy" className="text-primary hover:underline">GDPR Security Protocols</Link> and agree to the institutional data processing standards.
                                    </label>
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
                                    disabled={loading || !consent}
                                    className="w-full py-5 bg-primary text-primary-foreground rounded-[24px] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale disabled:scale-100"
                                >
                                    {loading ? (
                                        <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>Initialize Account</span>
                                            <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-10 text-center space-y-4">
                    <p className="text-muted-foreground text-xs font-medium">
                        Already established?{' '}
                        <Link href="/login" className="text-primary font-black uppercase tracking-widest hover:underline underline-offset-4">
                            Access Terminal
                        </Link>
                    </p>
                    <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/30">
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-500/70">
                            <CheckCircle2 size={10} />
                            <span>Institutional Guard</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
