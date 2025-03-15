import { NextResponse } from 'next/server';

const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY;

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Tambahkan timeout handler
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 detik timeout

    const response = await fetch(
      `https://api.challonge.com/v1/tournaments/${id}.json?api_key=${CHALLONGE_API_KEY}&include_participants=1&include_matches=1`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: 'Gagal mengambil data turnamen dari Challonge',
          details: errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching tournament:', error);

    // Handle specific error types
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - Challonge API tidak merespons' },
        { status: 504 }
      );
    }

    if (error.code === 'ECONNRESET') {
      return NextResponse.json(
        { error: 'Koneksi terputus - Silakan coba lagi' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
} 