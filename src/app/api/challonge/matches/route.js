import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk mendapatkan daftar pertandingan dalam turnamen
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const rawData = searchParams.get('raw') === 'true';

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Cek status turnamen dari database
    const { data: tournamentData, error: tournamentError } = await supabase
      .from('bracket_tournaments')
      .select('state')
      .eq('challonge_id', tournamentId)
      .single();

    if (tournamentError) {
      throw new Error('Gagal mengambil data turnamen dari database');
    }

    const isStarted = tournamentData.state !== 'pending';

    // Jika turnamen belum dimulai, kembalikan array kosong
    if (!isStarted) {
      return NextResponse.json([]);
    }

    // Ambil data pertandingan dari database
    const { data: matches, error: matchesError } = await supabase
      .from('bracket_matches')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('suggested_play_order', { nullsLast: true });

    if (matchesError) {
      throw new Error('Gagal mengambil data pertandingan dari database');
    }

    // Jika raw data diminta, kembalikan data mentah
    if (rawData) {
      return NextResponse.json(matches);
    }

    // Format data pertandingan seperti response dari Challonge
    const formattedMatches = matches.map(match => ({
      match: {
        id: match.challonge_id,
        tournament_id: match.tournament_id,
        round: match.round,
        player1_id: match.player1_id,
        player2_id: match.player2_id,
        winner_id: match.winner_id,
        loser_id: match.loser_id,
        scores_csv: match.scores_csv,
        state: match.state,
        suggested_play_order: match.suggested_play_order,
        created_at: match.created_at,
        updated_at: match.updated_at
      }
    }));

    // Sinkronisasi dengan Challonge di background
    syncMatchesWithChallonge(tournamentId, matches);

    return NextResponse.json(formattedMatches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk memperbarui hasil pertandingan
export async function PUT(request) {
  try {
    const body = await request.json();
    const { tournamentId, matchId, winnerId, scores, isReset } = body;

    if (!tournamentId || !matchId) {
      return NextResponse.json(
        { error: 'Tournament ID and match ID are required' },
        { status: 400 }
      );
    }

    // Jika isReset true, reset pemenang dan skor
    const matchData = isReset 
      ? {
          winner_id: null,
          scores_csv: '',
          state: 'open'
        }
      : {
          winner_id: winnerId,
          scores_csv: scores || '',
          state: 'complete'
        };

    if (!isReset && !winnerId) {
      return NextResponse.json(
        { error: 'Winner ID is required for non-reset updates' },
        { status: 400 }
      );
    }

    // Update pertandingan di database terlebih dahulu
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('bracket_matches')
      .update({
        ...matchData,
        updated_at: new Date().toISOString()
      })
      .eq('challonge_id', matchId)
      .eq('tournament_id', tournamentId)
      .select();

    if (supabaseError) {
      console.error('Error updating match in database:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to update match in database' },
        { status: 500 }
      );
    }

    // Update pertandingan di Challonge di background
    try {
      await axios.put(
        `${BASE_URL}/tournaments/${tournamentId}/matches/${matchId}.json`,
        {
          api_key: API_KEY,
          match: {
            winner_id: matchData.winner_id,
            scores_csv: matchData.scores_csv
          }
        }
      );
    } catch (challongeError) {
      console.error('Error updating match in Challonge:', challongeError);
      // Tidak menghentikan proses karena data sudah diupdate di database
    }

    return NextResponse.json({
      success: true,
      match: supabaseData[0]
    });
  } catch (error) {
    console.error('Error updating match:', error);
    return NextResponse.json(
      { error: 'Failed to update match' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk membuka kembali pertandingan (reopen)
export async function POST(request) {
  try {
    const body = await request.json();
    const { tournamentId, matchId } = body;

    if (!tournamentId || !matchId) {
      return NextResponse.json(
        { error: 'Tournament ID and match ID are required' },
        { status: 400 }
      );
    }

    // Update pertandingan di database terlebih dahulu
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('bracket_matches')
      .update({
        winner_id: null,
        scores_csv: '',
        state: 'open',
        updated_at: new Date().toISOString()
      })
      .eq('challonge_id', matchId)
      .eq('tournament_id', tournamentId)
      .select();

    if (supabaseError) {
      console.error('Error reopening match in database:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to reopen match in database' },
        { status: 500 }
      );
    }

    // Reopen pertandingan di Challonge di background
    try {
      await axios.post(
        `${BASE_URL}/tournaments/${tournamentId}/matches/${matchId}/reopen.json`,
        {
          api_key: API_KEY
        }
      );
    } catch (challongeError) {
      console.error('Error reopening match in Challonge:', challongeError);
      // Tidak menghentikan proses karena data sudah diupdate di database
    }

    return NextResponse.json({
      success: true,
      match: supabaseData[0]
    });
  } catch (error) {
    console.error('Error reopening match:', error);
    return NextResponse.json(
      { error: 'Failed to reopen match' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi helper untuk sinkronisasi dengan Challonge di background
async function syncMatchesWithChallonge(tournamentId, localMatches) {
  try {
    // Ambil data pertandingan dari Challonge
    const challongeResponse = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}/matches.json`,
      {
        params: {
          api_key: API_KEY
        }
      }
    );

    const challongeMatches = challongeResponse.data;

    // Buat map dari pertandingan lokal untuk pencarian yang lebih cepat
    const localMatchesMap = {};
    localMatches.forEach(match => {
      localMatchesMap[match.challonge_id] = match;
    });

    // Proses setiap pertandingan dari Challonge
    for (const challongeMatch of challongeMatches) {
      const matchData = challongeMatch.match;
      const localMatch = localMatchesMap[matchData.id];

      if (localMatch) {
        // Update pertandingan yang sudah ada
        await supabase
          .from('bracket_matches')
          .update({
            round: matchData.round,
            player1_id: matchData.player1_id,
            player2_id: matchData.player2_id,
            winner_id: matchData.winner_id,
            loser_id: matchData.loser_id,
            scores_csv: matchData.scores_csv,
            state: matchData.state,
            suggested_play_order: matchData.suggested_play_order,
            updated_at: new Date().toISOString()
          })
          .eq('challonge_id', matchData.id)
          .eq('tournament_id', tournamentId);
      } else {
        // Tambahkan pertandingan baru
        await supabase
          .from('bracket_matches')
          .insert([
            {
              id: matchData.id,
              challonge_id: matchData.id,
              tournament_id: tournamentId,
              round: matchData.round,
              player1_id: matchData.player1_id,
              player2_id: matchData.player2_id,
              winner_id: matchData.winner_id,
              loser_id: matchData.loser_id,
              scores_csv: matchData.scores_csv,
              state: matchData.state,
              suggested_play_order: matchData.suggested_play_order
            }
          ]);
      }
    }

    // Identifikasi pertandingan yang dihapus di Challonge
    const challongeMatchIds = challongeMatches.map(m => m.match.id.toString());
    const deletedMatches = localMatches.filter(
      match => !challongeMatchIds.includes(match.challonge_id.toString())
    );

    // Hapus pertandingan yang tidak ada lagi di Challonge
    for (const deletedMatch of deletedMatches) {
      await supabase
        .from('bracket_matches')
        .delete()
        .eq('challonge_id', deletedMatch.challonge_id)
        .eq('tournament_id', tournamentId);
    }
  } catch (error) {
    console.error('Error syncing matches with Challonge:', error);
  }
} 