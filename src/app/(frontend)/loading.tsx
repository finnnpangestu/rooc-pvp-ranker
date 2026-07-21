import React from 'react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen font-sans">
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-16 h-16 rounded-full blur-md z-0"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.4) 0%, rgba(0,0,0,0) 70%)',
          }}
        />
        <div
          className="absolute w-16 h-16 rounded-full z-0"
          style={{
            border: '4px solid var(--border-color, rgba(255,255,255,0.05))',
          }}
        />
        <div className="w-16 h-16 border-4 border-transparent border-t-indigo-500 border-r-indigo-400 rounded-full animate-[spin_1s_cubic-bezier(0.5,0.1,0.4,0.9)_infinite] z-10" />
      </div>
      <p
        className="mt-6 text-sm font-semibold tracking-[0.15em] uppercase animate-pulse"
        style={{ color: 'var(--text-secondary, #9ca3af)' }}
      >
        Loading...
      </p>
    </div>
  )
}
