import React from 'react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: PaginationProps) {
  if (totalPages <= 1) return null

  const btnBase =
    'rounded-lg text-[13px] font-semibold font-sans cursor-pointer transition-all duration-200 flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none'

  return (
    <div
      className={`flex items-center justify-between ${className}`}
      style={{ borderColor: 'var(--border-color)' }}
    >
      <button
        className={btnBase}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        style={{
          background: 'var(--bg-primary)',
          boxShadow: 'var(--shadow-neumorph-sm)',
          color: 'var(--text-secondary)',
          padding: '8px 16px',
        }}
      >
        ❮ Prev
      </button>

      <span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
        Page <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> of {totalPages}
      </span>

      <button
        className={btnBase}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        style={{
          background: 'var(--bg-primary)',
          boxShadow: 'var(--shadow-neumorph-sm)',
          color: 'var(--text-secondary)',
          padding: '8px 16px',
        }}
      >
        Next ❯
      </button>
    </div>
  )
}
