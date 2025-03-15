import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Simpan data sementara di memori (dalam implementasi nyata gunakan database)
let stats = {
  pageViews: 0,
  activeSessions: new Map(), // Menggunakan Map untuk menyimpan sesi aktif
  loadTimes: [], // Untuk menghitung rata-rata waktu loading
  bounces: 0, // Untuk menghitung bounce rate
  totalSessions: 0,
  connections: {
    challonge: false,
    supabase: false
  }
}

// Inisialisasi Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Fungsi untuk mengecek koneksi Challonge
async function checkChallongeConnection() {
  try {
    // Menggunakan format URL dan parameter yang benar sesuai dengan aplikasi
    const API_KEY = process.env.CHALLONGE_API_KEY
    const BASE_URL = 'https://api.challonge.com/v1'
    
    const response = await fetch(`${BASE_URL}/tournaments.json?api_key=${API_KEY}&state=all`)
    stats.connections.challonge = response.ok
   } catch (error) {
    console.error('Challonge connection error:', error)
    stats.connections.challonge = false
  }
}

// Fungsi untuk mengecek koneksi Supabase
async function checkSupabaseConnection() {
  try {
    // Menggunakan tabel bracket_tournaments yang benar
    const { data, error } = await supabase.from('bracket_tournaments').select('count').single()
    stats.connections.supabase = !error
    if (error) console.error('Supabase connection error:', error)
  } catch (error) {
    console.error('Supabase connection error:', error)
    stats.connections.supabase = false
  }
}

// Cek koneksi setiap 1 menit
setInterval(() => {
  checkChallongeConnection()
  checkSupabaseConnection()
}, 60000)

// Cek koneksi saat startup
checkChallongeConnection()
checkSupabaseConnection()

export async function POST(request) {
  const data = await request.json()
  const { sessionId, loadTime, isBounce } = data

  if (sessionId) {
    const currentTime = Date.now()
    const existingSession = stats.activeSessions.get(sessionId)
    
    if (!existingSession) {
      // Sesi baru
      stats.activeSessions.set(sessionId, {
        lastActive: currentTime,
        isNewSession: true,
        hasBounced: false
      })
      stats.pageViews++
      stats.totalSessions++
    } else {
      // Update waktu aktif terakhir
      existingSession.lastActive = currentTime
    }

    // Jika ini adalah request bounce dan sesi belum ditandai sebagai bounce
    if (isBounce === true) {
      const session = stats.activeSessions.get(sessionId)
      if (session && !session.hasBounced) {
        session.hasBounced = true
        stats.bounces++
       }
    }

    // Pastikan loadTime adalah angka yang valid dan masuk akal (antara 0.01 dan 30 detik)
    if (typeof loadTime === 'number' && !isNaN(loadTime) && loadTime >= 0.01 && loadTime <= 30) {
      // Simpan dengan presisi 2 desimal
      const roundedLoadTime = parseFloat(loadTime.toFixed(2))
      stats.loadTimes.push(roundedLoadTime)
      if (stats.loadTimes.length > 100) {
        stats.loadTimes.shift()
      }
  }
  }

  return NextResponse.json({ success: true })
}

export async function GET() {
  // Bersihkan sesi yang tidak aktif (lebih dari 5 menit)
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
  for (const [sessionId, session] of stats.activeSessions.entries()) {
    if (session.lastActive < fiveMinutesAgo) {
      stats.activeSessions.delete(sessionId)
    }
  }

  const currentVisitors = stats.activeSessions.size
  
  // Hitung rata-rata waktu loading dengan median untuk menghindari outlier
  let avgLoadTime = 0
  if (stats.loadTimes.length > 0) {
    // Gunakan median untuk menghindari outlier
    const sortedTimes = [...stats.loadTimes].sort((a, b) => a - b)
    const middleIndex = Math.floor(sortedTimes.length / 2)
    
    if (sortedTimes.length % 2 === 0) {
      // Jika jumlah sampel genap, ambil rata-rata dari dua nilai tengah
      avgLoadTime = ((sortedTimes[middleIndex - 1] + sortedTimes[middleIndex]) / 2).toFixed(2)
    } else {
      // Jika jumlah sampel ganjil, ambil nilai tengah
      avgLoadTime = sortedTimes[middleIndex].toFixed(2)
    }
  }
  
  // Hitung bounce rate
  const bounceRate = stats.totalSessions > 0 
    ? Math.round((stats.bounces / stats.totalSessions) * 100)
    : 0

 

  return NextResponse.json({
    currentVisitors,
    pageViews: stats.pageViews,
    avgLoadTime,
    bounceRate,
    connections: stats.connections
  })
} 