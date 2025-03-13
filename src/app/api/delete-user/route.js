import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Inisialisasi Supabase client dengan Service Role Key untuk akses penuh
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Ambil data pengguna untuk mendapatkan avatar
    const { data: userData, error: fetchError } = await adminSupabase
      .from('users')
      .select('avatar')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Failed to fetch user data', details: fetchError },
        { status: 500 }
      );
    }

    // Hapus file avatar dari storage jika ada
    if (userData.avatar) {
      const fileName = userData.avatar.split('/').pop(); // Ambil nama file dari URL
      const { error: deleteError } = await adminSupabase
        .storage
        .from('avatars')
        .remove([fileName]);

      if (deleteError) {
        return NextResponse.json(
          { error: 'Failed to delete avatar from storage', details: deleteError },
          { status: 500 }
        );
      }
    }

    // Hapus pengguna dari database
    const { error } = await adminSupabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete user', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, message: 'User and avatar deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}