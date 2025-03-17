import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Fungsi untuk memperbarui data pemenang turnamen secara manual
export async function POST(request) {
  try {
    const { tournamentId, winner, runnerUp, thirdPlace } = await request.json();
    
    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    if (!winner && !runnerUp && !thirdPlace) {
      return NextResponse.json(
        { error: 'At least one winner must be provided' },
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

    // Persiapkan data yang akan diupdate
    const updateData = {
      updated_at: new Date().toISOString()
    };

    // Tambahkan data pemenang jika disediakan
    if (winner !== undefined) {
      // Jika winner adalah objek dengan id dan name null, set nilai null
      if (winner && winner.id === null && winner.name === null) {
        updateData.winner_id = null;
        updateData.winner_name = null;
      } else if (winner) {
        updateData.winner_id = winner.id || null;
        updateData.winner_name = winner.name || null;
      }
    }

    // Tambahkan data runner-up jika disediakan
    if (runnerUp !== undefined) {
      // Jika runnerUp adalah objek dengan id dan name null, set nilai null
      if (runnerUp && runnerUp.id === null && runnerUp.name === null) {
        updateData.runner_up_id = null;
        updateData.runner_up_name = null;
      } else if (runnerUp) {
        updateData.runner_up_id = runnerUp.id || null;
        updateData.runner_up_name = runnerUp.name || null;
      }
    }

    // Tambahkan data juara 3 jika disediakan
    if (thirdPlace !== undefined) {
      // Jika thirdPlace adalah objek dengan id dan name null, set nilai null
      if (thirdPlace && thirdPlace.id === null && thirdPlace.name === null) {
        updateData.third_place_id = null;
        updateData.third_place_name = null;
      } else if (thirdPlace) {
        updateData.third_place_id = thirdPlace.id || null;
        updateData.third_place_name = thirdPlace.name || null;
      }
    }

    console.log("Data pemenang yang akan disimpan:", updateData);

    // Update data pemenang di database
    const { data: updatedData, error: updateError } = await supabase
      .from('bracket_tournaments')
      .update(updateData)
      .eq('challonge_id', tournamentId)
      .select();

    if (updateError) {
      throw new Error(`Gagal mengupdate data pemenang: ${updateError.message}`);
    }

    console.log("Hasil update:", updatedData);

    return NextResponse.json({
      success: true,
      message: 'Berhasil memperbarui data pemenang turnamen',
      tournament: tournament.name,
      winner: winner ? { id: winner.id, name: winner.name } : null,
      runnerUp: runnerUp ? { id: runnerUp.id, name: runnerUp.name } : null,
      thirdPlace: thirdPlace ? { id: thirdPlace.id, name: thirdPlace.name } : null
    });
  } catch (error) {
    console.error('Error updating tournament winners:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal memperbarui data pemenang turnamen' },
      { status: 500 }
    );
  }
} 