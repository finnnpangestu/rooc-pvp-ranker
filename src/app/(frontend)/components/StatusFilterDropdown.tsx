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
          iconColor: '#f59e0b',
          label: 'Pending',
          count: pendingCount,
          countBg: 'rgba(245, 158, 11, 0.15)',
          countText: '#f59e0b',
          countBorder: 'rgba(245, 158, 11, 0.3)',
        }
      case 'verified':
        return {
          icon: 'fluent:shield-checkmark-24-filled',
          iconColor: '#10b981',
          label: 'Verified',
          count: verifiedCount,
          countBg: 'rgba(16, 185, 129, 0.15)',
          countText: '#10b981',
          countBorder: 'rgba(16, 185, 129, 0.3)',
        }
      default:
        return {
          icon: 'fluent:filter-24-regular',
          iconColor: 'var(--text-secondary)',
          label: 'Semua Status',
          count: totalCount,
          countBg: 'var(--bg-secondary)',
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
        className="w-full rounded-lg py-2 px-3 text-[13px] font-semibold font-sans cursor-pointer flex items-center justify-between transition-all duration-200 gap-2"
        style={{
          background: 'var(--bg-primary)',
          boxShadow: 'var(--shadow-neumorph-sm)',
          color: 'var(--text-secondary)',
          border: '1px solid',
          borderColor:
            value === 'pending'
              ? 'rgba(245, 158, 11, 0.4)'
              : value === 'verified'
                ? 'rgba(16, 185, 129, 0.4)'
                : 'transparent',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Icon icon={current.icon} className="w-4 h-4 shrink-0" style={{ color: current.iconColor }} />
          <span
            className="truncate"
            style={{ color: value !== 'all' ? current.iconColor : 'var(--text-secondary)' }}
          >
            {current.label}
          </span>
          {value === 'all' && pendingCount > 0 ? (
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0 animate-pulse"
              style={{
                background: 'rgba(245, 158, 11, 0.18)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}
              title={`${pendingCount} member pending`}
            >
              {pendingCount}
            </span>
          ) : value !== 'all' ? (
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold rounded-full shrink-0"
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
          className="w-3.5 h-3.5 opacity-60 shrink-0"
        />
      </button>

      {isOpen && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 w-[190px] rounded-xl shadow-lg p-1.5 z-50 animate-fadeIn border"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-neumorph)',
          }}
        >
          {/* Semua Status */}
          <div
            className={`py-2 px-3 text-[13px] font-medium cursor-pointer flex items-center justify-between rounded-lg transition-all duration-150 mb-1 ${
              value === 'all' ? 'shadow-neumorph-inset' : 'hover:shadow-neumorph-sm'
            }`}
            style={{
              background: value === 'all' ? 'var(--bg-primary)' : 'transparent',
              color: value === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
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
              <span className="text-xs opacity-60 font-mono">{totalCount}</span>
            )}
          </div>

          {/* Pending */}
          <div
            className={`py-2 px-3 text-[13px] font-medium cursor-pointer flex items-center justify-between rounded-lg transition-all duration-150 mb-1 ${
              value === 'pending' ? 'shadow-neumorph-inset' : 'hover:shadow-neumorph-sm'
            }`}
            style={{
              background: value === 'pending' ? 'var(--bg-primary)' : 'transparent',
              color: value === 'pending' ? '#f59e0b' : 'var(--text-muted)',
            }}
            onClick={() => {
              onChange('pending')
              setIsOpen(false)
            }}
          >
            <div className="flex items-center gap-2">
              <Icon icon="fluent:clock-24-filled" className="w-4 h-4 text-amber-400" />
              <span className={value === 'pending' ? 'font-semibold text-amber-400' : ''}>
                Pending
              </span>
            </div>
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              {pendingCount}
            </span>
          </div>

          {/* Verified */}
          <div
            className={`py-2 px-3 text-[13px] font-medium cursor-pointer flex items-center justify-between rounded-lg transition-all duration-150 ${
              value === 'verified' ? 'shadow-neumorph-inset' : 'hover:shadow-neumorph-sm'
            }`}
            style={{
              background: value === 'verified' ? 'var(--bg-primary)' : 'transparent',
              color: value === 'verified' ? '#10b981' : 'var(--text-muted)',
            }}
            onClick={() => {
              onChange('verified')
              setIsOpen(false)
            }}
          >
            <div className="flex items-center gap-2">
              <Icon icon="fluent:shield-checkmark-24-filled" className="w-4 h-4 text-emerald-400" />
              <span className={value === 'verified' ? 'font-semibold text-emerald-400' : ''}>
                Verified
              </span>
            </div>
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.3)',
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
