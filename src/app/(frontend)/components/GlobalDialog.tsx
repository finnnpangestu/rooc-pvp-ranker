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

  // Jangan render di server (hydrasi akan menanganinya)
  if (typeof window === 'undefined') return null
  if (!shouldRender) return null

  const formattedMaxWidth = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth

  // Portal ke body agar bebas dari pengaruh ancestor manapun
  return createPortal(
    <div
      className={`fixed inset-0 bg-black/70 backdrop-blur-[8px] flex items-center justify-center z-[1000] ${
        isOpen ? 'animate-fadeIn' : 'animate-fadeOut'
      }`}
    >
      <div
        className={`bg-[#141419]/90 border border-white/10 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] rounded-2xl w-[90%] p-6 text-white flex flex-col font-sans gap-4 ${
          isOpen ? 'animate-slideIn' : 'animate-slideOut'
        }`}
        style={{ maxWidth: formattedMaxWidth }}
      >
        <div className="flex items-center justify-between">
          <h2 className="m-0 text-2xl font-semibold font-sans bg-gradient-to-br from-white to-[#a0a0a0] text-transparent bg-clip-text">
            {title}
          </h2>
          <button
            className="bg-transparent border-none text-[#888] text-[28px] cursor-pointer font-sans leading-none transition-colors duration-200 hover:text-white"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="text-base leading-relaxed text-[#ccc]">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
