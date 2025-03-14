import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

export async function POST(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID turnamen diperlukan' },
        { status: 400 }
      );
    }

    // Mendapatkan API key dari environment variable
    const apiKey = process.env.CHALLONGE_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key tidak ditemukan' },
        { status: 500 }
      );
    }

    // Melakukan shuffle peserta turnamen di Challonge
    const response = await axios.post(
      `${BASE_URL}/tournaments/${id}/participants/randomize.json`,
      {},
      {
        params: {
          api_key: apiKey,
        },
      }
    );

    // Ambil data peserta terbaru dari Challonge setelah shuffle
    const participantsResponse = await axios.get(
      `${BASE_URL}/tournaments/${id}/participants.json`,
      {
        params: {
          api_key: apiKey,
        },
      }
    );

    // Update seed peserta di database
    for (const participant of participantsResponse.data) {
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
      }
    }

    return NextResponse.json(
      { message: 'Peserta berhasil diacak', data: response.data },
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