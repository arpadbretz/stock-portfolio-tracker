'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { CurrencyCode } from '@/types/portfolio';

interface UserPreferencesContextType {
    stealthMode: boolean;
    setStealthMode: (enabled: boolean) => void;
    preferredCurrency: CurrencyCode;
    setPreferredCurrency: (currency: CurrencyCode) => void;
    exchangeRates: Record<string, number>;
    isLoading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType>({
    stealthMode: false,
    setStealthMode: () => { },
    preferredCurrency: 'USD',
    setPreferredCurrency: () => { },
    exchangeRates: { USD: 1, EUR: 0.92, HUF: 350 },
    isLoading: true,
});

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [stealthMode, setStealthMode] = useState(false);
    const [preferredCurrency, setPreferredCurrency] = useState<CurrencyCode>('USD');
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ USD: 1, EUR: 0.92, HUF: 350 });
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchPrefs = async () => {
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('stealth_mode_enabled, preferred_currency')
                    .eq('id', user.id)
                    .single();

                if (!error && data) {
                    setStealthMode(data.stealth_mode_enabled ?? false);
                    setPreferredCurrency(data.preferred_currency ?? 'USD');
                }

                // Fetch real-time exchange rates
                const response = await fetch('/api/portfolio/rates'); // I'll need to check if this exists or use a fallback
                if (response.ok) {
                    const rateData = await response.json();
                    if (rateData.success) {
                        setExchangeRates(rateData.rates);
                    }
                }
            } catch (err) {
                console.error('Error fetching preferences/rates:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPrefs();
    }, [user, supabase]);

    return (
        <UserPreferencesContext.Provider
            value={{
                stealthMode,
                setStealthMode,
                preferredCurrency,
                setPreferredCurrency,
                exchangeRates,
                isLoading
            }}
        >
            <div className={stealthMode ? 'stealth-active' : ''}>
                {children}
            </div>
        </UserPreferencesContext.Provider>
    );
}

export const useUserPreferences = () => useContext(UserPreferencesContext);
