import React from 'react'

interface TabBarProps {
  children: React.ReactNode
  className?: string
}

export function TabBar({ children, className = '' }: TabBarProps) {
  return (
    <div
      className={`flex gap-2 p-2 rounded-2xl border overflow-x-auto scrollbar-none ${className}`}
      style={{
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-neumorph-inset)',
      }}
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
      className={`flex-1 py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap border ${
        isActive ? 'shadow-neumorph-inset' : 'shadow-neumorph-sm hover:shadow-neumorph'
      }`}
      onClick={onClick}
      style={{
        background: isActive ? 'var(--bg-primary)' : 'var(--bg-secondary)',
        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
        borderColor: 'var(--border-color)',
        boxShadow: isActive ? 'var(--shadow-neumorph-inset)' : 'var(--shadow-neumorph-sm)',
      }}
    >
      {children}
    </button>
  )
}
