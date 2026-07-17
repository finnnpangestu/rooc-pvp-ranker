import React from 'react'

interface TabBarProps {
  children: React.ReactNode
  className?: string
}

export function TabBar({ children, className = '' }: TabBarProps) {
  return (
    <div
      className={`flex gap-2 bg-black/30 p-2 rounded-2xl border border-white/5 overflow-x-auto scrollbar-none ${className}`}
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
      className={`flex-1 bg-transparent text-gray-400 py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap hover:text-white hover:bg-indigo-500/20 border ${
        isActive
          ? 'bg-indigo-500/30 !text-white border-indigo-400/60 shadow-[0_0_12px_rgba(99,102,241,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]'
          : 'border-transparent hover:border-indigo-500/20'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
