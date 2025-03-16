import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk mengupdate peserta
export async function PUT(request, { params }) {
  try {
    const id = await params.id;
    const body = await request.json();
    const { tournamentId, name, seed } = body;

    if (!id || !tournamentId) {
      return NextResponse.json(
        { error: 'Participant ID and Tournament ID are required' },
        { status: 400 }
      );
    }

    // Update peserta di database terlebih dahulu
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('bracket_participants')
      .update({
        name,
        seed,
        updated_at: new Date().toISOString()
      })
      .eq('challonge_id', id)
      .eq('tournament_id', tournamentId)
      .select();

    if (supabaseError) {
      console.error('Error updating participant in database:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to update participant in database' },
        { status: 500 }
      );
    }

    // Update peserta di Challonge di background
    try {
      await axios.put(
        `${BASE_URL}/tournaments/${tournamentId}/participants/${id}.json`,
        {
          api_key: API_KEY,
          participant: {
            name,
            seed
          }
        }
      );
    } catch (challongeError) {
      console.error('Error updating participant in Challonge:', challongeError);
      // Tidak menghentikan proses karena data sudah diupdate di database
    }

    return NextResponse.json({
      success: true,
      participant: supabaseData[0]
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json(
      { error: 'Failed to update participant' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk menghapus peserta
export async function DELETE(request, { params }) {
  try {
    const id = await params.id;
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!id || !tournamentId) {
      return NextResponse.json(
        { error: 'Participant ID and Tournament ID are required' },
        { status: 400 }
      );
    }

    // Hapus peserta dari database terlebih dahulu
    const { error: supabaseError } = await supabase
      .from('bracket_participants')
      .delete()
      .eq('challonge_id', id)
      .eq('tournament_id', tournamentId);

    if (supabaseError) {
      console.error('Error deleting participant from database:', supabaseError);
      return NextResponse.json(
        { error: 'Failed to delete participant from database' },
        { status: 500 }
      );
    }

    // Hapus peserta dari Challonge di background
    try {
      await axios.delete(
        `${BASE_URL}/tournaments/${tournamentId}/participants/${id}.json`,
        {
          params: {
            api_key: API_KEY
          }
        }
      );
    } catch (challongeError) {
      console.error('Error deleting participant from Challonge:', challongeError);
      // Tidak menghentikan proses karena data sudah dihapus dari database
    }

    return NextResponse.json({ 
      success: true,
      message: 'Peserta berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting participant:', error);
    return NextResponse.json(
      { error: 'Failed to delete participant' },
      { status: error.response?.status || 500 }
    );
  }
} 