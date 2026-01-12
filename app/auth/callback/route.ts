import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type');
    // if "next" is in search params, use it as the redirection URL after successful exchange
    const next = searchParams.get('next') ?? '/dashboard';

    const supabase = await createClient();
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';

    const getRedirectUrl = (path: string) => {
        if (isLocalEnv) {
            return `${origin}${path}`;
        } else if (forwardedHost) {
            return `https://${forwardedHost}${path}`;
        } else {
            return `${origin}${path}`;
        }
    };

    // Handle OAuth callback (code exchange)
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(getRedirectUrl(next));
        }
        console.error('OAuth code exchange error:', error);
    }

    // Handle email verification (token hash)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: type as 'signup' | 'email' | 'recovery' | 'invite',
        });

        if (!error) {
            // Email verified successfully, redirect to dashboard or login
            if (type === 'signup' || type === 'email') {
                return NextResponse.redirect(getRedirectUrl('/login?verified=true'));
            }
            if (type === 'recovery') {
                return NextResponse.redirect(getRedirectUrl('/reset-password'));
            }
            return NextResponse.redirect(getRedirectUrl(next));
        }
        console.error('Email verification error:', error);
    }

    // If we have neither code nor token_hash, or both failed
    // Try to check if user is already authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // User is authenticated, redirect to dashboard
        return NextResponse.redirect(getRedirectUrl('/dashboard'));
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(getRedirectUrl('/auth/auth-code-error'));
}
