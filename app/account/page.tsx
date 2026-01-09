'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Trash2, AlertCircle, Shield, User } from 'lucide-react';

export default function AccountPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [exportLoading, setExportLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Redirect if not logged in
    if (!user) {
        router.push('/login');
        return null;
    }

    const handleExportData = async () => {
        setExportLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/account?action=export');

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to export data');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `portfolio-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to export data');
        } finally {
            setExportLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            setError('Please type DELETE to confirm');
            return;
        }

        setDeleteLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/account?action=delete', {
                method: 'DELETE',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to delete account');
            }

            // Redirect to goodbye page or login
            router.push('/login?deleted=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete account');
            setDeleteLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 py-12 px-4">
            <div className="container mx-auto max-w-4xl">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </Link>

                <div className="bg-slate-800/40 backdrop-blur-md border border-slate-700/50 rounded-3xl p-8 md:p-12">
                    <div className="flex items-center gap-3 mb-8">
                        <User className="text-blue-400" size={32} />
                        <h1 className="text-4xl font-bold text-white">Account Settings</h1>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-xl px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Account Information */}
                    <section className="mb-8 p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                            <Shield className="text-blue-400" size={20} />
                            Account Information
                        </h2>
                        <div className="space-y-2 text-slate-300">
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Account ID:</strong> <code className="text-xs bg-slate-800 px-2 py-1 rounded">{user.id.substring(0, 8)}...</code></p>
                        </div>
                    </section>

                    {/* Export Data */}
                    <section className="mb-8 p-6 bg-slate-900/50 rounded-xl border border-slate-700">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                                    <Download className="text-blue-400" size={20} />
                                    Export Your Data
                                </h2>
                                <p className="text-slate-400 text-sm">
                                    Download all your account data, including portfolios and trade history, in JSON format.
                                    This is your right under GDPR Article 20 (Right to Data Portability).
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportData}
                            disabled={exportLoading}
                            className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <Download size={18} />
                            {exportLoading ? 'Exporting...' : 'Export My Data'}
                        </button>
                    </section>

                    {/* Delete Account */}
                    <section className="p-6 bg-red-900/10 rounded-xl border border-red-700/50">
                        <div className="flex items-start gap-3 mb-4">
                            <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={24} />
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
                                    Delete Account
                                </h2>
                                <p className="text-slate-400 text-sm mb-4">
                                    Permanently delete your account and all associated data. This action cannot be undone.
                                    All your portfolios, trades, and account information will be permanently deleted within 30 days.
                                </p>
                            </div>
                        </div>

                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all flex items-center gap-2"
                            >
                                <Trash2 size={18} />
                                Delete My Account
                            </button>
                        ) : (
                            <div className="space-y-4 mt-4 p-4 bg-slate-900/50 rounded-xl border border-red-700/50">
                                <p className="text-white font-semibold">⚠️ Are you absolutely sure?</p>
                                <p className="text-sm text-slate-400">
                                    This will permanently delete all your data. Type <code className="bg-slate-800 px-2 py-1 rounded text-red-400">DELETE</code> below to confirm:
                                </p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-red-500 transition-colors"
                                    placeholder="Type DELETE to confirm"
                                />
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDeleteConfirm(false);
                                            setDeleteConfirmText('');
                                            setError(null);
                                        }}
                                        className="flex-1 px-6 py-3 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                                        className="flex-1 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        {deleteLoading ? 'Deleting...' : 'Permanently Delete'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Legal Links */}
                    <div className="mt-8 pt-6 border-t border-slate-700 flex flex-wrap gap-4 justify-center text-sm">
                        <Link href="/legal/privacy" className="text-blue-400 hover:underline">
                            Privacy Policy
                        </Link>
                        <span className="text-slate-600">•</span>
                        <Link href="/legal/terms" className="text-blue-400 hover:underline">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
