import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

export async function POST(request, { params }) {
  try {
    // Pastikan params.id tersedia
    const id = params?.id;
    if (!id) {
      return NextResponse.json(
        { error: 'ID turnamen diperlukan' },
        { status: 400 }
      );
    }

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'API key tidak ditemukan' },
        { status: 500 }
      );
    }

    // Melakukan shuffle peserta turnamen di Challonge
    const response = await axios.post(
      `${BASE_URL}/tournaments/${id}/participants/randomize.json`,
      {
        api_key: API_KEY
      }
    );

    if (!response.data) {
      throw new Error('Tidak ada respons dari Challonge saat mengacak peserta');
    }

    // Ambil data peserta terbaru dari Challonge setelah shuffle
    const participantsResponse = await axios.get(
      `${BASE_URL}/tournaments/${id}/participants.json`,
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
        .eq('tournament_id', id);

      if (updateError) {
        console.error('Error updating participant seed:', updateError);
        throw new Error(`Gagal memperbarui seed untuk peserta ${participant.participant.name}`);
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json(
      { 
        message: 'Peserta berhasil diacak',
        data: response.data 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error shuffling participants:', error.response?.data || error.message);
    
    return NextResponse.json(
      { 
        error: 'Gagal mengacak peserta', 
        details: error.response?.data || error.message 
      },
      { status: error.response?.status || 500 }
    );
  }
} 