/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState } from 'react'
import type { HexagonStats } from '@/utils/calculatePvPScore'

export interface HexagonRadarChartProps {
  // Single mode
  data?: HexagonStats
  label?: string
  color?: string

  // Compare mode
  dataA?: HexagonStats
  dataB?: HexagonStats
  labelA?: string
  labelB?: string
  colorA?: string
  colorB?: string

  size?: number
  showIcons?: boolean
  showLegend?: boolean
  showSummaryCards?: boolean
}

interface AxisConfig {
  key: keyof HexagonStats
  label: string
  subLabel: string
}

const AXES: AxisConfig[] = [
  { key: 'atk', label: 'ATK', subLabel: 'Offense & Burst' },
  { key: 'crit', label: 'CRIT', subLabel: 'Lethality & Crit' },
  { key: 'agi', label: 'AGI', subLabel: 'Mobility & Speed' },
  { key: 'def', label: 'DEF', subLabel: 'Survivability' },
  { key: 'cast', label: 'CAST', subLabel: 'Cadence & Execution' },
  { key: 'utl', label: 'UTL', subLabel: 'Support & Sustain' },
]

export function HexagonRadarChart({
  data,
  label,
  color = '#10b981',
  dataA,
  dataB,
  labelA = 'Candidate A',
  labelB = 'Candidate B',
  colorA = '#10b981',
  colorB = '#a855f7',
  size = 320,
  showIcons = false,
  showLegend = true,
  showSummaryCards = true,
}: HexagonRadarChartProps) {
  const isCompare = Boolean(dataA && dataB)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const isCompact = size < 250
  const width = size
  const height = size
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(cx, cy) - (isCompact ? 30 : 46)

  // 6 Angles for Hexagon (Top = 0, Clockwise)
  const angles = React.useMemo(() => {
    return [0, 1, 2, 3, 4, 5].map((i) => -Math.PI / 2 + (i * Math.PI) / 3)
  }, [])

  // Helper koordinat titik berdasarkan rasio radius (0 to 1)
  const getPoint = (angle: number, ratio: number) => {
    return {
      x: cx + radius * ratio * Math.cos(angle),
      y: cy + radius * ratio * Math.sin(angle),
    }
  }

  // Polygon path builder
  const getPolygonPoints = (stats: HexagonStats) => {
    return AXES.map((axis, i) => {
      const val = Math.max(5, Math.min(100, stats[axis.key] || 0))
      const pt = getPoint(angles[i], val / 100)
      return `${pt.x},${pt.y}`
    }).join(' ')
  }

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0]

  const activeAxis = hoveredIndex !== null ? AXES[hoveredIndex] : null

  return (
    <div className="flex flex-col items-center w-full">
      {/* Legend Tab jika mode Compare */}
      {isCompare && showLegend && (
        <div className="flex items-center justify-center gap-6 mb-3 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
              style={{ background: colorA }}
            />
            <span style={{ color: colorA }}>{labelA}</span>
          </div>
          <span className="text-gray-500 font-bold">VS</span>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
              style={{ background: colorB }}
            />
            <span style={{ color: colorB }}>{labelB}</span>
          </div>
        </div>
      )}

      {/* SVG Hexagon Radar */}
      <div className="relative flex items-center justify-center">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible select-none drop-shadow-md"
        >
          <defs>
            <radialGradient id={`hexGlow-${cx}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(99, 102, 241, 0.18)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
            </radialGradient>
            <filter id={`glow-${cx}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background glow */}
          <circle cx={cx} cy={cy} r={radius} fill={`url(#hexGlow-${cx})`} />

          {/* Grid Rings (Concentric Hexagons) */}
          {gridLevels.map((lvl) => {
            const points = angles
              .map((angle) => {
                const pt = getPoint(angle, lvl)
                return `${pt.x},${pt.y}`
              })
              .join(' ')
            return (
              <polygon
                key={`grid-${lvl}`}
                points={points}
                fill="none"
                className="stroke-black/10 dark:stroke-white/10"
                strokeWidth={lvl === 1.0 ? '1.5' : '1'}
                strokeDasharray={lvl < 1.0 ? '3 3' : undefined}
              />
            )
          })}

          {/* Sumbu Axis Garis Jari-jari */}
          {angles.map((angle, i) => {
            const pt = getPoint(angle, 1.0)
            const isHovered = hoveredIndex === i
            return (
              <line
                key={`axis-${i}`}
                x1={cx}
                y1={cy}
                x2={pt.x}
                y2={pt.y}
                className={`transition-all duration-200 ${
                  isHovered
                    ? 'stroke-black/30 dark:stroke-white/40'
                    : 'stroke-black/10 dark:stroke-white/10'
                }`}
                strokeWidth={isHovered ? '2' : '1'}
              />
            )
          })}

          {/* Poligon Data A / Single Data */}
          {(dataA || data) && (
            <g>
              <polygon
                points={getPolygonPoints(dataA || data!)}
                fill={isCompare ? `${colorA}33` : `${color}38`}
                stroke={isCompare ? colorA : color}
                strokeWidth="2.5"
                filter={`url(#glow-${cx})`}
                className="transition-all duration-300 ease-out"
              />
              {/* Vertex dots */}
              {angles.map((angle, i) => {
                const val = Math.max(5, Math.min(100, (dataA || data)![AXES[i].key] || 0))
                const pt = getPoint(angle, val / 100)
                const isHovered = hoveredIndex === i
                return (
                  <g key={`dot-a-${i}`}>
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isCompact ? 7 : 9}
                        fill="none"
                        stroke={isCompare ? colorA : color}
                        strokeWidth="1.5"
                        opacity="0.75"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? (isCompact ? 5 : 6) : isCompact ? 3.5 : 4}
                      fill={isCompare ? colorA : color}
                      stroke="var(--bg-card)"
                      strokeWidth="1.5"
                      className="transition-all duration-200"
                    />
                  </g>
                )
              })}
            </g>
          )}

          {/* Poligon Data B (Jika Compare Mode) */}
          {dataB && (
            <g>
              <polygon
                points={getPolygonPoints(dataB)}
                fill={`${colorB}33`}
                stroke={colorB}
                strokeWidth="2.5"
                filter={`url(#glow-${cx})`}
                className="transition-all duration-300 ease-out"
              />
              {/* Vertex dots */}
              {angles.map((angle, i) => {
                const val = Math.max(5, Math.min(100, dataB[AXES[i].key] || 0))
                const pt = getPoint(angle, val / 100)
                const isHovered = hoveredIndex === i
                return (
                  <g key={`dot-b-${i}`}>
                    {isHovered && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isCompact ? 7 : 9}
                        fill="none"
                        stroke={colorB}
                        strokeWidth="1.5"
                        opacity="0.75"
                        className="animate-ping"
                      />
                    )}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? (isCompact ? 5 : 6) : isCompact ? 3.5 : 4}
                      fill={colorB}
                      stroke="var(--bg-card)"
                      strokeWidth="1.5"
                      className="transition-all duration-200"
                    />
                  </g>
                )
              })}
            </g>
          )}

          {/* Label di Tiap Sudut Hexagon */}
          {AXES.map((axis, i) => {
            const angle = angles[i]
            const labelRadius = radius + (isCompact ? 16 : 24)
            const lx = cx + labelRadius * Math.cos(angle)
            const ly = cy + labelRadius * Math.sin(angle)

            let textAnchor: 'middle' | 'start' | 'end' = 'middle'
            if (i === 1 || i === 2) textAnchor = 'start'
            if (i === 4 || i === 5) textAnchor = 'end'

            const valSingle = data ? data[axis.key] || 0 : 0
            const valA = dataA ? dataA[axis.key] || 0 : 0
            const valB = dataB ? dataB[axis.key] || 0 : 0
            const isHovered = hoveredIndex === i

            return (
              <g
                key={`label-${axis.key}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Hit area transparan untuk memudahkan hover */}
                <circle cx={lx} cy={ly} r={isCompact ? 18 : 22} fill="transparent" />

                <text
                  x={lx}
                  y={ly - (isCompact ? 2 : 4)}
                  textAnchor={textAnchor}
                  fill={isHovered ? '#38bdf8' : 'var(--text-primary)'}
                  fontSize={isCompact ? '10' : '12'}
                  fontWeight="bold"
                  className="font-sans transition-colors duration-150"
                >
                  {axis.label}
                </text>
                <text
                  x={lx}
                  y={ly + (isCompact ? 9 : 11)}
                  textAnchor={textAnchor}
                  fontSize={isCompact ? '9' : '10'}
                  fontWeight="600"
                  fill="var(--text-muted)"
                  className="font-mono"
                >
                  {isCompare ? (
                    <>
                      <tspan fill={colorA}>{valA}</tspan>
                      <tspan fill="rgba(255,255,255,0.4)">/</tspan>
                      <tspan fill={colorB}>{valB}</tspan>
                    </>
                  ) : (
                    <tspan fill={isHovered ? color : 'var(--text-secondary)'}>{valSingle}</tspan>
                  )}
                </text>
              </g>
            )
          })}

          {/* Interactive Tooltip saat Mouse Hover di Tengah Chart */}
          {activeAxis !== null && (
            <g className="pointer-events-none transition-opacity duration-200">
              <rect
                x={cx - (isCompact ? 56 : 70)}
                y={cy - (isCompact ? 18 : 22)}
                width={isCompact ? 112 : 140}
                height={isCompact ? 36 : 44}
                rx="8"
                fill="var(--bg-secondary)"
                stroke="var(--border-color)"
                strokeWidth="1"
                className="drop-shadow-lg"
              />
              <text
                x={cx}
                y={cy - (isCompact ? 4 : 5)}
                textAnchor="middle"
                fill="#38bdf8"
                fontSize={isCompact ? '10' : '12'}
                fontWeight="bold"
                className="font-sans"
              >
                {activeAxis.label}:{' '}
                {isCompare
                  ? `${dataA?.[activeAxis.key] || 0} vs ${dataB?.[activeAxis.key] || 0}`
                  : `${data?.[activeAxis.key] || 0}/100`}
              </text>
              <text
                x={cx}
                y={cy + (isCompact ? 10 : 13)}
                textAnchor="middle"
                fill="var(--text-muted)"
                fontSize={isCompact ? '8' : '10'}
                className="font-sans"
              >
                {activeAxis.subLabel}
              </text>
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}
