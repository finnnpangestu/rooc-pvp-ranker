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
    'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-sm hover:shadow active:bg-[#0062c4] border border-blue-400/20',
  amber:
    'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/20 active:bg-amber-500/25',
  success:
    'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 active:bg-emerald-500/25',
  danger:
    'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 active:bg-rose-500/25',
  destructive:
    'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 active:bg-rose-500/25',
  ghost:
    'bg-black/5 dark:bg-white/8 hover:bg-black/10 dark:hover:bg-white/12 text-zinc-800 dark:text-zinc-200 border border-black/5 dark:border-white/10 active:bg-black/15 dark:active:bg-white/15',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'py-1.5 px-3.5 text-[13px] rounded-lg tracking-[-0.01em]',
  md: 'py-2 px-4.5 text-sm rounded-xl tracking-[-0.01em]',
  lg: 'py-3 px-6 text-[15px] rounded-2xl tracking-[-0.01em]',
}

export function Button({
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  style,
  ...props
}: ButtonProps) {
  const base =
    'font-medium font-sans cursor-pointer transition-all duration-150 inline-flex items-center justify-center gap-2 select-none active:scale-[0.97] disabled:opacity-45 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none'

  const variantClass = variantStyles[variant] || variantStyles.ghost

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
            className="animate-spin w-4 h-4 text-current"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}
