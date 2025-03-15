import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY;
const CHALLONGE_BASE_URL = 'https://api.challonge.com/v1';

export async function POST(request, { params }) {
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

    // Reset turnamen di Challonge
    await axios.post(
      `${CHALLONGE_BASE_URL}/tournaments/${id}/reset.json`,
      {},
      {
        params: {
          api_key: CHALLONGE_API_KEY,
        },
      }
    );

    // Update status di database lokal
    const { error: updateError } = await supabase
      .from('bracket_tournaments')
      .update({
        state: 'pending',
        started_at: null,
        completed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('challonge_id', id);

    if (updateError) {
      throw new Error('Gagal mengupdate status turnamen di database');
    }

    // Reset matches di database lokal
    const { error: matchesError } = await supabase
      .from('bracket_matches')
      .update({
        winner_id: null,
        scores_csv: null,
        state: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('tournament_id', id);

    if (matchesError) {
      throw new Error('Gagal mereset pertandingan di database');
    }

    return NextResponse.json(
      { message: 'Turnamen berhasil direset' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting tournament:', error);
    return NextResponse.json(
      { error: 'Gagal mereset turnamen' },
      { status: 500 }
    );
  }
} 