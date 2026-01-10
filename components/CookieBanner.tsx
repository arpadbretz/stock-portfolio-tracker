'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Settings } from 'lucide-react';

interface CookieConsent {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
}

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [consent, setConsent] = useState<CookieConsent>({
        necessary: true, // Always true
        analytics: false,
        marketing: false,
    });

    useEffect(() => {
        // Check if user has already given consent
        try {
            const savedConsent = localStorage.getItem('cookieConsent');
            if (savedConsent) {
                const parsed = JSON.parse(savedConsent);
                setConsent(parsed);
                console.log('[CookieBanner] Loaded saved consent:', parsed);
                // Ensure state matches localStorage if they differ
                setShowBanner(false);
            } else {
                setShowBanner(true);
            }
        } catch (e) {
            console.error('[CookieBanner] Error loading consent:', e);
            setShowBanner(true);
        }
    }, []);

    const saveConsent = (consentData: CookieConsent) => {
        try {
            console.log('[CookieBanner] Saving consent:', consentData);
            localStorage.setItem('cookieConsent', JSON.stringify(consentData));
            // Save analytics consent flag for tracking library
            localStorage.setItem('cookie_consent', consentData.analytics ? 'accepted' : 'rejected');

            setConsent(consentData);
            setShowBanner(false);
            setShowSettings(false);

            // Reload the page or trigger a custom event if tracking needs to start immediately
            if (consentData.analytics) {
                window.dispatchEvent(new Event('cookieConsentUpdate'));
            }
        } catch (e) {
            console.error('[CookieBanner] Error saving consent:', e);
        }
    };

    const acceptAll = () => {
        const allConsent = {
            necessary: true,
            analytics: true,
            marketing: true,
        };
        saveConsent(allConsent);
    };

    const acceptNecessary = () => {
        saveConsent({
            necessary: true,
            analytics: false,
            marketing: false,
        });
    };

    const saveCustom = () => {
        saveConsent(consent);
    };

    return (
        <>
            {/* Floating Cookie Settings Button (Always visible after consent) */}
            {!showBanner && (
                <button
                    onClick={() => setShowSettings(true)}
                    className="fixed bottom-4 right-4 z-40 p-3 bg-slate-800 border border-slate-600 rounded-full shadow-lg hover:bg-slate-700 transition-all hover:scale-110 group"
                    title="Cookie Settings"
                    aria-label="Cookie Settings"
                >
                    <Cookie className="text-slate-400 group-hover:text-white transition-colors" size={20} />
                </button>
            )}

            {/* Main Banner */}
            {showBanner && (
                <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700 shadow-2xl">
                    <div className="container mx-auto max-w-6xl">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                <Cookie className="text-blue-400 mt-1 flex-shrink-0" size={24} />
                                <div>
                                    <h3 className="text-white font-semibold mb-1">
                                        We value your privacy
                                    </h3>
                                    <p className="text-sm text-slate-300 leading-relaxed">
                                        We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                                        By clicking "Accept All", you consent to our use of cookies.{' '}
                                        <a href="/legal/privacy" className="text-blue-400 hover:underline">
                                            Learn more
                                        </a>
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 md:flex-shrink-0">
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 transition-all text-sm font-medium flex items-center gap-2"
                                >
                                    <Settings size={16} />
                                    Customize
                                </button>
                                <button
                                    onClick={acceptNecessary}
                                    className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white hover:bg-slate-700 transition-all text-sm font-medium"
                                >
                                    Necessary Only
                                </button>
                                <button
                                    onClick={acceptAll}
                                    className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all text-sm"
                                >
                                    Accept All
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Settings Modal */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
                            <h2 className="text-2xl font-bold text-white">Cookie Preferences</h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                className="p-2 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <p className="text-slate-300 text-sm">
                                We use different types of cookies to optimize your experience on our website.
                                Click on the categories below to learn more and change our default settings.
                                Blocking some types of cookies may impact your experience of the site.
                            </p>

                            {/* Necessary Cookies */}
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="text-white font-semibold">Strictly Necessary Cookies</h3>
                                        <p className="text-sm text-slate-400 mt-1">
                                            These cookies are essential for the website to function properly. They enable core functionality such as security, authentication, and accessibility.
                                        </p>
                                    </div>
                                    <div className="ml-4 flex items-center">
                                        <span className="text-xs font-medium text-slate-500 bg-slate-700 px-2 py-1 rounded">
                                            Always Active
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Analytics Cookies */}
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-white font-semibold">Analytics Cookies</h3>
                                        <p className="text-sm text-slate-400 mt-1">
                                            These cookies help us understand how visitors interact with our website, which pages are visited, and any errors encountered.
                                        </p>
                                    </div>
                                    <label className="ml-4 relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={consent.analytics}
                                            onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>

                            {/* Marketing Cookies */}
                            <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-white font-semibold">Marketing Cookies</h3>
                                        <p className="text-sm text-slate-400 mt-1">
                                            These cookies are used to track visitors across websites to display relevant advertisements and marketing campaigns.
                                        </p>
                                    </div>
                                    <label className="ml-4 relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={consent.marketing}
                                            onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-700 flex gap-3 sticky bottom-0 bg-slate-800">
                            <button
                                onClick={acceptNecessary}
                                className="flex-1 px-6 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white font-semibold hover:bg-slate-600 transition-all"
                            >
                                Reject All
                            </button>
                            <button
                                onClick={saveCustom}
                                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/20 transition-all"
                            >
                                Save Preferences
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
