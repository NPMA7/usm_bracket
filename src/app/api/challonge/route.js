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
    // Ambil daftar turnamen dengan data peserta
    const response = await axios.get(`${BASE_URL}/tournaments.json`, {
      params: {
        api_key: API_KEY,
        include_participants: 1,
        state: 'all'
      }
    });

    const tournaments = response.data;

    // Proses setiap turnamen untuk mendapatkan pemenang
    for (const tournament of tournaments) {
      if (tournament.tournament.state === "complete") {
        try {
          // Ambil detail turnamen spesifik dengan data peserta
          const detailResponse = await axios.get(
            `${BASE_URL}/tournaments/${tournament.tournament.id}.json`,
            {
              params: {
                api_key: API_KEY,
                include_participants: 1
              }
            }
          );

          const tournamentDetail = detailResponse.data.tournament;
          
          // Cari peserta dengan final_rank = 1 (Juara 1)
          if (tournamentDetail.participants) {
            const winner = tournamentDetail.participants.find(
              p => p.participant.final_rank === 1
            );

            if (winner) {
              tournament.tournament.winner_name = winner.participant.name || winner.participant.display_name;
              (`Found winner for tournament ${tournament.tournament.id}:`, tournament.tournament.winner_name);
            }
          }
        } catch (detailError) {
          console.error(`Error fetching details for tournament ${tournament.tournament.id}:`, detailError);
        }
      }
    }

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: error.response?.status || 500 }
    );
  }
} 