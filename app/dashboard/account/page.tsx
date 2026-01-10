'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Trash2, AlertCircle, Shield, User, ChevronRight, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AccountPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [exportLoading, setExportLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [error, setError] = useState<string | null>(null);

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
            router.push('/login?deleted=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete account');
            setDeleteLoading(false);
        }
    };

    return (
        <div className="p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
                <header className="mb-10">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <User size={18} />
                        <span className="text-sm font-bold tracking-wider uppercase">Profile Settings</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Manage your Account</h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Account Info Sidebar */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-card border border-border p-8 rounded-[40px] text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-black text-2xl mx-auto mb-6 shadow-inner">
                                {user.email?.[0].toUpperCase()}
                            </div>
                            <h2 className="font-black text-lg mb-1">{user.email?.split('@')[0]}</h2>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-6">{user.email}</p>
                            <div className="pt-6 border-t border-border/50 text-left">
                                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mb-2 text-primary">Member Reference</div>
                                <code className="text-[10px] bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-xl block font-mono text-center text-primary/80">{user.id}</code>
                            </div>
                        </div>

                        <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/20 shadow-sm relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-primary/20 rounded-xl">
                                        <Shield className="text-primary" size={16} />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-primary">Identity Verified</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Your account is secured with enterprise-grade encryption and multi-layer biometric protection.</p>
                            </div>
                        </div>
                        <h3 className="text-sm font-black mb-4 flex items-center gap-2">
                            <Shield size={16} className="text-primary" />
                            Privacy
                        </h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Your data is encrypted and managed according to GDPR standards.
                        </p>
                        <Link href="/legal/privacy" className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-primary hover:translate-x-1 transition-transform">
                            Read Privacy Policy
                            <ChevronRight size={14} />
                        </Link>
                    </div>
                </div>

                {/* Main Settings Areas */}
                <div className="md:col-span-2 space-y-8">
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500"
                            >
                                <AlertCircle size={20} />
                                <p className="text-sm font-bold">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Export Module */}
                    <section className="bg-card border border-border p-8 rounded-[40px] shadow-sm group">
                        <div className="flex items-start gap-6 mb-8">
                            <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                                <Download className="text-primary" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black mb-2">Data Portability</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Download a portable JSON archive of your entire investment history, portfolios, and research notes.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleExportData}
                            disabled={exportLoading}
                            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-muted border border-border rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-card hover:border-primary/50 transition-all disabled:opacity-50"
                        >
                            {exportLoading ? (
                                <Loader2 size={18} className="animate-spin text-primary" />
                            ) : (
                                <>
                                    <Download size={18} className="text-primary" />
                                    Generate Data Archive
                                </>
                            )}
                        </button>
                    </section>

                    {/* Security Module */}
                    <section className="bg-card border border-border p-8 rounded-[40px] shadow-sm group">
                        <div className="flex items-start gap-6 mb-8">
                            <div className="p-4 bg-accent/10 rounded-2xl group-hover:scale-110 transition-transform">
                                <Lock className="text-accent" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black mb-2">Security & Identity</h2>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Update your login credentials or manage multi-factor authentication for enhanced protection.
                                </p>
                            </div>
                        </div>
                        <button disabled className="w-full px-6 py-4 bg-muted border border-border rounded-[24px] font-black text-[10px] uppercase tracking-widest text-muted-foreground/50 cursor-not-allowed">
                            Identity Controls - Coming Soon
                        </button>
                    </section>

                    {/* Danger Zone */}
                    <section className="bg-rose-500/5 border border-rose-500/20 p-8 rounded-[40px] relative overflow-hidden">
                        <div className="flex items-start gap-6 mb-8">
                            <div className="p-4 bg-rose-500/10 rounded-2xl">
                                <Trash2 className="text-rose-500" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black mb-2 text-rose-600">Danger Zone</h2>
                                <p className="text-sm text-rose-500/70 leading-relaxed">
                                    Permanently delete your account and all associated data. This action is instantaneous and cannot be reversed.
                                </p>
                            </div>
                        </div>

                        {!showDeleteConfirm ? (
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full px-6 py-4 bg-rose-500 text-white font-black text-sm uppercase tracking-widest rounded-[24px] hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20"
                            >
                                Initiate Account Deletion
                            </button>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-card border border-rose-500/50 p-6 rounded-[32px] shadow-2xl space-y-4"
                            >
                                <p className="font-black text-sm text-center uppercase tracking-widest">Type <span className="text-rose-500">DELETE</span> to confirm</p>
                                <input
                                    type="text"
                                    value={deleteConfirmText}
                                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                                    className="w-full p-4 bg-muted border border-border rounded-2xl text-foreground font-black text-center focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                                    placeholder="DELETE"
                                />
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="flex-1 py-4 font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                                    >
                                        Nevermind
                                    </button>
                                    <button
                                        onClick={handleDeleteAccount}
                                        disabled={deleteLoading || deleteConfirmText !== 'DELETE'}
                                        className="flex-1 py-4 bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl disabled:opacity-30"
                                    >
                                        {deleteLoading ? 'Decommissioning...' : 'Final Delete'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}

function Loader2({ className, size }: { className?: string, size?: number }) {
    return <div className={`border-2 border-current border-t-transparent rounded-full animate-spin ${className}`} style={{ width: size, height: size }}></div>;
}
