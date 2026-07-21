'use client'

import React from 'react'
import { useTheme } from '../components/ThemeProvider'

export default function DashboardLoading() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="flex flex-col items-center justify-center h-full w-full font-sans">
      <div className="relative flex items-center justify-center">
        {/* Efek glow di belakang spinner (sesuai tema) */}
        <div
          className="absolute w-16 h-16 rounded-full blur-md z-0"
          style={{
            background: isDark
              ? 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(0,0,0,0) 70%)'
              : 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)',
          }}
        />
        {/* Lingkaran luar (border sesuai tema) */}
        <div
          className="absolute w-16 h-16 rounded-full z-0"
          style={{
            border: `4px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
          }}
        />
        {/* Spinner utama dengan warna indigo (tetap konsisten) */}
        <div className="w-16 h-16 border-4 border-transparent border-t-indigo-500 border-r-indigo-400 rounded-full animate-[spin_1s_cubic-bezier(0.5,0.1,0.4,0.9)_infinite] z-10" />
      </div>
      <p
        className="mt-6 text-sm font-semibold tracking-[0.15em] uppercase animate-pulse"
        style={{ color: 'var(--text-secondary)' }}
      >
        Loading...
      </p>
    </div>
  )
}
