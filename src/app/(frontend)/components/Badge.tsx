import React from 'react'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  style?: React.CSSProperties
}

const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  success: { bg: 'var(--bg-primary)', text: '#10b981', border: 'var(--border-color)' },
  warning: { bg: 'var(--bg-primary)', text: '#f59e0b', border: 'var(--border-color)' },
  danger: { bg: 'var(--bg-primary)', text: '#ef4444', border: 'var(--border-color)' },
  info: { bg: 'var(--bg-primary)', text: 'var(--text-primary)', border: 'var(--border-color)' },
  default: {
    bg: 'var(--bg-primary)',
    text: 'var(--text-secondary)',
    border: 'var(--border-color)',
  },
}

export function Badge({ children, variant = 'default', className = '', style }: BadgeProps) {
  const styles = variantStyles[variant]
  return (
    <span
      className={`px-4 py-1 rounded-full text-xs font-semibold inline-flex items-center justify-center whitespace-nowrap tracking-[0.02em] border shadow-neumorph-sm ${className}`}
      style={{
        background: styles.bg,
        color: styles.text,
        borderColor: styles.border,
        boxShadow: 'var(--shadow-neumorph-sm)',
        ...style,
      }}
    >
      {children}
    </span>
  )
}
