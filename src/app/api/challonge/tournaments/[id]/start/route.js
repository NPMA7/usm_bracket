import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

export async function POST(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Update status turnamen di Challonge
    const challongeResponse = await axios.post(
      `${BASE_URL}/tournaments/${id}/start.json`,
      {
        api_key: API_KEY,
      }
    );

    const tournamentData = challongeResponse.data.tournament;

    // Update status turnamen di database
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('bracket_tournaments')
      .update({
        state: 'underway',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('challonge_id', id)
      .select();

    if (supabaseError) {
      console.error('Error updating tournament status in database:', supabaseError);
      return NextResponse.json(challongeResponse.data);
    }

    // Ambil data pertandingan dari Challonge dan simpan ke database
    try {
      const matchesResponse = await axios.get(
        `${BASE_URL}/tournaments/${id}/matches.json`,
        {
          params: {
            api_key: API_KEY,
          },
        }
      );

      const matches = matchesResponse.data;

      // Simpan setiap pertandingan ke database
      for (const match of matches) {
        const matchData = match.match;
        
        await supabase
          .from('bracket_matches')
          .insert([
            {
              id: matchData.id,
              challonge_id: matchData.id,
              tournament_id: id,
              round: matchData.round,
              player1_id: matchData.player1_id,
              player2_id: matchData.player2_id,
              winner_id: matchData.winner_id,
              loser_id: matchData.loser_id,
              scores_csv: matchData.scores_csv,
              state: matchData.state,
              suggested_play_order: matchData.suggested_play_order
            }
          ])
          .onConflict(['challonge_id', 'tournament_id'])
          .merge();
      }
    } catch (matchError) {
      console.error('Error saving matches to database:', matchError);
      // Tidak menghentikan proses karena turnamen sudah dimulai
    }

    return NextResponse.json({
      tournament: {
        ...tournamentData,
        local_data: supabaseData[0]
      }
    });
  } catch (error) {
    console.error('Error starting tournament:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to start tournament' },
      { status: error.response?.status || 500 }
    );
  }
} 