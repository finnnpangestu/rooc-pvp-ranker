'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GlobalDialog } from '../components/GlobalDialog'
import { Button } from '../components/Button'
import { Turnstile, TurnstileRef } from '../components/Turnstile'
import { registerUser } from '@/actions/auth/registerUser'
import { formatErrorMessage } from '@/types'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const turnstileRef = useRef<TurnstileRef>(null)

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
        turnstileRef.current?.reset()
      }
    } catch (err: unknown) {
      setError(formatErrorMessage(err))
      turnstileRef.current?.reset()
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
      className="min-h-screen flex items-center justify-center p-4 apple-canvas"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-[420px] p-8 sm:p-10 rounded-3xl text-center apple-glass shadow-2xl border border-black/5 dark:border-white/10 transition-all">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Register Guild Master
        </h1>
        <p className="text-sm mt-1.5 mb-6" style={{ color: 'var(--text-secondary)' }}>
          Daftarkan diri sebagai pemimpin guild
        </p>

        {error && (
          <div className="p-3.5 rounded-2xl text-[13px] mb-4 border border-red-500/20 bg-red-500/10 text-red-500 backdrop-blur-sm text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="mb-4 text-left">
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Nama Lengkap / IGN
            </label>
            <input
              type="text"
              name="name"
              className="w-full rounded-xl py-3 px-4 text-sm font-sans transition-all outline-none border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              style={{
                color: 'var(--text-primary)',
              }}
              required
            />
          </div>
          <div className="mb-4 text-left">
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              className="w-full rounded-xl py-3 px-4 text-sm font-sans transition-all outline-none border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              style={{
                color: 'var(--text-primary)',
              }}
              required
            />
          </div>
          <div className="mb-5 text-left">
            <label
              className="block text-xs font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              className="w-full rounded-xl py-3 px-4 text-sm font-sans transition-all outline-none border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              style={{
                color: 'var(--text-primary)',
              }}
              required
              minLength={6}
            />
          </div>

          <Turnstile ref={turnstileRef} className="my-2" />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-4"
            loading={isLoading}
          >
            Daftar Sekarang
          </Button>
        </form>

        <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Sudah punya akun?{' '}
          <Link
            href="/login"
            className="font-semibold text-blue-500 hover:text-blue-600 transition-colors"
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
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleCloseDialog}
          >
            Lanjut ke Login
          </Button>
        </div>
      </GlobalDialog>
    </div>
  )
}
