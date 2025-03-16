'use client'

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import LoginToast from "@/components/admin/LoginToast";
import { useEffect } from 'react'

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
    // Tidak ada lagi kode analitik di sini
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
