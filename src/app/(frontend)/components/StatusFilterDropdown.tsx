'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Icon } from '@iconify/react'

export type MemberStatusFilter = 'all' | 'pending' | 'verified'

interface StatusFilterDropdownProps {
  value: MemberStatusFilter
  onChange: (value: MemberStatusFilter) => void
  pendingCount?: number
  verifiedCount?: number
  totalCount?: number
  className?: string
}

export function StatusFilterDropdown({
  value,
  onChange,
  pendingCount = 0,
  verifiedCount = 0,
  totalCount,
  className = '',
}: StatusFilterDropdownProps) {
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

  const getStatusDisplay = () => {
    switch (value) {
      case 'pending':
        return {
          icon: 'fluent:clock-24-filled',
          iconColor: '#ff9f0a',
          label: 'Pending',
          count: pendingCount,
          countBg: 'rgba(255, 159, 10, 0.15)',
          countText: '#ff9f0a',
          countBorder: 'rgba(255, 159, 10, 0.25)',
        }
      case 'verified':
        return {
          icon: 'fluent:shield-checkmark-24-filled',
          iconColor: '#30d158',
          label: 'Verified',
          count: verifiedCount,
          countBg: 'rgba(48, 209, 88, 0.15)',
          countText: '#30d158',
          countBorder: 'rgba(48, 209, 88, 0.25)',
        }
      default:
        return {
          icon: 'fluent:filter-24-regular',
          iconColor: 'var(--text-muted)',
          label: 'Semua Status',
          count: totalCount,
          countBg: 'var(--badge-bg)',
          countText: 'var(--text-secondary)',
          countBorder: 'var(--border-color)',
        }
    }
  }

  const current = getStatusDisplay()

  return (
    <div ref={containerRef} className={`relative min-w-[155px] ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl py-2 px-3.5 text-xs font-medium cursor-pointer flex items-center justify-between transition-all duration-150 gap-2 bg-black/5 dark:bg-white/8 hover:bg-black/8 dark:hover:bg-white/12 border border-black/5 dark:border-white/10 select-none active:scale-[0.98]"
        style={{
          borderColor:
            value === 'pending'
              ? 'rgba(255, 159, 10, 0.4)'
              : value === 'verified'
                ? 'rgba(48, 209, 88, 0.4)'
                : undefined,
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon icon={current.icon} className="w-4 h-4 shrink-0" style={{ color: current.iconColor }} />
          <span
            className="truncate font-semibold"
            style={{ color: value !== 'all' ? current.iconColor : 'var(--text-primary)' }}
          >
            {current.label}
          </span>
          {value === 'all' && pendingCount > 0 ? (
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 tabular-nums animate-pulse"
              style={{
                background: 'rgba(255, 159, 10, 0.18)',
                color: '#ff9f0a',
                border: '1px solid rgba(255, 159, 10, 0.35)',
              }}
              title={`${pendingCount} member pending`}
            >
              {pendingCount}
            </span>
          ) : value !== 'all' ? (
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 tabular-nums"
              style={{
                background: current.countBg,
                color: current.countText,
                border: `1px solid ${current.countBorder}`,
              }}
            >
              {current.count}
            </span>
          ) : null}
        </div>
        <Icon
          icon={isOpen ? 'fluent:chevron-up-16-regular' : 'fluent:chevron-down-16-regular'}
          className="w-3.5 h-3.5 opacity-40 shrink-0"
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 w-[200px] rounded-2xl p-1.5 z-50 animate-slideIn apple-glass bg-white/95 dark:bg-zinc-900/95 border border-black/5 dark:border-white/10 shadow-2xl"
        >
          {/* Semua Status */}
          <div
            className={`py-2 px-3 text-xs font-medium cursor-pointer flex items-center justify-between rounded-xl transition-all duration-150 mb-1 select-none ${
              value === 'all'
                ? 'bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] font-semibold'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/8'
            }`}
            onClick={() => {
              onChange('all')
              setIsOpen(false)
            }}
          >
            <div className="flex items-center gap-2">
              <Icon icon="fluent:people-24-regular" className="w-4 h-4 text-indigo-400" />
              <span>Semua Status</span>
            </div>
            {totalCount !== undefined && (
              <span className="text-xs opacity-60 tabular-nums font-semibold">{totalCount}</span>
            )}
          </div>

          {/* Pending */}
          <div
            className={`py-2 px-3 text-xs font-medium cursor-pointer flex items-center justify-between rounded-xl transition-all duration-150 mb-1 select-none ${
              value === 'pending'
                ? 'bg-amber-500/15 text-amber-500 dark:text-amber-400 font-semibold'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/8'
            }`}
            onClick={() => {
              onChange('pending')
              setIsOpen(false)
            }}
          >
            <div className="flex items-center gap-2">
              <Icon icon="fluent:clock-24-filled" className="w-4 h-4 text-amber-500" />
              <span>Pending</span>
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums"
              style={{
                background: 'rgba(255, 159, 10, 0.15)',
                color: '#ff9f0a',
                border: '1px solid rgba(255, 159, 10, 0.3)',
              }}
            >
              {pendingCount}
            </span>
          </div>

          {/* Verified */}
          <div
            className={`py-2 px-3 text-xs font-medium cursor-pointer flex items-center justify-between rounded-xl transition-all duration-150 select-none ${
              value === 'verified'
                ? 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 font-semibold'
                : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/8'
            }`}
            onClick={() => {
              onChange('verified')
              setIsOpen(false)
            }}
          >
            <div className="flex items-center gap-2">
              <Icon icon="fluent:shield-checkmark-24-filled" className="w-4 h-4 text-emerald-500" />
              <span>Verified</span>
            </div>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold tabular-nums"
              style={{
                background: 'rgba(48, 209, 88, 0.15)',
                color: '#30d158',
                border: '1px solid rgba(48, 209, 88, 0.3)',
              }}
            >
              {verifiedCount}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
