'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';

interface UserPreferencesContextType {
    stealthMode: boolean;
    setStealthMode: (enabled: boolean) => void;
    preferredCurrency: string;
    setPreferredCurrency: (currency: string) => void;
    isLoading: boolean;
}

const UserPreferencesContext = createContext<UserPreferencesContextType>({
    stealthMode: false,
    setStealthMode: () => { },
    preferredCurrency: 'USD',
    setPreferredCurrency: () => { },
    isLoading: true,
});

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [stealthMode, setStealthMode] = useState(false);
    const [preferredCurrency, setPreferredCurrency] = useState('USD');
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        const fetchPrefs = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('stealth_mode_enabled, preferred_currency')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                setStealthMode(data.stealth_mode_enabled ?? false);
                setPreferredCurrency(data.preferred_currency ?? 'USD');
            }
            setIsLoading(false);
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
