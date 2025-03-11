import { NextResponse } from 'next/server';
import axios from 'axios';

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

    // Mendapatkan detail turnamen untuk mendapatkan URL gambar bracket
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

    const tournament = response.data.tournament;
    
    // Cek apakah turnamen sudah dimulai
    const isStarted = tournament.state !== 'pending';
    
    // Buat URL untuk gambar bracket
    // Pastikan URL tidak undefined atau null
    const liveImageUrl = tournament.live_image_url || `https://challonge.com/${tournament.url}/module`;
    const svgIconUrl = tournament.svg_icon_url || `https://challonge.com/${tournament.url}.svg`;
    const fullSizeImageUrl = tournament.full_challonge_url + '.svg';
    
    const bracketUrls = {
      liveImage: liveImageUrl,
      svgImage: svgIconUrl,
      fullSizeImage: fullSizeImageUrl,
      isStarted: isStarted,
      participantsCount: tournament.participants_count || 0,
      state: tournament.state
    };

    return NextResponse.json(bracketUrls);
  } catch (error) {
    console.error('Error fetching bracket image:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch bracket image: ' + (error.response?.data?.errors?.[0] || error.message) },
      { status: error.response?.status || 500 }
    );
  }
} 