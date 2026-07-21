'use client'

import React, { useRef, useEffect } from 'react'
import { JOB_LABELS } from '@/const/JobLabels'

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
        className="w-full rounded-lg py-2 px-3 text-[13px] font-semibold font-sans cursor-pointer flex items-center justify-between transition-all duration-200"
        style={{
          background: 'var(--bg-primary)',
          boxShadow: 'var(--shadow-neumorph-sm)',
          color: 'var(--text-secondary)',
        }}
        onClick={onToggle}
      >
        <div className="flex items-center gap-1.5">
          {value ? (
            <>
              <img
                src={getJobIcon(value)}
                alt=""
                className="w-[18px] h-[18px] object-cover rounded-[20%]"
              />
              <span>{JOB_LABELS[value]}</span>
            </>
          ) : (
            <span>{allLabel}</span>
          )}
        </div>
        <span className="text-[10px] opacity-60">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 w-[200px] max-h-[260px] overflow-y-auto rounded-lg shadow-lg p-1 z-50"
          style={{
            background: 'var(--bg-secondary)',
            boxShadow: 'var(--shadow-neumorph)',
          }}
        >
          <div
            className={`py-2 px-3 text-[13px] font-medium cursor-pointer flex items-center gap-2 rounded-md transition-all duration-150 ${
              value === '' ? 'shadow-neumorph-inset' : 'hover:shadow-neumorph-sm'
            }`}
            style={{
              background: value === '' ? 'var(--bg-primary)' : 'transparent',
              color: value === '' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
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
              className={`py-2 px-3 text-[13px] font-medium cursor-pointer flex items-center gap-2 rounded-md transition-all duration-150 ${
                value === jobValue ? 'shadow-neumorph-inset' : 'hover:shadow-neumorph-sm'
              }`}
              style={{
                background: value === jobValue ? 'var(--bg-primary)' : 'transparent',
                color: value === jobValue ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              onClick={() => {
                onChange(jobValue)
                onClose()
              }}
            >
              <img
                src={getJobIcon(jobValue)}
                alt=""
                className="w-[18px] h-[18px] object-cover rounded-[20%]"
              />
              <span>{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
