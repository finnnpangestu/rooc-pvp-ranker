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
import type { Character, PopulatedMember } from '@/types'
import Image from 'next/image'
import { Icon } from '@iconify/react'
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
    if (!confirm('Yakin ingin menghapus karakter ini permanen?')) return
    startTransition(async () => {
      const res = await deleteCharacter(member.id)
      if (res.success) {
        alert('Karakter berhasil dihapus!')
        onClose(true)
      } else {
        if (handleAuthError(res)) return
        alert('Gagal menghapus: ' + String(res.error))
      }
    })
  }

  useEffect(() => {
    if (member) {
      setActiveDetailTab('general')
    }
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
        : dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
      const timeLabel = isNaN(dateObj.getTime())
        ? ''
        : dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
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
    <GlobalDialog isOpen={isOpen} onClose={onClose} title={`Detail: ${member.name}`} maxWidth={800}>
      <div>
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 p-4 rounded-lg border"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-neumorph-inset)',
          }}
        >
          {/* Bagian Kiri: Info Utama */}
          <div className="flex items-center gap-4">
            <Image
              src={getJobIcon(member.job)}
              alt=""
              width={48}
              height={48}
              className="w-12 h-12 object-cover rounded-lg shadow-sm border"
              style={{ borderColor: 'var(--border-color)' }}
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
            <div>
              <div className="font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>
                {JOB_LABELS[member.job] || member.job}
              </div>
              <div className="text-sm text-amber-400 font-medium mt-1 flex items-center gap-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                PvP Score: {Math.round(Number(member?.pvp_score || 0)).toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Bagian Kanan: Info GL & Resource */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-4">
            <div className="flex flex-col items-center">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Kehadiran GL
              </span>
              <div className="flex items-center gap-1.5 text-lg font-bold">
                <span className="text-emerald-400">{member.gl_present_count || 0}</span>
                <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                  /
                </span>
                <span className="text-red-400">{member.gl_absent_count || 0}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Kehadiran WoE
              </span>
              <div className="flex items-center gap-1.5 text-lg font-bold">
                <span className="text-emerald-400">{member.woe_present_count || 0}</span>
                <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                  /
                </span>
                <span className="text-red-400">{member.woe_absent_count || 0}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10 hidden sm:block"></div>
            <div className="flex flex-col items-center">
              <span
                className="text-[11px] font-semibold uppercase tracking-wider mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                Resource
              </span>
              <span className="text-lg font-bold text-indigo-400">
                {member.total_resources || 0}
              </span>
            </div>
          </div>
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
            Riwayat Skor
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
                className="p-3 rounded-xl border flex flex-col justify-center"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                }}
              >
                <span className="text-[11px] font-semibold uppercase text-gray-400">Skor Awal</span>
                <strong className="text-base text-gray-200 mt-0.5">
                  {Math.round(
                    member.stat_history && member.stat_history.length > 0
                      ? member.stat_history[0].pvp_score
                      : Number(member.pvp_score || 0),
                  ).toLocaleString('id-ID')}
                </strong>
              </div>

              <div
                className="p-3 rounded-xl border flex flex-col justify-center"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                }}
              >
                <span className="text-[11px] font-semibold uppercase text-gray-400">
                  Skor Terkini
                </span>
                <strong className="text-base text-amber-400 mt-0.5">
                  {Math.round(Number(member.pvp_score || 0)).toLocaleString('id-ID')}
                </strong>
              </div>

              <div
                className="p-3 rounded-xl border flex flex-col justify-center"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                }}
              >
                <span className="text-[11px] font-semibold uppercase text-gray-400">
                  Total Progres
                </span>
                {(() => {
                  const hist = member.stat_history || []
                  if (hist.length < 2) {
                    return <strong className="text-base text-gray-400 mt-0.5">Baseline</strong>
                  }
                  const first = hist[0].pvp_score
                  const last = hist[hist.length - 1].pvp_score
                  const delta = last - first
                  const isPos = delta >= 0
                  return (
                    <strong
                      className={`text-base mt-0.5 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {isPos
                        ? `+${Math.round(delta).toLocaleString('id-ID')}`
                        : Math.round(delta).toLocaleString('id-ID')}
                    </strong>
                  )
                })()}
              </div>

              <div
                className="p-3 rounded-xl border flex flex-col justify-center"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                }}
              >
                <span className="text-[11px] font-semibold uppercase text-gray-400">
                  Total Snapshot
                </span>
                <strong className="text-base text-emerald-400 mt-0.5">
                  {member.stat_history ? member.stat_history.length : 0} kali
                </strong>
              </div>
            </div>

            {/* Recharts Line Chart - Hanya tampil jika perubahan minimal 2x (chartData.length >= 2), menampilkan maksimal 5 data terakhir */}
            {chartData.length >= 2 && (
              <div
                className="p-5 rounded-xl border flex flex-col gap-3 transition-colors"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph)',
                }}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                      <Icon icon="fluent:data-trending-20-regular" className="w-4 h-4" />
                    </div>
                    <div>
                      <h3
                        className="text-sm font-semibold m-0"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        Tren Perkembangan Skor (5 Terakhir)
                      </h3>
                    </div>
                  </div>
                  <div
                    className="text-[11px] px-3 py-1.5 rounded-lg border flex items-center gap-2"
                    style={{
                      background: 'var(--bg-secondary)',
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>
                      Min:{' '}
                      <strong className="text-emerald-400">
                        {Math.min(...chartData.map((d) => d.score)).toLocaleString('id-ID')}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Max:{' '}
                      <strong className="text-emerald-400">
                        {Math.max(...chartData.map((d) => d.score)).toLocaleString('id-ID')}
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
                      className="p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-white/5"
                      style={{
                        background: 'var(--bg-primary)',
                        borderColor: 'var(--border-color)',
                        boxShadow: 'var(--shadow-neumorph-inset)',
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
                              {snap.note || 'Pembaruan stats'}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {new Date(snap.date).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                            <span>
                              Job:{' '}
                              <strong className="text-gray-300">
                                {JOB_LABELS[snap.job] || snap.job}
                              </strong>
                            </span>
                            {snap.hp !== undefined && snap.hp > 0 && (
                              <span>• HP: {snap.hp.toLocaleString('id-ID')}</span>
                            )}
                            {snap.patk !== undefined && snap.patk > 0 && (
                              <span>• PATK: {snap.patk.toLocaleString('id-ID')}</span>
                            )}
                            {snap.matk !== undefined && snap.matk > 0 && (
                              <span>• MATK: {snap.matk.toLocaleString('id-ID')}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                        <div className="text-base font-bold text-amber-400">
                          {Math.round(snap.pvp_score).toLocaleString('id-ID')} pts
                        </div>
                        {prevSnap && stepDelta !== 0 && (
                          <span
                            className={`text-[11px] font-bold ${
                              stepDelta > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {stepDelta > 0
                              ? `+${Math.round(stepDelta).toLocaleString('id-ID')}`
                              : Math.round(stepDelta).toLocaleString('id-ID')}
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
                    Belum ada riwayat perkembangan tercatat
                  </p>
                  <p className="text-xs text-gray-500 m-0 mt-1">
                    Setiap kali stats karakter ini diperbarui, snapshot skor dan stat kuncinya akan
                    otomatis terekam di sini.
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
              variant="primary"
              size="md"
              onClick={() => onOpenSimulator(member)}
              className="!text-indigo-400 !border !border-indigo-500/30 hover:!text-indigo-300"
            >
              Simulasi Stat
            </Button>
          )}

          <Button variant="amber" size="md" onClick={() => setIsUpdateModalOpen(true)}>
            Edit Karakter
          </Button>

          <Button
            variant={member.isVerified ? 'ghost' : 'success'}
            size="md"
            loading={isPending}
            className={`flex-1 sm:flex-none ${member.isVerified ? '!bg-amber-500/10 !text-amber-500 !border-amber-500/20' : ''}`}
            onClick={handleToggleVerify}
          >
            {member.isVerified ? 'Batalkan Verifikasi' : 'Approve & Verifikasi'}
          </Button>

          <Button
            variant="ghost"
            size="md"
            loading={isPending}
            className="flex-1 sm:flex-none !bg-red-500/10 !text-red-500 !border-red-500/20"
            onClick={handleDelete}
          >
            Hapus Member
          </Button>

          <Button variant="ghost" size="md" onClick={() => onClose()}>
            Tutup
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
