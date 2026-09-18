'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { GlobalDialog } from './GlobalDialog'
import { TabBar, TabButton } from './TabBar'
import { StatCard } from './StatCard'
import { Button } from './Button'
import { handleAuthError } from './SessionExpiredDialog'
import { MemberUpdateDialog } from './MemberUpdateDialog'
import { toggleVerifyMember } from '@/actions/dashboard/toggleVerifyMember'
import { deleteCharacter } from '@/actions/dashboard/deleteCharacter'
import { JOB_LABELS } from '@/const/JobLabels'
import type { Character, PopulatedMember, CharacterStatsInput } from '@/types'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { HexagonRadarChart } from './HexagonRadarChart'
import { calculateHexagonStats } from '@/utils/calculatePvPScore'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const getJobIcon = (job: string) => `/icons/jobs/${job}.png`

interface ChartDataPoint {
  name: string
  tooltipTitle: string
  score: number
  job: string
}

interface CharacterDetailModalProps {
  member: Character | PopulatedMember | null
  isOpen: boolean
  onClose: (isUpdated?: boolean) => void
  footerActions?: React.ReactNode
  onOpenSimulator?: (member: Character | PopulatedMember) => void
}

export function CharacterDetailModal({
  member,
  isOpen,
  onClose,
  footerActions,
  onOpenSimulator,
}: CharacterDetailModalProps) {
  const [activeDetailTab, setActiveDetailTab] = useState('general')
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleToggleVerify = () => {
    if (!member) return
    startTransition(async () => {
      const res = await toggleVerifyMember(member.id, Boolean(member.isVerified))
      if (res.success) {
        onClose(true)
      }
    })
  }

  const handleDelete = () => {
    if (!member) return
    if (!confirm('Are you sure you want to permanently delete this character?')) return
    startTransition(async () => {
      const res = await deleteCharacter(member.id)
      if (res.success) {
        alert('Character deleted successfully!')
        onClose(true)
      } else {
        if (handleAuthError(res)) return
        alert('Failed to delete: ' + String(res.error))
      }
    })
  }

  useEffect(() => {
    if (member) {
      setActiveDetailTab('general')
    }
  }, [member])

  const hexStats = React.useMemo(() => {
    if (!member) return null
    return calculateHexagonStats(member as unknown as CharacterStatsInput)
  }, [member])

  const chartData = React.useMemo<ChartDataPoint[]>(() => {
    if (!member?.stat_history || member.stat_history.length <= 1) return []
    const totalCount = member.stat_history.length
    const recent = member.stat_history.slice(-5)
    const startIndex = totalCount - recent.length
    return recent.map((item, idx) => {
      const origIdx = startIndex + idx + 1
      const dateObj = new Date(item.date)
      const dateLabel = isNaN(dateObj.getTime())
        ? `#${origIdx}`
        : dateObj.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
      const timeLabel = isNaN(dateObj.getTime())
        ? ''
        : dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      return {
        name: dateLabel,
        tooltipTitle: `#${origIdx} • ${dateLabel}${timeLabel ? `, ${timeLabel}` : ''}`,
        score: Math.round(Number(item.pvp_score) || 0),
        job: JOB_LABELS[item.job] || item.job,
      }
    })
  }, [member?.stat_history])

  if (!member) return null

  return (
    <GlobalDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Details: ${member.name}`}
      maxWidth={800}
    >
      <div>
        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6 p-5 rounded-3xl border transition-colors bg-black/[0.02] dark:bg-white/[0.04] backdrop-blur-xl"
          style={{
            borderColor: 'var(--border-color)',
          }}
        >
          {/* Bagian Kiri: Info Utama Karakter & Kehadiran/Resource */}
          <div className="flex flex-col gap-3 flex-1 w-full sm:w-auto">
            {/* Header Nama & Job */}
            <div className="flex items-center gap-3.5">
              <Image
                src={getJobIcon(member.job)}
                alt=""
                width={48}
                height={48}
                className="w-12 h-12 object-cover rounded-2xl shadow-sm border shrink-0"
                style={{ borderColor: 'var(--border-color)' }}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div>
                <div
                  className="font-bold text-lg tracking-tight"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {member.name}
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {JOB_LABELS[member.job] || member.job}
                </div>
                <div className="text-xs text-amber-500 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1.5 tabular-nums">
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  PvP Score: {Math.round(Number(member?.pvp_score || 0)).toLocaleString('en-US')}
                </div>
              </div>
            </div>

            {/* Kolom Vertikal: Kehadiran GL, WoE & Resource (Di Bawah Nama & Skor) */}
            <div
              className="flex flex-col gap-1.5 pt-2.5 border-t w-full max-w-sm"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-colors bg-black/[0.03] dark:bg-white/[0.05]"
                style={{
                  borderColor: 'var(--border-color)',
                }}
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.03em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  GL Attendance
                </span>
                <div className="flex items-center gap-1 text-sm font-bold tabular-nums">
                  <span className="text-emerald-500 dark:text-emerald-400">
                    {member.gl_present_count || 0}
                  </span>
                  <span className="text-xs font-normal opacity-40">/</span>
                  <span className="text-rose-500 dark:text-red-400">
                    {member.gl_absent_count || 0}
                  </span>
                </div>
              </div>

              <div
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-colors bg-black/[0.03] dark:bg-white/[0.05]"
                style={{
                  borderColor: 'var(--border-color)',
                }}
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.03em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  WoE Attendance
                </span>
                <div className="flex items-center gap-1 text-sm font-bold tabular-nums">
                  <span className="text-emerald-500 dark:text-emerald-400">
                    {member.woe_present_count || 0}
                  </span>
                  <span className="text-xs font-normal opacity-40">/</span>
                  <span className="text-rose-500 dark:text-red-400">
                    {member.woe_absent_count || 0}
                  </span>
                </div>
              </div>

              <div
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-colors bg-black/[0.03] dark:bg-white/[0.05]"
                style={{
                  borderColor: 'var(--border-color)',
                }}
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-[0.03em]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Resources
                </span>
                <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400 tabular-nums">
                  {member.total_resources || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Bagian Kanan: Hexagon Radar Chart (Hoverable, Tanpa Icon & Tanpa 6 Kotak Bawah) */}
          {hexStats && (
            <div className="flex items-center justify-center shrink-0 w-full sm:w-auto">
              <HexagonRadarChart
                data={hexStats}
                label={member.name}
                color="#10b981"
                size={220}
                showIcons={false}
                showLegend={false}
                showSummaryCards={false}
              />
            </div>
          )}
        </div>

        <TabBar className="mb-6">
          <TabButton
            isActive={activeDetailTab === 'general'}
            onClick={() => setActiveDetailTab('general')}
          >
            General
          </TabButton>
          <TabButton
            isActive={activeDetailTab === 'quasi'}
            onClick={() => setActiveDetailTab('quasi')}
          >
            Quasi
          </TabButton>
          <TabButton
            isActive={activeDetailTab === 'special'}
            onClick={() => setActiveDetailTab('special')}
          >
            Special
          </TabButton>
          <TabButton
            isActive={activeDetailTab === 'history'}
            onClick={() => setActiveDetailTab('history')}
          >
            Score History
          </TabButton>
        </TabBar>

        <div className={activeDetailTab === 'general' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
            <StatCard label="Max HP" value={member.max_hp} />
            <StatCard label="PATK" value={member.patk} />
            <StatCard label="MATK" value={member.matk} />
            <StatCard label="PDEF" value={member.pdef} />
            <StatCard label="MDEF" value={member.mdef} />
            <StatCard label="Refine PATK" value={member.refine_patk} />
            <StatCard label="Refine MATK" value={member.refine_matk} />
            <StatCard label="Refine PDEF" value={member.refine_pdef} />
            <StatCard label="Refine MDEF" value={member.refine_mdef} />
            <StatCard label="HIT" value={member.hit} />
            <StatCard label="FLEE" value={member.flee} />
          </div>
        </div>

        <div className={activeDetailTab === 'quasi' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
            <StatCard label="ASPD" value={member.aspd} isPercent />
            <StatCard label="Movement SPD" value={member.mspd} isPercent />
            <StatCard label="Variable CT" value={member.variable_cast} isPercent />
            <StatCard label="Fixed CT" value={member.fixed_cast} isPercent />
            <StatCard label="Healing Done" value={member.healing_done} isPercent />
            <StatCard label="Healing Taken" value={member.healing_taken} isPercent />
            <StatCard label="CRIT" value={member.critical} />
            <StatCard label="CRIT DMG" value={member.critical_damage} isPercent />
            <StatCard label="CRIT RES" value={member.critical_reduction} />
            <StatCard label="CRIT DMG RES" value={member.critical_damage_reduction} isPercent />
            <StatCard label="PDMG" value={member.pdmg} isPercent />
            <StatCard label="MDMG" value={member.mdmg} isPercent />
            <StatCard label="PDMG.R" value={member.pdmg_reduction} isPercent />
            <StatCard label="MDMG.R" value={member.mdmg_reduction} isPercent />
            <StatCard label="Ignore PDEF" value={member.ignore_pdef} />
            <StatCard label="Ignore MDEF" value={member.ignore_mdef} />
            <StatCard label="PDMG Bonus" value={member.pdmg_bonus} />
            <StatCard label="MDMG Bonus" value={member.mdmg_bonus} />
            <StatCard label="PvP DMG Bonus" value={member.pvp_dmg_bonus} />
            <StatCard label="PvP DMG Red" value={member.pvp_dmg_reduction} />
          </div>
        </div>

        <div className={activeDetailTab === 'special' ? 'block' : 'hidden'}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
            <StatCard label="Max HP %" value={member.max_hp_percentage} isPercent />
            <StatCard label="Equip PATK %" value={member.equipment_patk_percentage} isPercent />
            <StatCard label="Equip MATK %" value={member.equipment_matk_percentage} isPercent />
            <StatCard label="Equip PDEF %" value={member.equipment_pdef_percentage} isPercent />
            <StatCard label="Equip MDEF %" value={member.equipment_mdef_percentage} isPercent />
            <StatCard label="DMG vs Demi" value={member.dmg_vs_demi_human} isPercent />
            <StatCard label="DMG Red vs Demi" value={member.dmg_reduction_demi_human} isPercent />
            <StatCard label="DMG vs Medium" value={member.dmg_vs_medium} isPercent />
            <StatCard label="DMG Red vs Medium" value={member.dmg_reduction_medium} isPercent />
            <StatCard label="Neutral Bonus" value={member.neutral_dmg_bonus} isPercent />
            <StatCard label="Neutral Red" value={member.neutral_dmg_reduction} isPercent />
            <StatCard label="DMG vs Fire" value={member.fire_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Fire" value={member.fire_dmg_reduction} isPercent />
            <StatCard label="DMG vs Water" value={member.water_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Water" value={member.water_dmg_reduction} isPercent />
            <StatCard label="DMG vs Wind" value={member.wind_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Wind" value={member.wind_dmg_reduction} isPercent />
            <StatCard label="DMG vs Earth" value={member.earth_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Earth" value={member.earth_dmg_reduction} isPercent />
            <StatCard label="DMG vs Ghost" value={member.ghost_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Ghost" value={member.ghost_dmg_reduction} isPercent />
            <StatCard label="DMG vs Holy" value={member.holy_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Holy" value={member.holy_dmg_reduction} isPercent />
            <StatCard label="DMG vs Poison" value={member.poison_dmg_bonus} isPercent />
            <StatCard label="DMG Red vs Poison" value={member.poison_dmg_reduction} isPercent />
          </div>
        </div>

        {/* Tab Riwayat Perkembangan Skor */}
        <div className={activeDetailTab === 'history' ? 'block' : 'hidden'}>
          <div className="space-y-4 mb-6 max-h-[420px] overflow-y-auto pr-2">
            {/* Metric Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div
                className="p-3.5 rounded-2xl border flex flex-col justify-center bg-black/[0.03] dark:bg-white/[0.05]"
                style={{
                  borderColor: 'var(--border-color)',
                }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Initial Score
                </span>
                <strong
                  className="text-base mt-0.5 tabular-nums"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {Math.round(
                    member.stat_history && member.stat_history.length > 0
                      ? member.stat_history[0].pvp_score
                      : Number(member.pvp_score || 0),
                  ).toLocaleString('en-US')}
                </strong>
              </div>

              <div
                className="p-3.5 rounded-2xl border flex flex-col justify-center bg-black/[0.03] dark:bg-white/[0.05]"
                style={{
                  borderColor: 'var(--border-color)',
                }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Current Score
                </span>
                <strong className="text-base text-amber-500 dark:text-amber-400 mt-0.5 tabular-nums">
                  {Math.round(Number(member.pvp_score || 0)).toLocaleString('en-US')}
                </strong>
              </div>

              <div
                className="p-3.5 rounded-2xl border flex flex-col justify-center bg-black/[0.03] dark:bg-white/[0.05]"
                style={{
                  borderColor: 'var(--border-color)',
                }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Total Progress
                </span>
                {(() => {
                  const hist = member.stat_history || []
                  if (hist.length < 2) {
                    return <strong className="text-base text-zinc-400 mt-0.5">Baseline</strong>
                  }
                  const first = hist[0].pvp_score
                  const last = hist[hist.length - 1].pvp_score
                  const delta = last - first
                  const isPos = delta >= 0
                  return (
                    <strong
                      className={`text-base mt-0.5 tabular-nums flex items-center gap-1 ${isPos ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}
                    >
                      {isPos && <Icon icon="fluent:arrow-up-12-filled" className="w-3.5 h-3.5 shrink-0" />}
                      <span>
                        {isPos
                          ? `+${Math.round(delta).toLocaleString('en-US')}`
                          : Math.round(delta).toLocaleString('en-US')}
                      </span>
                    </strong>
                  )
                })()}
              </div>

              <div
                className="p-3.5 rounded-2xl border flex flex-col justify-center bg-black/[0.03] dark:bg-white/[0.05]"
                style={{
                  borderColor: 'var(--border-color)',
                }}
              >
                <span
                  className="text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Total Snapshots
                </span>
                <strong className="text-base text-emerald-500 dark:text-emerald-400 mt-0.5 tabular-nums">
                  {member.stat_history ? member.stat_history.length : 0} time(s)
                </strong>
              </div>
            </div>

            {/* Recharts Line Chart - Only displayed if >= 2 points, showing max 5 latest */}
            {chartData.length >= 2 && (
              <div className="p-5 rounded-2xl sm:rounded-3xl border border-black/10 dark:border-white/10 flex flex-col gap-3 transition-colors bg-black/[0.02] dark:bg-white/[0.03] shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                      <Icon icon="fluent:data-trending-20-regular" className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold m-0 text-zinc-900 dark:text-zinc-100">
                        Score Growth Trend (Last 5)
                      </h3>
                    </div>
                  </div>
                  <div className="text-[11px] px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.04] dark:bg-white/[0.06] text-zinc-600 dark:text-zinc-300 flex items-center gap-2 shadow-xs font-medium">
                    <span>
                      Min:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {Math.min(...chartData.map((d) => d.score)).toLocaleString('en-US')}
                      </strong>
                    </span>
                    <span className="opacity-40">•</span>
                    <span>
                      Max:{' '}
                      <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {Math.max(...chartData.map((d) => d.score)).toLocaleString('en-US')}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="w-full h-[230px] pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
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
                        stroke="var(--text-secondary)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        domain={['dataMin - 150', 'dataMax + 150']}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--bg-card)',
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)',
                          borderRadius: '12px',
                          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
                        }}
                        itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                        labelFormatter={(label, payload) =>
                          payload?.[0]?.payload?.tooltipTitle || label
                        }
                      />
                      <Line
                        type="monotone"
                        name="PvP Score"
                        dataKey="score"
                        stroke="#10b981"
                        strokeWidth={4}
                        dot={{ fill: '#10b981', r: 6, strokeWidth: 2, stroke: 'var(--bg-card)' }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* List Riwayat / Timeline */}
            <div className="space-y-3">
              {member.stat_history && member.stat_history.length > 0 ? (
                [...member.stat_history].reverse().map((snap, idx, arr) => {
                  const originalIdx = member.stat_history ? member.stat_history.length - idx : 1
                  const prevSnap = arr[idx + 1]
                  const stepDelta = prevSnap ? snap.pvp_score - prevSnap.pvp_score : 0

                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors bg-black/[0.02] dark:bg-white/[0.04] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
                      style={{
                        borderColor: 'var(--border-color)',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-xs font-bold text-emerald-400 shrink-0 mt-0.5">
                          #{originalIdx}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className="text-sm font-semibold"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {snap.note || 'Stats update'}
                            </span>
                            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                              {new Date(snap.date).toLocaleDateString('en-US', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div
                            className="text-xs mt-1 flex items-center gap-2 flex-wrap"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <span>
                              Job:{' '}
                              <strong style={{ color: 'var(--text-primary)' }}>
                                {JOB_LABELS[snap.job] || snap.job}
                              </strong>
                            </span>
                            {snap.hp !== undefined && snap.hp > 0 && (
                              <span>• HP: {snap.hp.toLocaleString('en-US')}</span>
                            )}
                            {snap.patk !== undefined && snap.patk > 0 && (
                              <span>• PATK: {snap.patk.toLocaleString('en-US')}</span>
                            )}
                            {snap.matk !== undefined && snap.matk > 0 && (
                              <span>• MATK: {snap.matk.toLocaleString('en-US')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                        <div className="text-base font-bold text-amber-400">
                          {Math.round(snap.pvp_score).toLocaleString('en-US')} pts
                        </div>
                        {prevSnap && stepDelta !== 0 && (
                          <span
                            className={`text-[11px] font-bold flex items-center gap-0.5 ${
                              stepDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {stepDelta > 0 && <Icon icon="fluent:arrow-up-12-filled" className="w-3 h-3 shrink-0" />}
                            <span>
                              {stepDelta > 0
                                ? `+${Math.round(stepDelta).toLocaleString('en-US')}`
                                : Math.round(stepDelta).toLocaleString('en-US')}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div
                  className="p-6 rounded-xl border text-center"
                  style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
                >
                  <Icon
                    icon="fluent:history-24-regular"
                    className="w-8 h-8 text-gray-500 mx-auto mb-2"
                  />
                  <p className="text-sm font-semibold text-gray-300 m-0">
                    No score growth history recorded yet
                  </p>
                  <p className="text-xs text-gray-500 m-0 mt-1">
                    Whenever this character's stats are updated, a snapshot of their score and key
                    stats will automatically be recorded here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className="flex justify-end gap-3 mt-4 pt-5 border-t flex-wrap"
          style={{ borderColor: 'var(--border-color)' }}
        >
          {footerActions}

          {onOpenSimulator && (
            <Button
              variant="ghost"
              size="md"
              onClick={() => onOpenSimulator(member)}
              className="text-indigo-600 dark:text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10"
            >
              Compare Member
            </Button>
          )}

          <Button variant="amber" size="md" onClick={() => setIsUpdateModalOpen(true)}>
            Edit Character
          </Button>

          <Button
            variant={member.isVerified ? 'ghost' : 'success'}
            size="md"
            loading={isPending}
            className={`flex-1 sm:flex-none ${member.isVerified ? 'text-amber-600 dark:text-amber-400 border-amber-500/30' : ''}`}
            onClick={handleToggleVerify}
          >
            {member.isVerified ? 'Revoke Verification' : 'Approve & Verify'}
          </Button>

          <Button
            variant="danger"
            size="md"
            loading={isPending}
            className="flex-1 sm:flex-none"
            onClick={handleDelete}
          >
            Delete Member
          </Button>

          <Button variant="ghost" size="md" onClick={() => onClose()}>
            Close
          </Button>
        </div>
      </div>

      <MemberUpdateDialog
        character={member}
        isOpen={isUpdateModalOpen}
        onClose={(isUpdated) => {
          setIsUpdateModalOpen(false)
          if (isUpdated) {
            onClose(true)
          }
        }}
      />
    </GlobalDialog>
  )
}
