import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { getCurrentWIBTime } from '@/lib/utils';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = 'https://api.challonge.com/v1';

export async function POST(request, { params }) {
  try {
    const tournamentId = params?.id;
    if (!tournamentId) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    // Memulai turnamen di Challonge
    const startResponse = await axios.post(
      `${BASE_URL}/tournaments/${tournamentId}/start.json`,
      {},
      {
        params: {
          api_key: API_KEY,
        },
      }
    );

    if (!startResponse.data) {
      throw new Error('Failed to start tournament');
    }

    // Ambil data turnamen terbaru dari Challonge untuk mendapatkan started_at
    const tournamentResponse = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}.json`,
      {
        params: {
          api_key: API_KEY,
        },
      }
    );

    if (!tournamentResponse.data?.tournament) {
      throw new Error('Failed to fetch tournament data');
    }

    const tournamentData = tournamentResponse.data.tournament;

    // Update status dan started_at turnamen di database
    const { error: updateError } = await supabase
      .from('bracket_tournaments')
      .update({ 
        state: 'underway',
        started_at: getCurrentWIBTime(),
        updated_at: getCurrentWIBTime()
      })
      .eq('challonge_id', tournamentId);

    if (updateError) {
      console.error('Error updating tournament state:', updateError);
      throw new Error('Failed to update tournament state in database');
    }

    return NextResponse.json({ 
      message: 'Tournament started successfully',
      tournament: tournamentData
    });
  } catch (error) {
    console.error('Error starting tournament:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to start tournament' },
      { status: 500 }
    );
  }
} 