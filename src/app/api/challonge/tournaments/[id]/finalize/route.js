import { NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

export async function POST(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    const response = await axios.post(
      `${BASE_URL}/tournaments/${id}/finalize.json`,
      {
        api_key: API_KEY,
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error finalizing tournament:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to finalize tournament' },
      { status: error.response?.status || 500 }
    );
  }
} 