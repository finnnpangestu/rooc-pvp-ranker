'use client'

import React from 'react'

interface EmptyStateProps {
  message: string
  className?: string
}

export function EmptyState({ message, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`py-12 px-6 text-center rounded-3xl border border-dashed border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] mb-6 transition-colors ${className}`}
    >
      <p className="text-sm m-0 text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
        {message}
      </p>
    </div>
  )
}
