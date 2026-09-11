'use client'

import React, { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { GlobalDialog } from '../components/GlobalDialog'
import { loginUser } from '@/actions/auth/loginUser'
import { formatErrorMessage } from '@/types'

function LoginFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const isSessionExpired = reason === 'session_expired' || searchParams.get('error') === 'jwt_expired'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      const res = await loginUser(formData)

      if (!res.success) {
        throw new Error(res.message)
      }

      setIsDialogOpen(true)
      setIsLoading(false)
    } catch (err: unknown) {
      setError(formatErrorMessage(err))
      setIsLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    router.push('/')
    router.refresh()
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
          Login Guild Master
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          Masuk untuk mengelola guild dan roster
        </p>

        {isSessionExpired && (
          <div
            className="p-3.5 rounded-xl text-[13px] mb-4 border flex items-start gap-2.5 text-left"
            style={{
              background: 'rgba(245, 158, 11, 0.08)',
              borderColor: 'rgba(245, 158, 11, 0.3)',
              color: '#f59e0b',
              boxShadow: 'var(--shadow-neumorph-inset)',
            }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 mt-0.5"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div>
              <div className="font-bold">Sesi Anda Telah Berakhir</div>
              <div className="text-xs opacity-90 mt-0.5">
                Token otentikasi (JWT) telah kedaluwarsa. Silakan login kembali untuk melanjutkan.
              </div>
            </div>
          </div>
        )}

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

        <form onSubmit={handleLogin}>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            {isLoading ? 'Memproses...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Belum punya akun?{' '}
          <Link
            href="/register"
            className="font-medium no-underline hover:underline"
            style={{ color: 'var(--text-primary)' }}
          >
            Daftar di sini
          </Link>
        </p>
      </div>

      <GlobalDialog isOpen={isDialogOpen} onClose={handleCloseDialog} title="Login Berhasil!">
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Selamat datang kembali! Autentikasi berhasil.
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
            Lanjut ke Dashboard
          </button>
        </div>
      </GlobalDialog>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center p-4"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Memuat...
          </div>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}
