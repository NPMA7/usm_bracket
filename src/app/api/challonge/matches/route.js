import { NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk mendapatkan daftar pertandingan dalam turnamen
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Cek status turnamen terlebih dahulu
    const tournamentResponse = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}.json`,
      {
        params: {
          api_key: API_KEY,
        },
      }
    );

    const tournament = tournamentResponse.data.tournament;
    const isStarted = tournament.state !== 'pending';

    // Jika turnamen belum dimulai, kembalikan array kosong
    if (!isStarted) {
      return NextResponse.json([]);
    }

    // Jika turnamen sudah dimulai, ambil daftar pertandingan
    const response = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}/matches.json`,
      {
        params: {
          api_key: API_KEY,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching matches:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk memperbarui hasil pertandingan
export async function PUT(request) {
  try {
    const body = await request.json();
    const { tournamentId, matchId, winnerId, scores, isReset } = body;

    if (!tournamentId || !matchId) {
      return NextResponse.json(
        { error: 'Tournament ID and match ID are required' },
        { status: 400 }
      );
    }

    // Jika isReset true, reset pemenang dan skor
    const matchData = isReset 
      ? {
          winner_id: null,
          scores_csv: '',
        }
      : {
          winner_id: winnerId,
          scores_csv: scores || '',
        };

    if (!isReset && !winnerId) {
      return NextResponse.json(
        { error: 'Winner ID is required for non-reset updates' },
        { status: 400 }
      );
    }

    const response = await axios.put(
      `${BASE_URL}/tournaments/${tournamentId}/matches/${matchId}.json`,
      {
        api_key: API_KEY,
        match: matchData,
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating match:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk membuka kembali pertandingan (reopen)
export async function POST(request) {
  try {
    const body = await request.json();
    const { tournamentId, matchId } = body;

    if (!tournamentId || !matchId) {
      return NextResponse.json(
        { error: 'Tournament ID and match ID are required' },
        { status: 400 }
      );
    }

    const response = await axios.post(
      `${BASE_URL}/tournaments/${tournamentId}/matches/${matchId}/reopen.json`,
      {
        api_key: API_KEY,
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error reopening match:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to reopen match' },
      { status: error.response?.status || 500 }
    );
  }
} 