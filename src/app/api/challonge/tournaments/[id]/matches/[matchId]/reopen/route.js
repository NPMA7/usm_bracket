import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request, { params }) {
  const { id, matchId } = await params;
  const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY;

  if (!CHALLONGE_API_KEY) {
    return NextResponse.json(
      { error: 'API key Challonge tidak ditemukan' },
      { status: 500 }
    );
  }

  try {
    
    const url = `https://api.challonge.com/v1/tournaments/${id}/matches/${matchId}/reopen.json?api_key=${CHALLONGE_API_KEY}`;
 
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });


    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Challonge API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

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
      .eq('tournament_id', id);

    if (supabaseError) {
      console.error('Failed to update match in local database:', supabaseError);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reopening match in Challonge:', error);
    return NextResponse.json(
      { error: `Gagal membuka kembali pertandingan di Challonge: ${error.message}` },
      { status: 500 }
    );
  }
} 