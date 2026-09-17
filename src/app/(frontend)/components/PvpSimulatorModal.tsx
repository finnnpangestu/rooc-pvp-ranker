'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { JOB_LABELS, JOBS } from '@/const/JobLabels'
import { calculatePvPScore, calculateHexagonStats } from '@/utils/calculatePvPScore'
import { HexagonRadarChart } from './HexagonRadarChart'
import type { Character, CharacterStatsInput, PopulatedMember } from '@/types'
import Image from 'next/image'

interface PvpSimulatorModalProps {
  isOpen: boolean
  onClose: () => void
  initialCharacter?: Character | PopulatedMember | null
  allMembers?: (Character | PopulatedMember)[]
  guildName?: string
}

type SimulatorTab = 'simulator' | 'compare'
type StatCategory = 'general' | 'quasi' | 'special'

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`

const STAT_CONFIGS: Record<
  StatCategory,
  { key: string; label: string; step: number; isPercent?: boolean }[]
> = {
  general: [
    { key: 'max_hp', label: 'Max HP', step: 5000 },
    { key: 'patk', label: 'PATK', step: 100 },
    { key: 'matk', label: 'MATK', step: 100 },
    { key: 'pdef', label: 'PDEF', step: 50 },
    { key: 'mdef', label: 'MDEF', step: 50 },
    { key: 'refine_patk', label: 'Refine PATK', step: 50 },
    { key: 'refine_matk', label: 'Refine MATK', step: 50 },
    { key: 'refine_pdef', label: 'Refine PDEF', step: 50 },
    { key: 'refine_mdef', label: 'Refine MDEF', step: 50 },
    { key: 'hit', label: 'HIT', step: 20 },
    { key: 'flee', label: 'FLEE', step: 20 },
  ],
  quasi: [
    { key: 'pdmg', label: 'PDMG', step: 5, isPercent: true },
    { key: 'mdmg', label: 'MDMG', step: 5, isPercent: true },
    { key: 'pdmg_reduction', label: 'PDMG.R', step: 5, isPercent: true },
    { key: 'mdmg_reduction', label: 'MDMG.R', step: 5, isPercent: true },
    { key: 'ignore_pdef', label: 'Ignore PDEF', step: 5, isPercent: true },
    { key: 'ignore_mdef', label: 'Ignore MDEF', step: 5, isPercent: true },
    { key: 'pdmg_bonus', label: 'PDMG Bonus', step: 50 },
    { key: 'mdmg_bonus', label: 'MDMG Bonus', step: 50 },
    { key: 'pvp_dmg_bonus', label: 'PvP DMG Bonus', step: 100 },
    { key: 'pvp_dmg_reduction', label: 'PvP DMG Red', step: 100 },
    { key: 'critical', label: 'CRIT', step: 10 },
    { key: 'critical_damage', label: 'CRIT DMG', step: 5, isPercent: true },
    { key: 'critical_reduction', label: 'CRIT RES', step: 10 },
    { key: 'critical_damage_reduction', label: 'CRIT DMG RES', step: 5, isPercent: true },
    { key: 'aspd', label: 'ASPD', step: 5, isPercent: true },
    { key: 'variable_cast', label: 'Variable CT', step: 5, isPercent: true },
    { key: 'healing_done', label: 'Healing Done', step: 5, isPercent: true },
    { key: 'healing_taken', label: 'Healing Taken', step: 5, isPercent: true },
  ],
  special: [
    { key: 'dmg_vs_demi_human', label: 'DMG vs Demi', step: 5, isPercent: true },
    { key: 'dmg_reduction_demi_human', label: 'DMG Red Demi', step: 5, isPercent: true },
    { key: 'dmg_vs_medium', label: 'DMG vs Med', step: 5, isPercent: true },
    { key: 'dmg_reduction_medium', label: 'DMG Red Med', step: 5, isPercent: true },
    { key: 'neutral_dmg_bonus', label: 'Neutral Bonus', step: 5, isPercent: true },
    { key: 'neutral_dmg_reduction', label: 'Neutral Red', step: 5, isPercent: true },
    { key: 'fire_dmg_reduction', label: 'Fire Red', step: 5, isPercent: true },
    { key: 'water_dmg_reduction', label: 'Water Red', step: 5, isPercent: true },
    { key: 'wind_dmg_reduction', label: 'Wind Red', step: 5, isPercent: true },
    { key: 'earth_dmg_reduction', label: 'Earth Red', step: 5, isPercent: true },
    { key: 'ghost_dmg_reduction', label: 'Ghost Red', step: 5, isPercent: true },
    { key: 'holy_dmg_reduction', label: 'Holy Red', step: 5, isPercent: true },
    { key: 'poison_dmg_reduction', label: 'Poison Red', step: 5, isPercent: true },
  ],
}

const JOB_ARCHETYPES: Record<string, { role: string; topWeights: string; hint: string }> = {
  paladin: {
    role: 'Primary Tanker & Damage Sponge',
    topWeights: 'HP (2.2x), Reduksi DMG (2.2x), Utilitas (1.4x)',
    hint: 'Prioritaskan Max HP, PDMG.R, MDMG.R, serta Reduksi Demi-Human & Medium untuk lonjakan skor tertinggi.',
  },
  lord_knight: {
    role: 'Bruiser Frontliner',
    topWeights: 'HP (1.8x), ATK (1.6x), Penetrasi (1.4x), DMG Bonus (1.4x)',
    hint: 'Kombinasi seimbang antara Max HP dan PATK/Ignore PDEF memberikan efektivitas PvP maksimal.',
  },
  high_priest: {
    role: 'Support & Healing Anchor',
    topWeights: 'Utilitas (2.6x), Reduksi DMG (2.0x), HP (1.8x)',
    hint: 'Healing Done, Healing Taken, Variable Cast, dan Reduksi Bertahan memberikan kontribusi skor terbesar.',
  },
  champion: {
    role: 'Single Target Burst Eliminator',
    topWeights: 'ATK (2.2x), Penetrasi (2.2x), DMG Bonus (2.0x), HP (1.6x)',
    hint: 'Fokus pada PATK, Ignore PDEF, dan PvP DMG Bonus untuk memaksimalkan damage pukulan Asura.',
  },
  assassin_cross: {
    role: 'Agile Assassin & Critical DPS',
    topWeights: 'ATK (2.4x), Penetrasi (2.4x), DMG Bonus (2.2x)',
    hint: 'Tingkatkan PATK, Ignore PDEF, CRIT DMG, dan Demi-Human Bonus untuk potensi burst tertingginya.',
  },
  stalker: {
    role: 'Disabler & Utility Skirmisher',
    topWeights: 'ATK (1.8x), Penetrasi (1.8x), Utilitas (1.8x), HP (1.6x)',
    hint: 'Stat merata antara daya serang dan utilitas status memberikan rating optimal.',
  },
  high_wizard: {
    role: 'Area Magic Nuker & Crowd Control',
    topWeights: 'MATK (2.4x), Penetrasi (2.2x), DMG Bonus (2.2x)',
    hint: 'Maksimalkan MATK, Ignore MDEF, Variable Cast reduction, dan Elemental Bonus.',
  },
  professor: {
    role: 'Magic Disrupter & Mana Controller',
    topWeights: 'Utilitas (2.2x), HP (1.8x), Reduksi DMG (1.6x), MATK (1.4x)',
    hint: 'Daya tahan tinggi dan utilitas cast menjadi kunci peran Profesor di Guild League & WoE.',
  },
  sniper: {
    role: 'Long Range Physical Carry',
    topWeights: 'ATK (2.4x), Penetrasi (2.2x), DMG Bonus (2.0x)',
    hint: 'PATK, Ignore PDEF, ASPD, dan Crit DMG adalah pilar utama kontribusi damage Sniper.',
  },
  minstrell: {
    role: 'Party Buffer & Bard Support',
    topWeights: 'Utilitas (2.8x), HP (1.8x), Reduksi DMG (1.8x)',
    hint: 'Sangat mengutamakan Utilitas (Cast, ASPD, Healing) dan ketahanan hidup di garis belakang.',
  },
  gypsy: {
    role: 'Party Buffer & Dancer Crowd Control',
    topWeights: 'Utilitas (2.8x), HP (1.8x), Reduksi DMG (1.8x)',
    hint: 'Utilitas skill, daya tahan HP, dan reduksi damage demi-human menjadikannya sulit ditumbangkan.',
  },
  mastersmith: {
    role: 'Melee Heavy Striker & Buffer',
    topWeights: 'ATK (2.2x), Penetrasi (2.0x), DMG Bonus (2.0x), HP (1.6x)',
    hint: 'PATK masif dipadu Ignore PDEF tinggi menghasilkan damage Cart Termination mematikan.',
  },
  biochemist: {
    role: 'Ranged Potion Thrower & Plant Burst',
    topWeights: 'ATK/MATK (2.0x), HP (1.8x), Penetrasi (1.8x), DMG Bonus (1.8x)',
    hint: 'Kombinasi hybrid ATK, MATK, dan Ignore DEF/MDEF mendongkrak skor Acid Demonstration.',
  },
  summoner: {
    role: 'Doran Magic / Physical Hybrid',
    topWeights: 'HP (1.8x), ATK/MATK (1.8x), Utilitas (1.8x), Penetrasi (1.6x)',
    hint: 'Fleksibel antara magic atau physical build dengan ketahanan HP yang solid.',
  },
  adept_novice: {
    role: 'Versatile All-Rounder',
    topWeights: 'ATK/MATK (2.0x), Penetrasi (1.8x), DMG Bonus (1.8x), Utilitas (1.8x)',
    hint: 'Memiliki konversi skor serba bisa dengan skala damage dan penetrasi tinggi.',
  },
  rebellion: {
    role: 'Firearms Rapid Fire Burst',
    topWeights: 'ATK (2.6x), Penetrasi (2.4x), DMG Bonus (2.4x)',
    hint: 'Pembobotan offensive tertinggi di game. Fokus mutlak pada PATK, Ignore PDEF, dan DMG Bonus.',
  },
}

export function PvpSimulatorModal({
  isOpen,
  onClose,
  initialCharacter,
  allMembers = [],
  guildName,
}: PvpSimulatorModalProps) {
  const [activeTab, setActiveTab] = useState<SimulatorTab>('simulator')
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialCharacter?.id || '')
  const [activeStatCategory, setActiveStatCategory] = useState<StatCategory>('general')

  // State untuk Simulator
  const [simJob, setSimJob] = useState<string>(initialCharacter?.job || 'paladin')
  const [simStats, setSimStats] = useState<Record<string, number>>({})
  const [baseStats, setBaseStats] = useState<Record<string, number>>({})
  const [baseScore, setBaseScore] = useState<number>(0)

  // State untuk Compare Karakter
  const [compareIdA, setCompareIdA] = useState<string>(
    initialCharacter?.id || allMembers[0]?.id || '',
  )
  const [compareIdB, setCompareIdB] = useState<string>(
    allMembers.find((m) => m.id !== (initialCharacter?.id || allMembers[0]?.id))?.id ||
      allMembers[1]?.id ||
      '',
  )

  // Inisialisasi simulator dari karakter yang dipilih
  const loadCharacterIntoSimulator = (char: Character | PopulatedMember | null | undefined) => {
    if (!char) {
      setSimJob('paladin')
      const emptyStats: Record<string, number> = {}
      setSimStats(emptyStats)
      setBaseStats(emptyStats)
      setBaseScore(0)
      return
    }

    setSimJob(char.job || 'paladin')
    const extracted: Record<string, number> = {}

    const allKeys = [
      ...STAT_CONFIGS.general.map((s) => s.key),
      ...STAT_CONFIGS.quasi.map((s) => s.key),
      ...STAT_CONFIGS.special.map((s) => s.key),
    ]

    for (const key of allKeys) {
      const val = (char as unknown as Record<string, unknown>)[key]
      extracted[key] = val !== undefined && val !== null ? Number(val) || 0 : 0
    }

    setSimStats(extracted)
    setBaseStats(extracted)

    const initialScore =
      Number(char.pvp_score) || calculatePvPScore({ ...extracted, job: char.job })
    setBaseScore(initialScore)
  }

  // Load awal atau saat initialCharacter berubah
  useEffect(() => {
    if (initialCharacter) {
      setSelectedMemberId(initialCharacter.id)
      loadCharacterIntoSimulator(initialCharacter)
      setCompareIdA(initialCharacter.id)
    } else if (allMembers.length > 0) {
      setSelectedMemberId(allMembers[0].id)
      loadCharacterIntoSimulator(allMembers[0])
      setCompareIdA(allMembers[0].id)
      if (allMembers[1]) {
        setCompareIdB(allMembers[1].id)
      }
    }
  }, [initialCharacter, isOpen])

  // Menangani penggantian karakter dropdown di simulator
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId)
    if (!memberId) {
      loadCharacterIntoSimulator(null)
      return
    }
    const target = allMembers.find((m) => m.id === memberId)
    if (target) {
      loadCharacterIntoSimulator(target)
    }
  }

  // Hitung Skor Real-Time Simulator
  const currentSimScore = useMemo(() => {
    const payload: CharacterStatsInput = {
      ...simStats,
      job: simJob as Character['job'],
    }
    return calculatePvPScore(payload)
  }, [simStats, simJob])

  const scoreDelta = currentSimScore - baseScore
  const scorePercentDelta = baseScore > 0 ? (scoreDelta / baseScore) * 100 : 0

  const handleStatChange = (key: string, value: number) => {
    setSimStats((prev) => ({
      ...prev,
      [key]: Math.max(0, value),
    }))
  }

  const handleQuickAdjust = (key: string, delta: number) => {
    setSimStats((prev) => {
      const current = prev[key] || 0
      return {
        ...prev,
        [key]: Math.max(0, current + delta),
      }
    })
  }

  const handleResetToBaseline = () => {
    setSimStats({ ...baseStats })
  }

  // Resolusi data untuk Compare Karakter
  const charA = useMemo(
    () => allMembers.find((m) => m.id === compareIdA) || null,
    [allMembers, compareIdA],
  )
  const charB = useMemo(
    () => allMembers.find((m) => m.id === compareIdB) || null,
    [allMembers, compareIdB],
  )

  const scoreA = useMemo(() => {
    if (!charA) return 0
    return Number(charA.pvp_score) || calculatePvPScore(charA as unknown as CharacterStatsInput)
  }, [charA])

  const scoreB = useMemo(() => {
    if (!charB) return 0
    return Number(charB.pvp_score) || calculatePvPScore(charB as unknown as CharacterStatsInput)
  }, [charB])

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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/40 dark:bg-black/65 backdrop-blur-xl animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-5xl rounded-3xl flex flex-col max-h-[92vh] overflow-hidden border border-black/5 dark:border-white/10 shadow-2xl transition-all bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl animate-slideIn"
      >
        {/* Header Modal */}
        <div
          className="p-5 sm:p-6 border-b border-black/5 dark:border-white/10 flex items-center justify-between gap-4 flex-wrap bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-bold m-0 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                PvP Lab & Simulator
              </h2>
              <p className="text-xs m-0 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Simulasi optimasi stat, uji perubahan job, dan bandingkan performa antar member.
              </p>
            </div>
          </div>

          {/* Tab Navigasi Utama */}
          <div className="flex items-center gap-2">
            <div
              className="flex p-1 rounded-2xl bg-black/5 dark:bg-white/8 border border-black/5 dark:border-white/10"
            >
              <button
                type="button"
                onClick={() => setActiveTab('simulator')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                  activeTab === 'simulator'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Stat Simulator
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('compare')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-150 cursor-pointer select-none active:scale-[0.98] ${
                  activeTab === 'compare'
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold shadow-sm'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Icon icon="fluent:arrow-swap-20-filled" className="w-4 h-4" />
                Compare Member
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer select-none active:scale-90"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Konten Tab: Simulator */}
        {activeTab === 'simulator' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Control Bar: Pilih Member & Job */}
            <div
              className="p-4.5 rounded-2xl border border-black/5 dark:border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 bg-black/[0.02] dark:bg-white/[0.04] backdrop-blur-md"
            >
              <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                <div className="flex flex-col gap-1 w-full sm:w-64">
                  <label
                    className="text-[11px] font-semibold uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Pilih Member Guild
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => handleSelectMember(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer"
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    <option value="">-- Template Kosong / Custom --</option>
                    {allMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({JOB_LABELS[m.job] || m.job}) -{' '}
                        {Math.round(Number(m.pvp_score || 0))} pts
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 w-full sm:w-56">
                  <label
                    className="text-[11px] font-semibold uppercase"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Target Job
                  </label>
                  <select
                    value={simJob}
                    onChange={(e) => setSimJob(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer"
                    style={{
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      borderColor: 'var(--border-color)',
                    }}
                  >
                    {JOBS.map((j) => (
                      <option key={j.value} value={j.value}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleResetToBaseline}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
                  style={{
                    color: 'var(--text-secondary)',
                    borderColor: 'var(--border-color)',
                    background: 'var(--bg-secondary)',
                  }}
                  title="Kembalikan semua stat ke nilai awal karakter"
                >
                  <Icon icon="fluent:arrow-reset-20-filled" className="w-4 h-4 text-amber-400" />
                  Reset ke Asli
                </button>
              </div>
            </div>

            {/* Score Comparison Hero Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card Base Score */}
              <div
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
              >
                <span
                  className="text-xs font-semibold uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Skor Awal (Baseline)
                </span>
                <div
                  className="text-2xl sm:text-3xl font-bold mt-2"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {Math.round(baseScore).toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  {selectedMemberId ? 'Dari data karakter asli' : 'Template default'}
                </span>
              </div>

              {/* Card Simulated Score */}
              <div
                className="p-4 rounded-xl border flex flex-col justify-between relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(124, 58, 237, 0.15))',
                  borderColor: 'rgba(99, 102, 241, 0.4)',
                  boxShadow: '0 0 20px rgba(99, 102, 241, 0.15)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    Skor Simulasi
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30">
                    <Image
                      width={14}
                      height={14}
                      src={getJobIcon(simJob)}
                      alt=""
                      className="w-3.5 h-3.5 object-cover rounded-full"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    {JOB_LABELS[simJob] || simJob}
                  </div>
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
                  {Math.round(currentSimScore).toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-indigo-300/80 mt-1">
                  Dihitung otomatis via engine PvP ROOC
                </span>
              </div>

              {/* Card Delta */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between ${
                  scoreDelta > 0
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : scoreDelta < 0
                      ? 'border-rose-500/40 bg-rose-500/10'
                      : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'
                }`}
              >
                <span
                  className="text-xs font-semibold uppercase"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Perubahan Skor (Delta)
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span
                    className={`text-2xl sm:text-3xl font-extrabold ${
                      scoreDelta > 0
                        ? 'text-emerald-500 dark:text-emerald-400'
                        : scoreDelta < 0
                          ? 'text-rose-500 dark:text-rose-400'
                          : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {scoreDelta > 0
                      ? `+${Math.round(scoreDelta).toLocaleString('id-ID')}`
                      : Math.round(scoreDelta).toLocaleString('id-ID')}
                  </span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      scoreDelta > 0
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                        : scoreDelta < 0
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300'
                          : 'bg-black/10 dark:bg-white/10 text-[var(--text-secondary)]'
                    }`}
                  >
                    {scoreDelta > 0
                      ? `+${scorePercentDelta.toFixed(1)}%`
                      : `${scorePercentDelta.toFixed(1)}%`}
                  </span>
                </div>
                <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                  {scoreDelta > 0
                    ? 'Peningkatan performa PvP tercapai'
                    : scoreDelta < 0
                      ? 'Penurunan performa dibanding baseline'
                      : 'Nilai sama dengan baseline'}
                </span>
              </div>
            </div>

            {/* Role & Weight Insights */}
            {JOB_ARCHETYPES[simJob] && (
              <div
                className="p-4 rounded-xl border flex items-start gap-3"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'rgba(99, 102, 241, 0.25)',
                }}
              >
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 mt-0.5">
                  <Icon icon="fluent:lightbulb-24-regular" className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Rekomendasi Optimasi {JOB_LABELS[simJob] || simJob}
                    </span>
                    <span
                      className="text-[11px] px-2 py-0.5 rounded-full border"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {JOB_ARCHETYPES[simJob].role}
                    </span>
                  </div>
                  <p className="text-xs m-0" style={{ color: 'var(--text-secondary)' }}>
                    <strong className="text-indigo-500 dark:text-indigo-300">Fokus Bobot: </strong>
                    {JOB_ARCHETYPES[simJob].topWeights}
                  </p>
                  <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>
                    {JOB_ARCHETYPES[simJob].hint}
                  </p>
                </div>
              </div>
            )}

            {/* Stat Adjustment Tabs */}
            <div className="space-y-4">
              <div
                className="flex items-center justify-between border-b pb-3"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <div className="flex items-center gap-2">
                  {(['general', 'quasi', 'special'] as StatCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveStatCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        activeStatCategory === cat
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-black/5 dark:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/10 dark:hover:bg-white/10'
                      }`}
                    >
                      {cat === 'general'
                        ? 'General Stats'
                        : cat === 'quasi'
                          ? 'Quasi & Reduksi'
                          : 'Special & Elemental'}
                    </button>
                  ))}
                </div>
                <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
                  Gunakan tombol +/- untuk simulasi cepat
                </span>
              </div>

              {/* Grid Form Input Stat */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {STAT_CONFIGS[activeStatCategory].map((stat) => {
                  const currentValue = simStats[stat.key] || 0
                  const baseValue = baseStats[stat.key] || 0
                  const diff = currentValue - baseValue

                  return (
                    <div
                      key={stat.key}
                      className="p-3.5 rounded-2xl border flex flex-col justify-between gap-2 transition-all bg-black/[0.02] dark:bg-white/[0.04]"
                      style={{
                        borderColor: diff !== 0 ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-color)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-medium"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {stat.label}
                        </span>
                        {diff !== 0 && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              diff > 0
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {diff > 0 ? `+${diff}` : diff}
                            {stat.isPercent ? '%' : ''}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={currentValue}
                          onChange={(e) => handleStatChange(stat.key, Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 text-sm font-semibold rounded-lg border outline-none focus:border-indigo-500 transition-colors"
                          style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-primary)',
                            borderColor: 'var(--border-color)',
                          }}
                        />

                        {/* Quick Step Buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(stat.key, -stat.step)}
                            className="w-7 h-7 rounded-lg border text-xs font-bold flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            style={{
                              borderColor: 'var(--border-color)',
                              background: 'var(--bg-secondary)',
                            }}
                            title={`-${stat.step}`}
                          >
                            -
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickAdjust(stat.key, stat.step)}
                            className="w-7 h-7 rounded-lg border text-xs font-bold flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            style={{
                              borderColor: 'var(--border-color)',
                              background: 'var(--bg-secondary)',
                            }}
                            title={`+${stat.step}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Konten Tab: Compare Karakter */}
        {activeTab === 'compare' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {/* Header Picker Dua Karakter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Karakter A */}
              <div
                className="p-4.5 rounded-2xl border flex flex-col gap-3 bg-black/[0.02] dark:bg-white/[0.04]"
                style={{
                  borderColor:
                    compareWinner === 'A' ? 'rgba(52, 211, 153, 0.4)' : 'var(--border-color)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Kandidat A
                  </span>
                  {compareWinner === 'A' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      Skor Lebih Tinggi (+{Math.round(compareScoreDelta)})
                    </span>
                  )}
                </div>

                <select
                  value={compareIdA}
                  onChange={(e) => setCompareIdA(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({JOB_LABELS[m.job] || m.job})
                    </option>
                  ))}
                </select>

                {charA && (
                  <div
                    className="flex items-center gap-3 pt-2 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <Image
                      width={48}
                      height={48}
                      src={getJobIcon(charA.job)}
                      alt=""
                      className="w-12 h-12 object-cover rounded-xl border border-white/10 shadow-sm"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div>
                      <h4
                        className="text-base font-bold m-0"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {charA.name}
                      </h4>
                      <p className="text-xs text-gray-400 m-0">
                        {JOB_LABELS[charA.job] || charA.job}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <span className="text-xs text-gray-400 block">PvP Score</span>
                      <strong className="text-lg font-bold text-amber-400">
                        {Math.round(scoreA).toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Karakter B */}
              <div
                className="p-4.5 rounded-2xl border flex flex-col gap-3 bg-black/[0.02] dark:bg-white/[0.04]"
                style={{
                  borderColor:
                    compareWinner === 'B' ? 'rgba(52, 211, 153, 0.4)' : 'var(--border-color)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Kandidat B
                  </span>
                  {compareWinner === 'B' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      Skor Lebih Tinggi (+{Math.round(compareScoreDelta)})
                    </span>
                  )}
                </div>

                <select
                  value={compareIdB}
                  onChange={(e) => setCompareIdB(e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg border outline-none cursor-pointer"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    borderColor: 'var(--border-color)',
                  }}
                >
                  {allMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({JOB_LABELS[m.job] || m.job})
                    </option>
                  ))}
                </select>

                {charB && (
                  <div
                    className="flex items-center gap-3 pt-2 border-t"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <Image
                      width={48}
                      height={48}
                      src={getJobIcon(charB.job)}
                      alt=""
                      className="w-12 h-12 object-cover rounded-xl border border-white/10 shadow-sm"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div>
                      <h4
                        className="text-base font-bold m-0"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {charB.name}
                      </h4>
                      <p className="text-xs text-gray-400 m-0">
                        {JOB_LABELS[charB.job] || charB.job}
                      </p>
                    </div>
                    <div className="ml-auto text-right">
                      <span className="text-xs text-gray-400 block">PvP Score</span>
                      <strong className="text-lg font-bold text-amber-400">
                        {Math.round(scoreB).toLocaleString('id-ID')}
                      </strong>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Banner Perbandingan Head to Head */}
            {charA && charB && (
              <div
                className="p-4 rounded-xl border text-center relative overflow-hidden"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.8))',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {compareWinner === 'TIE' ? (
                    'Kedua karakter memiliki skor PvP yang seimbang!'
                  ) : (
                    <span>
                      <strong className="text-emerald-400">
                        {compareWinner === 'A' ? charA.name : charB.name}
                      </strong>{' '}
                      unggul{' '}
                      <strong className="text-amber-400">
                        +{Math.round(compareScoreDelta).toLocaleString('id-ID')} pts
                      </strong>{' '}
                      dibanding{' '}
                      <strong className="text-gray-300">
                        {compareWinner === 'A' ? charB.name : charA.name}
                      </strong>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Visualisasi Perbandingan Hexagon Radar */}
            {charA && charB && hexA && hexB && (
              <div
                className="p-5 rounded-3xl border border-black/5 dark:border-white/10 flex flex-col items-center bg-black/[0.02] dark:bg-white/[0.04]"
              >
                <div
                  className="w-full flex items-center justify-between mb-4 border-b pb-3"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:radar" className="w-5 h-5 text-indigo-400" />
                    <h4 className="text-sm font-bold uppercase tracking-wider text-gray-200 m-0">
                      Analisis 6-Pilar Hexagon Stats
                    </h4>
                  </div>
                  <span className="text-xs text-gray-400">
                    Perbandingan Profil Kekuatan Karakter
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

            {/* Tabel Perbandingan Stat Langsung */}
            {charA && charB && (
              <div
                className="rounded-xl border overflow-hidden"
                style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
              >
                <div
                  className="px-4 py-3 border-b flex items-center justify-between text-xs font-bold uppercase tracking-wider"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span className="w-1/3 text-left">{charA.name}</span>
                  <span className="w-1/3 text-center">Stat Metric</span>
                  <span className="w-1/3 text-right">{charB.name}</span>
                </div>

                <div className="divide-y divide-white/5 text-sm">
                  {[
                    { label: 'Max HP', key: 'max_hp' },
                    { label: 'PATK', key: 'patk' },
                    { label: 'MATK', key: 'matk' },
                    { label: 'PDEF', key: 'pdef' },
                    { label: 'MDEF', key: 'mdef' },
                    { label: 'PDMG Reduction', key: 'pdmg_reduction', isPercent: true },
                    { label: 'MDMG Reduction', key: 'mdmg_reduction', isPercent: true },
                    {
                      label: 'Demi-Human Reduction',
                      key: 'dmg_reduction_demi_human',
                      isPercent: true,
                    },
                    { label: 'Medium Reduction', key: 'dmg_reduction_medium', isPercent: true },
                    { label: 'PvP DMG Reduction', key: 'pvp_dmg_reduction' },
                    { label: 'Ignore PDEF', key: 'ignore_pdef' },
                    { label: 'Ignore MDEF', key: 'ignore_mdef' },
                    { label: 'CRIT RES', key: 'critical_reduction' },
                    { label: 'CRIT DMG RES', key: 'critical_damage_reduction', isPercent: true },
                  ].map((row) => {
                    const rawValA = Number(
                      (charA as unknown as Record<string, unknown>)[row.key] || 0,
                    )
                    const rawValB = Number(
                      (charB as unknown as Record<string, unknown>)[row.key] || 0,
                    )

                    const maxVal = Math.max(rawValA, rawValB, 1)
                    const pctA = Math.round((rawValA / maxVal) * 100)
                    const pctB = Math.round((rawValB / maxVal) * 100)

                    const isAHigher = rawValA > rawValB
                    const isBHigher = rawValB > rawValA

                    return (
                      <div
                        key={row.key}
                        className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-black/[0.03] dark:hover:bg-white/5 transition-colors"
                      >
                        {/* Nilai A */}
                        <div className="w-1/3 flex items-center gap-2">
                          <span
                            className={`font-semibold ${
                              isAHigher ? 'text-emerald-500 dark:text-emerald-400' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {row.isPercent ? `${rawValA}%` : rawValA.toLocaleString('id-ID')}
                          </span>
                          {isAHigher && (
                            <Icon
                              icon="fluent:triangle-right-16-filled"
                              className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0"
                            />
                          )}
                        </div>

                        {/* Label & Dual Progress Bar */}
                        <div className="w-1/3 flex flex-col items-center gap-1">
                          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                          <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full flex overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                isAHigher ? 'bg-emerald-500' : 'bg-indigo-500/60'
                              }`}
                              style={{ width: `${pctA / 2}%` }}
                            />
                            <div className="w-0.5 bg-[var(--border-color)] h-full" />
                            <div
                              className={`h-full transition-all ml-auto ${
                                isBHigher ? 'bg-emerald-500' : 'bg-purple-500/60'
                              }`}
                              style={{ width: `${pctB / 2}%` }}
                            />
                          </div>
                        </div>

                        {/* Nilai B */}
                        <div className="w-1/3 flex items-center justify-end gap-2 text-right">
                          {isBHigher && (
                            <Icon
                              icon="fluent:triangle-left-16-filled"
                              className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0"
                            />
                          )}
                          <span
                            className={`font-semibold ${
                              isBHigher ? 'text-emerald-500 dark:text-emerald-400' : 'text-[var(--text-primary)]'
                            }`}
                          >
                            {row.isPercent ? `${rawValB}%` : rawValB.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Modal */}
        <div
          className="p-4 border-t flex items-center justify-between gap-3 flex-wrap"
          style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
        >
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {guildName && `Guild: ${guildName} • `}
            Total {allMembers.length} member siap disimulasikan
          </div>
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
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
