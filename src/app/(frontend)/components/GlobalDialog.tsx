'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface GlobalDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string | number
}

export function GlobalDialog({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 500,
}: GlobalDialogProps) {
  const [shouldRender, setRender] = useState(isOpen)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (timerRef.current) clearTimeout(timerRef.current)
      setRender(true)
    } else {
      timerRef.current = setTimeout(() => setRender(false), 250)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isOpen])

  if (typeof window === 'undefined') return null
  if (!shouldRender) return null

  const formattedMaxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth

  return createPortal(
    <div
      className={`fixed inset-0 bg-black/40 dark:bg-black/65 backdrop-blur-xl flex items-center justify-center z-[1000] p-4 ${
        isOpen ? 'animate-fadeIn' : 'animate-fadeOut'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={`rounded-3xl w-full p-6 flex flex-col gap-4 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-2xl relative ${
          isOpen ? 'animate-slideIn' : 'animate-slideOut'
        }`}
        style={{
          maxWidth: formattedMaxWidth,
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          <button
            className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer select-none active:scale-90"
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
