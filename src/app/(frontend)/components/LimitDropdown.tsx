'use client'

import React, { useState, useRef, useEffect } from 'react'

interface LimitDropdownProps {
  value: number
  onChange: (value: number) => void
  options?: number[]
  className?: string
}

export function LimitDropdown({
  value,
  onChange,
  options = [5, 10, 20],
  className = '',
}: LimitDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        className="w-full rounded-lg py-2 px-3 text-[13px] font-semibold font-sans cursor-pointer flex items-center justify-between transition-all duration-200 space-x-2"
        style={{
          background: 'var(--bg-primary)',
          boxShadow: 'var(--shadow-neumorph-sm)',
          color: 'var(--text-secondary)',
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{value} </span>
        <span className="text-[10px] opacity-60">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 w-[80px] rounded-lg shadow-lg p-1 z-50"
          style={{
            background: 'var(--bg-secondary)',
            boxShadow: 'var(--shadow-neumorph)',
          }}
        >
          {options.map((opt) => (
            <div
              key={opt}
              className={`py-2 px-3 text-[13px] font-medium cursor-pointer rounded-md transition-all duration-150 ${
                value === opt ? 'shadow-neumorph-inset' : 'hover:shadow-neumorph-sm'
              }`}
              style={{
                background: value === opt ? 'var(--bg-primary)' : 'transparent',
                color: value === opt ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              onClick={() => {
                onChange(opt)
                setIsOpen(false)
              }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
