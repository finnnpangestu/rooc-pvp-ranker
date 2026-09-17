import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  style?: React.CSSProperties
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  info: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
  default: 'bg-black/5 dark:bg-white/8 text-zinc-700 dark:text-zinc-300 border-black/5 dark:border-white/10',
}

export function Badge({ children, variant = 'default', className = '', style }: BadgeProps) {
  const variantClass = variantStyles[variant] || variantStyles.default
  return (
    <span
      className={`px-3 py-0.5 rounded-full text-xs font-semibold inline-flex items-center justify-center whitespace-nowrap tracking-[0.02em] border backdrop-blur-md transition-colors ${variantClass} ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}
