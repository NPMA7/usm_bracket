import { NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk membuat turnamen baru
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, tournamentType, description, gameType } = body;

    const response = await axios.post(`${BASE_URL}/tournaments.json`, {
      api_key: API_KEY,
      tournament: {
        name,
        tournament_type: tournamentType || 'single elimination',
        description: description || '',
        game_name: gameType || '',
        hold_third_place_match: true,
      }
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating tournament:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk mendapatkan daftar turnamen
export async function GET() {
  try {
    const response = await axios.get(`${BASE_URL}/tournaments.json`, {
      params: {
        api_key: API_KEY,
      }
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching tournaments:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: error.response?.status || 500 }
    );
  }
} 