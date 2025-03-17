import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk mendapatkan data peserta turnamen
export async function POST(request) {
  try {
    const { tournamentId } = await request.json();
    
    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Ambil data turnamen dari database
    const { data: tournament, error: tournamentError } = await supabase
      .from('bracket_tournaments')
      .select('*')
      .eq('challonge_id', tournamentId)
      .single();

    if (tournamentError) {
      throw new Error('Gagal mengambil data turnamen: ' + tournamentError.message);
    }

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    // Dapatkan data peserta dari Challonge API
    const participantsResponse = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
      {
        params: {
          api_key: API_KEY,
        },
      }
    );

    if (!participantsResponse.data || !Array.isArray(participantsResponse.data)) {
      throw new Error('Gagal mengambil data peserta');
    }

    // Format data peserta
    const participants = participantsResponse.data.map(p => ({
      id: p.participant.id,
      name: p.participant.name,
      seed: p.participant.seed,
      final_rank: p.participant.final_rank || p.participant.seed
    })).sort((a, b) => a.seed - b.seed); // Urutkan berdasarkan seed

    // Dapatkan data pemenang saat ini jika ada
    const currentWinners = {
      winner: tournament.winner_id ? {
        id: tournament.winner_id,
        name: tournament.winner_name
      } : null,
      runnerUp: tournament.runner_up_id ? {
        id: tournament.runner_up_id,
        name: tournament.runner_up_name
      } : null,
      thirdPlace: tournament.third_place_id ? {
        id: tournament.third_place_id,
        name: tournament.third_place_name
      } : null
    };

    return NextResponse.json({
      success: true,
      tournament: {
        id: tournament.challonge_id,
        name: tournament.name
      },
      participants,
      currentWinners
    });
  } catch (error) {
    console.error('Error getting tournament participants:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mendapatkan data peserta turnamen' },
      { status: 500 }
    );
  }
} 