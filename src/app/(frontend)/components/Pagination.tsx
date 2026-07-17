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
    'bg-white/5 border border-white/10 text-gray-300 py-2 px-4 rounded-lg text-[13px] font-semibold font-sans cursor-pointer transition-all duration-200 flex items-center gap-2 hover:not-disabled:bg-indigo-500/15 hover:not-disabled:border-indigo-500 hover:not-disabled:text-white hover:not-disabled:-translate-y-[1px] disabled:opacity-30 disabled:cursor-not-allowed disabled:bg-transparent disabled:border-transparent'

  return (
    <div
      className={`flex items-center justify-between pt-4 mt-4 border-t border-white/5 ${className}`}
    >
      <button
        className={btnBase}
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ❮ Prev
      </button>

      <span className="text-[13px] text-gray-400 font-medium">
        Page <strong className="text-white">{currentPage}</strong> of {totalPages}
      </span>

      <button
        className={btnBase}
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next ❯
      </button>
    </div>
  )
}
