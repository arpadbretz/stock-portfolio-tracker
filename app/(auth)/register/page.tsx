'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [consent, setConsent] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (!consent) {
            setError('Please accept the privacy policy to continue.');
            setLoading(false);
            return;
        }

        setError(null);

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
            setError('Check your email for the confirmation link.');
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            <div className="w-full max-w-md p-8 bg-card border border-border rounded-3xl shadow-xl">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Join Us</h1>
                    <p className="text-slate-400">Create your portfolio tracker account</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
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

                    {error && <p className={`text-sm ${error.includes('Check your email') ? 'text-emerald-500' : 'text-rose-500'}`}>{error}</p>}

                    <div className="flex items-start gap-3 mt-4">
                        <input
                            type="checkbox"
                            id="consent"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900/50 text-blue-600 focus:ring-blue-500"
                            required
                        />
                        <label htmlFor="consent" className="text-sm text-slate-400 leading-snug cursor-pointer">
                            I agree to the processing of my personal data according to the{' '}
                            <Link href="/legal/privacy" className="text-blue-500 hover:underline">
                                Privacy Policy
                            </Link>{' '}
                            (GDPR compliant).
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !consent}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating account...' : 'Register'}
                    </button>
                </form>

                <p className="mt-8 text-center text-slate-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-500 hover:underline">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    );
}
