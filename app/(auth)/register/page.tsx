'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Mail, Lock, ShieldCheck, ArrowRight, CheckCircle2, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Google icon SVG component
const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
        <g transform="matrix(1, 0, 0, 1, 0, 0)">
            <path fill="#EA4335" d="M5.26,9.75a7,7,0,0,1,11.59-4.31l-2.36,2.36a4.27,4.27,0,0,0-2.78-1.1A4.13,4.13,0,0,0,8,10.13v0a4.13,4.13,0,0,0,3.65,3.45A3.85,3.85,0,0,0,15,12.31H12V9.69h6.87a10.56,10.56,0,0,1,.18,1.81,6.93,6.93,0,0,1-7.23,7A7.18,7.18,0,0,1,5.26,9.75Z" />
        </g>
    </svg>
);

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<string | null>(null);
    const [consent, setConsent] = useState(false);
    const [success, setSuccess] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!consent) {
            setError('Please accept the privacy policy');
            toast.error('Terms required', { description: 'Please accept the privacy policy to continue' });
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
            toast.error('Registration failed', { description: error.message });
            setLoading(false);
        } else {
            setSuccess(true);
            toast.success('Check your email!', { description: 'We sent you a confirmation link' });
            setLoading(false);
        }
    };

    const handleOAuthLogin = async (provider: 'github' | 'google' | 'apple') => {
        setOauthLoading(provider);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider,
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
                },
            });

            if (error) {
                setError(error.message);
                toast.error(`${provider} signup failed`, { description: error.message });
                setOauthLoading(null);
            }
        } catch (err) {
            setError(`An unexpected error occurred with ${provider}`);
            toast.error('Signup error', { description: 'Please try again' });
            setOauthLoading(null);
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
                    <h1 className="text-4xl font-black tracking-tight mb-3">Create Account.</h1>
                    <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Start tracking your portfolio for free</p>
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
                                <h2 className="text-2xl font-black mb-4">Check Your Email</h2>
                                <p className="text-muted-foreground text-sm font-medium leading-relaxed mb-8">
                                    We've sent a confirmation link to <span className="text-foreground font-black">{email}</span>. Click the link to activate your account.
                                </p>
                                <button
                                    onClick={() => router.push('/login')}
                                    className="w-full py-4 bg-muted border border-border rounded-2xl font-black text-sm hover:bg-card transition-all"
                                >
                                    Back to Login
                                </button>
                            </motion.div>
                        ) : (
                            <>
                                {/* OAuth Buttons First */}
                                <div className="space-y-3 mb-8">
                                    <button
                                        type="button"
                                        onClick={() => handleOAuthLogin('google')}
                                        disabled={oauthLoading !== null}
                                        className="w-full py-4 bg-white text-gray-800 border border-gray-200 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {oauthLoading === 'google' ? (
                                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <GoogleIcon />
                                        )}
                                        Continue with Google
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => handleOAuthLogin('github')}
                                        disabled={oauthLoading !== null}
                                        className="w-full py-4 bg-[#24292e] text-white rounded-2xl font-bold text-sm hover:bg-[#1b1f23] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {oauthLoading === 'github' ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <Github size={20} />
                                        )}
                                        Continue with GitHub
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="relative flex items-center justify-center mb-8">
                                    <div className="w-full border-t border-border/50"></div>
                                    <span className="absolute bg-card px-4 text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Or use email</span>
                                </div>

                                <form onSubmit={handleRegister} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                <Mail size={18} />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-muted border border-border rounded-2xl text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="you@example.com"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                                <Lock size={18} />
                                            </div>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full pl-12 pr-4 py-4 bg-muted border border-border rounded-2xl text-foreground font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                placeholder="••••••••"
                                                required
                                                minLength={6}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground ml-1">Minimum 6 characters</p>
                                    </div>

                                    <div className="flex items-start gap-4 p-4 bg-muted/30 border border-border/50 rounded-2xl">
                                        <div className="pt-0.5">
                                            <input
                                                type="checkbox"
                                                id="consent"
                                                checked={consent}
                                                onChange={(e) => setConsent(e.target.checked)}
                                                className="w-4 h-4 rounded border-border bg-card text-primary focus:ring-primary"
                                            />
                                        </div>
                                        <label htmlFor="consent" className="text-xs leading-relaxed text-muted-foreground cursor-pointer select-none">
                                            I agree to the <Link href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</Link> and <Link href="/legal/terms" className="text-primary hover:underline">Terms of Service</Link>
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
                                        className="w-full py-5 bg-primary text-primary-foreground rounded-[24px] font-black text-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <div className="w-6 h-6 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                <span>Create Account</span>
                                                <ArrowRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-10 text-center space-y-4">
                    <p className="text-muted-foreground text-sm font-medium">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary font-bold hover:underline underline-offset-4">
                            Sign in
                        </Link>
                    </p>
                    <div className="flex items-center justify-center gap-6 pt-4 border-t border-border/30">
                        <Link href="/legal/privacy" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Privacy</Link>
                        <div className="w-1 h-1 bg-border rounded-full"></div>
                        <Link href="/legal/terms" className="text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">Terms</Link>
                        <div className="w-1 h-1 bg-border rounded-full"></div>
                        <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-500/70">
                            <CheckCircle2 size={10} />
                            <span>Free Forever</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
