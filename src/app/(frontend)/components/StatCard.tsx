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
    <div
      className="p-2.5 rounded-lg flex flex-col justify-center transition-colors"
      style={{
        background: 'var(--bg-primary)',
        boxShadow: 'var(--shadow-neumorph-inset)',
      }}
    >
      <span className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
      <strong className="text-[15px]" style={{ color: 'var(--text-primary)' }}>
        {formatted}
      </strong>
    </div>
  )
}
