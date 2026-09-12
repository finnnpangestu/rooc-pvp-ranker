'use client'

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

export interface TurnstileRef {
  reset: () => void
}

interface TurnstileProps {
  onVerify?: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  className?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        params: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
        },
      ) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAExaPStQd4JelF3J'

export const Turnstile = forwardRef<TurnstileRef, TurnstileProps>(function Turnstile(
  { onVerify, onExpire, onError, className },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const isDev = process.env.NODE_ENV === 'development'

  useImperativeHandle(ref, () => ({
    reset: () => {
      if (isDev) return
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.reset(widgetIdRef.current)
        } catch (e) {
          console.warn('[turnstile] reset error:', e)
        }
      }
    },
  }))

  useEffect(() => {
    if (isDev) {
      if (onVerify) onVerify('dev-token-bypass')
      return
    }

    let isMounted = true

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile || !isMounted) return

      // Cegah duplicate render jika sudah aktif
      if (widgetIdRef.current) return

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: 'auto',
          callback: (token: string) => {
            if (onVerify) onVerify(token)
          },
          'expired-callback': () => {
            if (onExpire) onExpire()
          },
          'error-callback': () => {
            if (onError) onError()
          },
        })
      } catch (e) {
        console.warn('[turnstile] render error:', e)
      }
    }

    if (!document.getElementById('cf-turnstile-script')) {
      const script = document.createElement('script')
      script.id = 'cf-turnstile-script'
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => {
        if (isMounted) renderWidget()
      }
      document.head.appendChild(script)
    } else if (window.turnstile) {
      renderWidget()
    } else {
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval)
          if (isMounted) renderWidget()
        }
      }, 100)
      return () => clearInterval(checkInterval)
    }

    return () => {
      isMounted = false
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {}
        widgetIdRef.current = null
      }
    }
  }, [isDev, onVerify, onExpire, onError])

  if (isDev) {
    return (
      <div
        className={`flex items-center justify-center my-2 text-[11px] py-1.5 px-3 rounded-lg border border-dashed border-amber-500/30 text-amber-500 bg-amber-500/5 ${
          className || ''
        }`}
      >
        <span>⚡ Cloudflare Turnstile Bypass (Dev Mode)</span>
        <input type="hidden" name="cf-turnstile-response" value="dev-token-bypass" />
      </div>
    )
  }

  return (
    <div className={`flex justify-center my-3 min-h-[65px] ${className || ''}`}>
      <div ref={containerRef} />
    </div>
  )
})
