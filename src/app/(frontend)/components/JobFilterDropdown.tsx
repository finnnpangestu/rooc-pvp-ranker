'use client'

import React, { useRef, useEffect } from 'react'
import { JOB_LABELS } from '@/const/JobLabels'
import Image from 'next/image'

const getJobIcon = (job: string) => `/icons/jobs/${job}.png`

interface JobFilterDropdownProps {
  value: string
  onChange: (value: string) => void
  isOpen: boolean
  onToggle: () => void
  onClose: () => void
  allLabel?: string
  className?: string
}

export function JobFilterDropdown({
  value,
  onChange,
  isOpen,
  onToggle,
  onClose,
  allLabel = 'Semua Job',
  className = '',
}: JobFilterDropdownProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, onClose])

  return (
    <div ref={containerRef} className={`relative min-w-[160px] ${className}`}>
      <button
        type="button"
        className="w-full rounded-xl py-2 px-3.5 text-xs font-medium cursor-pointer flex items-center justify-between transition-all duration-150 bg-black/5 dark:bg-white/8 hover:bg-black/8 dark:hover:bg-white/12 border border-black/5 dark:border-white/10 select-none active:scale-[0.98]"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 truncate">
          {value ? (
            <>
              <Image
                width={18}
                height={18}
                src={getJobIcon(value)}
                alt=""
                className="w-[18px] h-[18px] object-cover rounded-md"
              />
              <span className="truncate">{JOB_LABELS[value]}</span>
            </>
          ) : (
            <span className="truncate text-zinc-600 dark:text-zinc-300">{allLabel}</span>
          )}
        </div>
        <span className="text-[10px] opacity-40 ml-1.5">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 w-[210px] max-h-[260px] overflow-y-auto rounded-2xl p-1.5 z-50 apple-glass bg-white/95 dark:bg-zinc-900/95 border border-black/5 dark:border-white/10 shadow-2xl animate-slideIn"
        >
          <div
            className={`py-2 px-3 text-xs font-medium cursor-pointer flex items-center gap-2 rounded-xl transition-all duration-150 select-none ${
              value === ''
                ? 'bg-[#0071e3]/10 text-[#0071e3] font-semibold'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/8'
            }`}
            onClick={() => {
              onChange('')
              onClose()
            }}
          >
            {allLabel}
          </div>

          {Object.entries(JOB_LABELS).map(([jobValue, label]) => (
            <div
              key={jobValue}
              className={`py-2 px-3 text-xs font-medium cursor-pointer flex items-center gap-2 rounded-xl transition-all duration-150 select-none ${
                value === jobValue
                  ? 'bg-[#0071e3]/10 text-[#0071e3] font-semibold'
                  : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/8'
              }`}
              onClick={() => {
                onChange(jobValue)
                onClose()
              }}
            >
              <Image
                width={18}
                height={18}
                src={getJobIcon(jobValue)}
                alt=""
                className="w-[18px] h-[18px] object-cover rounded-md"
              />
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
