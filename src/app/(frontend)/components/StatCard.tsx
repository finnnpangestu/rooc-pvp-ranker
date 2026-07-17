import React from 'react'

interface StatCardProps {
  label: string
  value: any
  isPercent?: boolean
}

export function StatCard({ label, value, isPercent = false }: StatCardProps) {
  const formatted = value
    ? isPercent
      ? `${value}%`
      : Number(value).toLocaleString('id-ID')
    : isPercent
      ? '0%'
      : '0'

  return (
    <div className="bg-black/20 p-2.5 rounded-lg border border-white/5 flex flex-col justify-center">
      <span className="text-gray-400 text-xs mb-1">{label}</span>
      <strong className="text-white text-[15px]">{formatted}</strong>
    </div>
  )
}
