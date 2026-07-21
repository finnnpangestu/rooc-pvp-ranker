import React from 'react'

export type ButtonVariant = 'primary' | 'amber' | 'danger' | 'ghost' | 'destructive' | 'success'
export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'border-none shadow-neumorph-sm hover:shadow-neumorph hover:-translate-y-[1px] active:shadow-neumorph-inset active:translate-y-0',
  amber:
    'border-none shadow-neumorph-sm hover:shadow-neumorph hover:-translate-y-[1px] active:shadow-neumorph-inset active:translate-y-0',
  success:
    'border-none shadow-neumorph-sm hover:shadow-neumorph hover:-translate-y-[1px] active:shadow-neumorph-inset active:translate-y-0',
  danger:
    'border shadow-neumorph-sm hover:shadow-neumorph hover:-translate-y-[1px] active:shadow-neumorph-inset active:translate-y-0',
  destructive:
    'border shadow-neumorph-sm hover:shadow-neumorph hover:-translate-y-[1px] active:shadow-neumorph-inset active:translate-y-0',
  ghost:
    'border shadow-neumorph-sm hover:shadow-neumorph hover:-translate-y-[1px] active:shadow-neumorph-inset active:translate-y-0',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'py-1.5 px-3 text-[13px]',
  md: 'py-2.5 px-5 text-sm',
  lg: 'py-3.5 px-6 text-[15px]',
}

export function Button({
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'rounded-lg font-semibold font-sans cursor-pointer transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none'

  const variantClass = variantStyles[variant] || variantStyles.ghost

  // Dynamic styling based on variant and theme (handled via CSS variables)
  let style: React.CSSProperties = {}
  if (variant === 'primary') {
    style = {
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      boxShadow: 'var(--shadow-neumorph-sm)',
    }
  } else if (variant === 'amber') {
    style = {
      background: 'var(--bg-primary)',
      color: '#f59e0b',
      boxShadow: 'var(--shadow-neumorph-sm)',
    }
  } else if (variant === 'success') {
    style = {
      background: 'var(--bg-primary)',
      color: '#10b981',
      boxShadow: 'var(--shadow-neumorph-sm)',
    }
  } else if (variant === 'danger' || variant === 'destructive') {
    style = {
      background: 'var(--bg-primary)',
      color: '#ef4444',
      boxShadow: 'var(--shadow-neumorph-sm)',
      borderColor: 'var(--border-color)',
    }
  } else {
    // ghost
    style = {
      background: 'var(--bg-primary)',
      color: 'var(--text-secondary)',
      boxShadow: 'var(--shadow-neumorph-sm)',
      borderColor: 'var(--border-color)',
    }
  }

  return (
    <button
      className={`${base} ${variantClass} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      style={style}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}
