'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ConsentPreferences {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
}

interface ConsentContextType {
    preferences: ConsentPreferences;
    updateConsent: (prefs: Partial<ConsentPreferences>) => void;
    hasDetermined: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

const STORAGE_KEY = 'user_consent_prefs';

export function ConsentProvider({ children }: { children: React.ReactNode }) {
    const [preferences, setPreferences] = useState<ConsentPreferences>({
        necessary: true,
        functional: true,
        analytics: false,
    });
    const [hasDetermined, setHasDetermined] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setPreferences(JSON.parse(saved));
                setHasDetermined(true);
            } catch (e) {
                console.error('Failed to parse consent prefs', e);
            }
        }
    }, []);

    const updateConsent = (prefs: Partial<ConsentPreferences>) => {
        const newPrefs = { ...preferences, ...prefs };
        setPreferences(newPrefs);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newPrefs));
        setHasDetermined(true);

        // Dispatch custom event for vanilla JS listeners/third-party scripts
        window.dispatchEvent(new CustomEvent('consent_updated', { detail: newPrefs }));
    };

    return (
        <ConsentContext.Provider value={{ preferences, updateConsent, hasDetermined }}>
            {children}
        </ConsentContext.Provider>
    );
}

export function useConsent() {
    const context = useContext(ConsentContext);
    if (!context) {
        throw new Error('useConsent must be used within a ConsentProvider');
    }
    return context;
}
