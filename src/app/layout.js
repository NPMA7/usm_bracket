import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Toast from "@/components/admin/Toast";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Tournament Manager USM",
  description: "Tournament Manager USM",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toast />
        {children}
      </body>
    </html>
  );
}
