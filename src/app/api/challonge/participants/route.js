import { NextResponse } from 'next/server';
import axios from 'axios';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk menambahkan peserta ke turnamen
export async function POST(request) {
  try {
    const body = await request.json();
    const { tournamentId, name, email, seed, bulkParticipants } = body;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Jika ada bulkParticipants, proses sebagai bulk operation
    if (bulkParticipants && Array.isArray(bulkParticipants) && bulkParticipants.length > 0) {
      try {
        const promises = bulkParticipants.map(async (participantName) => {
          if (!participantName.trim()) return null; // Skip empty names
          
          return axios.post(
            `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
            {
              api_key: API_KEY,
              participant: {
                name: participantName.trim(),
                email: '',
                seed: null,
              },
            }
          );
        });

        const results = await Promise.allSettled(promises);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        return NextResponse.json({
          success: true,
          message: `Berhasil menambahkan ${successful} peserta${failed > 0 ? `, ${failed} gagal` : ''}`
        });
      } catch (error) {
        console.error('Error adding bulk participants:', error.response?.data || error.message);
        return NextResponse.json(
          { error: 'Failed to add bulk participants' },
          { status: error.response?.status || 500 }
        );
      }
    } else {
      // Proses single participant seperti sebelumnya
      if (!name) {
        return NextResponse.json(
          { error: 'Participant name is required' },
          { status: 400 }
        );
      }

      const response = await axios.post(
        `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
        {
          api_key: API_KEY,
          participant: {
            name,
            email: email || '',
            seed: seed || null,
          },
        }
      );

      return NextResponse.json(response.data);
    }
  } catch (error) {
    console.error('Error adding participant:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to add participant' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk mendapatkan daftar peserta turnamen
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const rawData = searchParams.get('raw') === 'true';

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching participants for tournament ID: ${tournamentId}`);

    // Fetch participants first
    const participantsResponse = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
      {
        params: {
          api_key: API_KEY
        },
      }
    );

    console.log(`Received participants data from Challonge API. Status: ${participantsResponse.status}`);
    
    // Jika parameter raw=true, kembalikan data mentah dari API
    if (rawData) {
      console.log('Returning raw participants data');
      return NextResponse.json(participantsResponse.data);
    }

    // Then fetch matches
    const matchesResponse = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}/matches.json`,
      {
        params: {
          api_key: API_KEY
        },
      }
    );

    console.log(`Received matches data from Challonge API. Status: ${matchesResponse.status}`);

    // Process the data to create standings
    const participants = participantsResponse.data;
    const matches = matchesResponse.data;

    console.log(`Processing ${participants ? participants.length : 0} participants and ${matches ? matches.length : 0} matches`);

    // Periksa struktur data peserta
    if (!Array.isArray(participants)) {
      console.error('Participants data is not an array:', participants);
      return NextResponse.json(
        { error: 'Invalid participants data format' },
        { status: 500 }
      );
    }

    // Calculate wins and losses for each participant
    const standings = participants.map(p => {
      // Pastikan p.participant ada sebelum mengakses propertinya
      if (!p.participant) {
        console.error('Invalid participant data structure:', p);
        // Coba gunakan p langsung jika sepertinya itu adalah objek participant
        if (p && typeof p === 'object' && (p.id || p.participant_id)) {
          console.log('Using participant object directly:', p);
          p = { participant: p };
        } else {
          return null;
        }
      }

      const participantData = p.participant;
      
      // Pastikan kita memiliki ID yang valid
      const participantId = participantData.id;
      if (!participantId) {
        console.error('Participant has no valid ID:', participantData);
        return null;
      }

      // Cari pertandingan untuk peserta ini
      const participantMatches = matches ? matches.filter(m => 
        m.match && (
          m.match.player1_id === participantId || 
          m.match.player2_id === participantId
        )
      ) : [];

      const wins = participantMatches.filter(m => 
        m.match && 
        m.match.winner_id === participantId && 
        m.match.state === 'complete'
      ).length;

      const losses = participantMatches.filter(m => 
        m.match && 
        m.match.loser_id === participantId && 
        m.match.state === 'complete'
      ).length;

      // Ambil nama dari display_name jika name tidak ada
      const name = participantData.name || participantData.display_name || 'Unnamed';
      
      // Pastikan seed selalu ada, bahkan jika null
      const seed = participantData.seed !== undefined ? participantData.seed : null;

      return {
        participant: {
          id: participantId,
          name: name,
          email: participantData.email || '',
          seed: seed,
          rank: participantData.final_rank || seed,
          wins,
          losses,
          display_name: participantData.display_name || name
        }
      };
    }).filter(p => p !== null); // Filter out any null entries

    console.log(`Processed ${standings.length} valid participants`);

    // Urutkan berdasarkan seed
    const sortedStandings = standings.sort((a, b) => {
      const seedA = a.participant && a.participant.seed ? a.participant.seed : Infinity;
      const seedB = b.participant && b.participant.seed ? b.participant.seed : Infinity;
      return seedA - seedB;
    });

    return NextResponse.json(sortedStandings);
  } catch (error) {
    console.error('Error fetching standings:', error);
    console.error('Error details:', error.response?.data || error.message);
    return NextResponse.json(
      { error: `Failed to fetch standings: ${error.message}` },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk mengubah data peserta
export async function PUT(request) {
  try {
    const body = await request.json();
    const { tournamentId, participantId, name, email, seed } = body;

    console.log('PUT request body:', body);

    if (!tournamentId || !participantId) {
      return NextResponse.json(
        { error: 'Tournament ID dan Participant ID diperlukan' },
        { status: 400 }
      );
    }

    // Buat objek participant dengan field yang akan diupdate
    const participant = {};
    if (name !== undefined) participant.name = name;
    if (email !== undefined) participant.email = email;
    if (seed !== undefined) participant.seed = seed;

    console.log(`Updating participant ${participantId} in tournament ${tournamentId} with data:`, participant);

    const response = await axios.put(
      `${BASE_URL}/tournaments/${tournamentId}/participants/${participantId}.json`,
      {
        api_key: API_KEY,
        participant
      }
    );

    console.log('Participant update response:', response.status, response.statusText);
    console.log('Updated participant data:', response.data);

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error updating participant:', error);
    console.error('Error details:', error.response?.data || error.message);
    
    return NextResponse.json(
      { error: 'Gagal mengupdate data peserta: ' + (error.response?.data?.errors?.join(', ') || error.message) },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk melakukan shuffle peserta
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { tournamentId, action } = body;

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    if (action === 'randomize') {
      // Melakukan randomize/shuffle peserta
      const response = await axios.post(
        `${BASE_URL}/tournaments/${tournamentId}/participants/randomize.json`,
        {
          api_key: API_KEY,
        }
      );

      return NextResponse.json({ 
        success: true, 
        message: 'Peserta berhasil di-shuffle' 
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Supported action: randomize' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error performing participant action:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to perform participant action' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk menghapus peserta
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    const participantId = searchParams.get('participantId');

    console.log('DELETE request params:', { tournamentId, participantId });

    if (!tournamentId || !participantId) {
      return NextResponse.json(
        { error: 'Tournament ID dan Participant ID diperlukan' },
        { status: 400 }
      );
    }

    try {
      const response = await axios.delete(
        `${BASE_URL}/tournaments/${tournamentId}/participants/${participantId}.json`,
        {
          params: {
            api_key: API_KEY
          }
        }
      );


      return NextResponse.json({ 
        success: true, 
        message: 'Peserta berhasil dihapus' 
      });
    } catch (apiError) {
      console.error('API Error:', apiError.response?.data || apiError.message);
      
      // Jika peserta tidak ditemukan
      if (apiError.response?.status === 404) {
        return NextResponse.json(
          { error: 'Peserta tidak ditemukan' },
          { status: 404 }
        );
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Error deleting participant:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Gagal menghapus peserta: ' + (error.response?.data?.errors?.join(', ') || error.message) },
      { status: error.response?.status || 500 }
    );
  }
} 