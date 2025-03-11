import { NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk menambahkan peserta ke turnamen
export async function POST(request) {
  try {
    const body = await request.json();
    const { tournamentId, name, email, seed } = body;

    if (!tournamentId || !name) {
      return NextResponse.json(
        { error: 'Tournament ID and participant name are required' },
        { status: 400 }
      );
    }

    const response = await axios.post(
      `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
      {
        api_key: API_KEY,
        participant: {
          name,
          email: email || '',
          seed: seed || null,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error adding participant:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to add participant' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk mendapatkan daftar peserta turnamen
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

    // Fetch participants first
    const participantsResponse = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
      {
        params: {
          api_key: API_KEY
        },
      }
    );

    // Then fetch matches
    const matchesResponse = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}/matches.json`,
      {
        params: {
          api_key: API_KEY
        },
      }
    );

    // Process the data to create standings
    const participants = participantsResponse.data;
    const matches = matchesResponse.data;

    // Calculate wins and losses for each participant
    const standings = participants.map(p => {
      const participantMatches = matches.filter(m => 
        m.match.player1_id === p.participant.id || 
        m.match.player2_id === p.participant.id
      );

      const wins = participantMatches.filter(m => 
        m.match.winner_id === p.participant.id && 
        m.match.state === 'complete'
      ).length;

      const losses = participantMatches.filter(m => 
        m.match.loser_id === p.participant.id && 
        m.match.state === 'complete'
      ).length;

      return {
        participant_id: p.participant.id,
        name: p.participant.name,
        rank: p.participant.final_rank || p.participant.seed,
        wins,
        losses
      };
    });

    // Sort by rank
    const sortedStandings = standings.sort((a, b) => (a.rank || 999) - (b.rank || 999));

    return NextResponse.json(sortedStandings);
  } catch (error) {
    console.error('Error fetching standings:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch standings' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk mengubah posisi/seed peserta
export async function PUT(request) {
  try {
    const body = await request.json();
    const { tournamentId, participantId, seed } = body;

    if (!tournamentId || !participantId || seed === undefined) {
      return NextResponse.json(
        { error: 'Tournament ID, participant ID, and seed are required' },
        { status: 400 }
      );
    }

    const response = await axios.put(
      `${BASE_URL}/tournaments/${tournamentId}/participants/${participantId}.json`,
      {
        api_key: API_KEY,
        participant: {
          seed: seed,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating participant seed:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to update participant seed' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk melakukan shuffle peserta
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { tournamentId, action } = body;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    if (action === 'randomize') {
      // Melakukan randomize/shuffle peserta
      const response = await axios.post(
        `${BASE_URL}/tournaments/${tournamentId}/participants/randomize.json`,
        {
          api_key: API_KEY,
        }
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Peserta berhasil di-shuffle' 
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported action: randomize' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error performing participant action:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to perform participant action' },
      { status: error.response?.status || 500 }
    );
  }
} 