import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Fungsi untuk mengecek koneksi Challonge
async function checkChallongeConnection() {
  try {
    // Menggunakan format URL dan parameter yang benar sesuai dengan aplikasi
    const API_KEY = process.env.CHALLONGE_API_KEY
    const BASE_URL = 'https://api.challonge.com/v1'
    
    const response = await fetch(`${BASE_URL}/tournaments.json?api_key=${API_KEY}&state=all`)
    return response.ok
  } catch (error) {
    console.error('Challonge connection error:', error)
    return false
  }
}

// Fungsi untuk mengecek koneksi Supabase
async function checkSupabaseConnection() {
  try {
    // Cek koneksi dengan menggunakan health check sederhana
    const { data, error } = await supabase.from('bracket_tournaments').select('id').limit(1)
    // Kita hanya perlu tahu apakah koneksi berhasil, bukan apakah data ada
    return !error
  } catch (error) {
    console.error('Supabase connection error:', error)
    return false
  }
}

export async function GET() {
  // Cek koneksi
  const challongeConnected = await checkChallongeConnection()
  const supabaseConnected = await checkSupabaseConnection()

  return NextResponse.json({
    challonge: challongeConnected,
    supabase: supabaseConnected
  })
} 