import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY;
const CHALLONGE_BASE_URL = 'https://api.challonge.com/v1';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Tournament ID tidak ditemukan' },
        { status: 400 }
      );
    }

    if (!CHALLONGE_API_KEY) {
      return NextResponse.json(
        { error: 'API key tidak ditemukan' },
        { status: 500 }
      );
    }

    // Hapus turnamen di Challonge
    await axios.delete(
      `${CHALLONGE_BASE_URL}/tournaments/${id}.json`,
      {
        params: {
          api_key: CHALLONGE_API_KEY,
        },
      }
    );

    // Hapus data terkait di database lokal
    await Promise.all([
      supabase.from('bracket_matches').delete().eq('tournament_id', id),
      supabase.from('bracket_participants').delete().eq('tournament_id', id),
      supabase.from('bracket_tournaments').delete().eq('challonge_id', id)
    ]);

    return NextResponse.json(
      { message: 'Turnamen berhasil dihapus' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus turnamen' },
      { status: 500 }
    );
  }
} 