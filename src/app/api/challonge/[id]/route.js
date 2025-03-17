import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk mendapatkan data turnamen
export async function GET(request, { params }) {
  try {
    const tournamentId = await params.id;
    
    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Ambil data turnamen dari Challonge
    const tournamentResponse = await axios.get(`${BASE_URL}/tournaments/${tournamentId}.json`, {
      params: {
        api_key: API_KEY
      }
    });

    if (!tournamentResponse.data?.tournament) {
      throw new Error('Failed to fetch tournament data');
    }

    const tournamentData = tournamentResponse.data.tournament;

    // Ambil data terkait turnamen di Supabase
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('bracket_tournaments')
      .select()
      .eq('challonge_id', tournamentId);

    if (supabaseError) {
      console.error('Error fetching local data:', supabaseError);
    }

    return NextResponse.json({
      success: true,
      tournament: tournamentData,
      local_data: supabaseData ? supabaseData[0] : null
    });
  } catch (error) {
    console.error('Error fetching tournament:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk mengedit turnamen
export async function PUT(request, { params }) {
  try {
    const tournamentId = await params.id;
    const body = await request.json();
    
    if (!tournamentId) {
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
    const challongeResponse = await axios.put(`${BASE_URL}/tournaments/${tournamentId}.json`, {
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
      .eq('challonge_id', tournamentId)
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
    const tournamentId = await params.id;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Hapus turnamen dari Challonge
    await axios.delete(`${BASE_URL}/tournaments/${tournamentId}.json`, {
      params: {
        api_key: API_KEY
      }
    });

    // Hapus data terkait di database lokal satu per satu dengan penanganan error
    try {
      // Hapus matches terlebih dahulu (foreign key constraint)
      const { error: matchesError } = await supabase
        .from('bracket_matches')
        .delete()
        .eq('tournament_id', tournamentId);
      
      if (matchesError) {
        console.error('Error deleting matches:', matchesError);
      }
      
      // Hapus participants
      const { error: participantsError } = await supabase
        .from('bracket_participants')
        .delete()
        .eq('tournament_id', tournamentId);
      
      if (participantsError) {
        console.error('Error deleting participants:', participantsError);
      }
      
      // Hapus tournament
      const { error: tournamentError } = await supabase
        .from('bracket_tournaments')
        .delete()
        .eq('challonge_id', tournamentId);
      
      if (tournamentError) {
        console.error('Error deleting tournament:', tournamentError);
        return NextResponse.json(
          { error: 'Failed to delete tournament data from database' },
          { status: 500 }
        );
      }
    } catch (dbError) {
      console.error('Database error during deletion:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete tournament data from database' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Tournament deleted successfully from both Challonge and local database'
    });
  } catch (error) {
    console.error('Error deleting tournament:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk memulai turnamen
export async function POST(request, { params }) {
  try {
    const tournamentId = await params.id;
    const { action } = await request.json();

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key is not configured' },
        { status: 500 }
      );
    }

    // Jika action adalah 'start', maka mulai turnamen
    if (action === 'start') {
      // Memulai turnamen di Challonge
      const startResponse = await axios.post(
        `${BASE_URL}/tournaments/${tournamentId}/start.json`,
        {},
        {
          params: {
            api_key: API_KEY,
          },
        }
      );

      if (!startResponse.data) {
        throw new Error('Failed to start tournament');
      }

      // Ambil data turnamen terbaru dari Challonge untuk mendapatkan started_at
      const tournamentResponse = await axios.get(
        `${BASE_URL}/tournaments/${tournamentId}.json`,
        {
          params: {
            api_key: API_KEY,
          },
        }
      );

      if (!tournamentResponse.data?.tournament) {
        throw new Error('Failed to fetch tournament data');
      }

      const tournamentData = tournamentResponse.data.tournament;

      // Update status dan started_at turnamen di database
      const { error: updateError } = await supabase
        .from('bracket_tournaments')
        .update({ 
          state: 'underway',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('challonge_id', tournamentId);

      if (updateError) {
        console.error('Error updating tournament state:', updateError);
        throw new Error('Failed to update tournament state in database');
      }

      return NextResponse.json({ 
        success: true,
        message: 'Tournament started successfully',
        tournament: tournamentData
      });
    }
    
    // Jika action adalah 'reset', maka reset turnamen
    else if (action === 'reset') {
      // Reset turnamen di Challonge
      await axios.post(
        `${BASE_URL}/tournaments/${tournamentId}/reset.json`,
        {},
        {
          params: {
            api_key: API_KEY,
          },
        }
      );

      // Update status di database lokal
      const { error: updateError } = await supabase
        .from('bracket_tournaments')
        .update({
          state: 'pending',
          started_at: null,
          completed_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('challonge_id', tournamentId);

      if (updateError) {
        throw new Error('Gagal mengupdate status turnamen di database');
      }

      // Reset matches di database lokal
      const { error: matchesError } = await supabase
        .from('bracket_matches')
        .update({
          winner_id: null,
          scores_csv: null,
          state: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('tournament_id', tournamentId);

      if (matchesError) {
        throw new Error('Gagal mereset pertandingan di database');
      }

      return NextResponse.json({
        success: true,
        message: 'Turnamen berhasil direset'
      });
    }
    
    // Jika action adalah 'finalize', maka selesaikan turnamen
    else if (action === 'finalize') {
      // Menyelesaikan turnamen di Challonge
      const finalizeResponse = await axios.post(
        `${BASE_URL}/tournaments/${tournamentId}/finalize.json`,
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

      // Dapatkan data pertandingan untuk menemukan pemenang turnamen
      const matchesResponse = await axios.get(
        `${BASE_URL}/tournaments/${tournamentId}/matches.json`,
        {
          params: {
            api_key: API_KEY,
          },
        }
      );

      let winnerId = null;
      let winnerName = null;
      let runnerUpId = null;
      let runnerUpName = null;
      let thirdPlaceId = null;
      let thirdPlaceName = null;

      if (matchesResponse.data && Array.isArray(matchesResponse.data)) {
        // Cari pertandingan final (biasanya memiliki round tertinggi)
        const finalMatch = matchesResponse.data.reduce((highest, current) => {
          return (current.match.round > highest.match.round) ? current : highest;
        }, matchesResponse.data[0]);

        // Jika ada final match dan memiliki winner_id, dapatkan pemenang
        if (finalMatch && finalMatch.match.winner_id) {
          winnerId = finalMatch.match.winner_id;
          
          // Runner-up adalah yang kalah di final
          runnerUpId = finalMatch.match.loser_id;

          // Dapatkan data peserta
          const participantsResponse = await axios.get(
            `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
            {
              params: {
                api_key: API_KEY,
              },
            }
          );

          if (participantsResponse.data && Array.isArray(participantsResponse.data)) {
            // Dapatkan nama pemenang
            const winner = participantsResponse.data.find(
              p => p.participant.id === winnerId
            );
            if (winner) {
              winnerName = winner.participant.name;
            }
            
            // Dapatkan nama runner-up
            const runnerUp = participantsResponse.data.find(
              p => p.participant.id === runnerUpId
            );
            if (runnerUp) {
              runnerUpName = runnerUp.participant.name;
            }
            
            // Cari juara 3 (yang kalah di semifinal dan bukan runner-up)
            // Semifinal biasanya adalah round = round final - 1
            const finalRound = finalMatch.match.round;
            const semifinalMatches = matchesResponse.data.filter(match => 
              match.match.round === finalRound - 1 && match.match.state === 'complete'
            );
            
            if (semifinalMatches.length > 0) {
              for (const semifinalMatch of semifinalMatches) {
                if (semifinalMatch.match.loser_id && semifinalMatch.match.loser_id !== runnerUpId) {
                  thirdPlaceId = semifinalMatch.match.loser_id;
                  
                  // Dapatkan nama juara 3
                  const thirdPlace = participantsResponse.data.find(
                    p => p.participant.id === thirdPlaceId
                  );
                  if (thirdPlace) {
                    thirdPlaceName = thirdPlace.participant.name;
                    break; // Hanya perlu satu juara 3
                  }
                }
              }
            }
          }
        }
      }

      // Update status turnamen di database termasuk winner_id dan winner_name
      const { error: updateError } = await supabase
        .from('bracket_tournaments')
        .update({
          state: 'complete',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          winner_id: winnerId,
          winner_name: winnerName,
          runner_up_id: runnerUpId,
          runner_up_name: runnerUpName,
          third_place_id: thirdPlaceId,
          third_place_name: thirdPlaceName
        })
        .eq('challonge_id', tournamentId);

      if (updateError) {
        console.error('Error updating tournament state:', updateError);
        throw new Error('Failed to update tournament state in database');
      }

      // Mengambil dan menyimpan hasil akhir peserta
      const participantsResponse = await axios.get(
        `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
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
              updated_at: new Date().toISOString()
            })
            .eq('challonge_id', participant.participant.id)
            .eq('tournament_id', tournamentId);

          if (participantError) {
            console.error('Error updating participant final rank:', participantError);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Tournament finalized successfully',
        winner: {
          id: winnerId,
          name: winnerName
        },
        runnerUp: {
          id: runnerUpId,
          name: runnerUpName
        },
        thirdPlace: {
          id: thirdPlaceId,
          name: thirdPlaceName
        }
      });
    }
    
    // Jika action adalah 'shuffle', maka acak peserta turnamen
    else if (action === 'shuffle') {
      // Melakukan shuffle peserta turnamen di Challonge
      const response = await axios.post(
        `${BASE_URL}/tournaments/${tournamentId}/participants/randomize.json`,
        {
          api_key: API_KEY
        }
      );

      if (!response.data) {
        throw new Error('Tidak ada respons dari Challonge saat mengacak peserta');
      }

      // Ambil data peserta terbaru dari Challonge setelah shuffle
      const participantsResponse = await axios.get(
        `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
        {
          params: {
            api_key: API_KEY
          }
        }
      );

      if (!participantsResponse.data) {
        throw new Error('Tidak ada data peserta setelah pengacakan');
      }

      // Update seed peserta di database
      const updatePromises = participantsResponse.data.map(async (participant) => {
        const { error: updateError } = await supabase
          .from('bracket_participants')
          .update({
            seed: participant.participant.seed,
            updated_at: new Date().toISOString()
          })
          .eq('challonge_id', participant.participant.id)
          .eq('tournament_id', tournamentId);

        if (updateError) {
          console.error('Error updating participant seed:', updateError);
          throw new Error(`Gagal memperbarui seed untuk peserta ${participant.participant.name}`);
        }
      });

      await Promise.all(updatePromises);

      return NextResponse.json(
        { 
          success: true,
          message: 'Peserta berhasil diacak',
          data: response.data 
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing tournament action:', error.response?.data || error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to process tournament action' },
      { status: error.response?.status || 500 }
    );
  }
} 