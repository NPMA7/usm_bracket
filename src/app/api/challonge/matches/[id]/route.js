import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Mendapatkan data pertandingan
export async function GET(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const matchId = await params.id;

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key tidak ditemukan' },
        { status: 500 }
      );
    }

    // Jika tournamentId ada, berarti kita ingin mendapatkan semua pertandingan dalam turnamen
    if (tournamentId) {
      const url = `${BASE_URL}/tournaments/${tournamentId}/matches.json`;
      
      const response = await axios.get(url, {
        params: {
          api_key: API_KEY
        }
      });

      return NextResponse.json(response.data);
    }
    
    // Jika matchId ada, berarti kita ingin mendapatkan detail pertandingan tertentu
    if (matchId) {
      if (!tournamentId) {
        return NextResponse.json(
          { error: 'Tournament ID diperlukan' },
          { status: 400 }
        );
      }
      
      const url = `${BASE_URL}/tournaments/${tournamentId}/matches/${matchId}.json`;
      
      const response = await axios.get(url, {
        params: {
          api_key: API_KEY
        }
      });

      return NextResponse.json(response.data);
    }

    return NextResponse.json(
      { error: 'Parameter tidak valid' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching match data:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Gagal mengambil data pertandingan' },
      { status: error.response?.status || 500 }
    );
  }
}

// Memperbarui hasil pertandingan
export async function PUT(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const matchId = await params.id;
    
    if (!tournamentId || !matchId) {
      return NextResponse.json(
        { error: 'Tournament ID dan Match ID diperlukan' },
        { status: 400 }
      );
    }
    
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key tidak ditemukan' },
        { status: 500 }
      );
    }
    
    const body = await request.json();
    const url = `${BASE_URL}/tournaments/${tournamentId}/matches/${matchId}.json`;
    
    const response = await axios.put(url, body, {
      params: {
        api_key: API_KEY
      }
    });
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating match:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Gagal memperbarui pertandingan' },
      { status: error.response?.status || 500 }
    );
  }
}

// Membuka kembali pertandingan atau operasi lainnya
export async function POST(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const matchId = await params.id;
    const { action } = await request.json();
    
    if (!tournamentId || !matchId) {
      return NextResponse.json(
        { error: 'Tournament ID dan Match ID diperlukan' },
        { status: 400 }
      );
    }
    
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key tidak ditemukan' },
        { status: 500 }
      );
    }
    
    // Jika action adalah 'reopen', maka buka kembali pertandingan
    if (action === 'reopen') {
      const url = `${BASE_URL}/tournaments/${tournamentId}/matches/${matchId}/reopen.json`;
      
      const response = await axios.post(url, {}, {
        params: {
          api_key: API_KEY
        }
      });
      
      // Update match state in local database using Supabase
      const { error: supabaseError } = await supabase
        .from('bracket_matches')
        .update({
          winner_id: null,
          scores_csv: '',
          state: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('challonge_id', matchId)
        .eq('tournament_id', tournamentId);
      
      if (supabaseError) {
        console.error('Failed to update match in local database:', supabaseError);
      }
      
      return NextResponse.json(response.data);
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing match action:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Gagal memproses aksi pertandingan' },
      { status: error.response?.status || 500 }
    );
  }
} 