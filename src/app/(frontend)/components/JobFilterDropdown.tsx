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

  // Close on outside click
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
        className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-gray-300 text-[13px] font-semibold font-sans cursor-pointer flex items-center justify-between transition-all duration-200 hover:bg-white/5 hover:border-indigo-400/40"
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
        <div className="absolute top-[calc(100%+6px)] right-0 w-[200px] max-h-[260px] overflow-y-auto bg-[#0f0f16]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.7)] z-50 p-1 scrollbar-thin scrollbar-thumb-white/10">
          {/* All option */}
          <div
            className={`py-2 px-3 text-[13px] font-medium cursor-pointer flex items-center gap-2 rounded-md transition-all duration-150 hover:bg-white/5 hover:text-white ${
              value === '' ? '!bg-indigo-600/15 !text-indigo-400 font-semibold' : 'text-gray-400'
            }`}
            onClick={() => {
              onChange('')
              onClose()
            }}
          >
            {allLabel}
          </div>

          {/* Job options */}
          {Object.entries(JOB_LABELS).map(([jobValue, label]) => (
            <div
              key={jobValue}
              className={`py-2 px-3 text-[13px] font-medium cursor-pointer flex items-center gap-2 rounded-md transition-all duration-150 hover:bg-white/5 hover:text-white ${
                value === jobValue
                  ? '!bg-indigo-600/15 !text-indigo-400 font-semibold'
                  : 'text-gray-400'
              }`}
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
