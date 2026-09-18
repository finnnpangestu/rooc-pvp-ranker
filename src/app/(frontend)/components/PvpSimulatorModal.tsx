'use client'

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { toPng } from 'html-to-image'
import { Icon } from '@iconify/react'
import { JOB_LABELS } from '@/const/JobLabels'
import { calculatePvPScore, calculateHexagonStats } from '@/utils/calculatePvPScore'
import { HexagonRadarChart } from './HexagonRadarChart'
import { CustomDropdown } from './CustomDropdown'
import type { Character, CharacterStatsInput, PopulatedMember } from '@/types'
import Image from 'next/image'

export interface PvpSimulatorModalProps {
  isOpen: boolean
  onClose: () => void
  initialCharacter?: Character | PopulatedMember | null
  allMembers?: (Character | PopulatedMember)[]
  guildName?: string
}

type StatCategory = 'all' | 'offensive' | 'defensive' | 'support' | 'elemental'

interface StatRowDefinition {
  key: string
  label: string
  category: 'offensive' | 'defensive' | 'support' | 'elemental'
  isPercent?: boolean
  description?: string
}

const STAT_MATRIX_CONFIGS: StatRowDefinition[] = [
  // --- OFFENSIVE & CRITICAL ---
  { key: 'patk', label: 'PATK', category: 'offensive', description: 'Physical Attack' },
  { key: 'matk', label: 'MATK', category: 'offensive', description: 'Magic Attack' },
  {
    key: 'refine_patk',
    label: 'Refine PATK',
    category: 'offensive',
    description: 'Refine Physical Attack',
  },
  {
    key: 'refine_matk',
    label: 'Refine MATK',
    category: 'offensive',
    description: 'Refine Magic Attack',
  },
  {
    key: 'pdmg',
    label: 'PDMG',
    category: 'offensive',
    isPercent: true,
    description: 'Physical Damage Multiplier',
  },
  {
    key: 'mdmg',
    label: 'MDMG',
    category: 'offensive',
    isPercent: true,
    description: 'Magic Damage Multiplier',
  },
  {
    key: 'pdmg_bonus',
    label: 'PDMG Bonus',
    category: 'offensive',
    description: 'Physical Damage Flat Bonus',
  },
  {
    key: 'mdmg_bonus',
    label: 'MDMG Bonus',
    category: 'offensive',
    description: 'Magic Damage Flat Bonus',
  },
  {
    key: 'ignore_pdef',
    label: 'Ignore PDEF',
    category: 'offensive',
    isPercent: true,
    description: 'Physical Armor Penetration',
  },
  {
    key: 'ignore_mdef',
    label: 'Ignore MDEF',
    category: 'offensive',
    isPercent: true,
    description: 'Magic Armor Penetration',
  },
  { key: 'critical', label: 'CRIT', category: 'offensive', description: 'Critical Rate' },
  {
    key: 'critical_damage',
    label: 'CRIT DMG',
    category: 'offensive',
    isPercent: true,
    description: 'Critical Damage %',
  },
  {
    key: 'aspd',
    label: 'ASPD',
    category: 'offensive',
    isPercent: true,
    description: 'Attack Speed %',
  },
  { key: 'hit', label: 'HIT', category: 'offensive', description: 'Attack Hit / Accuracy Rate' },
  { key: 'flee', label: 'FLEE', category: 'offensive', description: 'Dodge / Evasion Rate' },
  {
    key: 'pvp_dmg_bonus',
    label: 'PvP DMG Bonus',
    category: 'offensive',
    description: 'PvP Mode Damage Bonus',
  },
  {
    key: 'dmg_vs_demi_human',
    label: 'DMG vs Demi-Human',
    category: 'offensive',
    isPercent: true,
    description: 'Damage Bonus vs Demi-Human / Player',
  },
  {
    key: 'dmg_vs_medium',
    label: 'DMG vs Medium',
    category: 'offensive',
    isPercent: true,
    description: 'Damage Bonus vs Medium Size Targets',
  },

  // --- DEFENSIVE & HP ---
  {
    key: 'max_hp',
    label: 'Max HP',
    category: 'defensive',
    description: 'Maximum Hit Points',
  },
  { key: 'pdef', label: 'PDEF', category: 'defensive', description: 'Physical Defense' },
  { key: 'mdef', label: 'MDEF', category: 'defensive', description: 'Magic Defense' },
  {
    key: 'refine_pdef',
    label: 'Refine PDEF',
    category: 'defensive',
    description: 'Refine Physical Defense',
  },
  {
    key: 'refine_mdef',
    label: 'Refine MDEF',
    category: 'defensive',
    description: 'Refine Magic Defense',
  },
  {
    key: 'pdmg_reduction',
    label: 'P.DMG Reduction',
    category: 'defensive',
    isPercent: true,
    description: 'Physical Damage Reduction',
  },
  {
    key: 'mdmg_reduction',
    label: 'M.DMG Reduction',
    category: 'defensive',
    isPercent: true,
    description: 'Magic Damage Reduction',
  },
  {
    key: 'critical_reduction',
    label: 'CRIT Reduction',
    category: 'defensive',
    description: 'Critical Hit Resistance',
  },
  {
    key: 'critical_damage_reduction',
    label: 'CRIT DMG Reduction',
    category: 'defensive',
    isPercent: true,
    description: 'Critical Damage Reduction',
  },
  {
    key: 'pvp_dmg_reduction',
    label: 'PvP DMG Reduction',
    category: 'defensive',
    description: 'PvP Mode Damage Reduction',
  },
  {
    key: 'dmg_reduction_demi_human',
    label: 'Demi-Human Red.',
    category: 'defensive',
    isPercent: true,
    description: 'Damage Reduction from Demi-Human / Player',
  },
  {
    key: 'dmg_reduction_medium',
    label: 'Medium Red.',
    category: 'defensive',
    isPercent: true,
    description: 'Damage Reduction from Medium Size Targets',
  },

  // --- SUPPORT & UTILITY ---
  {
    key: 'healing_done',
    label: 'Healing Done',
    category: 'support',
    isPercent: true,
    description: 'Healing Output Efficiency',
  },
  {
    key: 'healing_taken',
    label: 'Healing Taken',
    category: 'support',
    isPercent: true,
    description: 'Healing Received Efficiency',
  },
  {
    key: 'variable_cast',
    label: 'Variable Cast (VCT)',
    category: 'support',
    isPercent: true,
    description: 'Variable Cast Time Reduction',
  },
  {
    key: 'fixed_cast',
    label: 'Fixed Cast',
    category: 'support',
    description: 'Fixed Cast Time Reduction',
  },
  {
    key: 'mspd',
    label: 'Movement Speed (MSPD)',
    category: 'support',
    description: 'Movement Speed',
  },

  // --- ELEMENTAL RESISTANCE ---
  {
    key: 'neutral_dmg_reduction',
    label: 'Neutral Reduction',
    category: 'elemental',
    isPercent: true,
    description: 'Neutral Element Resistance',
  },
  {
    key: 'fire_dmg_reduction',
    label: 'Fire Reduction',
    category: 'elemental',
    isPercent: true,
    description: 'Fire Element Resistance',
  },
  {
    key: 'water_dmg_reduction',
    label: 'Water Reduction',
    category: 'elemental',
    isPercent: true,
    description: 'Water Element Resistance',
  },
  {
    key: 'wind_dmg_reduction',
    label: 'Wind Reduction',
    category: 'elemental',
    isPercent: true,
    description: 'Wind Element Resistance',
  },
  {
    key: 'earth_dmg_reduction',
    label: 'Earth Reduction',
    category: 'elemental',
    isPercent: true,
    description: 'Earth Element Resistance',
  },
  {
    key: 'ghost_dmg_reduction',
    label: 'Ghost Reduction',
    category: 'elemental',
    isPercent: true,
    description: 'Ghost Element Resistance',
  },
  {
    key: 'holy_dmg_reduction',
    label: 'Holy Reduction',
    category: 'elemental',
    isPercent: true,
    description: 'Holy Element Resistance',
  },
  {
    key: 'poison_dmg_reduction',
    label: 'Poison Reduction',
    category: 'elemental',
    isPercent: true,
    description: 'Poison Element Resistance',
  },
]

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`

// Cache in-memory untuk font Poppins agar render PNG instan dan selalu menggunakan font Poppins asli
let cachedPoppinsEmbedCss: string | null = null

function resolveNextMediaUrl(rawUrl: string): string {
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:')) {
    return rawUrl
  }
  const clean = rawUrl.replace(/^[./]+/, '')
  if (clean.startsWith('_next/')) {
    return `${window.location.origin}/${clean}`
  }
  if (clean.startsWith('static/media/')) {
    return `${window.location.origin}/_next/${clean}`
  }
  if (clean.startsWith('media/')) {
    return `${window.location.origin}/_next/static/${clean}`
  }
  return `${window.location.origin}/_next/static/media/${clean}`
}

async function getPoppinsFontEmbedCss(): Promise<string> {
  if (cachedPoppinsEmbedCss) return cachedPoppinsEmbedCss
  if (typeof document === 'undefined') return ''

  const fontFaceRules: string[] = []
  const promises: Promise<void>[] = []
  const processedUrls = new Set<string>()

  try {
    if (document.fonts) {
      await document.fonts.ready
    }

    for (const sheet of Array.from(document.styleSheets)) {
      try {
        const cssRules = Array.from(sheet.cssRules || [])
        for (const rule of cssRules) {
          if (rule.type === CSSRule.FONT_FACE_RULE) {
            const fontFace = rule as CSSFontFaceRule
            const family = fontFace.style.getPropertyValue('font-family') || ''
            const src = fontFace.style.getPropertyValue('src') || ''
            const cssText = fontFace.cssText || ''

            const isPoppins =
              family.toLowerCase().includes('poppins') || cssText.toLowerCase().includes('poppins')

            if (isPoppins) {
              const urlMatch = src.match(/url\((?:['"]?)(.*?)(?:['"]?)\)/)
              const weightMatch = cssText.match(/font-weight:\s*([^;]+)/)
              const styleMatch = cssText.match(/font-style:\s*([^;]+)/)

              const weight = weightMatch ? weightMatch[1].trim() : '400'
              const style = styleMatch ? styleMatch[1].trim() : 'normal'

              if (urlMatch && urlMatch[1]) {
                const fontUrl = urlMatch[1]
                const fullUrl = resolveNextMediaUrl(fontUrl)

                if (!processedUrls.has(fullUrl)) {
                  processedUrls.add(fullUrl)
                  const p = fetch(fullUrl)
                    .then((res) => {
                      if (!res.ok) return null
                      return res.blob()
                    })
                    .then((blob) => {
                      if (!blob) return
                      return new Promise<void>((resolve, reject) => {
                        const reader = new FileReader()
                        reader.onloadend = () => {
                          const base64 = reader.result as string
                          fontFaceRules.push(
                            `@font-face { font-family: 'Poppins'; src: url('${base64}') format('woff2'); font-weight: ${weight}; font-style: ${style}; font-display: swap; }`,
                          )
                          resolve()
                        }
                        reader.onerror = reject
                        reader.readAsDataURL(blob)
                      })
                    })
                    .catch(() => {
                      // Abaikan jika fetch font gagal secara diam-diam tanpa memicu error berlebih
                    })

                  promises.push(p)
                }
              }
            }
          }
        }
      } catch {
        // Cross-origin stylesheet access restricted, ignore
      }
    }

    if (promises.length > 0) {
      await Promise.all(promises)
    }
  } catch (err: unknown) {
    console.warn('Error reading stylesheets for Poppins font:', err)
  }

  const baseFontStyles = `
#member-compare-export-canvas {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif !important;
}
#member-compare-export-canvas *:not(.font-mono) {
  font-family: 'Poppins', -apple-system, BlinkMacSystemFont, sans-serif !important;
}
#member-compare-export-canvas .font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
}
`

  if (fontFaceRules.length > 0) {
    cachedPoppinsEmbedCss = fontFaceRules.join('\n') + '\n' + baseFontStyles
  } else {
    cachedPoppinsEmbedCss =
      '@import url("https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap");\n' +
      baseFontStyles
  }

  return cachedPoppinsEmbedCss
}

export function PvpSimulatorModal({
  isOpen,
  onClose,
  initialCharacter,
  allMembers = [],
  guildName,
}: PvpSimulatorModalProps) {
  // State Pemilihan Kandidat Komparasi
  const [compareIdA, setCompareIdA] = useState<string>(
    initialCharacter?.id || allMembers[0]?.id || '',
  )
  const [compareIdB, setCompareIdB] = useState<string>(
    allMembers.find((m) => m.id !== (initialCharacter?.id || allMembers[0]?.id))?.id ||
      allMembers[1]?.id ||
      '',
  )

  // State Filter Kategori & Pencarian Stat (di UI Interaktif)
  const [activeCategory, setActiveCategory] = useState<StatCategory>('all')
  const [statSearchQuery, setStatSearchQuery] = useState<string>('')

  // State Ekspor PNG
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const exportCanvasRef = useRef<HTMLDivElement>(null)
  const isDownloadingRef = useRef(false)

  // Inisialisasi saat modal dibuka atau target awal berubah
  useEffect(() => {
    if (initialCharacter) {
      setCompareIdA(initialCharacter.id)
      const other = allMembers.find((m) => m.id !== initialCharacter.id)
      if (other && !compareIdB) {
        setCompareIdB(other.id)
      }
    } else if (allMembers.length > 0) {
      if (!compareIdA) setCompareIdA(allMembers[0].id)
      if (!compareIdB && allMembers[1]) setCompareIdB(allMembers[1].id)
    }
  }, [initialCharacter, isOpen, allMembers, compareIdA, compareIdB])

  // Pre-load font Poppins saat modal dibuka agar proses unduh seketika
  useEffect(() => {
    if (isOpen) {
      getPoppinsFontEmbedCss().catch(() => {})
    }
  }, [isOpen])

  // Karakter A dan B
  const charA = useMemo(
    () => allMembers.find((m) => m.id === compareIdA) || null,
    [allMembers, compareIdA],
  )
  const charB = useMemo(
    () => allMembers.find((m) => m.id === compareIdB) || null,
    [allMembers, compareIdB],
  )

  // Skor PvP (dihitung dinamis menggunakan formula balance engine terbaru)
  const scoreA = useMemo(() => {
    if (!charA) return 0
    return calculatePvPScore(charA as unknown as CharacterStatsInput)
  }, [charA])

  const scoreB = useMemo(() => {
    if (!charB) return 0
    return calculatePvPScore(charB as unknown as CharacterStatsInput)
  }, [charB])

  // Data Radar 6-Pilar
  const hexA = useMemo(() => {
    if (!charA) return null
    return calculateHexagonStats(charA as unknown as CharacterStatsInput)
  }, [charA])

  const hexB = useMemo(() => {
    if (!charB) return null
    return calculateHexagonStats(charB as unknown as CharacterStatsInput)
  }, [charB])

  const compareScoreDelta = Math.abs(scoreA - scoreB)
  const compareWinner = scoreA > scoreB ? 'A' : scoreA < scoreB ? 'B' : 'TIE'

  // Filter Stat Matrix (untuk tampilan interaktif dalam dialog)
  const filteredStats = useMemo(() => {
    return STAT_MATRIX_CONFIGS.filter((stat) => {
      const matchCategory = activeCategory === 'all' || stat.category === activeCategory
      const matchQuery =
        !statSearchQuery ||
        stat.label.toLowerCase().includes(statSearchQuery.toLowerCase()) ||
        stat.key.toLowerCase().includes(statSearchQuery.toLowerCase()) ||
        (stat.description && stat.description.toLowerCase().includes(statSearchQuery.toLowerCase()))
      return matchCategory && matchQuery
    })
  }, [activeCategory, statSearchQuery])

  // Stat per kategori untuk Canvas Export Rekreasi (Seluruh 43 Stat)
  const offensiveStats = useMemo(
    () => STAT_MATRIX_CONFIGS.filter((s) => s.category === 'offensive'),
    [],
  )
  const defensiveStats = useMemo(
    () => STAT_MATRIX_CONFIGS.filter((s) => s.category === 'defensive'),
    [],
  )
  const supportStats = useMemo(
    () => STAT_MATRIX_CONFIGS.filter((s) => s.category === 'support'),
    [],
  )
  const elementalStats = useMemo(
    () => STAT_MATRIX_CONFIGS.filter((s) => s.category === 'elemental'),
    [],
  )

  // Penghitungan Skor Keunggulan Stat
  const statWins = useMemo(() => {
    if (!charA || !charB) return { aWins: 0, bWins: 0, ties: 0 }
    let aWins = 0
    let bWins = 0
    let ties = 0

    for (const stat of STAT_MATRIX_CONFIGS) {
      const valA = Number((charA as unknown as Record<string, unknown>)[stat.key] || 0)
      const valB = Number((charB as unknown as Record<string, unknown>)[stat.key] || 0)
      if (valA > valB) aWins++
      else if (valB > valA) bWins++
      else ties++
    }

    return { aWins, bWins, ties }
  }, [charA, charB])

  // Handler Download Gambar PNG (Dirender instan dari Canvas Standalone Rekreasi Penuh dengan Poppins Asli)
  const handleDownloadPng = useCallback(async () => {
    if (!exportCanvasRef.current || isDownloadingRef.current || !charA || !charB) return
    isDownloadingRef.current = true
    setIsDownloading(true)
    setErrorMessage(null)

    try {
      const cleanNameA = (charA.name || 'MemberA').replace(/[^a-zA-Z0-9_-]/g, '_')
      const cleanNameB = (charB.name || 'MemberB').replace(/[^a-zA-Z0-9_-]/g, '_')
      const today = new Date().toISOString().slice(0, 10)
      const fileName = `Comparison-${cleanNameA}-vs-${cleanNameB}-${today}.png`

      // 1. Ambil font embed CSS base64 untuk Poppins (instan dari cache in-memory)
      const fontEmbedCSS = await getPoppinsFontEmbedCss()

      // 2. Pastikan avatar gambar job sudah ter-decode di canvas
      if (exportCanvasRef.current) {
        const imgElements = exportCanvasRef.current.querySelectorAll('img')
        await Promise.all(
          Array.from(imgElements).map((img) => {
            if (img.complete) return Promise.resolve()
            return new Promise<void>((resolve) => {
              img.onload = () => resolve()
              img.onerror = () => resolve()
              setTimeout(resolve, 300)
            })
          }),
        )
      }

      // 3. Jeda singkat agar browser menyelesaikan reflow
      await new Promise((resolve) => setTimeout(resolve, 60))

      // 4. Render canvas ke PNG dengan font Poppins yang ter-embed murni
      const dataUrl = await toPng(exportCanvasRef.current, {
        pixelRatio: 2,
        backgroundColor: '#0b0d14',
        fontEmbedCSS,
        cacheBust: false,
      })

      if (!dataUrl) {
        throw new Error('Failed to convert member comparison to PNG format.')
      }

      const link = document.createElement('a')
      link.download = fileName
      link.href = dataUrl
      document.body.appendChild(link)
      link.click()
      setTimeout(() => {
        link.remove()
      }, 300)

      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (err: unknown) {
      console.error('Export PNG failed:', err)
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'An error occurred while downloading comparison image.',
      )
    } finally {
      isDownloadingRef.current = false
      setIsDownloading(false)
    }
  }, [charA, charB])

  // Helper render baris stat untuk template ekspor PNG
  const renderCanvasRows = (stats: StatRowDefinition[]) => {
    if (!charA || !charB) return null
    return stats.map((row) => {
      const rawValA = Number((charA as unknown as Record<string, unknown>)[row.key] || 0)
      const rawValB = Number((charB as unknown as Record<string, unknown>)[row.key] || 0)

      const maxVal = Math.max(rawValA, rawValB, 1)
      const pctA = Math.min(100, Math.round((rawValA / maxVal) * 100))
      const pctB = Math.min(100, Math.round((rawValB / maxVal) * 100))

      const isAHigher = rawValA > rawValB
      const isBHigher = rawValB > rawValA
      const diff = Math.round(Math.abs(rawValA - rawValB))

      const displayValA = row.isPercent
        ? `${Math.round(rawValA)}%`
        : rawValA.toLocaleString('en-US')
      const displayValB = row.isPercent
        ? `${Math.round(rawValB)}%`
        : rawValB.toLocaleString('en-US')
      const displayDiff = row.isPercent ? `${diff}%` : diff.toLocaleString('en-US')

      return (
        <div
          key={row.key}
          className="px-6 py-3.5 flex items-center justify-between gap-4 border-b border-white/[0.04]"
        >
          {/* Nilai Kandidat A */}
          <div className="w-[140px] flex items-center gap-2.5 shrink-0">
            <span
              className={`font-mono text-base tracking-tight ${
                isAHigher ? 'text-emerald-400 font-black' : 'text-gray-300 font-bold'
              }`}
            >
              {displayValA}
            </span>
            {isAHigher && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0 whitespace-nowrap flex items-center gap-1">
                <Icon icon="fluent:chevron-up-24-filled" className="w-3 h-3 shrink-0" />
                <span>+{displayDiff}</span>
              </span>
            )}
          </div>

          {/* Label Stat & Centered Dual Bar (Panjang & Lebar Maksimal) */}
          <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2">
            <span className="text-sm font-bold text-gray-100 text-center tracking-wide whitespace-nowrap">
              {row.label}
            </span>
            <div className="w-full max-w-[680px] h-3 bg-white/10 rounded-full flex overflow-hidden mt-2 shadow-inner">
              <div
                className={`h-full ${isAHigher ? 'bg-emerald-500' : 'bg-emerald-500/35'}`}
                style={{ width: `${pctA / 2}%` }}
              />
              <div className="w-0.5 bg-white/20 h-full shrink-0" />
              <div
                className={`h-full ml-auto ${isBHigher ? 'bg-purple-500' : 'bg-purple-500/35'}`}
                style={{ width: `${pctB / 2}%` }}
              />
            </div>
          </div>

          {/* Nilai Kandidat B */}
          <div className="w-[140px] flex items-center justify-end gap-2.5 text-right shrink-0">
            {isBHigher && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 whitespace-nowrap flex items-center gap-1">
                <Icon icon="fluent:chevron-up-24-filled" className="w-3 h-3 shrink-0" />
                <span>+{displayDiff}</span>
              </span>
            )}
            <span
              className={`font-mono text-base tracking-tight ${
                isBHigher ? 'text-purple-400 font-black' : 'text-gray-300 font-bold'
              }`}
            >
              {displayValB}
            </span>
          </div>
        </div>
      )
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* =========================================================================
          DEDICATED FULL-HEIGHT EXPORT CANVAS (RECREATED STANDALONE DARK MODE)
          Canvas ini khusus ditargetkan oleh html-to-image sehingga seluruh isi
          dari atas ke bawah tertangkap utuh tanpa batasan scroll atau clipping.
         ========================================================================= */}
      {charA && charB && (
        <div
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '1080px',
            zIndex: -9999,
            pointerEvents: 'none',
            opacity: 1,
          }}
        >
          <div
            ref={exportCanvasRef}
            id="member-compare-export-canvas"
            className="w-[1080px] p-8 flex flex-col gap-6"
            style={{
              background: '#0b0d14',
              color: '#f3f4f6',
              fontFamily: "'Poppins', -apple-system, BlinkMacSystemFont, sans-serif",
            }}
          >
            {/* 1. Header Banner Branding */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10 gap-6">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                {/* Guild Badge & Title in one clean row */}
                <div className="flex items-center gap-3">
                  {guildName && (
                    <div className="px-3 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                      <Icon icon="fluent:shield-task-20-filled" className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-blue-300 tracking-wider uppercase">
                        {guildName}
                      </span>
                    </div>
                  )}
                  <h1 className="text-2xl font-extrabold text-white tracking-tight m-0 whitespace-nowrap">
                    Head-to-Head Member Comparison
                  </h1>
                </div>

                {/* Subtitle Row with Bullets */}
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium whitespace-nowrap">
                  <span className="text-gray-300">ROOC PvP Ranker</span>
                  <span className="text-gray-600">•</span>
                  <span>Official Analytics Infographic</span>
                  <span className="text-gray-600">•</span>
                  <span>
                    Created:{' '}
                    {new Date().toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Top-Right Badge */}
              <div className="px-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2 shrink-0 whitespace-nowrap">
                <Icon
                  icon="fluent:arrow-swap-20-filled"
                  className="w-4 h-4 text-blue-400 shrink-0"
                />
                <span className="text-xs font-bold uppercase tracking-wider text-gray-200 whitespace-nowrap">
                  PvP Analytics Infographic
                </span>
              </div>
            </div>

            {/* 2. Dua Kartu Profil Kandidat */}
            <div className="grid grid-cols-2 gap-5">
              {/* Profil A */}
              <div
                className="p-5 rounded-2xl border flex items-center justify-between gap-4"
                style={{
                  background: 'rgba(16, 185, 129, 0.05)',
                  borderColor:
                    compareWinner === 'A' ? 'rgba(16, 185, 129, 0.5)' : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: compareWinner === 'A' ? '0 0 24px rgba(16, 185, 129, 0.12)' : 'none',
                }}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <Image
                      width={56}
                      height={56}
                      src={getJobIcon(charA.job)}
                      alt=""
                      unoptimized
                      className="w-14 h-14 object-cover rounded-2xl border border-emerald-500/30 shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0b0d14] flex items-center justify-center text-[9px] font-black text-white">
                      A
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block whitespace-nowrap">
                      Candidate A
                    </span>
                    <h3 className="text-xl font-extrabold text-white tracking-tight truncate m-0 mt-0.5">
                      {charA.name}
                    </h3>
                    <p className="text-xs text-gray-400 m-0 mt-0.5 truncate">
                      {JOB_LABELS[charA.job] || charA.job}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 min-w-[150px] flex flex-col items-end justify-center">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block whitespace-nowrap">
                    PvP Score
                  </span>
                  <div className="flex items-center gap-2 my-0.5 whitespace-nowrap">
                    <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                      {Math.round(scoreA).toLocaleString('en-US')}
                    </div>
                    {compareWinner === 'A' && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap flex items-center gap-1">
                        <Icon icon="fluent:chevron-up-24-filled" className="w-3 h-3 shrink-0" />+
                        {Math.round(compareScoreDelta).toLocaleString('en-US')} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Profil B */}
              <div
                className="p-5 rounded-2xl border flex items-center justify-between gap-4"
                style={{
                  background: 'rgba(168, 85, 247, 0.05)',
                  borderColor:
                    compareWinner === 'B' ? 'rgba(168, 85, 247, 0.5)' : 'rgba(255, 255, 255, 0.08)',
                  boxShadow: compareWinner === 'B' ? '0 0 24px rgba(168, 85, 247, 0.12)' : 'none',
                }}
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div className="relative shrink-0">
                    <Image
                      width={56}
                      height={56}
                      src={getJobIcon(charB.job)}
                      alt=""
                      unoptimized
                      className="w-14 h-14 object-cover rounded-2xl border border-purple-500/30 shadow-md"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-purple-500 border-2 border-[#0b0d14] flex items-center justify-center text-[9px] font-black text-white">
                      B
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block whitespace-nowrap">
                      Candidate B
                    </span>
                    <h3 className="text-xl font-extrabold text-white tracking-tight truncate m-0 mt-0.5">
                      {charB.name}
                    </h3>
                    <p className="text-xs text-gray-400 m-0 mt-0.5 truncate">
                      {JOB_LABELS[charB.job] || charB.job}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 min-w-[150px] flex flex-col items-end justify-center">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block whitespace-nowrap">
                    PvP Score
                  </span>
                  <div className="flex items-center gap-2 my-0.5 whitespace-nowrap">
                    <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                      {Math.round(scoreB).toLocaleString('en-US')}
                    </div>
                    {compareWinner === 'B' && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap flex items-center gap-1">
                        <Icon icon="fluent:chevron-up-24-filled" className="w-3 h-3 shrink-0" />+
                        {Math.round(compareScoreDelta).toLocaleString('en-US')} pts
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Head to Head Summary Bar */}
            <div
              className="p-4 rounded-2xl border flex items-center justify-between gap-4"
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/25 shrink-0">
                  <Icon icon="fluent:chart-multiple-20-filled" className="w-5 h-5" />
                </div>
                <div className="text-sm font-semibold text-gray-200 truncate">
                  {compareWinner === 'TIE' ? (
                    'Both characters have very balanced overall performance!'
                  ) : (
                    <span>
                      <strong
                        className={compareWinner === 'A' ? 'text-emerald-400' : 'text-purple-400'}
                      >
                        {compareWinner === 'A' ? charA.name : charB.name}
                      </strong>{' '}
                      leads by{' '}
                      <strong className="text-amber-400 font-mono">
                        +{Math.round(compareScoreDelta).toLocaleString('en-US')} pts
                      </strong>{' '}
                      against{' '}
                      <strong className="text-gray-300">
                        {compareWinner === 'A' ? charB.name : charA.name}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 whitespace-nowrap">
                  {charA.name}: {statWins.aWins} Stats Won
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/25 whitespace-nowrap">
                  {charB.name}: {statWins.bWins} Stats Won
                </span>
                {statWins.ties > 0 && (
                  <span className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-400 border border-white/10 whitespace-nowrap">
                    {statWins.ties} Stats Tied
                  </span>
                )}
              </div>
            </div>

            {/* 4. Analisis 6-Pilar Hexagon Radar Chart */}
            {hexA && hexB && (
              <div
                className="p-6 rounded-3xl border flex flex-col items-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="w-full flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:radar" className="w-5 h-5 text-blue-400" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-white m-0">
                      Summary
                    </h4>
                  </div>
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                    ROOC Character Profile & Performance Comparison
                  </span>
                </div>

                <HexagonRadarChart
                  dataA={hexA}
                  dataB={hexB}
                  labelA={charA.name}
                  labelB={charB.name}
                  colorA="#10b981"
                  colorB="#a855f7"
                  size={360}
                  showLegend={true}
                  showSummaryCards={true}
                />
              </div>
            )}

            {/* 5. Matriks Perbandingan Seluruh Stat (1 Kolom Vertikal Penuh: Ukuran Teks Lebih Besar & Jelas) */}
            <div className="flex flex-col gap-6 w-full">
              {/* Card 1: Attack */}
              <div
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="px-6 py-3.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
                  <span className="text-base font-extrabold uppercase tracking-wider text-rose-400 flex items-center gap-2.5 whitespace-nowrap">
                    Attack
                  </span>
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                    Physical / Magic / Penetration / Crit
                  </span>
                </div>
                <div>{renderCanvasRows(offensiveStats)}</div>
              </div>

              {/* Card 2: Defense */}
              <div
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="px-6 py-3.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
                  <span className="text-base font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-2.5 whitespace-nowrap">
                    Defense
                  </span>
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                    HP / DEF / Physical & Magic Reduction
                  </span>
                </div>
                <div>{renderCanvasRows(defensiveStats)}</div>
              </div>

              {/* Card 3: Utility */}
              <div
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="px-6 py-3.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
                  <span className="text-base font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-2.5 whitespace-nowrap">
                    Utility
                  </span>
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                    Heal Done & Taken / Cast / Movement Speed
                  </span>
                </div>
                <div>{renderCanvasRows(supportStats)}</div>
              </div>

              {/* Card 4: Elemental Reduction */}
              <div
                className="rounded-2xl border overflow-hidden"
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div className="px-6 py-3.5 bg-white/[0.04] border-b border-white/10 flex items-center justify-between">
                  <span className="text-base font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-2.5 whitespace-nowrap">
                    Elemental Reduction
                  </span>
                  <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
                    8 Elements Resistance (Neutral, Fire, Water, Wind, Earth, Ghost, Holy, Poison)
                  </span>
                </div>
                <div>{renderCanvasRows(elementalStats)}</div>
              </div>
            </div>

            {/* 6. Footer Watermark */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>ROOC PvP Ranker & Guild Management System</span>
              <span className="font-mono text-gray-500">ragnatool.my.id</span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE MODAL DIALOG (TAMPILAN INTERAKTIF PENGGUNA)
         ========================================================================= */}
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/40 dark:bg-black/65 backdrop-blur-xl animate-fadeIn"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <div className="w-full max-w-5xl rounded-3xl flex flex-col max-h-[92vh] overflow-hidden border border-black/5 dark:border-white/10 shadow-2xl transition-all bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl animate-slideIn">
          {/* Header Modal */}
          <div className="p-5 sm:p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-4 flex-wrap bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20 shadow-sm">
                <Icon icon="fluent:arrow-swap-20-filled" className="w-5 h-5" />
              </div>
              <div>
                <h2
                  className="text-xl font-bold m-0 tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  Member Comparison
                </h2>
                <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Compare comprehensive stats, 6-pillar radar chart, and performance advantages
                  between two members.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Tombol Download PNG Header */}
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isDownloading || !charA || !charB}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-sm"
                title="Download member comparison result in high-resolution PNG format"
              >
                {isDownloading ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Preparing PNG...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Icon icon="fluent:checkmark-20-filled" className="w-4 h-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Icon icon="fluent:arrow-download-20-filled" className="w-4 h-4" />
                    <span>Download PNG</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer select-none active:scale-90"
                aria-label="Close"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Error Alert jika download gagal */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon icon="fluent:error-circle-20-filled" className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-400 hover:text-red-300 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Konten Utama Komparasi Interaktif */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Header Pemilihan Dua Kandidat */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kandidat A */}
              <div
                className="p-4.5 rounded-2xl border flex flex-col gap-3 bg-black/[0.02] dark:bg-white/[0.04] transition-all"
                style={{
                  borderColor:
                    compareWinner === 'A' ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-color)',
                  boxShadow: compareWinner === 'A' ? '0 4px 20px rgba(16, 185, 129, 0.08)' : 'none',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Candidate A
                    </span>
                  </div>
                </div>

                <CustomDropdown
                  value={compareIdA}
                  onChange={(val) => setCompareIdA(val)}
                  placeholder="-- Select Candidate A --"
                  options={allMembers.map((m) => ({
                    value: m.id,
                    label: m.name,
                    sublabel: `${JOB_LABELS[m.job] || m.job} • ${Math.round(calculatePvPScore(m as unknown as CharacterStatsInput))} pts`,
                    icon: getJobIcon(m.job),
                  }))}
                />

                {charA && (
                  <div
                    className="flex items-center gap-3 pt-3 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <Image
                      width={48}
                      height={48}
                      src={getJobIcon(charA.job)}
                      alt=""
                      className="w-12 h-12 object-cover rounded-2xl border border-black/10 dark:border-white/10 shadow-sm"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div>
                      <h4
                        className="text-base font-bold m-0"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {charA.name}
                      </h4>
                      <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>
                        {JOB_LABELS[charA.job] || charA.job}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>
                        PvP Score
                      </span>
                      <div className="flex items-center gap-1">
                        <strong className="text-lg font-extrabold text-amber-500 dark:text-amber-400">
                          {Math.round(scoreA).toLocaleString('en-US')}
                        </strong>
                        {compareWinner === 'A' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            +{Math.round(compareScoreDelta).toLocaleString('en-US')} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Kandidat B */}
              <div
                className="p-4.5 rounded-2xl border flex flex-col gap-3 bg-black/[0.02] dark:bg-white/[0.04] transition-all"
                style={{
                  borderColor:
                    compareWinner === 'B' ? 'rgba(168, 85, 247, 0.5)' : 'var(--border-color)',
                  boxShadow: compareWinner === 'B' ? '0 4px 20px rgba(168, 85, 247, 0.08)' : 'none',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                      Candidate B
                    </span>
                  </div>
                </div>

                <CustomDropdown
                  value={compareIdB}
                  onChange={(val) => setCompareIdB(val)}
                  placeholder="-- Select Candidate B --"
                  options={allMembers.map((m) => ({
                    value: m.id,
                    label: m.name,
                    sublabel: `${JOB_LABELS[m.job] || m.job} • ${Math.round(calculatePvPScore(m as unknown as CharacterStatsInput))} pts`,
                    icon: getJobIcon(m.job),
                  }))}
                />

                {charB && (
                  <div
                    className="flex items-center gap-3 pt-3 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <Image
                      width={48}
                      height={48}
                      src={getJobIcon(charB.job)}
                      alt=""
                      className="w-12 h-12 object-cover rounded-2xl border border-black/10 dark:border-white/10 shadow-sm"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div>
                      <h4
                        className="text-base font-bold m-0"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {charB.name}
                      </h4>
                      <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>
                        {JOB_LABELS[charB.job] || charB.job}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <span className="text-[11px] block" style={{ color: 'var(--text-muted)' }}>
                        PvP Score
                      </span>
                      <div className="flex items-center gap-1">
                        <strong className="text-lg font-extrabold text-amber-500 dark:text-amber-400">
                          {Math.round(scoreB).toLocaleString('en-US')}
                        </strong>
                        {compareWinner === 'B' && (
                          <span className="text-[11px] font-bold px-2 py-0.5 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                            +{Math.round(compareScoreDelta).toLocaleString('en-US')} pts
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Head to Head Comparison Result Banner */}
            {charA && charB && (
              <div
                className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left bg-black/[0.02] dark:bg-white/[0.03]"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
                    <Icon icon="fluent:chart-multiple-20-filled" className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {compareWinner === 'TIE' ? (
                      'Both characters have very balanced overall performance!'
                    ) : (
                      <span>
                        <strong
                          className={compareWinner === 'A' ? 'text-emerald-500' : 'text-purple-500'}
                        >
                          {compareWinner === 'A' ? charA.name : charB.name}
                        </strong>{' '}
                        leads by{' '}
                        <strong className="text-amber-500">
                          +{Math.round(compareScoreDelta).toLocaleString('en-US')} pts
                        </strong>{' '}
                        against{' '}
                        <strong style={{ color: 'var(--text-secondary)' }}>
                          {compareWinner === 'A' ? charB.name : charA.name}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Stat Win Counters */}
                <div className="flex items-center gap-2 text-xs font-semibold shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                    {charA.name}: {statWins.aWins} Stats
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/25">
                    {charB.name}: {statWins.bWins} Stats
                  </span>
                </div>
              </div>
            )}

            {/* Visualisasi Perbandingan 6-Pilar Hexagon Radar */}
            {charA && charB && hexA && hexB && (
              <div className="p-5 rounded-3xl border border-black/5 dark:border-white/10 flex flex-col items-center bg-black/[0.02] dark:bg-white/[0.04]">
                <div
                  className="w-full flex items-center justify-between mb-4 border-b pb-3"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:radar" className="w-5 h-5 text-blue-500" />
                    <h4
                      className="text-sm font-bold uppercase tracking-wider m-0"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Summary
                    </h4>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    ROOC Character Profile Comparison
                  </span>
                </div>

                <HexagonRadarChart
                  dataA={hexA}
                  dataB={hexB}
                  labelA={charA.name}
                  labelB={charB.name}
                  colorA="#10b981"
                  colorB="#a855f7"
                  size={340}
                  showLegend={true}
                  showSummaryCards={true}
                />
              </div>
            )}

            {/* Matriks Perbandingan Stat Lengkap (Interaktif) */}
            {charA && charB && (
              <div
                className="rounded-3xl border overflow-hidden shadow-sm"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
              >
                {/* Header Matriks & Filter Toolbar */}
                <div
                  className="p-4 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
                >
                  <div>
                    <h3
                      className="text-sm font-bold uppercase tracking-wider m-0"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Detail
                    </h3>
                    <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Displaying key stats across all jobs (Offense, Defense, Support & Elemental).
                    </p>
                  </div>

                  {/* Search Bar Stat */}
                  <div className="w-full sm:w-56 relative">
                    <Icon
                      icon="fluent:search-20-regular"
                      className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    />
                    <input
                      type="text"
                      value={statSearchQuery}
                      onChange={(e) => setStatSearchQuery(e.target.value)}
                      placeholder="Search stat (CRIT, ASPD, Heal...)"
                      className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border outline-none transition-colors bg-white dark:bg-zinc-800"
                      style={{
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Category Pills */}
                <div
                  className="px-4 py-2.5 border-b flex items-center gap-1.5 overflow-x-auto"
                  style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}
                >
                  {[
                    { id: 'all', label: 'All' },
                    { id: 'offensive', label: 'Attack' },
                    { id: 'defensive', label: 'Defense' },
                    { id: 'support', label: 'Support' },
                    {
                      id: 'elemental',
                      label: 'Elemental Reduction',
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCategory(tab.id as StatCategory)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        activeCategory === tab.id
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-black/5 dark:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Table Column Headers */}
                <div
                  className="px-4 py-2.5 border-b flex items-center justify-between text-xs font-bold uppercase tracking-wider"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div className="w-[140px] sm:w-[160px] shrink-0 flex items-center gap-2 text-left">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="truncate">{charA.name}</span>
                  </div>
                  <div className="flex-1 text-center font-bold">Stat Metric</div>
                  <div className="w-[140px] sm:w-[160px] shrink-0 flex items-center justify-end gap-2 text-right">
                    <span className="truncate">{charB.name}</span>
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                </div>

                {/* Rows List Interaktif (dengan Scrollbar nyaman) */}
                <div className="divide-y divide-black/5 dark:divide-white/5 text-sm max-h-[480px] overflow-y-auto">
                  {filteredStats.length === 0 ? (
                    <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                      No stats match your search &quot;{statSearchQuery}&quot;
                    </div>
                  ) : (
                    filteredStats.map((row) => {
                      const rawValA = Number(
                        (charA as unknown as Record<string, unknown>)[row.key] || 0,
                      )
                      const rawValB = Number(
                        (charB as unknown as Record<string, unknown>)[row.key] || 0,
                      )

                      const maxVal = Math.max(rawValA, rawValB, 1)
                      const pctA = Math.min(100, Math.round((rawValA / maxVal) * 100))
                      const pctB = Math.min(100, Math.round((rawValB / maxVal) * 100))

                      const isAHigher = rawValA > rawValB
                      const isBHigher = rawValB > rawValA
                      const diff = Math.round(Math.abs(rawValA - rawValB))

                      const displayValA = row.isPercent
                        ? `${Math.round(rawValA)}%`
                        : rawValA.toLocaleString('en-US')
                      const displayValB = row.isPercent
                        ? `${Math.round(rawValB)}%`
                        : rawValB.toLocaleString('en-US')
                      const displayDiff = row.isPercent ? `${diff}%` : diff.toLocaleString('en-US')

                      return (
                        <div
                          key={row.key}
                          className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                        >
                          {/* Nilai Kandidat A */}
                          <div className="w-[140px] sm:w-[160px] shrink-0 flex items-center gap-2">
                            <span
                              className={`font-bold font-mono ${
                                isAHigher
                                  ? 'text-emerald-600 dark:text-emerald-400 font-extrabold'
                                  : 'text-[var(--text-primary)]'
                              }`}
                            >
                              {displayValA}
                            </span>
                            {isAHigher && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 flex items-center gap-0.5">
                                <Icon
                                  icon="fluent:chevron-up-24-filled"
                                  className="w-2.5 h-2.5 shrink-0"
                                />
                                <span>+{displayDiff}</span>
                              </span>
                            )}
                          </div>

                          {/* Nama Stat & Dual Progress Bar (Panjang & Lebar Maksimal) */}
                          <div className="flex-1 flex flex-col items-center justify-center gap-1.5 min-w-0 px-2">
                            <span
                              className="text-xs font-semibold text-center truncate max-w-full"
                              style={{ color: 'var(--text-primary)' }}
                              title={row.description}
                            >
                              {row.label}
                            </span>
                            <div className="w-full max-w-[500px] h-3 bg-black/10 dark:bg-white/10 rounded-full flex overflow-hidden shadow-inner">
                              {/* Bar A (ke arah kiri dari tengah atau 50-50) */}
                              <div
                                className={`h-full transition-all ${
                                  isAHigher ? 'bg-emerald-500' : 'bg-emerald-500/40'
                                }`}
                                style={{ width: `${pctA / 2}%` }}
                              />
                              <div className="w-0.5 bg-[var(--border-color)] h-full shrink-0" />
                              <div
                                className={`h-full transition-all ml-auto ${
                                  isBHigher ? 'bg-purple-500' : 'bg-purple-500/40'
                                }`}
                                style={{ width: `${pctB / 2}%` }}
                              />
                            </div>
                          </div>

                          {/* Nilai Kandidat B */}
                          <div className="w-[140px] sm:w-[160px] shrink-0 flex items-center justify-end gap-2 text-right">
                            {isBHigher && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0 flex items-center gap-0.5">
                                <Icon
                                  icon="fluent:chevron-up-24-filled"
                                  className="w-2.5 h-2.5 shrink-0"
                                />
                                <span>+{displayDiff}</span>
                              </span>
                            )}
                            <span
                              className={`font-bold font-mono ${
                                isBHigher
                                  ? 'text-purple-600 dark:text-purple-400 font-extrabold'
                                  : 'text-[var(--text-primary)]'
                              }`}
                            >
                              {displayValB}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Modal */}
          <div
            className="p-4 border-t flex items-center justify-between gap-3 flex-wrap"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
          >
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {guildName && `Guild: ${guildName} • `}
              Total {allMembers.length} registered guild members
            </div>

            <div className="flex items-center gap-2">
              {/* Tombol Download PNG Footer */}
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isDownloading || !charA || !charB}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white border-blue-500 shadow-sm"
              >
                {isDownloading ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Preparing PNG...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <Icon icon="fluent:checkmark-20-filled" className="w-4 h-4 text-emerald-300" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <>
                    <Icon icon="fluent:arrow-download-20-filled" className="w-4 h-4" />
                    <span>Download PNG</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl text-sm font-semibold border hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
                style={{
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                  background: 'var(--bg-primary)',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
