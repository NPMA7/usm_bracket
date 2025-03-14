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

    // Finalisasi turnamen di Challonge
    const challongeResponse = await axios.post(
      `${BASE_URL}/tournaments/${id}/finalize.json`,
      {
        api_key: API_KEY,
      }
    );

    const tournamentData = challongeResponse.data.tournament;

    // Update status turnamen di database
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('bracket_tournaments')
      .update({
        state: 'complete',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('challonge_id', id)
      .select();

    if (supabaseError) {
      console.error('Error updating tournament status in database:', supabaseError);
      return NextResponse.json(challongeResponse.data);
    }

    // Update final_rank peserta di database
    try {
      const participantsResponse = await axios.get(
        `${BASE_URL}/tournaments/${id}/participants.json`,
        {
          params: {
            api_key: API_KEY,
          },
        }
      );

      const participants = participantsResponse.data;

      // Update final_rank setiap peserta
      for (const participant of participants) {
        const participantData = participant.participant;
        
        if (participantData.final_rank) {
          await supabase
            .from('bracket_participants')
            .update({
              final_rank: participantData.final_rank,
              updated_at: new Date().toISOString()
            })
            .eq('challonge_id', participantData.id)
            .eq('tournament_id', id);
        }
      }
    } catch (participantError) {
      console.error('Error updating participants final rank:', participantError);
      // Tidak menghentikan proses karena turnamen sudah difinalisasi
    }

    return NextResponse.json({
      tournament: {
        ...tournamentData,
        local_data: supabaseData[0]
      }
    });
  } catch (error) {
    console.error('Error finalizing tournament:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to finalize tournament' },
      { status: error.response?.status || 500 }
    );
  }
} 