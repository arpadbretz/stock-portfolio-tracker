'use client';

import { useState, useEffect } from 'react';
import { useConsent } from './providers/ConsentProvider';
import { Shield, Settings, X, Check, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CookieConsent() {
    const { preferences, updateConsent, hasDetermined } = useConsent();
    const [showBanner, setShowBanner] = useState(false);
    const [showManage, setShowManage] = useState(false);

    useEffect(() => {
        if (!hasDetermined) {
            const timer = setTimeout(() => setShowBanner(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [hasDetermined]);

    const handleAcceptAll = () => {
        updateConsent({ necessary: true, functional: true, analytics: true });
        setShowBanner(false);
    };

    const handleRejectAll = () => {
        updateConsent({ necessary: true, functional: false, analytics: false });
        setShowBanner(false);
    };

    const handleSaveManage = () => {
        setShowBanner(false);
        setShowManage(false);
    };

    if (!showBanner && !showManage) return null;

    return (
        <AnimatePresence>
            {showBanner && !showManage && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6"
                >
                    <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 rounded-[32px] shadow-2xl p-6 md:p-8 backdrop-blur-xl">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                            <div className="p-4 bg-primary/10 rounded-2xl hidden md:block">
                                <Shield className="text-primary" size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-white mb-2">Cookie & Privacy Control</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    We use cookies to ensure the platform's security (Sentry) and to understand how our tools are used (PostHog).
                                    Strictly necessary cookies for authentication (Supabase) are always active.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3 w-full md:w-auto">
                                <button
                                    onClick={() => setShowManage(true)}
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-all"
                                >
                                    Manage
                                </button>
                                <button
                                    onClick={handleRejectAll}
                                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold text-sm transition-all"
                                >
                                    Reject All
                                </button>
                                <button
                                    onClick={handleAcceptAll}
                                    className="px-8 py-3 bg-primary text-primary-foreground hover:scale-105 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-primary/20"
                                >
                                    Accept All
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {showManage && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-slate-900 border border-slate-800 rounded-[40px] max-w-xl w-full p-8 shadow-2xl"
                    >
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-black text-white">Privacy Preferences</h2>
                            <button onClick={() => setShowManage(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                                <X size={24} className="text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-6 mb-10">
                            {/* Necessary */}
                            <div className="flex items-start justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <Lock size={14} className="text-primary" />
                                        <span className="font-bold text-white">Strictly Necessary</span>
                                    </div>
                                    <p className="text-xs text-slate-400">Essential for login and security. Cannot be disabled.</p>
                                </div>
                                <div className="p-2 bg-primary/20 text-primary rounded-lg">
                                    <Check size={16} />
                                </div>
                            </div>

                            {/* Functional/Sentry */}
                            <div className="flex items-start justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                <div>
                                    <span className="font-bold text-white block mb-1">Security & Errors (Sentry)</span>
                                    <p className="text-xs text-slate-400">Processes crash reports to keep the system stable.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preferences.functional}
                                        onChange={(e) => updateConsent({ functional: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {/* Analytics/PostHog */}
                            <div className="flex items-start justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                                <div>
                                    <span className="font-bold text-white block mb-1">Analytics (PostHog)</span>
                                    <p className="text-xs text-slate-400">Helps us understand how you use our investment tools.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preferences.analytics}
                                        onChange={(e) => updateConsent({ analytics: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveManage}
                            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-sm hover:scale-[1.02] transition-all"
                        >
                            Save Preferences
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
