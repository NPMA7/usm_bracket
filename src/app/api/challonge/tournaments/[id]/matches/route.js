import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = await params;
  const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY;


  if (!CHALLONGE_API_KEY) {
    return NextResponse.json(
      { error: 'API key Challonge tidak ditemukan' },
      { status: 500 }
    );
  }

  try {
    const url = `https://api.challonge.com/v1/tournaments/${id}/matches.json?api_key=${CHALLONGE_API_KEY}`;

    const response = await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Challonge API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching matches from Challonge:', error);
    return NextResponse.json(
      { error: `Gagal mengambil data pertandingan dari Challonge: ${error.message}` },
      { status: 500 }
    );
  }
} 