import React from 'react'
import styles from './Badge.module.css'

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  style?: React.CSSProperties
}

export function Badge({ children, variant = 'default', className = '', style }: BadgeProps) {
  const variantClass = styles[variant] || styles.default

  return (
    <span className={`${styles.badge} ${variantClass} ${className}`} style={style}>
      {children}
    </span>
  )
}
