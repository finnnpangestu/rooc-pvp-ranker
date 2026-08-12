import React from 'react'
import { JetBrains_Mono, Outfit } from 'next/font/google'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './styles.css'
import { ThemeProvider } from './components/ThemeProvider'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata = {
  title: 'ROO PvP Ranker & Guild Manager',
  description: 'Sistem manajemen formasi dan pelacakan performa War of Emperium (WoE) serta Guild League.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" className={`${outfit.variable} ${jetbrainsMono.variable}`}>
      <body>
        <main>
          <ThemeProvider>{children}</ThemeProvider>
        </main>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
