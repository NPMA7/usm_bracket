import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk memperbaiki data pemenang turnamen yang sudah selesai
export async function GET(request) {
  try {
    // Ambil semua turnamen yang sudah selesai tetapi belum memiliki pemenang
    const { data: tournaments, error: tournamentsError } = await supabase
      .from('bracket_tournaments')
      .select('*')
      .eq('state', 'complete')
      .or('winner_id.is.null,runner_up_id.is.null,third_place_id.is.null');

    if (tournamentsError) {
      throw new Error('Gagal mengambil data turnamen: ' + tournamentsError.message);
    }

    if (!tournaments || tournaments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Tidak ada turnamen yang perlu diperbaiki',
        fixed: 0
      });
    }

    // Proses setiap turnamen
    const results = [];
    for (const tournament of tournaments) {
      try {
        // Dapatkan data pertandingan untuk menemukan pemenang turnamen
        const matchesResponse = await axios.get(
          `${BASE_URL}/tournaments/${tournament.challonge_id}/matches.json`,
          {
            params: {
              api_key: API_KEY,
            },
          }
        );

        // Dapatkan data peserta
        const participantsResponse = await axios.get(
          `${BASE_URL}/tournaments/${tournament.challonge_id}/participants.json`,
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

        if (winnerId && winnerName) {
          console.log(`Memperbaiki turnamen ${tournament.name} (ID: ${tournament.challonge_id})`, {
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
            .eq('challonge_id', tournament.challonge_id)
            .select();

          if (updateError) {
            throw new Error(`Gagal mengupdate data pemenang untuk turnamen ${tournament.name}: ${updateError.message}`);
          }

          console.log(`Hasil update turnamen ${tournament.name}:`, updateData);

          results.push({
            id: tournament.id,
            name: tournament.name,
            winner_id: winnerId,
            winner_name: winnerName,
            runner_up_id: runnerUpId,
            runner_up_name: runnerUpName,
            third_place_id: thirdPlaceId,
            third_place_name: thirdPlaceName,
            status: 'fixed'
          });
        } else {
          results.push({
            id: tournament.id,
            name: tournament.name,
            status: 'no_winner_found'
          });
        }
      } catch (error) {
        results.push({
          id: tournament.id,
          name: tournament.name,
          status: 'error',
          error: error.message
        });
      }
    }

    const fixedCount = results.filter(r => r.status === 'fixed').length;

    return NextResponse.json({
      success: true,
      message: `Berhasil memperbaiki ${fixedCount} dari ${tournaments.length} turnamen`,
      results,
      fixed: fixedCount,
      total: tournaments.length
    });
  } catch (error) {
    console.error('Error fixing tournament winners:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbaiki data pemenang turnamen' },
      { status: 500 }
    );
  }
} 