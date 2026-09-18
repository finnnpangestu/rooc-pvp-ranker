'use client'

import React, { useState, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { GlobalDialog } from '../components/GlobalDialog'
import { Button } from '../components/Button'
import { Turnstile, TurnstileRef } from '../components/Turnstile'
import { loginUser } from '@/actions/auth/loginUser'
import { formatErrorMessage } from '@/types'

function LoginFormContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  const isSessionExpired =
    reason === 'session_expired' || searchParams.get('error') === 'jwt_expired'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const turnstileRef = useRef<TurnstileRef>(null)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)

    try {
      const res = await loginUser(formData)

      if (!res.success) {
        turnstileRef.current?.reset()
        throw new Error(res.message)
      }

      setIsDialogOpen(true)
      setIsLoading(false)
    } catch (err: unknown) {
      setError(formatErrorMessage(err))
      turnstileRef.current?.reset()
      setIsLoading(false)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    window.location.href = '/'
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 apple-canvas"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="w-full max-w-[420px] p-8 sm:p-10 rounded-3xl text-center apple-glass shadow-2xl border border-black/5 dark:border-white/10 transition-all">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Guild Master Sign In
        </h1>
        <p className="text-sm mt-1.5 mb-6" style={{ color: 'var(--text-secondary)' }}>
          Sign in to manage your guild and roster
        </p>

        {isSessionExpired && (
          <div className="p-4 rounded-2xl text-[13px] mb-4 border border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-start gap-3 text-left backdrop-blur-sm">
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
              <div className="font-bold">Your Session Has Expired</div>
              <div className="text-xs opacity-90 mt-0.5 leading-relaxed">
                Your authentication token has expired. Please sign in again to continue.
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl text-[13px] mb-4 border border-red-500/20 bg-red-500/10 text-red-500 backdrop-blur-sm text-left">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-blue-500 hover:text-blue-600 transition-colors"
          >
            Register here
          </Link>
        </p>
      </div>

      <GlobalDialog isOpen={isDialogOpen} onClose={handleCloseDialog} title="Sign In Successful!">
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Welcome back! Authentication successful.
          <br />
          <br />
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleCloseDialog}
          >
            Continue to Dashboard
          </Button>
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
          className="min-h-screen flex items-center justify-center p-4 apple-canvas"
          style={{ background: 'var(--bg-primary)' }}
        >
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  )
}
