import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !user.email) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check if welcome email has already been sent
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('welcome_email_sent, display_name')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Error fetching profile:', profileError);
            return NextResponse.json({ success: false, error: 'Profile error' }, { status: 500 });
        }

        if (profile?.welcome_email_sent) {
            return NextResponse.json({ success: true, message: 'Already sent' });
        }

        // Send welcome email
        const result = await sendWelcomeEmail({
            to: user.email,
            userName: profile?.display_name || user.email.split('@')[0],
        });

        if (!result.success) {
            console.error('Failed to send welcome email:', result.error);
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        // Update profile to mark as sent
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ welcome_email_sent: true })
            .eq('id', user.id);

        if (updateError) {
            console.error('Failed to update profile:', updateError);
            // Email was sent but DB update failed - log generic error but don't fail request
        }

        return NextResponse.json({ success: true, message: 'Welcome email sent' });
    } catch (error) {
        console.error('Welcome email API error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
