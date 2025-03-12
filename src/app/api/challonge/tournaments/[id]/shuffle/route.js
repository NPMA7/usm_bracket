import { NextResponse } from 'next/server';
import axios from 'axios';

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

    // Melakukan shuffle peserta turnamen
    const response = await axios.post(
      `https://api.challonge.com/v1/tournaments/${id}/participants/randomize.json`,
      {},
      {
        params: {
          api_key: apiKey,
        },
      }
    );

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