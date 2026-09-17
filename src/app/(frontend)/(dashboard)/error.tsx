'use client'

import React, { useEffect } from 'react'
import { Icon } from '@iconify/react'

interface DashboardErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  useEffect(() => {
    console.error('Dashboard route error:', error)
  }, [error])

  const errorMessage = error?.message || ''
  const isDbConnectionError =
    errorMessage.includes('Failed query') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('connect') ||
    errorMessage.includes('database') ||
    errorMessage.includes('connection')

  return (
    <div className="min-h-[55vh] flex items-center justify-center p-4 sm:p-6">
      <div
        className="max-w-lg w-full p-6 sm:p-8 rounded-2xl flex flex-col items-center text-center border transition-all"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-neumorph-lg)',
        }}
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-5">
          <Icon icon="fluent:database-warning-24-filled" className="w-8 h-8" />
        </div>

        <h2
          className="text-lg sm:text-xl font-bold mb-2.5"
          style={{ color: 'var(--text-primary)' }}
        >
          {isDbConnectionError
            ? 'Koneksi Database Terputus'
            : 'Terjadi Kendala Memuat Data Dashboard'}
        </h2>

        <p
          className="text-xs sm:text-sm mb-6 leading-relaxed max-w-md"
          style={{ color: 'var(--text-secondary)' }}
        >
          {isDbConnectionError
            ? 'Aplikasi tidak dapat menghubungi PostgreSQL (ECONNREFUSED). Pastikan container Docker atau service PostgreSQL Anda sudah berjalan (misal jalankan: docker compose up -d postgres).'
            : 'Terjadi kesalahan saat memproses data halaman ini. Silakan coba klik tombol "Coba Lagi" di bawah.'}
        </p>

        {errorMessage && (
          <div
            className="w-full p-3 mb-6 rounded-xl text-left text-xs font-mono overflow-x-auto max-h-32 border"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              borderColor: 'var(--border-color)',
              color: '#f87171',
            }}
          >
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md cursor-pointer hover:opacity-95"
            style={{
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            }}
          >
            <Icon icon="fluent:arrow-clockwise-20-filled" className="w-4 h-4" />
            <span>Coba Lagi</span>
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer hover:bg-white/5"
            style={{
              color: 'var(--text-primary)',
              borderColor: 'var(--border-color)',
            }}
          >
            <span>Muat Ulang Halaman</span>
          </button>
        </div>
      </div>
    </div>
  )
}
