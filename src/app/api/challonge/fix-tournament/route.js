import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk memperbaiki data pemenang turnamen tertentu
export async function POST(request) {
  try {
    const { tournamentId } = await request.json();
    
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
      throw new Error('Gagal mengambil data turnamen: ' + tournamentError.message);
    }

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
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

    // Dapatkan data peserta
    const participantsResponse = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
      {
        params: {
          api_key: API_KEY,
        },
      }
    );

    if (!participantsResponse.data || !Array.isArray(participantsResponse.data)) {
      throw new Error('Gagal mengambil data peserta');
    }

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

    if (!winnerId || !winnerName) {
      return NextResponse.json({
        success: false,
        message: 'Tidak dapat menemukan pemenang untuk turnamen ini',
        tournament: tournament.name
      });
    }

    console.log("Data pemenang yang akan disimpan:", {
      winner_id: winnerId,
      winner_name: winnerName,
      runner_up_id: runnerUpId,
      runner_up_name: runnerUpName,
      third_place_id: thirdPlaceId,
      third_place_name: thirdPlaceName
    });

    // Update data pemenang di database
    const { data: updateData, error: updateError } = await supabase
      .from('bracket_tournaments')
      .update({
        winner_id: winnerId,
        winner_name: winnerName,
        runner_up_id: runnerUpId,
        runner_up_name: runnerUpName,
        third_place_id: thirdPlaceId,
        third_place_name: thirdPlaceName,
        updated_at: new Date().toISOString()
      })
      .eq('challonge_id', tournamentId)
      .select();

    if (updateError) {
      throw new Error(`Gagal mengupdate data pemenang: ${updateError.message}`);
    }

    console.log("Hasil update:", updateData);

    return NextResponse.json({
      success: true,
      message: 'Berhasil memperbaiki data pemenang turnamen',
      tournament: tournament.name,
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
  } catch (error) {
    console.error('Error fixing tournament winner:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbaiki data pemenang turnamen' },
      { status: 500 }
    );
  }
} 