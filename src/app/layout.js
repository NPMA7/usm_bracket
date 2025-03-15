'use client'

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import LoginToast from "@/components/admin/LoginToast";
import { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }) {
  useEffect(() => {
    // Generate session ID jika belum ada
    let sessionId = localStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = uuidv4()
      localStorage.setItem('sessionId', sessionId)
    }

    // Catat waktu mulai navigasi
    const navigationStart = window.performance && window.performance.timing ? 
      window.performance.timing.navigationStart : Date.now();
    
    // Flag untuk menandai apakah pengguna berinteraksi dengan halaman
    let hasInteracted = false
    
    // Tandai interaksi pengguna
    const handleUserInteraction = () => {
      hasInteracted = true
    }
    
    // Tambahkan event listener untuk interaksi pengguna
    window.addEventListener('click', handleUserInteraction)
    window.addEventListener('scroll', handleUserInteraction)
    window.addEventListener('keydown', handleUserInteraction)

    // Kirim data statistik untuk kunjungan
    const sendPageView = () => {
      // Gunakan Navigation Timing API untuk waktu loading yang lebih akurat
      let loadTime = 0.5; // Default fallback value
      
      if (window.performance && window.performance.timing) {
        const perfData = window.performance.timing;
        // Waktu dari mulai navigasi sampai halaman selesai dimuat
        loadTime = (perfData.loadEventEnd - perfData.navigationStart) / 1000;
        
        // Pastikan nilai masuk akal (kadang bisa negatif karena timing issue)
        if (loadTime <= 0 || loadTime > 30) {
          // Fallback ke metode sederhana
          loadTime = (Date.now() - navigationStart) / 1000;
        }
      }
      
      // Pastikan nilai minimal 0.01 detik
      loadTime = Math.max(loadTime, 0.01);
      
      
      fetch('/api/stats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          loadTime,
          isBounce: false
        }),
      })
    }

    // Tunggu sampai halaman selesai dimuat
    if (document.readyState === 'complete') {
      sendPageView()
    } else {
      window.addEventListener('load', sendPageView)
    }

    // Catat bounce jika pengguna meninggalkan halaman tanpa berinteraksi
    const handleBeforeUnload = () => {
      // Hanya kirim bounce jika pengguna belum berinteraksi
      if (!hasInteracted) {
        
        // Gunakan navigator.sendBeacon jika tersedia untuk memastikan data terkirim
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/stats', JSON.stringify({
            sessionId,
            isBounce: true
          }));
        } else {
          // Fallback ke fetch dengan keepalive
          fetch('/api/stats', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              sessionId,
              isBounce: true
            }),
            keepalive: true
          });
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('load', sendPageView)
      window.removeEventListener('click', handleUserInteraction)
      window.removeEventListener('scroll', handleUserInteraction)
      window.removeEventListener('keydown', handleUserInteraction)
    }
  }, [])

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#22c55e',
              color: '#fff',
            },
          }}
        />
        <LoginToast />
        {children}
        <div id="modal-root"></div>
      </body>
    </html>
  );
}
