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
    'py-1.5 px-3.5 rounded-xl text-xs font-medium cursor-pointer transition-all duration-150 flex items-center gap-1.5 bg-black/5 dark:bg-white/8 hover:bg-black/8 dark:hover:bg-white/12 border border-black/5 dark:border-white/10 active:scale-[0.97] select-none disabled:opacity-30 disabled:cursor-not-allowed disabled:transform-none'

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      <button
        type="button"
        className={btnBase}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ❮ Prev
      </button>

      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
        Halaman <strong className="text-zinc-900 dark:text-white font-semibold">{currentPage}</strong> dari {totalPages}
      </span>

      <button
        type="button"
        className={btnBase}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next ❯
      </button>
    </div>
  )
}
