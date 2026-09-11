'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GlobalDialog } from './GlobalDialog'
import { Button } from './Button'
import { logoutUser } from '@/actions/auth/logoutUser'

interface SessionExpiredEventDetail {
  message?: string
  redirectUrl?: string
}

const SESSION_EXPIRED_EVENT = 'auth:session-expired'

/**
 * Global helper function to trigger the session expired dialog from anywhere on the client.
 */
export function triggerSessionExpired(message?: string, redirectUrl = '/login') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent<SessionExpiredEventDetail>(SESSION_EXPIRED_EVENT, {
        detail: { message, redirectUrl },
      }),
    )
  }
}

/**
 * Checks if an action result or error contains an authorization/JWT failure,
 * and if so, automatically triggers the SessionExpiredDialog.
 */
export function handleAuthError(
  result: { success: boolean; message?: string; error?: string; code?: string } | null | undefined,
): boolean {
  if (!result || result.success) return false

  const code = result.code
  if (code === 'UNAUTHORIZED' || code === 'TOKEN_EXPIRED') {
    triggerSessionExpired(result.message || result.error)
    return true
  }

  const msg = (result.message || result.error || '').toLowerCase()
  if (
    msg.includes('jwt') ||
    msg.includes('token') ||
    msg.includes('login terlebih dahulu') ||
    msg.includes('unauthorized') ||
    msg.includes('sesi') ||
    msg.includes('tidak memiliki akses')
  ) {
    triggerSessionExpired(result.message || result.error)
    return true
  }

  return false
}

export function SessionExpiredDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [customMessage, setCustomMessage] = useState<string | null>(null)
  const [redirectTarget, setRedirectTarget] = useState('/login')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const handleOpen = useCallback((event: Event) => {
    const customEvent = event as CustomEvent<SessionExpiredEventDetail>
    if (customEvent.detail?.message) {
      setCustomMessage(customEvent.detail.message)
    }
    if (customEvent.detail?.redirectUrl) {
      setRedirectTarget(customEvent.detail.redirectUrl)
    }
    setIsOpen(true)
  }, [])

  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, handleOpen)
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleOpen)
    }
  }, [handleOpen])

  const handleGoToLogin = async () => {
    setIsLoggingOut(true)
    try {
      // Clear session cookies on the server
      await logoutUser()
    } catch {
      // Ignore logout failure and proceed to redirect
    }
    setIsOpen(false)
    setIsLoggingOut(false)
    router.push(`${redirectTarget}?reason=session_expired`)
    router.refresh()
  }

  return (
    <GlobalDialog
      isOpen={isOpen}
      onClose={handleGoToLogin}
      title="Sesi Login Berakhir"
      maxWidth={460}
    >
      <div className="flex flex-col items-center text-center py-2">
        {/* Warning Icon Badge */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative"
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            boxShadow: 'var(--shadow-neumorph-sm)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}
        >
          <div className="absolute inset-0 rounded-2xl bg-amber-500/10 animate-pulse" />
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative z-10"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1.5" />
          </svg>
        </div>

        {/* Message Content */}
        <h3
          className="text-lg font-bold mb-2 tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Token Kedaluwarsa (JWT Expired)
        </h3>

        <p
          className="text-sm leading-relaxed mb-6 max-w-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          {customMessage ||
            'Sesi login Anda telah berakhir atau token otentikasi tidak valid. Demi keamanan data guild dan roster, silakan login kembali untuk melanjutkan.'}
        </p>

        {/* Action Button */}
        <div className="w-full flex flex-col gap-3">
          <Button
            variant="amber"
            size="lg"
            className="w-full justify-center font-bold tracking-wide"
            onClick={handleGoToLogin}
            loading={isLoggingOut}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
            Ke Halaman Login
          </Button>
        </div>
      </div>
    </GlobalDialog>
  )
}
