'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

export interface DropdownOption {
  value: string | number
  label: string
  sublabel?: string
  icon?: string | React.ReactNode
  disabled?: boolean
}

export interface CustomDropdownProps {
  value?: string | number | null
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  menuClassName?: string
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  id?: string
  name?: string
  align?: 'left' | 'right'
}

export function CustomDropdown({
  value,
  onChange,
  options,
  placeholder = '-- Pilih --',
  disabled = false,
  className = '',
  triggerClassName = '',
  menuClassName = '',
  size = 'md',
  icon,
  align = 'left',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handler)
    }
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const selectedOption = options.find((opt) => String(opt.value) === String(value))

  const sizeClasses = {
    sm: 'py-2 px-3 text-xs',
    md: 'py-2.5 px-3.5 text-sm',
    lg: 'py-3 px-4 text-[14px]',
  }[size]

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full rounded-xl ${sizeClasses} font-medium flex items-center justify-between transition-all duration-150 select-none border text-left ${
          disabled
            ? 'opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10'
            : 'cursor-pointer bg-black/5 dark:bg-white/8 hover:bg-black/8 dark:hover:bg-white/12 border-black/10 dark:border-white/10 active:scale-[0.99]'
        } text-zinc-900 dark:text-zinc-100 ${triggerClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 truncate">
          {icon && <span className="shrink-0">{icon}</span>}
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              {typeof selectedOption.icon === 'string' ? (
                <Image
                  src={selectedOption.icon}
                  alt=""
                  width={20}
                  height={20}
                  className="w-5 h-5 object-cover rounded-md shrink-0"
                />
              ) : (
                selectedOption.icon && <span className="shrink-0">{selectedOption.icon}</span>
              )}
              <span className="truncate font-semibold">{selectedOption.label}</span>
              {selectedOption.sublabel && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
                  {selectedOption.sublabel}
                </span>
              )}
            </div>
          ) : (
            <span className="text-zinc-400 dark:text-zinc-500 truncate">{placeholder}</span>
          )}
        </div>

        <span
          className={`text-[10px] opacity-40 ml-2 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          ▼
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute top-[calc(100%+6px)] ${
            align === 'right' ? 'right-0' : 'left-0'
          } w-full min-w-[220px] max-h-[260px] overflow-y-auto rounded-2xl p-1.5 z-50 apple-glass bg-white/95 dark:bg-zinc-900/95 border border-black/10 dark:border-white/15 shadow-2xl animate-slideIn custom-scrollbar ${menuClassName}`}
        >
          {options.length === 0 ? (
            <div className="py-3 px-3 text-xs text-center text-zinc-400 dark:text-zinc-500 italic">
              Tidak ada pilihan
            </div>
          ) : (
            options.map((option) => {
              const isSelected = String(option.value) === String(value)
              return (
                <div
                  key={String(option.value)}
                  className={`py-2 px-3 text-xs sm:text-sm font-medium cursor-pointer flex items-center justify-between rounded-xl transition-all duration-150 select-none ${
                    option.disabled
                      ? 'opacity-40 cursor-not-allowed pointer-events-none'
                      : isSelected
                        ? 'bg-[#0071e3]/10 text-[#0071e3] dark:text-[#2997ff] font-semibold'
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/8'
                  }`}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(String(option.value))
                      setIsOpen(false)
                    }
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 truncate">
                    {typeof option.icon === 'string' ? (
                      <Image
                        src={option.icon}
                        alt=""
                        width={20}
                        height={20}
                        className="w-5 h-5 object-cover rounded-md shrink-0"
                      />
                    ) : (
                      option.icon && <span className="shrink-0">{option.icon}</span>
                    )}
                    <span className="truncate">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-[11px] opacity-60 shrink-0 font-normal">
                        {option.sublabel}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <span className="text-xs text-[#0071e3] dark:text-[#2997ff] font-bold ml-2 shrink-0">
                      ✓
                    </span>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
