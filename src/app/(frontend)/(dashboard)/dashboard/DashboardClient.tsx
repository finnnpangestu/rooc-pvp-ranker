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
      date: new Date(report?.match_date || new Date()).toLocaleDateString('en-US', {
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

  // 3. Komposisi Class & Smart Synergy Advisor
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
    const palaCount = jobCounts['paladin'] + jobCounts['lord_knight'] || 0
    const performer = jobCounts['minstrell'] + jobCounts['gypsy'] || 0
    const profCount = jobCounts['professor'] + jobCounts['high_wizard'] || 0
    const bioCount = jobCounts['biochemist'] || 0

    if (hpCount < 8) {
      advice.push(`High Priest needed (currently ${hpCount}, recommend min. 8 for party support).`)
    }

    if (palaCount < 2) {
      advice.push(
        `Low Paladin/Lord Knight count (currently ${palaCount}, recommend min. 2-3 for Frontline).`,
      )
    }

    if (profCount < 2) {
      advice.push(
        `Recommended to recruit Professor/High Wizard (currently ${profCount}, essential for Land Protector & Dispel).`,
      )
    }

    if (performer < 8) {
      advice.push(
        `Recommended to recruit Minstrel/Gypsy (currently ${performer}, recommend min. 8 for party support).`,
      )
    }

    if (bioCount < 6) {
      advice.push(
        `Recommended to recruit Biochemist (currently ${bioCount}, essential for Weapon/Armor Protection).`,
      )
    }

    if (advice.length === 0 && verified.length >= 10) {
      advice.push('✅ Guild role composition is well-balanced and combat-ready!')
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

    const dateStr = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return `**ROOC GUILD TACTICAL REPORT: ${guild.name.toUpperCase()}**
*Update: ${dateStr}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**GUILD SUMMARY**
• Total Members: ${guild.total_characters || 0} Verified Characters
• Total PvP Score: ${Math.round(Number(guild.total_pvp_score) || 0).toLocaleString('en-US')}
• Guild Attendance: ${attendanceStats.averageRate}%
• GL Record: ${guild.gl_wins || 0}W - ${guild.gl_losses || 0}L (Trend: ${guild.gl_trends || 'N/A'})

**WAR READINESS**
• Guild League (8 Elite Parties): ${glStats.filled}/${glStats.total} Slots (${glStats.percent}%) [${glStats.isFull ? 'READY' : 'NEEDS SLOTS'}]${glStats.hasSub ? ` (Sub: ${glStats.subFilled}/${glStats.subTotal})` : ''}
• WoE Raid (${woeStats.raidCount} Raid, ${woeStats.partyCount} Parties): ${woeStats.filled}/${woeStats.total} Slots (${woeStats.percent}%) [${woeStats.isFull ? 'READY' : 'NEEDS SLOTS'}]

**ROLE COMPOSITION & SYNERGY**
• Tank: ${classComposition.tanks.count} Members (${classComposition.tanks.pct}%)
• Physical DPS: ${classComposition.physical.count} Members (${classComposition.physical.pct}%)
• Magic DPS: ${classComposition.magic.count} Members (${classComposition.magic.pct}%)
• Support/Healer: ${classComposition.support.count} Members (${classComposition.support.pct}%)
${classComposition.advice.map((adv) => `> ${adv}`).join('\n')}

**TOP 5 RANKERS**
${top5.map((c, i) => `${i + 1}. **${c.name}** (${c.job.replace(/_/g, ' ')}) — Score: ${Math.round(Number(c.pvp_score) || 0).toLocaleString('en-US')}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*Report automatically generated from RagnaTool Dashboard*`
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
          setError(res.error || 'Failed to create guild')
        }
      })
    }

    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-160px)] relative p-4">
        <div className="rounded-3xl py-12 px-8 sm:px-10 max-w-[480px] w-full text-center apple-glass bg-white/85 dark:bg-zinc-900/85 border border-black/5 dark:border-white/10 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <svg
              className="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold tracking-tight mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Create New Guild
          </h1>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            You do not have a guild yet. Register your guild to start managing your roster and PvP
            strategies.
          </p>
          {error && (
            <div className="text-rose-500 bg-rose-500/10 p-3.5 rounded-2xl text-xs mb-5 border border-rose-500/20 font-medium">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateGuild} className="flex flex-col gap-3.5">
            <input
              type="text"
              placeholder="Guild Name..."
              value={guildName}
              onChange={(e) => setGuildName(e.target.value)}
              className="w-full rounded-2xl py-3 px-4 text-sm font-medium transition-all duration-150 outline-none bg-black/4 dark:bg-white/6 border border-black/8 dark:border-white/10 text-zinc-900 dark:text-zinc-100 focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/20"
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isPending}
              className="w-full"
            >
              {isPending ? 'Creating...' : 'Create Guild'}
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
      </div>

      {/* Stat cards - Apple Bento Grid */}
      <div
        id="tour-dashboard-stats"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        <div className="rounded-3xl p-5 flex items-center gap-4 transition-all apple-glass bg-white/70 dark:bg-zinc-900/60 border border-black/5 dark:border-white/10 shadow-sm hover:scale-[1.01]">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.04em] mb-0.5 truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              TOTAL VERIFIED MEMBERS
            </div>
            <div
              className="text-2xl font-bold tracking-tight tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {guild.total_characters || 0}
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-5 flex items-center gap-4 transition-all apple-glass bg-white/70 dark:bg-zinc-900/60 border border-black/5 dark:border-white/10 shadow-sm hover:scale-[1.01]">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.04em] mb-0.5 truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              TOTAL PVP SCORE
            </div>
            <div className="text-2xl font-bold tracking-tight tabular-nums text-amber-500 dark:text-amber-400">
              {Math.round(Number(guild.total_pvp_score) || 0).toLocaleString('en-US')}
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-5 flex items-center gap-4 transition-all apple-glass bg-white/70 dark:bg-zinc-900/60 border border-black/5 dark:border-white/10 shadow-sm hover:scale-[1.01]">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.04em] mb-0.5 truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              ATTENDANCE RATE
            </div>
            <div className="text-2xl font-bold tracking-tight tabular-nums text-emerald-500 dark:text-emerald-400">
              {attendanceStats.averageRate}%
            </div>
          </div>
        </div>

        <div className="rounded-3xl p-5 flex items-center gap-4 transition-all apple-glass bg-white/70 dark:bg-zinc-900/60 border border-black/5 dark:border-white/10 shadow-sm hover:scale-[1.01]">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-sky-500/10 text-sky-500 border border-sky-500/20">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
          <div className="min-w-0">
            <div
              className="text-[10px] font-semibold uppercase tracking-[0.04em] mb-0.5 truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              PENDING VERIFICATION
            </div>
            <div
              className="text-2xl font-bold tracking-tight tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {members.filter((m) => !m?.isVerified).length}
            </div>
          </div>
        </div>
      </div>

      {/* War Readiness & Attendance Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Card: War Readiness */}
        <div className="rounded-3xl p-6 transition-colors border border-black/5 dark:border-white/10 apple-glass bg-white/70 dark:bg-zinc-900/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    War Readiness
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Slot fulfillment status for GL & WoE match setups
                  </p>
                </div>
              </div>
            </div>

            {/* Guild League Slot Status */}
            <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 mb-3 bg-black/[0.02] dark:bg-white/[0.04]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold text-xs inline-flex items-center gap-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Guild League (8 Elite Parties)
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      glStats.isFull
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {glStats.isFull
                      ? 'Combat Ready'
                      : `${glStats.total - glStats.filled} Slots Open`}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {glStats.filled} / {glStats.total} Slots ({glStats.percent}%)
                </span>
              </div>
              <div className="w-full bg-black/10 dark:bg-gray-700/30 rounded-full h-2 overflow-hidden mb-2">
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
                    Sub Parties: {glStats.subFilled} / {glStats.subTotal} Filled
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>
                    Standard 40 Slots (Top 40 Main Roster)
                  </span>
                )}
                <Link
                  href="/guild-league"
                  className="font-semibold text-emerald-400 hover:underline inline-flex items-center gap-1 ml-auto"
                >
                  Manage GL Lineup →
                </Link>
              </div>
            </div>

            {/* WoE Raid Slot Status (8 Party 1 Raid) */}
            <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04]">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold text-xs inline-flex items-center gap-1.5"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {woeStats.raidCount > 1
                      ? `WoE Raid (${woeStats.raidCount} Raids, ${woeStats.partyCount} Parties)`
                      : 'WoE Raid (1 Raid, 8 Parties)'}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      woeStats.isFull
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {woeStats.isFull
                      ? 'Combat Ready'
                      : `${woeStats.total - woeStats.filled} Slots Open`}
                  </span>
                </div>
                <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                  {woeStats.filled} / {woeStats.total} Members ({woeStats.percent}%)
                </span>
              </div>
              <div className="w-full bg-black/10 dark:bg-gray-700/30 rounded-full h-2 overflow-hidden mb-2">
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
                  Standard ${woeStats.total} Slots (5 Characters / Party)
                </span>
                <Link
                  href="/woe-setup"
                  className="font-semibold text-amber-400 hover:underline inline-flex items-center gap-1 ml-auto"
                >
                  Manage WoE Setup →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Card: Attendance & Member Activity */}
        <div className="rounded-3xl p-6 transition-colors border border-black/5 dark:border-white/10 apple-glass bg-white/70 dark:bg-zinc-900/60 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Member Attendance & Activity
                  </h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Accumulated match participation across GL & WoE
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
                  Guild Average
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-2xl text-center border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04]">
                <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Total Attended
                </div>
                <div className="text-lg font-bold text-emerald-500 dark:text-emerald-400 mt-0.5 tabular-nums">
                  {attendanceStats.totalPresent}x
                </div>
              </div>
              <div className="p-3 rounded-2xl text-center border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04]">
                <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Total Absent
                </div>
                <div className="text-lg font-bold text-rose-500 dark:text-rose-400 mt-0.5 tabular-nums">
                  {attendanceStats.totalAbsent}x
                </div>
              </div>
            </div>

            {/* At-risk Warning or Healthy status */}
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>
                Attendance Watchlist:
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
                          {m.absent}x Absent
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-bold">
                          {m.rate}% Present
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
                    All members have excellent attendance records and participate actively.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Class Composition & Synergy Advisor */}
      <div className="rounded-3xl p-6 mb-8 transition-colors border border-black/5 dark:border-white/10 apple-glass bg-white/70 dark:bg-zinc-900/60 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                Role Composition & Guild Synergy
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Balance of Tanks, DPS, and Support for tactical warfare
              </p>
            </div>
          </div>
        </div>

        {/* 4 Role Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 text-left bg-black/[0.02] dark:bg-white/[0.03] transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-xs font-semibold tracking-tight inline-flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Tank / Frontline
              </span>
              <span className="text-xs font-bold text-amber-500 tabular-nums">
                {classComposition.tanks.pct}%
              </span>
            </div>
            <div
              className="text-2xl font-bold tracking-tight tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {classComposition.tanks.count}{' '}
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Members
              </span>
            </div>
            <div className="text-[11px] mt-1 tracking-tight" style={{ color: 'var(--text-muted)' }}>
              Paladin, Lord Knight
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 text-left bg-black/[0.02] dark:bg-white/[0.03] transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-xs font-semibold tracking-tight inline-flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Physical DPS
              </span>
              <span className="text-xs font-bold text-red-500 tabular-nums">
                {classComposition.physical.pct}%
              </span>
            </div>
            <div
              className="text-2xl font-bold tracking-tight tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {classComposition.physical.count}{' '}
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Members
              </span>
            </div>
            <div className="text-[11px] mt-1 tracking-tight" style={{ color: 'var(--text-muted)' }}>
              SinX, Sniper, Champ, Rebel, etc.
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 text-left bg-black/[0.02] dark:bg-white/[0.03] transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-xs font-semibold tracking-tight inline-flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Magic DPS
              </span>
              <span className="text-xs font-bold text-cyan-500 tabular-nums">
                {classComposition.magic.pct}%
              </span>
            </div>
            <div
              className="text-2xl font-bold tracking-tight tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {classComposition.magic.count}{' '}
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Members
              </span>
            </div>
            <div className="text-[11px] mt-1 tracking-tight" style={{ color: 'var(--text-muted)' }}>
              High Wizard, Prof, Biochem, etc.
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-black/5 dark:border-white/10 text-left bg-black/[0.02] dark:bg-white/[0.03] transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-xs font-semibold tracking-tight inline-flex items-center gap-1.5"
                style={{ color: 'var(--text-primary)' }}
              >
                Support / Utility
              </span>
              <span className="text-xs font-bold text-emerald-500 tabular-nums">
                {classComposition.support.pct}%
              </span>
            </div>
            <div
              className="text-2xl font-bold tracking-tight tabular-nums"
              style={{ color: 'var(--text-primary)' }}
            >
              {classComposition.support.count}{' '}
              <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                Members
              </span>
            </div>
            <div className="text-[11px] mt-1 tracking-tight" style={{ color: 'var(--text-muted)' }}>
              High Priest, Minstrel, Gypsy
            </div>
          </div>
        </div>

        {/* Job Breakdown Chips */}
        <div className="mb-5">
          <div
            className="text-xs font-semibold tracking-wider uppercase mb-2.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Job Breakdown in Guild
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(classComposition.jobCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([job, count]) => (
                <div
                  key={job}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black/5 dark:border-white/10 text-xs font-medium bg-black/[0.02] dark:bg-white/[0.04] hover:border-black/20 dark:hover:border-white/20 transition-all apple-press"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <Image
                    src={getJobIcon(job)}
                    alt=""
                    width={18}
                    height={18}
                    className="rounded-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <span className="capitalize">{job.replace(/_/g, ' ')}</span>
                  <span className="text-amber-500 font-bold tabular-nums ml-0.5">({count})</span>
                </div>
              ))}
          </div>
        </div>

        {/* Tactical Advisor Box */}
        <div className="p-4 rounded-2xl border border-blue-500/20 bg-blue-500/5 backdrop-blur-sm flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-500 dark:text-blue-400">
            <span className="tracking-tight">Smart Synergy Advisor</span>
          </div>
          <div className="flex flex-col gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            {classComposition.advice.map((adv, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <Icon
                  icon="fluent:arrow-right-16-filled"
                  className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5"
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
          className="rounded-3xl p-6 flex flex-col justify-between transition-colors lg:col-span-1 apple-glass border border-black/5 dark:border-white/10 shadow-sm"
        >
          <div>
            <h2
              className="text-lg font-bold tracking-tight mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              Guild League Performance
            </h2>
          </div>

          <div className="flex justify-between items-end my-4">
            <div className="flex flex-col gap-1">
              <div
                className="text-4xl font-bold tracking-tight leading-none tabular-nums"
                style={{ color: '#10b981' }}
              >
                {guild.gl_wins || 0}{' '}
                <span className="text-base font-medium" style={{ color: 'var(--text-muted)' }}>
                  Wins
                </span>
              </div>
              <div
                className="text-2xl font-bold tracking-tight leading-none tabular-nums"
                style={{ color: '#ef4444' }}
              >
                {guild.gl_losses || 0}{' '}
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                  Losses
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Last 5 Matches
              </span>
              <div className="flex gap-1.5">
                {(guild.gl_trends || '-----')
                  .padEnd(5, '-')
                  .split('')
                  .slice(0, 5)
                  .map((result: string, i: number) => (
                    <div
                      key={i}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-bold border transition-all"
                      style={{
                        background:
                          result === 'W'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : result === 'L'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'rgba(0, 0, 0, 0.04)',
                        color:
                          result === 'W'
                            ? '#10b981'
                            : result === 'L'
                              ? '#ef4444'
                              : 'var(--text-muted)',
                        borderColor:
                          result === 'W'
                            ? 'rgba(16, 185, 129, 0.3)'
                            : result === 'L'
                              ? 'rgba(239, 68, 68, 0.3)'
                              : 'var(--border-color)',
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
          className="rounded-3xl p-6 transition-colors lg:col-span-2 apple-glass border border-black/5 dark:border-white/10 shadow-sm"
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2
                className="text-lg font-bold tracking-tight mb-1"
                style={{ color: 'var(--text-primary)' }}
              >
                Top 5 Best Performers
              </h2>
            </div>
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
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
                  <div className="col-span-5 rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-2 border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03]">
                    <div className="mb-3 w-12 h-12 rounded-2xl flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.06] text-[var(--text-muted)]">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
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
                      className="text-sm font-semibold tracking-tight mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      No Verified Members Yet
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Please verify members in the roster management table.
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
                  <div className="col-span-5 rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-2 border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03]">
                    <div className="mb-3 w-12 h-12 rounded-2xl flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.06] text-[var(--text-muted)]">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div
                      className="text-sm font-semibold tracking-tight mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      No Report Data Yet
                    </div>
                  </div>
                )
              }

              return top5.map((char, index) => (
                <div
                  key={char.id}
                  className={`rounded-2xl p-3.5 flex flex-col items-center justify-center text-center transition-all duration-200 apple-press border relative ${
                    index === 0
                      ? 'bg-amber-500/10 border-amber-500/30 shadow-sm'
                      : 'bg-black/[0.02] dark:bg-white/[0.03] border-black/5 dark:border-white/10 hover:border-black/15 dark:hover:border-white/20'
                  }`}
                >
                  <div className="relative mb-2">
                    <Image
                      src={getJobIcon(char.job)}
                      alt=""
                      width={42}
                      height={42}
                      className="object-cover rounded-xl shadow-sm"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    {index === 0 && (
                      <span className="absolute -top-1.5 -right-1.5 text-xs">👑</span>
                    )}
                  </div>
                  <div
                    className="font-semibold text-[13px] tracking-tight truncate w-full mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {char.name}{' '}
                    <span className="text-amber-500 font-bold tabular-nums">
                      ({Math.round(Number(char.pvp_score) || 0).toLocaleString('en-US')})
                    </span>
                  </div>
                  <div className="text-lg font-bold text-amber-500 dark:text-amber-400 tabular-nums">
                    {Math.round(Number(char.calculatedGLScore) || 0).toLocaleString('en-US')}
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
          className="rounded-3xl flex flex-col h-[600px] overflow-hidden transition-colors apple-glass border border-black/5 dark:border-white/10 shadow-sm"
        >
          <div className="p-6 flex justify-between items-center gap-3 flex-wrap border-b border-black/5 dark:border-white/10">
            <h2
              className="text-lg font-bold tracking-tight m-0"
              style={{ color: 'var(--text-primary)' }}
            >
              WoE Performance
            </h2>
          </div>
          <div className="flex-1 p-5 relative flex items-center justify-center">
            {woeChartData.length === 0 ? (
              <div
                className="text-center text-sm font-medium"
                style={{ color: 'var(--text-muted)' }}
              >
                No WoE report data yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={woeChartData}
                  accessibilityLayer={false}
                  margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                >
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
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
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

        <div className="rounded-3xl flex flex-col h-[600px] overflow-hidden transition-colors apple-glass border border-black/5 dark:border-white/10 shadow-sm">
          <div className="p-6 flex justify-between items-center gap-3 flex-wrap border-b border-black/5 dark:border-white/10">
            <h2
              className="text-lg font-bold tracking-tight m-0"
              style={{ color: 'var(--text-primary)' }}
            >
              Internal Leaderboard
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
              <thead className="sticky top-0 z-10 border-b backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-black/5 dark:border-white/10">
                <tr>
                  <th
                    className="p-4 text-center text-xs font-semibold uppercase tracking-wider w-[60px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No
                  </th>
                  <th
                    className="p-4 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    IGN
                  </th>
                  <th
                    className="p-4 text-right text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaderboard.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-8 text-center text-sm font-medium"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      No verified members yet.
                    </td>
                  </tr>
                ) : (
                  paginatedLeaderboard.map((char, idx) => (
                    <tr
                      key={char.id}
                      className="border-b transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.04]"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <td
                        className={`p-4 text-center font-bold tabular-nums ${idx === 0 && leaderboardPage === 1 ? 'text-amber-500' : ''}`}
                        style={{
                          color:
                            idx === 0 && leaderboardPage === 1 ? '#f59e0b' : 'var(--text-muted)',
                        }}
                      >
                        {(leaderboardPage - 1) * leaderboardLimit + idx + 1}
                      </td>
                      <td
                        className="p-4 font-semibold tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {char.name}
                      </td>
                      <td className="p-4 text-right font-bold tabular-nums text-amber-500 dark:text-amber-400">
                        {Math.round(Number(char.pvp_score) || 0).toLocaleString('en-US')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-black/5 dark:border-white/10">
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
        <div className="rounded-3xl p-6 border border-black/5 dark:border-white/10 apple-glass mt-8 shadow-sm">
          <h2
            className="text-lg font-bold tracking-tight mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Guild Resources
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className="rounded-2xl p-4 border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
              >
                <div
                  className="text-sm font-semibold tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {resource.name}
                </div>
                <div className="flex justify-between items-center mt-1.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Total
                  </span>
                  <span className="font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {resource.total_quantity}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Remaining
                  </span>
                  <span
                    className={`font-bold tabular-nums ${resource.remaining_quantity === 0 ? 'text-red-500' : 'text-emerald-500'}`}
                  >
                    {resource.remaining_quantity}
                  </span>
                </div>
                <div className="mt-2.5 w-full bg-black/10 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(resource.remaining_quantity / resource.total_quantity) * 100}%`,
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
                title="Delete Character"
                onClick={() => {
                  if (confirm('Are you sure you want to permanently delete this character?')) {
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
                {selectedMember.isVerified ? 'Revoke Verification' : 'Approve & Verify'}
              </Button>
              <Button variant="ghost" size="md" onClick={() => setSelectedMember(null)}>
                Close
              </Button>
            </>
          ) : null
        }
      />
    </div>
  )
}
