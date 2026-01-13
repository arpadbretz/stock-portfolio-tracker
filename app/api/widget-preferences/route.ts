import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - Fetch user's widget preferences
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('widget_layouts, widget_visibility')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching widget preferences:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            layouts: profile?.widget_layouts || null,
            visibility: profile?.widget_visibility || null,
        });
    } catch (error) {
        console.error('Widget preferences GET error:', error);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}

// POST - Save user's widget preferences
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { layouts, visibility } = body;

        const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (layouts !== undefined) {
            updateData.widget_layouts = layouts;
        }

        if (visibility !== undefined) {
            updateData.widget_visibility = visibility;
        }

        const { error } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id);

        if (error) {
            console.error('Error saving widget preferences:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Widget preferences POST error:', error);
        return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
    }
}
