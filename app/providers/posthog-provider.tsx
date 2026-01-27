'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { useConsent } from '@/components/providers/ConsentProvider'

export function PostHogContextProvider({ children }: { children: React.ReactNode }) {
    const { preferences, hasDetermined } = useConsent();

    useEffect(() => {
        if (!hasDetermined) return;

        const posthog_key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        const posthog_host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

        if (posthog_key && posthog_host && preferences.analytics) {
            posthog.init(posthog_key, {
                api_host: posthog_host,
                person_profiles: 'identified_only',
                capture_pageview: false
            })
        } else if (!preferences.analytics && posthog.isFeatureEnabled('any')) {
            // If consent is revoked, we opt out
            posthog.opt_out_capturing();
        }
    }, [preferences.analytics, hasDetermined]);

    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
