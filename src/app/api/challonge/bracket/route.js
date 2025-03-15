import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import { getCurrentWIBTime } from '@/lib/utils';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk mendapatkan gambar bracket turnamen
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

    // Ambil data turnamen dari database
    const { data: tournament, error: tournamentError } = await supabase
      .from('bracket_tournaments')
      .select('*')
      .eq('challonge_id', tournamentId)
      .single();

    if (tournamentError) {
      throw new Error('Gagal mengambil data turnamen dari database');
    }
    
    // Cek apakah turnamen sudah dimulai
    const isStarted = tournament.state !== 'pending';
    
    // Buat URL untuk gambar bracket
    // Pastikan URL tidak undefined atau null
    const liveImageUrl = tournament.live_image_url || `https://challonge.com/${tournament.url}/module`;
    const svgIconUrl = `https://challonge.com/${tournament.url}.svg`;
    const fullSizeImageUrl = tournament.full_challonge_url + '.svg';
    
    const bracketUrls = {
      liveImage: liveImageUrl,
      svgImage: svgIconUrl,
      fullSizeImage: fullSizeImageUrl,
      isStarted: isStarted,
      participantsCount: tournament.participants_count || 0,
      state: tournament.state
    };

    // Sinkronisasi dengan Challonge di background untuk memastikan URL terbaru
    syncBracketWithChallonge(tournamentId, tournament);

    return NextResponse.json(bracketUrls);
  } catch (error) {
    console.error('Error fetching bracket image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bracket image: ' + (error.message) },
      { status: 500 }
    );
  }
}

// Fungsi helper untuk sinkronisasi dengan Challonge di background
async function syncBracketWithChallonge(tournamentId, localTournament) {
  try {
    // Mendapatkan detail turnamen dari Challonge
    const response = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}.json`,
      {
        params: {
          api_key: API_KEY,
          include_participants: 1,
          include_matches: 0,
        },
      }
    );

    const tournamentData = response.data.tournament;
    
    // Update URL dan informasi bracket di database
    await supabase
      .from('bracket_tournaments')
      .update({
        live_image_url: tournamentData.live_image_url,
        full_challonge_url: tournamentData.full_challonge_url,
        state: tournamentData.state,
        participants_count: tournamentData.participants_count,
        progress_meter: tournamentData.progress_meter,
        updated_at: getCurrentWIBTime()
      })
      .eq('challonge_id', tournamentId);
  } catch (error) {
    console.error('Error syncing bracket with Challonge:', error);
  }
} 