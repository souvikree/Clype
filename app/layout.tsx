import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import Script from "next/script"
import './globals.css'
import { ThemeProvider } from "@/components/theme-provider"
import TitleBar from "@/components/desktop/TitleBar"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: 'Clype - Real-time Communication Platform',
  description: 'Privacy-first terminal-style communication with real-time chat, voice, and video calls',
  generator: 'Souvik Ghosh',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">

        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          id="google-jsl"
        />
        <ThemeProvider>
          <TitleBar />
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
