import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  // Await params sebelum menggunakannya
  const resolvedParams = await Promise.resolve(params);
  const { id, matchId } = resolvedParams;
  const CHALLONGE_API_KEY = process.env.CHALLONGE_API_KEY;

  if (!CHALLONGE_API_KEY) {
    return NextResponse.json(
      { error: 'API key Challonge tidak ditemukan' },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    console.log('Request body:', body); // Tambahkan logging
    const url = `https://api.challonge.com/v1/tournaments/${id}/matches/${matchId}.json?api_key=${CHALLONGE_API_KEY}`;
    console.log('Sending request to:', url); // Tambahkan logging

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('Response status:', response.status); // Tambahkan logging

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Challonge API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Success response:', data); // Tambahkan logging
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating match in Challonge:', error);
    return NextResponse.json(
      { error: `Gagal mengupdate pertandingan di Challonge: ${error.message}` },
      { status: 500 }
    );
  }
} 