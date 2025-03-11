import { NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk memulai turnamen
export async function POST(request) {
  try {
    const body = await request.json();
    const { tournamentId } = body;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Memulai turnamen
    const response = await axios.post(
      `${BASE_URL}/tournaments/${tournamentId}/start.json`,
      {
        api_key: API_KEY,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Tournament started successfully',
      tournament: response.data.tournament
    });
  } catch (error) {
    console.error('Error starting tournament:', error.response?.data || error.message);
    
    // Cek apakah error karena turnamen sudah dimulai
    if (error.response?.data?.errors?.includes('Tournament has already started')) {
      return NextResponse.json(
        { 
          error: 'Turnamen sudah dimulai sebelumnya',
          alreadyStarted: true
        },
        { status: 400 }
      );
    }
    
    // Cek apakah error karena jumlah peserta tidak cukup
    if (error.response?.data?.errors?.includes('Not enough participants')) {
      return NextResponse.json(
        { 
          error: 'Jumlah peserta tidak cukup. Turnamen membutuhkan minimal 2 peserta untuk dimulai.',
          notEnoughParticipants: true
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Gagal memulai turnamen: ' + (error.response?.data?.errors?.[0] || error.message) },
      { status: error.response?.status || 500 }
    );
  }
} 