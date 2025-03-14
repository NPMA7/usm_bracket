import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk mengedit turnamen
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Buat objek untuk parameter turnamen
    const tournamentParams = {
      name: body.name,
      tournament_type: body.tournament_type,
      game_name: body.game_name,
      description: body.description,
      ranked_by: body.ranked_by,
      pts_for_match_win: body.pts_for_match_win,
      pts_for_match_tie: body.pts_for_match_tie,
      pts_for_game_win: body.pts_for_game_win,
      pts_for_game_tie: body.pts_for_game_tie,
      pts_for_bye: body.pts_for_bye,
      rr_iterations: body.rr_iterations
    };

    // Jika URL diubah, tambahkan ke parameter
    if (body.url) {
      tournamentParams.url = body.url;
    }

    // Jika ini adalah turnamen two stage, tambahkan parameter yang sesuai
    if (body.tournament_stage === 'two_stage') {
      tournamentParams.group_stages_enabled = true;
      tournamentParams.group_stage_format = body.group_stage_format;
      tournamentParams.final_stage_format = body.final_stage_format;
      tournamentParams.group_size = body.group_size;
      tournamentParams.group_advance = body.group_advance;
    } else {
      tournamentParams.group_stages_enabled = false;
    }

    // Update turnamen di Challonge
    const challongeResponse = await axios.put(`${BASE_URL}/tournaments/${id}.json`, {
      api_key: API_KEY,
      tournament: tournamentParams
    });

    const tournamentData = challongeResponse.data.tournament;

    // Update data turnamen di Supabase
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('bracket_tournaments')
      .update({
        name: tournamentData.name,
        tournament_type: tournamentData.tournament_type,
        game_name: tournamentData.game_name || '',
        description: tournamentData.description || '',
        url: tournamentData.url || '',
        live_image_url: tournamentData.live_image_url || `https://challonge.com/${tournamentData.url}/module`,
        full_challonge_url: tournamentData.full_challonge_url || `https://challonge.com/${tournamentData.url}`,
        updated_at: new Date().toISOString()
      })
      .eq('challonge_id', id)
      .select();

    if (supabaseError) {
      console.error('Error updating in Supabase:', supabaseError);
    }

    return NextResponse.json({
      success: true,
      tournament: tournamentData,
      local_data: supabaseData ? supabaseData[0] : null
    });
  } catch (error) {
    console.error('Error updating tournament:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: error.response?.status || 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Hapus turnamen dari Challonge
    await axios.delete(`${BASE_URL}/tournaments/${id}.json`, {
      params: {
        api_key: API_KEY
      }
    });

    // Hapus data turnamen dari Supabase
    const { error: supabaseError } = await supabase
      .from('bracket_tournaments')
      .delete()
      .eq('challonge_id', id);

    if (supabaseError) {
      console.error('Error deleting from Supabase:', supabaseError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tournament:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: error.response?.status || 500 }
    );
  }
} 