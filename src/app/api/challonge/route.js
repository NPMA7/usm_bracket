import { NextResponse } from 'next/server';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_KEY = process.env.CHALLONGE_API_KEY;
const BASE_URL = process.env.CHALLONGE_API_URL;

// Fungsi untuk membuat turnamen baru
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, tournament_type, description, game_name } = body;

    // Buat turnamen di Challonge
    const challongeResponse = await axios.post(`${BASE_URL}/tournaments.json`, {
      api_key: API_KEY,
      tournament: {
        name,
        tournament_type: tournament_type || 'single elimination',
        description: description || '',
        game_name: game_name || '',
        hold_third_place_match: true,
      }
    });

    const tournamentData = challongeResponse.data.tournament;

    // Simpan data turnamen ke Supabase
    const { data: supabaseData, error: supabaseError } = await supabase
      .from('bracket_tournaments')
      .insert([
        {
          id: tournamentData.id,
          challonge_id: tournamentData.id,
          name: tournamentData.name,
          tournament_type: tournamentData.tournament_type,
          game_name: tournamentData.game_name || '',
          description: tournamentData.description || '',
          state: tournamentData.state,
          progress_meter: tournamentData.progress_meter || 0,
          started_at: tournamentData.started_at,
          completed_at: tournamentData.completed_at,
          url: tournamentData.url,
          live_image_url: tournamentData.live_image_url,
          full_challonge_url: tournamentData.full_challonge_url
        }
      ])
      .select();

    if (supabaseError) {
      console.error('Error saving to Supabase:', supabaseError);
      // Tetap kembalikan data dari Challonge meskipun gagal menyimpan ke Supabase
      return NextResponse.json(challongeResponse.data);
    }

    // Gabungkan data dari Challonge dan Supabase
    return NextResponse.json({
      ...challongeResponse.data,
      local_data: supabaseData[0]
    });

  } catch (error) {
    console.error('Error creating tournament:', error.response?.data || error.message);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi untuk mendapatkan daftar turnamen
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('tournamentId');
    
    // Ambil data dari Supabase
    let supabaseQuery = supabase.from('bracket_tournaments').select('*');
    
    // Jika ada tournamentId, filter berdasarkan id tersebut
    if (tournamentId) {
      supabaseQuery = supabaseQuery.eq('challonge_id', tournamentId);
    }
    
    const { data: localTournaments, error: supabaseError } = await supabaseQuery;

    if (supabaseError) {
      throw new Error('Gagal mengambil data dari database');
    }

    // Jika ini request untuk turnamen spesifik
    if (tournamentId) {
      // Jika data ditemukan di database, gunakan itu
      if (localTournaments && localTournaments.length > 0) {
        const tournament = localTournaments[0];
        
        // Sinkronkan dengan Challonge untuk mendapatkan status terkini di background
        try {
          const challongeResponse = await axios.get(
            `${BASE_URL}/tournaments/${tournamentId}.json`,
            {
              params: {
                api_key: API_KEY,
                include_participants: 1
              }
            }
          );
          
          const challongeData = challongeResponse.data.tournament;
          
          // Update status dan informasi penting lainnya di database
          await supabase
            .from('bracket_tournaments')
            .update({
              state: challongeData.state,
              progress_meter: challongeData.progress_meter,
              started_at: challongeData.started_at,
              completed_at: challongeData.completed_at,
              updated_at: new Date().toISOString()
            })
            .eq('challonge_id', tournamentId);
        } catch (challongeError) {
          console.error('Error syncing with Challonge:', challongeError);
          // Jika gagal sync dengan Challonge, tetap lanjutkan dengan data lokal
        }
        
        // Kembalikan data dari database
        return NextResponse.json({
          tournament: {
            ...tournament,
            local_data: tournament
          }
        });
      }
      
      // Jika tidak ada di database, ambil dari Challonge dan simpan ke database
      try {
        const challongeResponse = await axios.get(
          `${BASE_URL}/tournaments/${tournamentId}.json`,
          {
            params: {
              api_key: API_KEY,
              include_participants: 1
            }
          }
        );
        
        const tournamentData = challongeResponse.data.tournament;
        
        // Simpan ke database
        const { data: savedData, error: saveError } = await supabase
          .from('bracket_tournaments')
          .insert([
            {
              id: tournamentData.id,
              challonge_id: tournamentData.id,
              name: tournamentData.name,
              tournament_type: tournamentData.tournament_type,
              game_name: tournamentData.game_name || '',
              description: tournamentData.description || '',
              state: tournamentData.state,
              progress_meter: tournamentData.progress_meter || 0,
              started_at: tournamentData.started_at,
              completed_at: tournamentData.completed_at,
              url: tournamentData.url,
              live_image_url: tournamentData.live_image_url,
              full_challonge_url: tournamentData.full_challonge_url
            }
          ])
          .select();
          
        if (saveError) {
          console.error('Error saving tournament to database:', saveError);
          return NextResponse.json(challongeResponse.data);
        }
        
        return NextResponse.json({
          tournament: {
            ...tournamentData,
            local_data: savedData[0]
          }
        });
      } catch (challongeError) {
        console.error('Error fetching from Challonge:', challongeError);
        return NextResponse.json(
          { error: 'Failed to fetch tournament data' },
          { status: challongeError.response?.status || 500 }
        );
      }
    }

    // Untuk daftar semua turnamen, kembalikan data dari database
    const formattedTournaments = localTournaments.map(tournament => ({
      tournament: {
        ...tournament,
        local_data: tournament
      }
    }));

    // Sinkronisasi status dengan Challonge di background
    syncTournamentsWithChallonge(localTournaments);

    return NextResponse.json(formattedTournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: error.response?.status || 500 }
    );
  }
}

// Fungsi helper untuk sinkronisasi dengan Challonge di background
async function syncTournamentsWithChallonge(localTournaments) {
  try {
    const challongeResponse = await axios.get(`${BASE_URL}/tournaments.json`, {
      params: {
        api_key: API_KEY,
        state: 'all'
      }
    });

    const challongeTournaments = challongeResponse.data;
    
    // Update status turnamen di database
    for (const tournament of challongeTournaments) {
      const localTournament = localTournaments.find(
        lt => lt.challonge_id.toString() === tournament.tournament.id.toString()
      );
      
      if (localTournament) {
        await supabase
          .from('bracket_tournaments')
          .update({
            state: tournament.tournament.state,
            progress_meter: tournament.tournament.progress_meter,
            started_at: tournament.tournament.started_at,
            completed_at: tournament.tournament.completed_at,
            updated_at: new Date().toISOString()
          })
          .eq('challonge_id', tournament.tournament.id);
      }
    }
  } catch (error) {
    console.error('Error syncing with Challonge:', error);
  }
} 