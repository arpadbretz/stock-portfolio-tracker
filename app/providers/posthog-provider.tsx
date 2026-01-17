'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

if (typeof window !== 'undefined') {
    const posthog_key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthog_host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (posthog_key && posthog_host) {
        posthog.init(posthog_key, {
            api_host: posthog_host,
            person_profiles: 'identified_only',
            capture_pageview: false // Handled manually below or by router
        })
    }
}

export function PostHogContextProvider({ children }: { children: React.ReactNode }) {
    return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
