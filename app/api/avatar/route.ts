import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 5MB.' },
                { status: 400 }
            );
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/avatar.${fileExt}`;

        // Convert file to arrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true // Overwrite if exists
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            return NextResponse.json(
                { error: 'Failed to upload file' },
                { status: 500 }
            );
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        // Update user metadata with avatar URL
        const { error: updateError } = await supabase.auth.updateUser({
            data: { avatar_url: urlData.publicUrl }
        });

        if (updateError) {
            console.error('Error updating user metadata:', updateError);
        }

        return NextResponse.json({
            success: true,
            url: urlData.publicUrl
        });

    } catch (error) {
        console.error('Unexpected error in avatar upload:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();

        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // List files in user's folder
        const { data: files, error: listError } = await supabase.storage
            .from('avatars')
            .list(user.id);

        if (listError) {
            console.error('Error listing files:', listError);
            return NextResponse.json(
                { error: 'Failed to list files' },
                { status: 500 }
            );
        }

        // Delete all avatar files for this user
        if (files && files.length > 0) {
            const filesToDelete = files.map(file => `${user.id}/${file.name}`);
            const { error: deleteError } = await supabase.storage
                .from('avatars')
                .remove(filesToDelete);

            if (deleteError) {
                console.error('Error deleting files:', deleteError);
                return NextResponse.json(
                    { error: 'Failed to delete avatar' },
                    { status: 500 }
                );
            }
        }

        // Clear avatar URL from user metadata
        const { error: updateError } = await supabase.auth.updateUser({
            data: { avatar_url: null }
        });

        if (updateError) {
            console.error('Error updating user metadata:', updateError);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Unexpected error in avatar delete:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
