import React from 'react'
import { JetBrains_Mono, Outfit, Poppins } from 'next/font/google'

import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './styles.css'
import { ThemeProvider } from './components/ThemeProvider'
import { SessionExpiredDialog } from './components/SessionExpiredDialog'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
})

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

export const metadata = {
  title: 'Ragnatool',
  description:
    'Sistem manajemen formasi dan pelacakan performa War of Emperium (WoE) serta Guild League.',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${outfit.variable} ${poppins.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <main>
          <ThemeProvider>
            {children}
            <SessionExpiredDialog />
          </ThemeProvider>
        </main>

        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
