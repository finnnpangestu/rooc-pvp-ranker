'use client'

import React from 'react'

interface EmptyStateProps {
  message: string
  className?: string
}

export function EmptyState({ message, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`p-[60px] text-center rounded-2xl border border-dashed mb-6 transition-colors ${className}`}
      style={{
        background: 'var(--bg-primary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-neumorph-inset)',
        color: 'var(--text-muted)',
      }}
    >
      <p className="text-[15px] m-0" style={{ color: 'var(--text-muted)' }}>
        {message}
      </p>
    </div>
  )
}
