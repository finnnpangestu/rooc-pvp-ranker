import React from 'react'

interface StatCardProps {
  label: string
  value: string | number | null | undefined
  isPercent?: boolean
  className?: string
}

export function StatCard({ label, value, isPercent = false, className = '' }: StatCardProps) {
  const formatted = value
    ? isPercent
      ? `${value}%`
      : Number(value).toLocaleString('id-ID')
    : isPercent
      ? '0%'
      : '0'

  return (
    <div
      className={`p-3 rounded-2xl flex flex-col justify-center transition-all duration-150 bg-black/3 dark:bg-white/5 border border-black/5 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/8 ${className}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-[0.04em] text-zinc-500 dark:text-zinc-400 mb-0.5 truncate">
        {label}
      </span>
      <span className="text-[15px] font-bold text-zinc-900 dark:text-zinc-100 tabular-nums tracking-tight">
        {formatted}
      </span>
    </div>
  )
}
