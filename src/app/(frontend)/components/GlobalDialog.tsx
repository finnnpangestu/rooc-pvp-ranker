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
      timerRef.current = setTimeout(() => setRender(false), 350)
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
      className={`fixed inset-0 bg-black/70 backdrop-blur-[8px] flex items-center justify-center z-[1000] ${
        isOpen ? 'animate-fadeIn' : 'animate-fadeOut'
      }`}
    >
      <div
        className={`rounded-2xl w-[90%] p-6 flex flex-col gap-4 ${
          isOpen ? 'animate-slideIn' : 'animate-slideOut'
        }`}
        style={{
          background: 'var(--bg-card)',
          boxShadow: 'var(--shadow-neumorph)',
          maxWidth: formattedMaxWidth,
          color: 'var(--text-primary)',
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <button
            className="bg-transparent border-none text-[28px] cursor-pointer font-sans leading-none transition-colors duration-200"
            style={{ color: 'var(--text-muted)' }}
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
