import React from 'react'

interface TabBarProps {
  children: React.ReactNode
  className?: string
}

export function TabBar({ children, className = '' }: TabBarProps) {
  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-2xl bg-black/5 dark:bg-white/8 backdrop-blur-xl border border-black/5 dark:border-white/10 overflow-x-auto scrollbar-none ${className}`}
    >
      {children}
    </div>
  )
}

interface TabButtonProps {
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
}

export function TabButton({ isActive, onClick, children }: TabButtonProps) {
  return (
    <button
      type="button"
      className={`flex-1 py-2 px-4 text-[13px] sm:text-sm font-medium font-sans rounded-xl cursor-pointer transition-all duration-150 whitespace-nowrap select-none active:scale-[0.98] ${
        isActive
          ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-semibold'
          : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-black/3 dark:hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
