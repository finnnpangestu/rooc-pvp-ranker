'use client'

import React, { useEffect } from 'react'
import { Icon } from '@iconify/react'

interface RootErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalFrontendError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    console.error('Frontend error caught by boundary:', error)
  }, [error])

  const errorMessage = error?.message || ''
  const isDbConnectionError =
    errorMessage.includes('Failed query') ||
    errorMessage.includes('ECONNREFUSED') ||
    errorMessage.includes('connect') ||
    errorMessage.includes('database')

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 transition-colors"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div
        className="max-w-md w-full p-8 rounded-2xl flex flex-col items-center text-center border shadow-2xl backdrop-blur-md transition-colors"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-neumorph)',
        }}
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-500 mb-5">
          <Icon icon="fluent:plug-disconnected-24-filled" className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {isDbConnectionError ? 'Koneksi Server / Database Terputus' : 'Terjadi Kesalahan'}
        </h2>

        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {isDbConnectionError
            ? 'Tidak dapat terhubung ke database. Jika menggunakan SSH tunnel atau koneksi port forwarding ke VPS (localhost:5432), pastikan terminal penghubung ke VPS sedang aktif.'
            : 'Terjadi kendala yang tidak terduga saat memuat halaman. Silakan coba klik tombol di bawah.'}
        </p>

        {errorMessage && (
          <div
            className="w-full p-3 mb-6 rounded-xl text-left text-xs font-mono overflow-x-auto max-h-28 border border-rose-500/20 text-rose-500"
            style={{ background: 'var(--bg-secondary)' }}
          >
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all shadow-md cursor-pointer hover:opacity-90"
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
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
            style={{
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-secondary)',
            }}
          >
            <span>Muat Ulang Halaman</span>
          </button>
        </div>
      </div>
    </div>
  )
}
