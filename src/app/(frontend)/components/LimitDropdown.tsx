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
        className="w-full rounded-xl py-2 px-3 text-xs font-medium cursor-pointer flex items-center justify-between transition-all duration-150 bg-black/5 dark:bg-white/8 hover:bg-black/8 dark:hover:bg-white/12 border border-black/5 dark:border-white/10 select-none active:scale-[0.98] space-x-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="tabular-nums font-semibold">{value}</span>
        <span className="text-[10px] opacity-40">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 w-[85px] rounded-2xl p-1 z-50 apple-glass bg-white/95 dark:bg-zinc-900/95 border border-black/5 dark:border-white/10 shadow-2xl animate-slideIn"
        >
          {options.map((opt) => (
            <div
              key={opt}
              className={`py-1.5 px-3 text-xs font-medium cursor-pointer rounded-xl transition-all duration-150 select-none text-center tabular-nums ${
                value === opt
                  ? 'bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] font-semibold'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/8'
              }`}
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
