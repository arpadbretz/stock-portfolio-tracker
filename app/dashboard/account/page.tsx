'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, Trash2, AlertCircle, Shield, User, ChevronRight, Lock, Globe, Check, DollarSign, Loader2, Eye, EyeOff, Key, Edit3, Camera, X, Bell, Eye as EyeIcon, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useUserPreferences } from '@/components/providers/UserPreferencesProvider';
import { CurrencyCode } from '@/types/portfolio';

const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
];

export default function AccountPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [exportLoading, setExportLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { preferredCurrency: currency, setPreferredCurrency: setCurrency, stealthMode, setStealthMode } = useUserPreferences();
    const [savingCurrency, setSavingCurrency] = useState(false);

    // Password change states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Display name states
    const [displayName, setDisplayName] = useState('');
    const [displayNameLoading, setDisplayNameLoading] = useState(false);
    const [displayNameSuccess, setDisplayNameSuccess] = useState(false);

    // Avatar states
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarLoading, setAvatarLoading] = useState(false);

    // New Settings states
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [weeklySummary, setWeeklySummary] = useState(true);
    const [portfolios, setPortfolios] = useState<any[]>([]);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const supabase = createClient();

    useEffect(() => {
        // Load saved currency preference
        const saved = localStorage.getItem('preferredCurrency');
        if (saved && (saved === 'USD' || saved === 'EUR' || saved === 'HUF' || saved === 'GBP')) {
            setCurrency(saved as CurrencyCode);
        }

        // Load display name, avatar and profile settings
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (user?.user_metadata?.display_name) {
                setDisplayName(user.user_metadata.display_name);
            }
            if (user?.user_metadata?.avatar_url) {
                setAvatarUrl(user.user_metadata.avatar_url);
            }

            // Fetch profile settings
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setEmailAlerts(profile.email_alerts_enabled ?? true);
                setWeeklySummary(profile.weekly_summary_enabled ?? true);
                setStealthMode(profile.stealth_mode_enabled ?? false);
                if (profile.preferred_currency) {
                    setCurrency(profile.preferred_currency as CurrencyCode);
                }
            }

            // Fetch portfolios for selection
            const { data: portfoliosData } = await supabase
                .from('portfolios')
                .select('*')
                .eq('user_id', user.id)
                .order('name', { ascending: true });

            if (portfoliosData) {
                setPortfolios(portfoliosData);
            }
        };
        fetchUserData();
    }, [supabase]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/avatar', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to upload');
            }

            setAvatarUrl(data.url);
            toast.success('Profile photo updated!');
        } catch (err: any) {
            setError(err.message);
            toast.error('Upload failed', { description: err.message });
        } finally {
            setAvatarLoading(false);
        }
    };

    const handleAvatarDelete = async () => {
        setAvatarLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/avatar', {
                method: 'DELETE',
            });

            if (!res.ok) {
                throw new Error('Failed to delete avatar');
            }

            setAvatarUrl(null);
            toast.success('Profile photo removed');
        } catch (err: any) {
            setError(err.message);
            toast.error('Delete failed');
        } finally {
            setAvatarLoading(false);
        }
    };

    const updateSettings = async (updates: any) => {
        setSettingsLoading(true);
        try {
            const res = await fetch('/api/account', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Update failed');
            return data.data;
        } catch (err: any) {
            toast.error('Failed to update settings', { description: err.message });
            throw err;
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleSetDefaultPortfolio = async (portfolioId: string) => {
        if (!user) return;
        setSettingsLoading(true);
        try {
            // First clear all defaults for this user
            await supabase
                .from('portfolios')
                .update({ is_default: false })
                .eq('user_id', user.id);

            // Set new default
            const { error } = await supabase
                .from('portfolios')
                .update({ is_default: true })
                .eq('id', portfolioId);

            if (error) throw error;

            setPortfolios(portfolios.map(p => ({
                ...p,
                is_default: p.id === portfolioId
            })));

            toast.success('Default portfolio updated!');
        } catch (err: any) {
            toast.error('Failed to update portfolio');
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleCurrencyChange = async (newCurrency: string) => {
        setSavingCurrency(true);
        try {
            await updateSettings({ preferred_currency: newCurrency });
            if (newCurrency === 'USD' || newCurrency === 'EUR' || newCurrency === 'HUF' || newCurrency === 'GBP') {
                setCurrency(newCurrency as CurrencyCode);
            }
            localStorage.setItem('preferredCurrency', newCurrency);
            toast.success(`Currency set to ${newCurrency}`);
        } catch (e) {
            // Error handled in updateSettings
        } finally {
            setSavingCurrency(false);
        }
    };

    const handleDisplayNameUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setDisplayNameLoading(true);
        setDisplayNameSuccess(false);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                data: { display_name: displayName.trim() }
            });

            if (error) {
                throw error;
            }

            setDisplayNameSuccess(true);
            toast.success('Display name updated!');
        } catch (err: any) {
            setError(err.message || 'Failed to update display name');
            toast.error('Failed to update', { description: err.message });
        } finally {
            setDisplayNameLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setPasswordSuccess(false);

        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            toast.error('Passwords do not match');
            return;
        }

        // Password requirements: min 8 chars, upper, lower, digit, symbol
        const hasMinLength = newPassword.length >= 8;
        const hasUppercase = /[A-Z]/.test(newPassword);
        const hasLowercase = /[a-z]/.test(newPassword);
        const hasDigit = /[0-9]/.test(newPassword);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

        if (!hasMinLength || !hasUppercase || !hasLowercase || !hasDigit || !hasSymbol) {
            const missing = [];
            if (!hasMinLength) missing.push('at least 8 characters');
            if (!hasUppercase) missing.push('an uppercase letter');
            if (!hasLowercase) missing.push('a lowercase letter');
            if (!hasDigit) missing.push('a number');
            if (!hasSymbol) missing.push('a symbol (!@#$%^&*...)');

            setError(`Password must have: ${missing.join(', ')}`);
            toast.error('Password does not meet requirements', {
                description: `Missing: ${missing.join(', ')}`
            });
            return;
        }

        setPasswordLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                throw error;
            }

            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            toast.success('Password changed successfully!');
        } catch (err: any) {
            setError(err.message || 'Failed to update password');
            toast.error('Failed to change password', { description: err.message });
        } finally {
            setPasswordLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

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
            <div className="max-w-6xl mx-auto">
                <header className="mb-10">
                    <div className="flex items-center gap-2 text-primary mb-1">
                        <User size={18} />
                        <span className="text-sm font-bold tracking-wider uppercase">Profile Settings</span>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Manage your Account</h1>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Account Info Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-card border border-border p-8 rounded-[40px] text-center">
                            {/* Avatar Upload */}
                            <div className="relative w-24 h-24 mx-auto mb-6 group">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt="Profile"
                                        className="w-full h-full rounded-full object-cover border-4 border-border"
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-primary font-black text-3xl border-4 border-border">
                                        {displayName ? displayName[0].toUpperCase() : user.email?.[0].toUpperCase()}
                                    </div>
                                )}

                                {/* Upload Overlay */}
                                <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all">
                                    {avatarLoading ? (
                                        <Loader2 size={24} className="text-white animate-spin" />
                                    ) : (
                                        <Camera size={24} className="text-white" />
                                    )}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        disabled={avatarLoading}
                                    />
                                </label>

                                {/* Delete Button */}
                                {avatarUrl && !avatarLoading && (
                                    <button
                                        onClick={handleAvatarDelete}
                                        className="absolute -top-1 -right-1 p-1.5 bg-rose-500 rounded-full text-white hover:bg-rose-600 transition-colors shadow-lg"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            <h2 className="font-black text-lg mb-1">{displayName || user.email?.split('@')[0]}</h2>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-6">{user.email}</p>

                            {/* Display Name Editor */}
                            <form onSubmit={handleDisplayNameUpdate} className="mb-6 text-left">
                                <label className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mb-2 block flex items-center gap-2">
                                    <Edit3 size={12} />
                                    Display Name
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your name"
                                        className="flex-1 px-3 py-2 bg-muted border border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                    <button
                                        type="submit"
                                        disabled={displayNameLoading}
                                        className="px-3 py-2 bg-primary text-primary-foreground rounded-xl font-bold text-sm disabled:opacity-50"
                                    >
                                        {displayNameLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    </button>
                                </div>
                                {displayNameSuccess && (
                                    <p className="text-xs text-emerald-500 mt-2 flex items-center gap-1">
                                        <Check size={12} /> Saved!
                                    </p>
                                )}
                            </form>

                            <div className="pt-6 border-t border-border/50 text-left">
                                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter mb-2 text-primary">Member Reference</div>
                                <code className="text-[10px] bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-xl block font-mono text-center text-primary/80 break-all">{user.id}</code>
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
                                <p className="text-[10px] text-muted-foreground font-medium leading-relaxed">Your account is secured with enterprise-grade encryption.</p>
                            </div>
                        </div>
                    </div>

                    {/* Main Settings Areas */}
                    <div className="lg:col-span-2 space-y-8">
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

                        {/* Currency Preference */}
                        <section className="bg-card border border-border p-8 rounded-[40px] shadow-sm">
                            <div className="flex items-start gap-6 mb-8">
                                <div className="p-4 bg-emerald-500/10 rounded-2xl">
                                    <DollarSign className="text-emerald-500" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black mb-2">Currency Preference</h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Select your preferred currency for displaying portfolio values and prices.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {CURRENCIES.map((curr) => (
                                    <button
                                        key={curr.code}
                                        onClick={() => handleCurrencyChange(curr.code)}
                                        disabled={savingCurrency}
                                        className={`relative p-4 rounded-2xl border-2 transition-all ${currency === curr.code
                                            ? 'bg-primary/10 border-primary'
                                            : 'bg-muted border-transparent hover:border-border'
                                            }`}
                                    >
                                        {currency === curr.code && (
                                            <div className="absolute top-2 right-2">
                                                <Check size={14} className="text-primary" />
                                            </div>
                                        )}
                                        <div className="text-2xl font-black mb-1">{curr.symbol}</div>
                                        <div className="text-xs font-bold text-muted-foreground">{curr.code}</div>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Communication Settings */}
                        <section className="bg-card border border-border p-8 rounded-[40px] shadow-sm">
                            <div className="flex items-start gap-6 mb-8">
                                <div className="p-4 bg-blue-500/10 rounded-2xl">
                                    <Bell className="text-blue-500" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black mb-2">Communication Settings</h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Manage how and when you receive updates about your investments.
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
                                    <div>
                                        <div className="font-bold text-sm">Price Alerts</div>
                                        <div className="text-xs text-muted-foreground">Receive emails when your targets are hit</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newVal = !emailAlerts;
                                            setEmailAlerts(newVal);
                                            updateSettings({ email_alerts_enabled: newVal });
                                        }}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${emailAlerts ? 'bg-primary' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
                                    <div>
                                        <div className="font-bold text-sm">Weekly Summary</div>
                                        <div className="text-xs text-muted-foreground">Portfolio performance snapshot every Monday</div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newVal = !weeklySummary;
                                            setWeeklySummary(newVal);
                                            updateSettings({ weekly_summary_enabled: newVal });
                                        }}
                                        className={`w-12 h-6 rounded-full p-1 transition-colors ${weeklySummary ? 'bg-primary' : 'bg-slate-700'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${weeklySummary ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </section>

                        {/* Display Preferences */}
                        <section className="bg-card border border-border p-8 rounded-[40px] shadow-sm">
                            <div className="flex items-start gap-6 mb-8">
                                <div className="p-4 bg-amber-500/10 rounded-2xl">
                                    <EyeIcon className="text-amber-500" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black mb-2">Privacy & Display</h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Customize how your data is presented across the dashboard.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-muted rounded-2xl">
                                <div>
                                    <div className="font-bold text-sm">Stealth Mode</div>
                                    <div className="text-xs text-muted-foreground">Blur monetary values by default</div>
                                </div>
                                <button
                                    onClick={() => {
                                        const newVal = !stealthMode;
                                        setStealthMode(newVal);
                                        updateSettings({ stealth_mode_enabled: newVal });
                                    }}
                                    className={`w-12 h-6 rounded-full p-1 transition-colors ${stealthMode ? 'bg-primary' : 'bg-slate-700'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${stealthMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                            </div>
                        </section>

                        {/* Portfolio Defaults */}
                        <section className="bg-card border border-border p-8 rounded-[40px] shadow-sm">
                            <div className="flex items-start gap-6 mb-8">
                                <div className="p-4 bg-indigo-500/10 rounded-2xl">
                                    <Briefcase className="text-indigo-500" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black mb-2">Portfolio Management</h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Select which portfolio should be treated as your primary baseline.
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {portfolios.map((p) => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSetDefaultPortfolio(p.id)}
                                        className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${p.is_default
                                            ? 'bg-primary/10 border-primary'
                                            : 'bg-muted border-transparent hover:border-border'
                                            }`}
                                    >
                                        <div className="text-left">
                                            <div className="font-bold text-sm">{p.name}</div>
                                            <div className="text-[10px] text-muted-foreground uppercase font-black">
                                                {p.is_default ? 'Current Default' : 'Set as Default'}
                                            </div>
                                        </div>
                                        {p.is_default && <Check size={16} className="text-primary" />}
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* Change Password */}
                        <section className="bg-card border border-border p-8 rounded-[40px] shadow-sm">
                            <div className="flex items-start gap-6 mb-8">
                                <div className="p-4 bg-violet-500/10 rounded-2xl">
                                    <Key className="text-violet-500" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black mb-2">Change Password</h2>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        Update your password to keep your account secure.
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New Password (8+ chars, upper, lower, digit, symbol)"
                                        className="w-full pl-12 pr-12 py-4 bg-muted border border-border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswords(!showPasswords)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <input
                                        type={showPasswords ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm New Password"
                                        className="w-full pl-12 pr-4 py-4 bg-muted border border-border rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                        minLength={8}
                                    />
                                </div>

                                {passwordSuccess && (
                                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-500">
                                        <Check size={18} />
                                        <span className="font-bold text-sm">Password updated successfully!</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={passwordLoading || !newPassword || !confirmPassword}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-violet-500 text-white rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-violet-600 transition-all disabled:opacity-50"
                                >
                                    {passwordLoading ? (
                                        <Loader2 className="animate-spin" size={18} />
                                    ) : (
                                        <>
                                            <Key size={18} />
                                            Update Password
                                        </>
                                    )}
                                </button>
                            </form>
                        </section>

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
                                    <Loader2 size={18} className="text-primary" />
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

                        {/* Privacy */}
                        <section className="bg-card border border-border p-6 rounded-[32px]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Shield size={18} className="text-primary" />
                                    <div>
                                        <h3 className="font-black">Privacy</h3>
                                        <p className="text-xs text-muted-foreground">Your data is encrypted and managed according to GDPR standards.</p>
                                    </div>
                                </div>
                                <Link href="/legal/privacy" className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:translate-x-1 transition-transform">
                                    Read Policy
                                    <ChevronRight size={14} />
                                </Link>
                            </div>
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
                                        Permanently delete your account and all associated data. This action cannot be reversed.
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
        </div>
    );
}
