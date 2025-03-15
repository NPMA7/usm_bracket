import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { getCurrentWIBTime } from '@/lib/utils';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = 'https://api.challonge.com/v1';

export async function POST(request, { params }) {
  try {
    if (!params?.id) {
      return NextResponse.json({ error: 'Tournament ID is required' }, { status: 400 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'API key is not configured' }, { status: 500 });
    }

    // Menyelesaikan turnamen di Challonge
    const finalizeResponse = await axios.post(
      `${BASE_URL}/tournaments/${params.id}/finalize.json`,
      {},
      {
        params: {
          api_key: API_KEY,
        },
      }
    );

    if (!finalizeResponse.data) {
      throw new Error('Failed to finalize tournament');
    }

    // Update status turnamen di database
    const { error: updateError } = await supabase
      .from('bracket_tournaments')
      .update({
        state: 'complete',
        completed_at: getCurrentWIBTime(),
        updated_at: getCurrentWIBTime()
      })
      .eq('challonge_id', params.id);

    if (updateError) {
      console.error('Error updating tournament state:', updateError);
      throw new Error('Failed to update tournament state in database');
    }

    // Mengambil dan menyimpan hasil akhir peserta
    const participantsResponse = await axios.get(
      `${BASE_URL}/tournaments/${params.id}/participants.json`,
      {
        params: {
          api_key: API_KEY,
        },
      }
    );

    if (participantsResponse.data) {
      for (const participant of participantsResponse.data) {
        const { error: participantError } = await supabase
          .from('bracket_participants')
          .update({
            final_rank: participant.participant.final_rank,
            updated_at: getCurrentWIBTime()
          })
          .eq('challonge_id', participant.participant.id)
          .eq('tournament_id', params.id);

        if (participantError) {
          console.error('Error updating participant final rank:', participantError);
        }
      }
    }

    return NextResponse.json({ message: 'Tournament finalized successfully' });
  } catch (error) {
    console.error('Error finalizing tournament:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to finalize tournament' },
      { status: 500 }
    );
  }
} 