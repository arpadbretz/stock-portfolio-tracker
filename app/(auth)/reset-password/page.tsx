'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Lock, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [sessionChecked, setSessionChecked] = useState(false);
    const [hasSession, setHasSession] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        // Check if user has a valid session from password reset email
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setHasSession(!!session);
            setSessionChecked(true);

            if (!session) {
                setError('Invalid or expired password reset link. Please request a new one.');
            }
        };

        checkSession();
    }, [supabase]);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.updateUser({
            password: password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 2000);
        }
    };

    if (!sessionChecked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0f172a]">
                <div className="w-full max-w-md p-8 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl text-center">
                    <p className="text-slate-400">Verifying reset link...</p>
                </div>
            </div>
        );
    }

    if (!hasSession) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0f172a]">
                <div className="w-full max-w-md p-8 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-red-500/10 rounded-full">
                            <AlertCircle className="text-red-400" size={48} />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-3">
                        Invalid Reset Link
                    </h1>

                    <p className="text-slate-400 mb-6">
                        {error || 'This password reset link is invalid or has expired.'}
                    </p>

                    <Link
                        href="/forgot-password"
                        className="block w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                    >
                        Request New Reset Link
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0f172a]">
                <div className="w-full max-w-md p-8 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl text-center">
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-emerald-500/10 rounded-full">
                            <Check className="text-emerald-400" size={48} />
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-3">
                        Password Updated!
                    </h1>

                    <p className="text-slate-400 mb-6">
                        Your password has been successfully reset. Redirecting to login...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#0f172a]">
            <div className="w-full max-w-md p-8 bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl">
                <div className="mb-8 text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="p-3 bg-blue-500/10 rounded-full">
                            <Lock className="text-blue-400" size={32} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Set New Password</h1>
                    <p className="text-slate-400">Enter your new password below</p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            New Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full p-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
