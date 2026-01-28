import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // Optimization: Skip session refresh for public landing pages and non-API auth paths
    // if we don't even have a cookie.
    const hasSessionCookie = request.cookies.getAll().some(c => c.name.startsWith('sb-') && c.name.endsWith('-auth-token'));

    const publicRoutes = ['/', '/login', '/register', '/auth/callback'];
    const isPublicRoute = publicRoutes.includes(request.nextUrl.pathname);

    // Fast path: Don't hit Supabase if it's a public route and no cookie exists
    if (isPublicRoute && !hasSessionCookie) {
        return NextResponse.next({ request });
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // refreshing the auth token
    await supabase.auth.getUser()

    return supabaseResponse
}
