/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useTransition, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CharacterDetailModal } from '../../components/CharacterDetailModal'
import { GlobalDialog } from '../../components/GlobalDialog'
import { Button } from '../../components/Button'
import { Pagination } from '../../components/Pagination'
import { JobFilterDropdown } from '../../components/JobFilterDropdown'
import { createGuild } from '@/actions/dashboard/createGuild'
import { toggleVerifyMember } from '@/actions/dashboard/toggleVerifyMember'
import { deleteCharacter } from '@/actions/dashboard/deleteCharacter'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../components/ThemeProvider'
import { LimitDropdown } from '../../components/LimitDropdown'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Icon } from '@iconify/react'

import type {
  Guild,
  Character,
  PartySetup,
  PopulatedResource,
  ReportWoe,
  WoeSetup,
  Party,
  PartySlot,
  WoeRaid,
} from '@/types'

interface DashboardClientProps {
  guild: Guild | null
  members: Character[]
  partySetup?: PartySetup | null
  woeSetup?: WoeSetup | null
  resources?: PopulatedResource[]
  woeReports?: ReportWoe[]
}

const getJobIcon = (job: string) => `/icons/jobs/${job}.png`

export function DashboardClient({
  guild,
  members,
  partySetup,
  woeSetup,
  resources = [],
  woeReports = [],
}: DashboardClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isPending, startTransition] = useTransition()
  const [guildName, setGuildName] = useState('')
  const [selectedMember, setSelectedMember] = useState<Character | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState('general')
  const [error, setError] = useState('')
  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState(false)
  const [copiedDiscord, setCopiedDiscord] = useState(false)
  const router = useRouter()

  const [memberLimit, setMemberLimit] = useState(5)
  const [leaderboardLimit, setleaderboardLimit] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [leaderboardPage, setLeaderboardPage] = useState(1)

  const [selectedRosterJob, setSelectedRosterJob] = useState('')
  const [isRosterDropdownOpen, setIsRosterDropdownOpen] = useState(false)

  const [selectedLeaderboardJob, setSelectedLeaderboardJob] = useState('')
  const [isLbdDropdownOpen, setIsLbdDropdownOpen] = useState(false)

  useEffect(() => {
    setCurrentPage(1)
    setLeaderboardPage(1)
  }, [selectedRosterJob, selectedLeaderboardJob, memberLimit, leaderboardLimit])

  useEffect(() => {
    if (selectedMember) {
      setActiveDetailTab('general')
    }
  }, [selectedMember])

  const safeMembers = members || []

  const sortedMembers = [...safeMembers].sort(
    (a, b) => new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime(),
  )

  React.useMemo(() => {
    const filtered = selectedRosterJob
      ? sortedMembers.filter((m) => m?.job === selectedRosterJob)
      : sortedMembers
    const pages = Math.ceil(filtered.length / memberLimit) || 1
    const paginated = filtered.slice((currentPage - 1) * memberLimit, currentPage * memberLimit)
    return { filteredMembers: filtered, paginatedMembers: paginated, totalPages: pages }
  }, [sortedMembers, selectedRosterJob, memberLimit, currentPage])

  const { paginatedLeaderboard, totalLeaderboardPages } = React.useMemo(() => {
    const verifiedMembers = safeMembers.filter((m) => m?.isVerified)
    const sorted = (
      selectedLeaderboardJob
        ? verifiedMembers.filter((m) => m?.job === selectedLeaderboardJob)
        : verifiedMembers
    ).sort((a, b) => (Number(b?.pvp_score) || 0) - (Number(a?.pvp_score) || 0))
    const pages = Math.ceil(sorted.length / leaderboardLimit) || 1
    const paginated = sorted.slice(
      (leaderboardPage - 1) * leaderboardLimit,
      leaderboardPage * leaderboardLimit,
    )
    return {
      sortedLeaderboard: sorted,
      paginatedLeaderboard: paginated,
      totalLeaderboardPages: pages,
    }
  }, [safeMembers, selectedLeaderboardJob, leaderboardLimit, leaderboardPage])

  const rosterShouldScroll = memberLimit > 5
  const leaderboardShouldScroll = leaderboardLimit > 5
  const rosterMaxHeight = rosterShouldScroll ? 'max-h-[420px]' : 'max-h-[none]'
  const leaderboardMaxHeight = leaderboardShouldScroll ? 'max-h-[420px]' : 'max-h-[none]'

  // Preparing data for WoE Performance chart
  const woeChartData = React.useMemo(() => {
    if (!woeReports || woeReports.length === 0) return []
    return woeReports.map((report, idx) => ({
      name: `Match ${idx + 1}`,
      rank: Number(report?.match_rank) || 0,
      date: new Date(report?.match_date || new Date()).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      }),
      tooltipTitle: report?.report_name || `Match ${idx + 1}`,
    }))
  }, [woeReports])

  // 1. Kesiapan Party Guild League
  // Elite Parties = 8 Party x 5 Slot = 40 Slot (Top 40 main roster)
  // Sub Parties = up to 8 Party x 5 Slot per group (cadangan / bench)
  const glStats = React.useMemo(() => {
    const eliteParties: Party[] = partySetup?.elite_parties || []
    const subParties: Party[] = partySetup?.sub_parties || []

    let filledElite = 0
    let totalEliteSlots = 0
    eliteParties.forEach((p: Party) => {
      totalEliteSlots += p.slots?.length || 0
      p.slots?.forEach((s: PartySlot) => {
        const id =
          typeof s.assigned_character === 'string'
            ? s.assigned_character.trim()
            : s.assigned_character?.id
        if (id) filledElite++
      })
    })

    let filledSub = 0
    let totalSubSlots = 0
    subParties.forEach((p: Party) => {
      totalSubSlots += p.slots?.length || 0
      p.slots?.forEach((s: PartySlot) => {
        const id =
          typeof s.assigned_character === 'string'
            ? s.assigned_character.trim()
            : s.assigned_character?.id
        if (id) filledSub++
      })
    })

    // Standar GL: 8 Party Elite x 5 Slot = 40 Slot
    const defaultEliteSlots = 40
    const finalEliteTotal = totalEliteSlots > 0 ? totalEliteSlots : defaultEliteSlots
    const elitePercent = finalEliteTotal > 0 ? Math.round((filledElite / finalEliteTotal) * 100) : 0

    const totalSlots = finalEliteTotal + totalSubSlots
    const totalFilled = filledElite + filledSub
    const totalPercent = totalSlots > 0 ? Math.round((totalFilled / totalSlots) * 100) : 0

    return {
      filled: filledElite,
      total: finalEliteTotal,
      percent: elitePercent,
      isFull: filledElite >= finalEliteTotal,
      eliteFilled: filledElite,
      eliteTotal: finalEliteTotal,
      subFilled: filledSub,
      subTotal: totalSubSlots,
      hasSub: subParties.length > 0 && totalSubSlots > 0,
      totalSlots,
      totalFilled,
      totalPercent,
    }
  }, [partySetup])

  // 2. Kesiapan Raid War of Emperium (Standar 1 Raid = 8 Party x 5 Slot = 40 Slot)
  const woeStats = React.useMemo(() => {
    let filled = 0
    const raids: WoeRaid[] = woeSetup?.raids || []
    let totalSlots = 0

    raids.forEach((r: WoeRaid) => {
      r.parties?.forEach((p: Party) => {
        totalSlots += p.slots?.length || 0
        p.slots?.forEach((s: PartySlot) => {
          const id =
            typeof s.assigned_character === 'string'
              ? s.assigned_character.trim()
              : s.assigned_character?.id
          if (id) filled++
        })
      })
    })

    const raidCount = raids.length || 1
    const defaultSlots = raidCount * 40
    const finalTotal = totalSlots > 0 ? totalSlots : defaultSlots
    const percent = finalTotal > 0 ? Math.round((filled / finalTotal) * 100) : 0

    return {
      filled,
      total: finalTotal,
      percent,
      isFull: filled >= finalTotal,
      raidCount,
      partyCount: raidCount * 8,
    }
  }, [woeSetup])

  // 3. Combat Power Tier Pyramid
  const powerTiers = React.useMemo(() => {
    const verified = safeMembers.filter((m) => m?.isVerified)
    const total = verified.length || 1

    const s = verified.filter((m) => (Number(m?.pvp_score) || 0) >= 3500)
    const a = verified.filter((m) => {
      const sc = Number(m?.pvp_score) || 0
      return sc >= 2800 && sc < 3500
    })
    const b = verified.filter((m) => {
      const sc = Number(m?.pvp_score) || 0
      return sc >= 2000 && sc < 2800
    })
    const c = verified.filter((m) => (Number(m?.pvp_score) || 0) < 2000)

    return {
      s: { count: s.length, pct: Math.round((s.length / total) * 100) },
      a: { count: a.length, pct: Math.round((a.length / total) * 100) },
      b: { count: b.length, pct: Math.round((b.length / total) * 100) },
      c: { count: c.length, pct: Math.round((c.length / total) * 100) },
      total: verified.length,
    }
  }, [safeMembers])

  // 4. Komposisi Class & Smart Synergy Advisor
  const classComposition = React.useMemo(() => {
    const verified = safeMembers.filter((m) => m?.isVerified)
    const total = verified.length || 1

    const tankJobs = ['paladin', 'lord_knight']
    const magicJobs = ['high_wizard', 'professor', 'biochemist', 'summoner']
    const supportJobs = ['high_priest', 'minstrell', 'gypsy']
    const physJobs = [
      'assassin_cross',
      'sniper',
      'champion',
      'stalker',
      'mastersmith',
      'rebellion',
      'adept_novice',
    ]

    const tanks = verified.filter((m) => tankJobs.includes(m?.job || ''))
    const magic = verified.filter((m) => magicJobs.includes(m?.job || ''))
    const support = verified.filter((m) => supportJobs.includes(m?.job || ''))
    const physical = verified.filter((m) => physJobs.includes(m?.job || ''))

    const jobCounts: Record<string, number> = {}
    verified.forEach((m) => {
      if (m?.job) {
        jobCounts[m.job] = (jobCounts[m.job] || 0) + 1
      }
    })

    const advice: string[] = []
    const hpCount = jobCounts['high_priest'] || 0
    const palaCount = jobCounts['paladin'] || jobCounts['lord_knight'] || 0
    const profCount = jobCounts['professor'] || jobCounts['high_wizard'] || 0
    const bioCount = jobCounts['biochemist'] || 0

    if (hpCount < 8) {
      advice.push(
        `Butuh tambahan High Priest (saat ini ${hpCount}, rekomendasi min. 8 untuk sustain party).`,
      )
    }
    if (palaCount < 2) {
      advice.push(`Paladin/Lord Knight minim (${palaCount}, rekomendasi min. 2-3 untuk Frontline).`)
    }
    if (profCount < 2) {
      advice.push(
        `Rekomendasi rekrut Professor/High Wizard (${profCount}, penting untuk Land Protector & Dispel).`,
      )
    }
    if (bioCount < 6) {
      advice.push(
        `Rekomendasi rekrut Biochemist (${bioCount}, penting untuk Anti Break Equipment).`,
      )
    }

    if (advice.length === 0 && verified.length >= 10) {
      advice.push('✅ Komposisi role guild sangat berimbang dan siap tempur!')
    }

    return {
      tanks: { count: tanks.length, pct: Math.round((tanks.length / total) * 100) },
      physical: { count: physical.length, pct: Math.round((physical.length / total) * 100) },
      magic: { count: magic.length, pct: Math.round((magic.length / total) * 100) },
      support: { count: support.length, pct: Math.round((support.length / total) * 100) },
      jobCounts,
      advice,
    }
  }, [safeMembers])

  // 5. Tingkat Kehadiran & Aktivitas Guild
  const attendanceStats = React.useMemo(() => {
    let totalPresent = 0
    let totalAbsent = 0
    const atRiskMembers: Array<{ name: string; job: string; absent: number; rate: number }> = []

    safeMembers.forEach((m) => {
      const p = (Number(m?.woe_present_count) || 0) + (Number(m?.gl_present_count) || 0)
      const a = (Number(m?.woe_absent_count) || 0) + (Number(m?.gl_absent_count) || 0)
      totalPresent += p
      totalAbsent += a
      const totalMatches = p + a
      if (totalMatches >= 2) {
        const rate = Math.round((p / totalMatches) * 100)
        if (a >= 2 || rate < 60) {
          atRiskMembers.push({
            name: m?.name || 'Unknown',
            job: m?.job || 'novice',
            absent: a,
            rate,
          })
        }
      }
    })

    const totalMatchesAll = totalPresent + totalAbsent
    const averageRate =
      totalMatchesAll > 0 ? Math.round((totalPresent / totalMatchesAll) * 100) : 100

    return {
      averageRate,
      totalPresent,
      totalAbsent,
      atRiskMembers: atRiskMembers.sort((x, y) => y.absent - x.absent).slice(0, 5),
    }
  }, [safeMembers])

  // 6. Format Export Discord
  const generateDiscordSummary = () => {
    if (!guild) return ''
    const verified = safeMembers.filter((m) => m?.isVerified)
    const sorted = [...verified].sort(
      (a, b) => (Number(b?.pvp_score) || 0) - (Number(a?.pvp_score) || 0),
    )
    const top5 = sorted.slice(0, 5)

    const dateStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return `**ROOC GUILD TACTICAL REPORT: ${guild.name.toUpperCase()}**
*Update: ${dateStr}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**RINGKASAN GUILD**
• Total Member: ${guild.total_characters || 0} Karakter Terverifikasi
• Total PvP Score: ${Math.round(Number(guild.total_pvp_score) || 0).toLocaleString('id-ID')}
• Kehadiran Guild: ${attendanceStats.averageRate}%
• GL Record: ${guild.gl_wins || 0}W - ${guild.gl_losses || 0}L (Tren: ${guild.gl_trends || 'N/A'})

**WAR READINESS (KESIAPAN PERANG)**
• Guild League (8 Party Elite): ${glStats.filled}/${glStats.total} Slot (${glStats.percent}%) [${glStats.isFull ? 'READY' : 'BUTUH SLOT'}]${glStats.hasSub ? ` (Sub: ${glStats.subFilled}/${glStats.subTotal})` : ''}
• WoE Raid (${woeStats.raidCount} Raid, ${woeStats.partyCount} Party): ${woeStats.filled}/${woeStats.total} Slot (${woeStats.percent}%) [${woeStats.isFull ? 'READY' : 'BUTUH SLOT'}]

**KOMPOSISI ROLE & SINERGI**
• Tank: ${classComposition.tanks.count} Member (${classComposition.tanks.pct}%)
• Physical DPS: ${classComposition.physical.count} Member (${classComposition.physical.pct}%)
• Magic DPS: ${classComposition.magic.count} Member (${classComposition.magic.pct}%)
• Support/Healer: ${classComposition.support.count} Member (${classComposition.support.pct}%)
${classComposition.advice.map((adv) => `> ${adv}`).join('\n')}

**TOP 5 RANKERS**
${top5.map((c, i) => `${i + 1}. **${c.name}** (${c.job.replace(/_/g, ' ')}) — Score: ${Math.round(Number(c.pvp_score) || 0).toLocaleString('id-ID')}`).join('\n')}

**POWER TIER PYRAMID**
• S-Tier (Score ≥3500): ${powerTiers.s.count} Member (${powerTiers.s.pct}%)
• A-Tier (2800-3499): ${powerTiers.a.count} Member (${powerTiers.a.pct}%)
• B-Tier (2000-2799): ${powerTiers.b.count} Member (${powerTiers.b.pct}%)
• C-Tier (<2000): ${powerTiers.c.count} Member (${powerTiers.c.pct}%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Laporan otomatis diekspor dari RagnaTool Dashboard*`
  }

  const handleCopyDiscord = () => {
    const text = generateDiscordSummary()
    navigator.clipboard.writeText(text)
    setCopiedDiscord(true)
    setTimeout(() => setCopiedDiscord(false), 2500)
  }

  if (!guild) {
    const handleCreateGuild = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!guildName.trim()) return
      setError('')

      startTransition(async () => {
        const res = await createGuild(guildName)
        if (!res.success) {
          setError(res.error || 'Gagal mendirikan guild')
        }
      })
    }

    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-160px)] relative">
        <div
          className="rounded-2xl py-12 px-10 max-w-[480px] w-full text-center"
          style={{
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-neumorph)',
          }}
        >
          <div
            className="w-[72px] h-[72px] mx-auto mb-6 rounded-full flex items-center justify-center relative"
            style={{
              background: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-neumorph-inset)',
            }}
          >
            <svg
              className="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Buat Guild Baru
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            Anda belum memiliki guild. Daftarkan guild Anda untuk mulai mengelola roster.
          </p>
          {error && (
            <div className="text-red-300 bg-red-500/10 p-3 rounded-lg text-[13px] mb-4 border border-red-500/20">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateGuild} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nama Guild..."
              value={guildName}
              onChange={(e) => setGuildName(e.target.value)}
              className="w-full rounded-lg py-3 px-4 font-sans transition-all duration-200 outline-none"
              style={{
                background: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                color: 'var(--text-primary)',
                border: 'none',
              }}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isPending}
              className="w-full"
            >
              {isPending ? 'Membuat...' : 'Buat Guild'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  const handleToggleVerify = (char: Character) => {
    startTransition(async () => {
      const res = await toggleVerifyMember(char.id, Boolean(char.isVerified))
      if (res.success) {
        setSelectedMember((prev) => (prev ? { ...prev, isVerified: !prev.isVerified } : null))
        router.refresh()
      }
    })
  }

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Header & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            {guild.name}
          </h1>
          <p className="text-xs sm:text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Tactical Guild Management & PvP Command Center
          </p>
        </div>
        <button
          onClick={() => setIsDiscordModalOpen(true)}
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all duration-200 cursor-pointer w-fit hover:scale-102 active:scale-98"
          style={{
            background:
              'linear-gradient(135deg, rgba(88, 101, 242, 0.18), rgba(88, 101, 242, 0.08))',
            border: '1px solid rgba(88, 101, 242, 0.35)',
            color: '#5865F2',
            boxShadow: 'var(--shadow-neumorph-sm)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          Format Discord Roster
        </button>
      </div>

      {/* Stat cards */}
      <div
        id="tour-dashboard-stats"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6"
      >
        <div
          className="rounded-xl p-5 flex items-center gap-4 transition-colors"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div
            className="p-3.5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-primary)', boxShadow: 'var(--shadow-neumorph-inset)' }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-primary)' }}
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="min-w-0">
            <div
              className="text-[11px] font-medium tracking-wide mb-0.5 truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              TOTAL MEMBER VERIF
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {guild.total_characters || 0}
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-5 flex items-center gap-4 transition-colors"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div
            className="p-3.5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-primary)', boxShadow: 'var(--shadow-neumorph-inset)' }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#f59e0b' }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div
              className="text-[11px] font-medium tracking-wide mb-0.5 truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              TOTAL PVP SCORE
            </div>
            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
              {Math.round(Number(guild.total_pvp_score) || 0).toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-5 flex items-center gap-4 transition-colors"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div
            className="p-3.5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-primary)', boxShadow: 'var(--shadow-neumorph-inset)' }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#10b981' }}
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="min-w-0">
            <div
              className="text-[11px] font-medium tracking-wide mb-0.5 truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              TINGKAT KEHADIRAN
            </div>
            <div className="text-2xl font-bold" style={{ color: '#10b981' }}>
              {attendanceStats.averageRate}%
            </div>
          </div>
        </div>

        <div
          className="rounded-xl p-5 flex items-center gap-4 transition-colors"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div
            className="p-3.5 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--bg-primary)', boxShadow: 'var(--shadow-neumorph-inset)' }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-primary)' }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
          <div className="min-w-0">
            <div
              className="text-[11px] font-medium tracking-wide mb-0.5 truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              PENDING VERIFIKASI
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {members.filter((m) => !m?.isVerified).length}
            </div>
          </div>
        </div>
      </div>

      {/* Combat Power Tier Pyramid */}
      <div
        className="rounded-xl p-5 mb-8 transition-colors border"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-neumorph)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2
              className="text-sm font-bold tracking-wide uppercase"
              style={{ color: 'var(--text-primary)' }}
            >
              Distribusi Power Tier PvP
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Klasifikasi kekuatan tempur dari {powerTiers.total} member terverifikasi
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="text-amber-500">S: {powerTiers.s.count}</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span className="text-purple-400">A: {powerTiers.a.count}</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span className="text-cyan-400">B: {powerTiers.b.count}</span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span className="text-slate-400">C: {powerTiers.c.count}</span>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-gray-800/40 p-0.5 border border-white/5 mb-3">
          {powerTiers.s.pct > 0 && (
            <div
              title={`S-Tier: ${powerTiers.s.count} (${powerTiers.s.pct}%)`}
              className="h-full rounded-l-full transition-all duration-500"
              style={{
                width: `${powerTiers.s.pct}%`,
                background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
              }}
            />
          )}
          {powerTiers.a.pct > 0 && (
            <div
              title={`A-Tier: ${powerTiers.a.count} (${powerTiers.a.pct}%)`}
              className="h-full transition-all duration-500"
              style={{
                width: `${powerTiers.a.pct}%`,
                background: 'linear-gradient(90deg, #a855f7, #c084fc)',
              }}
            />
          )}
          {powerTiers.b.pct > 0 && (
            <div
              title={`B-Tier: ${powerTiers.b.count} (${powerTiers.b.pct}%)`}
              className="h-full transition-all duration-500"
              style={{
                width: `${powerTiers.b.pct}%`,
                background: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
              }}
            />
          )}
          {powerTiers.c.pct > 0 && (
            <div
              title={`C-Tier: ${powerTiers.c.count} (${powerTiers.c.pct}%)`}
              className="h-full rounded-r-full transition-all duration-500"
              style={{
                width: `${powerTiers.c.pct}%`,
                background: 'linear-gradient(90deg, #64748b, #94a3b8)',
              }}
            />
          )}
        </div>

        {/* Tier Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div
            className="p-2.5 rounded-lg text-left border"
            style={{
              background: 'rgba(245, 158, 11, 0.06)',
              borderColor: 'rgba(245, 158, 11, 0.25)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-500 inline-flex items-center gap-1.5">
                S-Tier (Core)
              </span>
              <span className="text-[11px] text-amber-400 font-semibold">{powerTiers.s.pct}%</span>
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Skor ≥3.500 ({powerTiers.s.count} Member)
            </div>
          </div>

          <div
            className="p-2.5 rounded-lg text-left border"
            style={{
              background: 'rgba(168, 85, 247, 0.06)',
              borderColor: 'rgba(168, 85, 247, 0.25)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-400 inline-flex items-center gap-1.5">
                A-Tier (Elite)
              </span>
              <span className="text-[11px] text-purple-300 font-semibold">{powerTiers.a.pct}%</span>
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Skor 2.800–3.499 ({powerTiers.a.count} Member)
            </div>
          </div>

          <div
            className="p-2.5 rounded-lg text-left border"
            style={{
              background: 'rgba(6, 182, 212, 0.06)',
              borderColor: 'rgba(6, 182, 212, 0.25)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 inline-flex items-center gap-1.5">
                B-Tier (Main)
              </span>
              <span className="text-[11px] text-cyan-300 font-semibold">{powerTiers.b.pct}%</span>
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Skor 2.000–2.799 ({powerTiers.b.count} Member)
            </div>
          </div>

          <div
            className="p-2.5 rounded-lg text-left border"
            style={{
              background: 'rgba(100, 116, 139, 0.06)',
              borderColor: 'rgba(100, 116, 139, 0.25)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 inline-flex items-center gap-1.5">
                C-Tier (Cadet)
              </span>
              <span className="text-[11px] text-slate-300 font-semibold">{powerTiers.c.pct}%</span>
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Skor &lt;2.000 ({powerTiers.c.count} Member)
            </div>
          </div>
        </div>
      </div>

      {/* War Readiness & Attendance Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Card: War Readiness */}
        <div
          className="rounded-xl p-6 transition-colors border flex flex-col justify-between"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-neumorph)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Kesiapan Perang (War Readiness)
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Status pengisian slot formasi match GL & WoE
                  </p>
                </div>
              </div>
            </div>

            {/* Guild League Slot Status */}
            <div
              className="p-3.5 rounded-xl border mb-3"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-neumorph-inset)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold text-xs inline-flex items-center gap-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Icon icon="fluent:trophy-24-filled" className="w-4 h-4 text-emerald-400" />
                    Guild League (8 Party Elite)
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      glStats.isFull
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {glStats.isFull
                      ? 'Siap Tempur'
                      : `${glStats.total - glStats.filled} Slot Kosong`}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {glStats.filled} / {glStats.total} Slot ({glStats.percent}%)
                </span>
              </div>
              <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${glStats.percent}%`,
                    background: glStats.isFull ? '#10b981' : '#f59e0b',
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                {glStats.hasSub ? (
                  <span className="text-xs font-medium text-indigo-400">
                    Sub Party: {glStats.subFilled} / {glStats.subTotal} Terisi
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Standar 40 Slot (Top 40 Main Roster)
                  </span>
                )}
                <Link
                  href="/guild-league"
                  className="font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1 ml-auto"
                >
                  Atur Formasi GL →
                </Link>
              </div>
            </div>

            {/* WoE Raid Slot Status (8 Party 1 Raid) */}
            <div
              className="p-3.5 rounded-xl border"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-neumorph-inset)',
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold text-xs inline-flex items-center gap-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <Icon icon="fluent:shield-globe-24-filled" className="w-4 h-4 text-amber-400" />
                    {woeStats.raidCount > 1
                      ? `WoE Raid (${woeStats.raidCount} Raid, ${woeStats.partyCount} Party)`
                      : 'WoE Raid (1 Raid, 8 Party)'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      woeStats.isFull
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {woeStats.isFull
                      ? 'Siap Tempur'
                      : `${woeStats.total - woeStats.filled} Slot Kosong`}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {woeStats.filled} / {woeStats.total} Member ({woeStats.percent}%)
                </span>
              </div>
              <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${woeStats.percent}%`,
                    background: woeStats.isFull ? '#10b981' : '#f59e0b',
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span style={{ color: 'var(--text-muted)' }}>
                  Standar {woeStats.total} Slot (5 Karakter / Party)
                </span>
                <Link
                  href="/woe-setup"
                  className="font-semibold text-amber-400 hover:underline inline-flex items-center gap-1 ml-auto"
                >
                  Atur Formasi WoE →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Attendance & Member Activity */}
        <div
          className="rounded-xl p-6 transition-colors border flex flex-col justify-between"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-neumorph)',
          }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Kehadiran & Keaktifan Member
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Akumulasi partisipasi match GL & WoE
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-emerald-400 leading-none">
                  {attendanceStats.averageRate}%
                </div>
                <span
                  className="text-[10px] uppercase font-semibold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Rata-rata Guild
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                className="p-3 rounded-lg text-center border"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                }}
              >
                <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Total Kehadiran
                </div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">
                  {attendanceStats.totalPresent}x
                </div>
              </div>
              <div
                className="p-3 rounded-lg text-center border"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                }}
              >
                <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Total Absen / Bolos
                </div>
                <div className="text-lg font-bold text-red-400 mt-0.5">
                  {attendanceStats.totalAbsent}x
                </div>
              </div>
            </div>

            {/* At-risk Warning or Healthy status */}
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Status Disiplin Member:
              </div>
              {attendanceStats.atRiskMembers.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {attendanceStats.atRiskMembers.map((m) => (
                    <div
                      key={m.name}
                      className="flex items-center justify-between p-2 rounded-lg border text-xs"
                      style={{
                        background: 'rgba(239, 68, 68, 0.05)',
                        borderColor: 'rgba(239, 68, 68, 0.2)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-red-400 inline-flex items-center gap-1.5">
                          <Icon
                            icon="fluent:warning-24-filled"
                            className="w-3.5 h-3.5 text-red-400"
                          />
                          {m.name}
                        </span>
                        <span
                          className="text-[10px] opacity-75 capitalize"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          ({m.job.replace(/_/g, ' ')})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-red-400">
                          {m.absent}x Absen
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">
                          {m.rate}% Hadir
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="p-3 rounded-lg border flex items-center gap-2.5 text-xs text-emerald-400"
                  style={{
                    background: 'rgba(16, 185, 129, 0.06)',
                    borderColor: 'rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    Seluruh member memiliki catatan kehadiran yang baik dan aktif berpartisipasi.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Class Composition & Synergy Advisor */}
      <div
        className="rounded-xl p-6 mb-8 transition-colors border"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-neumorph)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Komposisi Role & Sinergi Guild
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Keseimbangan Tank, DPS, dan Support untuk strategi pertempuran
              </p>
            </div>
          </div>
        </div>

        {/* 4 Role Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <div
            className="p-3.5 rounded-xl border text-left"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-neumorph-inset)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-xs font-bold inline-flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Tanker / Frontline
              </span>
              <span className="text-xs font-bold text-amber-400">
                {classComposition.tanks.pct}%
              </span>
            </div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {classComposition.tanks.count}{' '}
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                Member
              </span>
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              Paladin, Lord Knight
            </div>
          </div>

          <div
            className="p-3.5 rounded-xl border text-left"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-neumorph-inset)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-xs font-bold inline-flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Physical DPS
              </span>
              <span className="text-xs font-bold text-red-400">
                {classComposition.physical.pct}%
              </span>
            </div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {classComposition.physical.count}{' '}
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                Member
              </span>
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              SinX, Sniper, Champ, Rebel, dll.
            </div>
          </div>

          <div
            className="p-3.5 rounded-xl border text-left"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-neumorph-inset)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-xs font-bold inline-flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Magic DPS
              </span>
              <span className="text-xs font-bold text-cyan-400">{classComposition.magic.pct}%</span>
            </div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {classComposition.magic.count}{' '}
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                Member
              </span>
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              High Wizard, Prof, Biochem, dll.
            </div>
          </div>

          <div
            className="p-3.5 rounded-xl border text-left"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-neumorph-inset)',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-xs font-bold inline-flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Support / Utility
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {classComposition.support.pct}%
              </span>
            </div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {classComposition.support.count}{' '}
              <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>
                Member
              </span>
            </div>
            <div className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
              High Priest, Minstrel, Gypsy
            </div>
          </div>
        </div>

        {/* Job Breakdown Chips */}
        <div className="mb-4">
          <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
            Daftar Job dalam Guild:
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(classComposition.jobCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([job, count]) => (
                <div
                  key={job}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    boxShadow: 'var(--shadow-neumorph-sm)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Image
                    src={getJobIcon(job)}
                    alt=""
                    width={18}
                    height={18}
                    className="rounded-sm object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <span className="capitalize">{job.replace(/_/g, ' ')}</span>
                  <span className="text-amber-500 font-bold ml-0.5">({count})</span>
                </div>
              ))}
          </div>
        </div>

        {/* Tactical Advisor Box */}
        <div
          className="p-4 rounded-xl border flex flex-col gap-2"
          style={{
            background: 'rgba(59, 130, 246, 0.05)',
            borderColor: 'rgba(59, 130, 246, 0.2)',
          }}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <span>Smart Synergy Advisor:</span>
          </div>
          <div className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {classComposition.advice.map((adv, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <Icon
                  icon="fluent:arrow-right-16-filled"
                  className="w-3 h-3 text-blue-400 shrink-0 mt-0.5"
                />
                <span>{adv}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* League & Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          id="tour-dashboard-league"
          className="rounded-lg p-6 flex flex-col justify-between transition-colors lg:col-span-1"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Performa Guild League
            </h2>
          </div>

          <div className="flex justify-between items-end mb-2">
            <div className="flex flex-col gap-1">
              <div
                className="text-[36px] font-bold tracking-tight leading-none"
                style={{ color: '#10b981' }}
              >
                {guild.gl_wins || 0}{' '}
                <span className="text-[18px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Wins
                </span>
              </div>
              <div
                className="text-[20px] font-bold tracking-tight leading-none"
                style={{ color: '#ef4444' }}
              >
                {guild.gl_losses || 0}{' '}
                <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Losses
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                5 Match Terakhir
              </span>
              <div className="flex gap-1.5">
                {(guild.gl_trends || '-----')
                  .padEnd(5, '-')
                  .split('')
                  .slice(0, 5)
                  .map((result: string, i: number) => (
                    <div
                      key={i}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-bold"
                      style={{
                        background:
                          result === 'W'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : result === 'L'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'var(--bg-primary)',
                        color:
                          result === 'W'
                            ? '#10b981'
                            : result === 'L'
                              ? '#ef4444'
                              : 'var(--text-muted)',
                        boxShadow: result === '-' ? 'var(--shadow-neumorph-inset)' : 'none',
                        border:
                          result === 'W'
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : result === 'L'
                              ? '1px solid rgba(239, 68, 68, 0.3)'
                              : 'none',
                      }}
                    >
                      {result}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div
          id="tour-dashboard-performers"
          className="rounded-lg p-6 transition-colors lg:col-span-2"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Top 5 Best Performers
              </h2>
            </div>
            <div
              className="p-2 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                color: '#f59e0b',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {(() => {
              const verifiedMembers = members.filter((m) => m.isVerified)
              if (verifiedMembers.length === 0) {
                return (
                  <div
                    className="col-span-5 rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-2 border"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-neumorph-inset)',
                    }}
                  >
                    <div
                      className="mb-3 p-3 rounded-full flex items-center justify-center"
                      style={{
                        background: 'var(--bg-secondary)',
                        boxShadow: 'var(--shadow-neumorph-inset)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="18" y1="8" x2="23" y2="13" />
                        <line x1="23" y1="8" x2="18" y2="13" />
                      </svg>
                    </div>
                    <div
                      className="text-[14px] font-semibold mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Belum Ada Member Terverifikasi
                    </div>
                    <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      Harap verifikasi member di tabel manajemen roster.
                    </div>
                  </div>
                )
              }

              const rankedMembers = verifiedMembers
                .map((m) => {
                  const totalGLScore = Number(m.gl_total_score) || 0
                  return { ...m, calculatedGLScore: totalGLScore }
                })
                .sort((a, b) => b.calculatedGLScore - a.calculatedGLScore)

              const top5 = rankedMembers.slice(0, 5)
              const hasData = top5.some((char) => char.calculatedGLScore > 0)

              if (!hasData) {
                return (
                  <div
                    className="col-span-5 rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-2 border"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-neumorph-inset)',
                    }}
                  >
                    <div
                      className="mb-3 p-3 rounded-full flex items-center justify-center"
                      style={{
                        background: 'var(--bg-secondary)',
                        boxShadow: 'var(--shadow-neumorph-inset)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div
                      className="text-[14px] font-normal mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Data Report Masih Kosong
                    </div>
                  </div>
                )
              }

              return top5.map((char, index) => (
                <div
                  key={char.id}
                  className="rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-200 border relative"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: index === 0 ? 'rgba(251, 191, 36, 0.3)' : 'var(--border-color)',
                    boxShadow: 'var(--shadow-neumorph-sm)',
                  }}
                >
                  <div className="relative mb-2">
                    <Image
                      src={getJobIcon(char.job)}
                      alt=""
                      width={40}
                      height={40}
                      className="object-cover rounded-[20%] shadow-sm"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                  <div
                    className="font-semibold text-[13px] truncate w-full mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {char.name}{' '}
                    <span className="text-amber-500">
                      ({Math.round(Number(char.pvp_score) || 0).toLocaleString('id-ID')})
                    </span>
                  </div>
                  <div className="text-[18px] font-bold text-amber-400">
                    {Math.round(Number(char.calculatedGLScore) || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      </div>

      {/* Main Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6">
        <div
          id="tour-dashboard-woe"
          className="rounded-lg flex flex-col h-[600px] overflow-hidden transition-colors"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div className="p-5 flex justify-between items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
              Performa WoE
            </h2>
          </div>
          <div className="flex-1 p-5 relative flex items-center justify-center">
            {woeChartData.length === 0 ? (
              <div className="text-center" style={{ color: 'var(--text-muted)' }}>
                Belum ada data report WoE.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={woeChartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-color)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    reversed={true}
                    stroke="var(--text-secondary)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[1, 'dataMax + 1']}
                    allowDecimals={false}
                    ticks={Array.from(
                      { length: Math.max(1, ...woeChartData.map((d) => Number(d.rank) || 0)) + 1 },
                      (_, i) => i + 1,
                    )}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                    labelFormatter={(label, payload) =>
                      payload?.[0]?.payload?.tooltipTitle || label
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="rank"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: 'var(--bg-card)' }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div
          className="rounded-lg flex flex-col h-[600px] overflow-hidden transition-colors"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div className="p-5 flex justify-between items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
              Top Rank Internal
            </h2>
            <div className="flex items-center gap-3">
              <JobFilterDropdown
                value={selectedLeaderboardJob}
                onChange={(v) => {
                  setSelectedLeaderboardJob(v)
                  setLeaderboardPage(1)
                }}
                isOpen={isLbdDropdownOpen}
                onToggle={() => {
                  setIsLbdDropdownOpen(!isLbdDropdownOpen)
                  setIsRosterDropdownOpen(false)
                }}
                onClose={() => setIsLbdDropdownOpen(false)}
              />
              <LimitDropdown
                value={leaderboardLimit}
                onChange={(val) => {
                  setleaderboardLimit(val)
                  setLeaderboardPage(1)
                }}
              />
            </div>
          </div>
          <div
            className={`flex-1 overflow-y-auto relative ${leaderboardShouldScroll ? leaderboardMaxHeight : ''}`}
            style={leaderboardShouldScroll ? { maxHeight: '420px' } : {}}
          >
            <table className="w-full border-collapse text-sm">
              <thead
                className="sticky top-0 shadow-md z-10 border-b"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <tr>
                  <th
                    className="p-4 text-center font-medium w-[60px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No
                  </th>
                  <th className="p-4 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                    IGN
                  </th>
                  <th className="p-4 text-right font-medium" style={{ color: 'var(--text-muted)' }}>
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaderboard.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-8 text-center"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Belum ada member terverifikasi.
                    </td>
                  </tr>
                ) : (
                  paginatedLeaderboard.map((char, idx) => (
                    <tr
                      key={char.id}
                      className="border-b transition-colors hover:bg-white/5"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <td
                        className={`p-4 text-center font-bold ${idx === 0 && leaderboardPage === 1 ? 'text-amber-400' : ''}`}
                        style={{
                          color:
                            idx === 0 && leaderboardPage === 1 ? '#f59e0b' : 'var(--text-muted)',
                        }}
                      >
                        {(leaderboardPage - 1) * leaderboardLimit + idx + 1}
                      </td>
                      <td className="p-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {char.name}
                      </td>
                      <td className="p-4 text-right font-semibold text-amber-400">
                        {Math.round(Number(char.pvp_score) || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <Pagination
              currentPage={leaderboardPage}
              totalPages={totalLeaderboardPages}
              onPageChange={setLeaderboardPage}
            />
          </div>
        </div>
      </div>

      {/* === CARD RESOURCE === */}
      {resources.length > 0 && (
        <div
          className="rounded-lg p-6 border mt-8"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-neumorph)',
          }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            Resource Guild
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="rounded-lg p-4 border"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                }}
              >
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {resource.name}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Total
                  </span>
                  <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {resource.total_quantity}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Sisa
                  </span>
                  <span
                    className={`font-bold ${resource.remaining_quantity === 0 ? 'text-red-400' : 'text-emerald-400'}`}
                  >
                    {resource.remaining_quantity}
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-700/30 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((resource.total_quantity - resource.remaining_quantity) / resource.total_quantity) * 100}%`,
                      background:
                        resource.remaining_quantity === 0
                          ? '#ef4444'
                          : resource.remaining_quantity < resource.total_quantity / 2
                            ? '#f59e0b'
                            : '#10b981',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <CharacterDetailModal
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        footerActions={
          selectedMember ? (
            <>
              <Button
                variant="destructive"
                size="md"
                title="Hapus Karakter"
                onClick={() => {
                  if (confirm('Yakin ingin menghapus karakter ini permanen?')) {
                    startTransition(async () => {
                      const res = await deleteCharacter(selectedMember.id)
                      if (res.success) setSelectedMember(null)
                    })
                  }
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </Button>
              <Button
                variant={selectedMember.isVerified ? 'ghost' : 'success'}
                size="md"
                loading={isPending}
                className={`flex-1 sm:flex-none ${selectedMember.isVerified ? '!bg-amber-500/10 !text-amber-500 !border-amber-500/20' : ''}`}
                onClick={() => handleToggleVerify(selectedMember)}
              >
                {selectedMember.isVerified ? 'Batalkan Verifikasi' : 'Approve & Verifikasi'}
              </Button>
              <Button variant="ghost" size="md" onClick={() => setSelectedMember(null)}>
                Tutup
              </Button>
            </>
          ) : null
        }
      />

      {/* Modal Format Discord */}
      <GlobalDialog
        isOpen={isDiscordModalOpen}
        onClose={() => setIsDiscordModalOpen(false)}
        title="Salin Roster ke Discord"
        maxWidth={640}
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Teks di bawah diformat khusus menggunakan markdown Discord (lengkap dengan emoji, tebal,
            dan kutipan) agar rapi saat dibagikan ke channel briefing atau pengumuman guild kamu.
          </p>

          <div
            className="p-4 rounded-xl font-mono text-xs overflow-y-auto max-h-[320px] whitespace-pre-wrap border select-all"
            style={{
              background: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-neumorph-inset)',
            }}
          >
            {generateDiscordSummary()}
          </div>

          <div className="flex items-center justify-end gap-3 mt-2">
            <button
              onClick={() => setIsDiscordModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-colors"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              Tutup
            </button>
            <button
              onClick={handleCopyDiscord}
              className="px-5 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all duration-200 border-none flex items-center gap-2"
              style={{
                background: copiedDiscord ? '#10b981' : '#5865F2',
                color: '#ffffff',
                boxShadow: 'var(--shadow-neumorph-sm)',
              }}
            >
              {copiedDiscord ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  <span>Salin Format Discord</span>
                </>
              )}
            </button>
          </div>
        </div>
      </GlobalDialog>
    </div>
  )
}
