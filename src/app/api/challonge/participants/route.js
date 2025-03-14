import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk mendapatkan jumlah peserta saat ini
async function getCurrentParticipantCount(tournamentId) {
  const { count } = await supabase
    .from('bracket_participants')
    .select('*', { count: 'exact' })
    .eq('tournament_id', tournamentId);
  
  return count || 0;
}

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
        // Filter nama kosong
        const validParticipants = bulkParticipants
          .map(name => name.trim())
          .filter(name => name.length > 0);

        if (validParticipants.length === 0) {
          return NextResponse.json(
            { error: 'Tidak ada nama peserta yang valid' },
            { status: 400 }
          );
        }

        // Dapatkan jumlah peserta saat ini untuk perhitungan seed
        let currentCount = await getCurrentParticipantCount(tournamentId);
        let addedParticipants = [];
        let errors = [];

        // Proses satu per satu untuk menghindari race condition
        for (let i = 0; i < validParticipants.length; i++) {
          const participantName = validParticipants[i];
          const nextSeed = currentCount + i + 1;

          try {
            // Tambah ke Challonge
            const challongeResponse = await axios.post(
              `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
              {
                api_key: API_KEY,
                participant: {
                  name: participantName,
                  email: '',
                  seed: nextSeed,
                },
              }
            );

            const participantData = challongeResponse.data.participant;

            // Tambah ke database
            const { error: supabaseError } = await supabase
              .from('bracket_participants')
              .insert([
                {
                  id: participantData.id,
                  challonge_id: participantData.id,
                  tournament_id: tournamentId,
                  name: participantData.name,
                  seed: nextSeed,
                  final_rank: participantData.final_rank,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ]);

            if (supabaseError) {
              throw new Error(`Gagal menyimpan ke database: ${supabaseError.message}`);
            }

            addedParticipants.push(participantData);
          } catch (error) {
            console.error(`Error adding participant ${participantName}:`, error);
            errors.push({
              name: participantName,
              error: error.message || 'Unknown error'
            });
          }
        }

        // Return hasil
        return NextResponse.json({
          success: true,
          message: `Berhasil menambahkan ${addedParticipants.length} peserta${errors.length > 0 ? `, ${errors.length} gagal` : ''}`,
          added: addedParticipants,
          errors: errors.length > 0 ? errors : undefined
        });

      } catch (error) {
        console.error('Error in bulk operation:', error);
        return NextResponse.json(
          { 
            error: 'Gagal menambahkan peserta secara bulk: ' + error.message,
            details: error.response?.data || error.message
          },
          { status: 500 }
        );
      }
    } else {
      // Proses single participant
      if (!name) {
        return NextResponse.json(
          { error: 'Participant name is required' },
          { status: 400 }
        );
      }

      try {
        // Dapatkan jumlah peserta saat ini untuk perhitungan seed
        const currentCount = await getCurrentParticipantCount(tournamentId);
        const nextSeed = currentCount + 1;

        // Tambah ke Challonge
        const challongeResponse = await axios.post(
          `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
          {
            api_key: API_KEY,
            participant: {
              name,
              email: email || '',
              seed: seed || nextSeed,
            },
          }
        );

        // Tambah ke database
        const participantData = challongeResponse.data.participant;
        const { data: supabaseData, error: supabaseError } = await supabase
          .from('bracket_participants')
          .insert([
            {
              id: participantData.id,
              challonge_id: participantData.id,
              tournament_id: tournamentId,
              name: participantData.name,
              seed: seed || nextSeed,
              final_rank: participantData.final_rank,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])
          .select();

        if (supabaseError) {
          console.error('Error saving to database:', supabaseError);
          throw new Error('Failed to save participant to database');
        }

        return NextResponse.json({
          success: true,
          participant: {
            ...participantData,
            local_data: supabaseData[0]
          }
        });
      } catch (error) {
        console.error('Error adding participant:', error);
        if (error.response?.data) {
          console.error('API Error details:', error.response.data);
        }
        return NextResponse.json(
          { error: 'Failed to add participant: ' + (error.response?.data?.errors?.join(', ') || error.message) },
          { status: error.response?.status || 500 }
        );
      }
    }
  } catch (error) {
    console.error('Error adding participant:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to add participant: ' + (error.response?.data?.errors?.join(', ') || error.message) },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk mendapatkan daftar peserta turnamen
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');

    if (!tournamentId) {
      return NextResponse.json(
        { error: 'Tournament ID is required' },
        { status: 400 }
      );
    }

    // Ambil data peserta dari database
    const { data: participants, error: supabaseError } = await supabase
      .from('bracket_participants')
      .select('*')
      .eq('tournament_id', tournamentId);

    if (supabaseError) {
      throw new Error('Gagal mengambil data peserta dari database');
    }

    // Format data peserta seperti response dari Challonge
    const formattedParticipants = participants.map(participant => ({
      participant: {
        id: participant.challonge_id,
        tournament_id: participant.tournament_id,
        name: participant.name,
        seed: participant.seed,
        final_rank: participant.final_rank
      }
    }));

    // Sinkronisasi dengan Challonge di background
    syncParticipantsWithChallonge(tournamentId, participants);

    return NextResponse.json(formattedParticipants);
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      { error: 'Failed to fetch participants' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi helper untuk sinkronisasi peserta dengan Challonge
async function syncParticipantsWithChallonge(tournamentId, localParticipants) {
  try {
    const challongeResponse = await axios.get(
      `${BASE_URL}/tournaments/${tournamentId}/participants.json`,
      {
        params: {
          api_key: API_KEY
        }
      }
    );

    const challongeParticipants = challongeResponse.data;

    // Update data peserta di database
    for (const challongeParticipant of challongeParticipants) {
      const participant = challongeParticipant.participant;
      const localParticipant = localParticipants.find(
        lp => lp.challonge_id.toString() === participant.id.toString()
      );

      if (localParticipant) {
        // Update peserta yang sudah ada
        await supabase
          .from('bracket_participants')
          .update({
            name: participant.name,
            seed: participant.seed,
            final_rank: participant.final_rank,
            updated_at: new Date().toISOString()
          })
          .eq('challonge_id', participant.id)
          .eq('tournament_id', tournamentId);
      } else {
        // Tambah peserta baru yang belum ada di database
        await supabase
          .from('bracket_participants')
          .insert([
            {
              id: participant.id,
              challonge_id: participant.id,
              tournament_id: tournamentId,
              name: participant.name,
              seed: participant.seed,
              final_rank: participant.final_rank
            }
          ]);
      }
    }

    // Hapus peserta yang sudah tidak ada di Challonge
    const challongeIds = challongeParticipants.map(cp => cp.participant.id.toString());
    const deletedParticipants = localParticipants.filter(
      lp => !challongeIds.includes(lp.challonge_id.toString())
    );

    for (const deletedParticipant of deletedParticipants) {
      await supabase
        .from('bracket_participants')
        .delete()
        .eq('challonge_id', deletedParticipant.challonge_id)
        .eq('tournament_id', tournamentId);
    }
  } catch (error) {
    console.error('Error syncing participants with Challonge:', error);
  }
}

// Fungsi untuk mengubah data peserta
export async function PUT(request) {
  try {
    const body = await request.json();
    const { tournamentId, participantId, name, email, seed } = body;


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


    const response = await axios.put(
      `${BASE_URL}/tournaments/${tournamentId}/participants/${participantId}.json`,
      {
        api_key: API_KEY,
        participant
      }
    );


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

    ('DELETE request params:', { tournamentId, participantId });

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