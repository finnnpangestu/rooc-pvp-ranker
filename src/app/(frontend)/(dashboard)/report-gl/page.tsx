'use client'

import React from 'react'
import Link from 'next/link'
import { useTheme } from '../../components/ThemeProvider'

export default function ReportGLPage() {
  const { theme } = useTheme()

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-5">
      <div
        className="rounded-3xl p-10 max-w-lg w-full text-center transition-colors"
        style={{
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-neumorph)',
          color: 'var(--text-primary)',
        }}
      >
        <div
          className="text-[64px] mb-6"
          style={{ filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.4))' }}
        >
          📊
        </div>
        <h1 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Report GL
        </h1>
        <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
          Fitur ini sedang dalam tahap pengembangan. Nantinya Anda dapat mengevaluasi performa Guild
          League berdasarkan gabungan 40% Stats dan 60% Performa di sini.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          style={{
            background: 'var(--bg-primary)',
            boxShadow: 'var(--shadow-neumorph-sm)',
            color: 'var(--text-primary)',
            border: 'none',
            textDecoration: 'none',
          }}
        >
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  )
}
