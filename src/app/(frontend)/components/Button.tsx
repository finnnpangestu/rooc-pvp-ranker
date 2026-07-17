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
    'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-[0_4px_15px_rgba(99,102,241,0.3)] hover:not-disabled:-translate-y-[2px] hover:not-disabled:shadow-[0_8px_20px_rgba(99,102,241,0.4)]',
  amber:
    'bg-gradient-to-br from-amber-400 to-amber-600 text-black border-none shadow-[0_4px_15px_rgba(251,191,36,0.3)] hover:not-disabled:-translate-y-[2px] hover:not-disabled:shadow-[0_8px_20px_rgba(251,191,36,0.4)]',
  success:
    'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-none shadow-[0_4px_15px_rgba(16,185,129,0.3)] hover:not-disabled:-translate-y-[2px]',
  danger:
    'bg-red-500/10 border border-red-500/20 text-red-400 hover:not-disabled:bg-red-500/20 hover:not-disabled:border-red-500/40',
  destructive:
    'bg-red-500/10 border border-red-500/30 text-red-300 hover:not-disabled:bg-red-500 hover:not-disabled:text-white hover:not-disabled:shadow-[0_0_15px_rgba(239,68,68,0.4)]',
  ghost:
    'bg-white/5 border border-white/10 text-gray-300 hover:not-disabled:bg-white/10 hover:not-disabled:text-white',
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
    'rounded-lg font-semibold font-sans cursor-pointer transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'

  return (
    <button
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
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
