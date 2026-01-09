'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
            router.push('/');
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
        if (error) setError(error.message);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0f172a]">
            <div className="w-full max-w-md p-8 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                    <p className="text-slate-400">Log in to your portfolio tracker</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                            placeholder="you@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && <p className="text-rose-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>

                <div className="mt-6">
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Continue with Google
                    </button>
                </div>
                <p className="mt-8 text-center text-slate-400">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-blue-500 hover:underline">
                        Register
                    </Link>
                </p>

                <div className="mt-8 pt-6 border-t border-slate-700/50 flex justify-center gap-4 text-xs text-slate-500">
                    <Link href="/legal/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
                    <span>•</span>
                    <span className="cursor-default text-slate-600">GDPR Compliant</span>
                </div>
            </div>
        </div>
    );
}
