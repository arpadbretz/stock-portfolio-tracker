'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import posthog from 'posthog-js';
import * as Sentry from '@sentry/nextjs';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isLoading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const setData = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setIsLoading(false);

            if (session?.user) {
                // Identify user in PostHog
                posthog.identify(session.user.id, {
                    email: session.user.email,
                    app_version: '0.1.0'
                });

                // Identify user in Sentry
                Sentry.setUser({
                    id: session.user.id,
                    email: session.user.email ?? undefined,
                });
            } else if (event === 'SIGNED_OUT') {
                posthog.reset();
                Sentry.setUser(null);
            }

            router.refresh();
        });

        setData();

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    const signOut = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
