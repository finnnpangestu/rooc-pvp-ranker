'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GlobalDialog } from '../components/GlobalDialog'
import { registerUser } from '@/actions/auth/registerUser'
import { useTheme } from '../components/ThemeProvider'

export default function RegisterPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      const result = await registerUser(formData)

      if (result.success) {
        setIsDialogOpen(true)
      } else {
        setError(result.error || 'Terjadi kesalahan')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    router.push('/login')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div
        className="w-full max-w-[400px] p-10 rounded-3xl text-center transition-colors"
        style={{
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-neumorph)',
          color: 'var(--text-primary)',
        }}
      >
        <h1 className="mb-2 text-[28px] font-bold" style={{ color: 'var(--text-primary)' }}>
          Register Guild Master
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Daftarkan diri sebagai pemimpin guild
        </p>

        {error && (
          <div
            className="p-3 rounded-lg text-[13px] mb-4 border"
            style={{
              background: 'var(--bg-primary)',
              borderColor: '#ef4444',
              color: '#ef4444',
              boxShadow: 'var(--shadow-neumorph-inset)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="mb-4 text-left">
            <label
              className="block text-[13px] mb-2 font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Nama Lengkap / IGN
            </label>
            <input
              type="text"
              name="name"
              className="w-full rounded-lg py-3 px-4 font-sans transition-all duration-200 outline-none"
              style={{
                background: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                color: 'var(--text-primary)',
                border: 'none',
              }}
              required
            />
          </div>
          <div className="mb-4 text-left">
            <label
              className="block text-[13px] mb-2 font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full rounded-lg py-3 px-4 font-sans transition-all duration-200 outline-none"
              style={{
                background: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                color: 'var(--text-primary)',
                border: 'none',
              }}
              required
            />
          </div>
          <div className="mb-4 text-left">
            <label
              className="block text-[13px] mb-2 font-medium"
              style={{ color: 'var(--text-muted)' }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              className="w-full rounded-lg py-3 px-4 font-sans transition-all duration-200 outline-none"
              style={{
                background: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                color: 'var(--text-primary)',
                border: 'none',
              }}
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg p-[14px] font-semibold font-sans cursor-pointer mt-4 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            style={{
              background: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-neumorph-sm)',
              color: 'var(--text-primary)',
              border: 'none',
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Sudah punya akun?{' '}
          <Link
            href="/login"
            className="font-medium no-underline hover:underline"
            style={{ color: 'var(--text-primary)' }}
          >
            Login di sini
          </Link>
        </p>
      </div>

      <GlobalDialog isOpen={isDialogOpen} onClose={handleCloseDialog} title="Registrasi Berhasil!">
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Akun Guild Master kamu berhasil dibuat!
          <br />
          <br />
          Sekarang kamu bisa login menggunakan email dan password yang telah didaftarkan.
          <br />
          <br />
          <button
            onClick={handleCloseDialog}
            className="w-full rounded-lg p-3 font-semibold font-sans cursor-pointer transition-colors border-none"
            style={{
              background: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-neumorph-sm)',
              color: 'var(--text-primary)',
            }}
          >
            Lanjut ke Login
          </button>
        </div>
      </GlobalDialog>
    </div>
  )
}
