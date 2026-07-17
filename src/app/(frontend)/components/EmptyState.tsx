import React from 'react'

interface EmptyStateProps {
  message: string
  className?: string
}

export function EmptyState({ message, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`p-[60px] text-center bg-white/5 rounded-2xl border border-dashed border-white/10 mb-6 ${className}`}
    >
      <p className="text-gray-500 text-[15px] m-0">{message}</p>
    </div>
  )
}
