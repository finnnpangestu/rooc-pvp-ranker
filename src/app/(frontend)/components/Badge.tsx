import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  style?: React.CSSProperties
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-500 border-red-500/20',
  info: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
  default: 'bg-white/5 text-gray-300 border-white/10',
}

export function Badge({ children, variant = 'default', className = '', style }: BadgeProps) {
  const variantClass = variantStyles[variant] || variantStyles.default

  return (
    <span
      className={`px-4 py-1 rounded-full text-xs font-semibold inline-flex items-center justify-center whitespace-nowrap tracking-[0.02em] border ${variantClass} ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}
