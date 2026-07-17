import React from 'react'

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] font-sans">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.4)_0%,rgba(0,0,0,0)_70%)] blur-md z-0"></div>
        <div className="absolute w-16 h-16 border-4 border-white/5 rounded-full"></div>
        <div className="w-16 h-16 border-4 border-transparent border-t-indigo-500 border-r-indigo-400 rounded-full animate-[spin_1s_cubic-bezier(0.5,0.1,0.4,0.9)_infinite] z-10"></div>
      </div>
      <p className="mt-6 text-indigo-400 text-sm font-semibold tracking-[0.15em] uppercase animate-pulse">
        Loading...
      </p>
    </div>
  )
}
