'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { GlobalDialog } from '../../components/GlobalDialog'
import { CharacterDetailModal } from '../../components/CharacterDetailModal'
import { Button } from '../../components/Button'
import { Pagination } from '../../components/Pagination'
import { handleAuthError } from '../../components/SessionExpiredDialog'
import { saveReportGL } from '@/actions/guild/saveReportGL'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { useRouter } from 'next/navigation'
import type {
  Guild,
  PartySetup,
  ReportGl,
  Party,
  PartySlot,
  PartySlotCharacter,
  MemberMatchReport,
  Character,
} from '@/types'

interface ReportGLClientProps {
  guild: Guild
  initialSetup: PartySetup | null
  historyReports: ReportGl[]
  members?: Character[]
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`
const clone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj))

const REPORT_LIMIT = 14
const RANKING_LIMIT = 10

export function ReportGLClient({
  guild,
  initialSetup,
  historyReports,
  members = [],
}: ReportGLClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeReport, setActiveReport] = useState<Partial<ReportGl> | null>(null)
  const [viewReport, setViewReport] = useState<ReportGl | null>(null)
  const [localMembers, setLocalMembers] = useState<Character[]>(members)
  const [viewedMember, setViewedMember] = useState<Character | null>(null)
  const router = useRouter()

  const [reportName, setReportName] = useState('')
  const [matchStatus, setMatchStatus] = useState<'win' | 'loss'>('win')
  const [matchScore, setMatchScore] = useState<number | null>(null)

  const [localSetup, setLocalSetup] = useState<PartySetup | null>(null)
  const [memberData, setMemberData] = useState<
    Record<string, { is_present: boolean; actual_score: number | null }>
  >({})
  const [isSaving, setIsSaving] = useState(false)

  const [swapTargetParty, setSwapTargetParty] = useState<Record<string, string>>({})
  const [swapTargetChar, setSwapTargetChar] = useState<Record<string, string>>({})
  const [isDropdownLoading, setIsDropdownLoading] = useState<Record<string, boolean>>({})

  // Pagination states
  const [reportPage, setReportPage] = useState(1)
  const [rankingPage, setRankingPage] = useState(1)

  // Ranking members dari seluruh history reports
  const rankingMembers = useMemo(() => {
    const rankMap: Record<
      string,
      { name: string; job: string; total: number; charObj: Character | null }
    > = {}
    historyReports.forEach((report) => {
      ;(report.member_reports || []).forEach((mr: MemberMatchReport) => {
        const charId = typeof mr.character_id === 'string' ? mr.character_id : mr.character_id?.id
        if (!charId) return
        if (!rankMap[charId]) {
          const resolved = localMembers.find((m) => m.id === charId) || null
          const charName =
            resolved?.name ||
            (typeof mr.character_id === 'object' && mr.character_id?.name
              ? mr.character_id.name
              : 'Unknown')
          const charJob =
            resolved?.job ||
            (typeof mr.character_id === 'object' && mr.character_id?.job ? mr.character_id.job : '')
          rankMap[charId] = {
            name: charName,
            job: charJob,
            total: 0,
            charObj: resolved,
          }
        }
        rankMap[charId].total += Number(mr.actual_score || mr.score || 0)
      })
    })
    return Object.values(rankMap)
      .filter((m) => m.total > 0)
      .sort((a, b) => b.total - a.total)
  }, [historyReports, localMembers])

  // Paginate reports (newest first)
  const sortedReports = useMemo(() => {
    return [...historyReports].sort(
      (a, b) => new Date(b.match_date || '').getTime() - new Date(a.match_date || '').getTime(),
    )
  }, [historyReports])

  const totalReportPages = Math.ceil(sortedReports.length / REPORT_LIMIT)
  const paginatedReports = sortedReports.slice(
    (reportPage - 1) * REPORT_LIMIT,
    reportPage * REPORT_LIMIT,
  )

  // Paginate ranking
  const totalRankingPages = Math.ceil(rankingMembers.length / RANKING_LIMIT)
  const paginatedRanking = rankingMembers.slice(
    (rankingPage - 1) * RANKING_LIMIT,
    rankingPage * RANKING_LIMIT,
  )

  const handleStartReport = () => {
    if (!reportName.trim()) return alert('Nama report wajib diisi')
    if (!initialSetup) return alert('Party Setup belum dibentuk')

    const setupClone = clone(initialSetup)
    const initialMemberData: Record<string, { is_present: boolean; actual_score: number }> = {}

    const hydrateAndInitParties = (parties: Party[], type: 'elite' | 'sub') =>
      parties.map((p, pIdx) => {
        const defaultName = type === 'elite' ? `Elite Party ${pIdx + 1}` : `Sub Party ${pIdx + 1}`
        const pName = p.name || p.party_name || defaultName
        return {
          ...p,
          name: pName,
          party_name: pName,
          slots: (p.slots || []).map((s) => {
            if (!s.assigned_character) return s
            const charId =
              typeof s.assigned_character === 'object'
                ? s.assigned_character.id
                : s.assigned_character
            if (charId) {
              initialMemberData[charId] = { is_present: false, actual_score: 0 }
            }
            const charObj =
              typeof s.assigned_character === 'object'
                ? s.assigned_character
                : localMembers.find((m) => m.id === charId) || s.assigned_character
            return {
              ...s,
              assigned_character: charObj,
            }
          }),
        }
      })

    if (setupClone.elite_parties) {
      setupClone.elite_parties = hydrateAndInitParties(setupClone.elite_parties, 'elite')
    }
    if (setupClone.sub_parties) {
      setupClone.sub_parties = hydrateAndInitParties(setupClone.sub_parties, 'sub')
    }

    setMemberData(initialMemberData)
    setLocalSetup(setupClone)
    setActiveReport({
      report_name: reportName,
      match_status: matchStatus,
      match_score: matchScore != null ? String(matchScore) : '0',
    })
    setIsModalOpen(false)
  }

  const flattenedMembers = useMemo(() => {
    if (!localSetup) return []
    const members: {
      char: PartySlotCharacter | Character
      partyType: 'elite' | 'sub'
      pIdx: number
      sIdx: number
      partyName: string
    }[] = []

    const extract = (parties: Party[], type: 'elite' | 'sub') => {
      parties.forEach((p, pIdx) => {
        const defaultName = type === 'elite' ? `Elite Party ${pIdx + 1}` : `Sub Party ${pIdx + 1}`
        const partyName = p.name || p.party_name || defaultName

        p.slots.forEach((s, sIdx) => {
          if (s.assigned_character) {
            const charObj =
              typeof s.assigned_character === 'object'
                ? s.assigned_character
                : localMembers.find((m) => m.id === s.assigned_character) || null
            if (charObj) {
              members.push({
                char: charObj,
                partyType: type,
                pIdx,
                sIdx,
                partyName,
              })
            }
          }
        })
      })
    }

    extract(localSetup.elite_parties || [], 'elite')
    extract(localSetup.sub_parties || [], 'sub')
    return members
  }, [localSetup, localMembers])

  const availableParties = useMemo(() => {
    if (!localSetup) return []
    const parties: {
      id: string
      name: string
      type: 'elite' | 'sub'
      pIdx: number
      memberCount: number
      slots: PartySlot[]
    }[] = []

    localSetup.elite_parties?.forEach((p: Party, pIdx: number) => {
      const name = p.name || p.party_name || `Elite Party ${pIdx + 1}`
      parties.push({
        id: `elite-${pIdx}`,
        name,
        type: 'elite',
        pIdx,
        memberCount: p.slots.filter((s: PartySlot) => s.assigned_character).length,
        slots: p.slots,
      })
    })
    localSetup.sub_parties?.forEach((p: Party, pIdx: number) => {
      const name = p.name || p.party_name || `Sub Party ${pIdx + 1}`
      parties.push({
        id: `sub-${pIdx}`,
        name,
        type: 'sub',
        pIdx,
        memberCount: p.slots.filter((s: PartySlot) => s.assigned_character).length,
        slots: p.slots,
      })
    })
    return parties
  }, [localSetup])

  const handleSwapExecute = (
    sourceCharId: string,
    sourcePartyType: string,
    sourcePIdx: number,
    sourceSIdx: number,
  ) => {
    const targetPartyId = swapTargetParty[sourceCharId]
    if (!targetPartyId) return

    const targetParty = availableParties.find((p) => p.id === targetPartyId)
    if (!targetParty) return

    setIsDropdownLoading((prev) => ({ ...prev, [sourceCharId]: true }))

    setTimeout(() => {
      if (!localSetup) return
      const newSetup = clone(localSetup)
      const sParties = sourcePartyType === 'elite' ? newSetup.elite_parties : newSetup.sub_parties
      const tParties = targetParty.type === 'elite' ? newSetup.elite_parties : newSetup.sub_parties
      if (!sParties || !tParties) return

      const sourceChar = sParties[sourcePIdx].slots[sourceSIdx].assigned_character

      if (targetParty.memberCount < 5) {
        const emptySlotIdx = tParties[targetParty.pIdx].slots.findIndex(
          (s: PartySlot) => !s.assigned_character,
        )
        tParties[targetParty.pIdx].slots[emptySlotIdx].assigned_character = sourceChar
        sParties[sourcePIdx].slots[sourceSIdx].assigned_character = null
      } else {
        const targetCharId = swapTargetChar[sourceCharId]
        if (!targetCharId) {
          setIsDropdownLoading((prev) => ({ ...prev, [sourceCharId]: false }))
          return alert('Pilih karakter yang ingin di-swap')
        }

        const targetSlotIdx = tParties[targetParty.pIdx].slots.findIndex((s: PartySlot) => {
          const id =
            typeof s.assigned_character === 'string'
              ? s.assigned_character
              : s.assigned_character?.id
          return id === targetCharId
        })
        const targetChar = tParties[targetParty.pIdx].slots[targetSlotIdx].assigned_character

        tParties[targetParty.pIdx].slots[targetSlotIdx].assigned_character = sourceChar
        sParties[sourcePIdx].slots[sourceSIdx].assigned_character = targetChar
      }

      setLocalSetup(newSetup)
      setSwapTargetParty((prev) => {
        const n = { ...prev }
        delete n[sourceCharId]
        return n
      })
      setSwapTargetChar((prev) => {
        const n = { ...prev }
        delete n[sourceCharId]
        return n
      })
      setIsDropdownLoading((prev) => ({ ...prev, [sourceCharId]: false }))
    }, 400)
  }

  const handleHadirSemua = () => {
    setMemberData((prev) => {
      const newData = { ...prev }
      Object.keys(newData).forEach((key) => {
        newData[key].is_present = true
      })
      return newData
    })
  }

  const handleSave = async () => {
    if (!initialSetup) return
    setIsSaving(true)
    const memberReports = flattenedMembers.map((m) => ({
      character_id: m.char.id,
      character_name: m.char.name,
      job: m.char.job,
      is_present: memberData[m.char.id]?.is_present || false,
      actual_score: memberData[m.char.id]?.actual_score || 0,
      party_assigned: m.partyName,
    }))

    const reportPayload = {
      report_name: reportName || activeReport?.report_name || 'Report GL',
      match_status: matchStatus,
      match_score: matchScore ?? 0,
      member_reports: memberReports,
    }

    // Clean up relations for Payload to drastically reduce request size and prevent timeouts
    const cleanParties = (parties: Party[]) =>
      parties.map((p: Party) => ({
        ...p,
        slots: p.slots.map((s: PartySlot) => ({
          required_job: s.required_job,
          assigned_character: s.assigned_character
            ? typeof s.assigned_character === 'string'
              ? s.assigned_character
              : s.assigned_character.id
            : null,
        })),
      }))

    const payloadSetup = localSetup
      ? {
          ...localSetup,
          elite_parties: localSetup.elite_parties ? cleanParties(localSetup.elite_parties) : [],
          sub_parties: localSetup.sub_parties ? cleanParties(localSetup.sub_parties) : [],
        }
      : {}

    const res = await saveReportGL(guild.id, initialSetup.id, reportPayload, payloadSetup)

    if (res.success) {
      alert('Report berhasil disimpan!')
      router.refresh()
      setActiveReport(null)
      setReportName('')
      setMatchScore(null)
      setLocalSetup(null)
    } else {
      if (handleAuthError(res)) return
      alert('Gagal: ' + res.message)
    }
    setIsSaving(false)
  }

  const handleViewReport = (report: ReportGl) => {
    setViewReport(report)
  }

  if (localSetup && activeReport) {
    return (
      <div className="max-w-[1200px] mx-auto">
        <div
          className="flex justify-between items-center mb-8 border-b pb-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>
              {activeReport.report_name}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Evaluasi Performa & Formasi
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleHadirSemua}
              style={{ color: '#10b981', borderColor: '#10b981' }}
              className="border hover:bg-[#10b981]/10"
            >
              ✓ Hadir Semua
            </Button>
            <Button variant="amber" size="lg" loading={isSaving} onClick={handleSave}>
              {isSaving ? 'Menyimpan...' : 'Simpan Report & Update Formasi'}
            </Button>
          </div>
        </div>

        {availableParties.map((party) => {
          const partyMembers = flattenedMembers.filter(
            (m) =>
              (m.partyType === party.type && m.pIdx === party.pIdx) || m.partyName === party.name,
          )
          if (partyMembers.length === 0) return null

          return (
            <div key={party.id} className="mb-10">
              <h2
                className="text-[20px] font-bold mb-4 pb-2 border-b flex items-center justify-between"
                style={{ color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              >
                <span>{party.name}</span>
                <span className="text-sm px-3 py-1 rounded bg-white/5 text-gray-400">
                  {party.memberCount}/5 Member
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {partyMembers.map((m) => {
                  const charId = m.char.id
                  const data = memberData[charId] || { is_present: false, actual_score: 0 }
                  const selectedTargetId = swapTargetParty[charId]
                  const targetParty = availableParties.find((p) => p.id === selectedTargetId)
                  const isTargetFull = targetParty && targetParty.memberCount >= 5

                  return (
                    <div
                      key={charId}
                      className="rounded-xl p-5 flex flex-col gap-4 border transition-all"
                      style={{
                        background: 'var(--bg-secondary)',
                        borderColor: 'var(--border-color)',
                        boxShadow: 'var(--shadow-neumorph-sm)',
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Image
                            src={getJobIcon(m.char.job || '')}
                            alt=""
                            width={32}
                            height={32}
                            className="rounded object-cover"
                          />
                          <div>
                            <div
                              className="font-bold text-[15px]"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {m.char.name}
                            </div>
                            <div className="text-[11px] text-amber-400 font-semibold mt-0.5">
                              PvP Score:{' '}
                              {Math.round(Number(m.char.pvp_score) || 0).toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>

                        <label className="flex flex-col items-center gap-1 cursor-pointer">
                          <span
                            className="text-[11px] font-bold uppercase tracking-wider"
                            style={{ color: data.is_present ? '#10b981' : 'var(--text-muted)' }}
                          >
                            Hadir
                          </span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={data.is_present}
                              onChange={(e) =>
                                setMemberData((prev) => ({
                                  ...prev,
                                  [charId]: { ...prev[charId], is_present: e.target.checked },
                                }))
                              }
                            />
                            <div
                              className={`w-10 h-5 rounded-full transition-colors duration-300 ${data.is_present ? 'bg-emerald-500' : 'bg-gray-600'}`}
                              style={{
                                boxShadow: data.is_present
                                  ? 'inset 0 2px 4px rgba(0,0,0,0.2)'
                                  : 'var(--shadow-neumorph-inset)',
                              }}
                            >
                              <div
                                className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${data.is_present ? 'left-6' : 'left-1'}`}
                                style={{ boxShadow: 'var(--shadow-neumorph-sm)' }}
                              />
                            </div>
                          </div>
                        </label>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="text-[13px] w-20"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Score Aktual
                          </span>
                          <input
                            type="number"
                            value={data.actual_score || ''}
                            onChange={(e) =>
                              setMemberData((prev) => ({
                                ...prev,
                                [charId]: { ...prev[charId], actual_score: Number(e.target.value) },
                              }))
                            }
                            className="flex-1 rounded-lg py-2 px-3 outline-none text-[14px]"
                            style={{
                              background: 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              boxShadow: 'var(--shadow-neumorph-inset)',
                              border: 'none',
                            }}
                          />
                        </div>

                        <div className="flex items-start gap-3">
                          <span
                            className="text-[13px] w-20 mt-2"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Pindah Ke
                          </span>
                          <div className="flex-1 flex flex-col gap-2">
                            <select
                              value={selectedTargetId || ''}
                              onChange={(e) => {
                                setSwapTargetParty((prev) => ({
                                  ...prev,
                                  [charId]: e.target.value,
                                }))
                                setSwapTargetChar((prev) => ({ ...prev, [charId]: '' }))
                              }}
                              className="w-full rounded-lg py-2 px-3 outline-none text-[14px]"
                              style={{
                                background: 'var(--bg-primary)',
                                color: 'var(--text-primary)',
                                boxShadow: 'var(--shadow-neumorph-inset)',
                                border: 'none',
                              }}
                            >
                              <option value="">-- Tetap di posisinya --</option>
                              {availableParties.map((p) => (
                                <option
                                  key={p.id}
                                  value={p.id}
                                  disabled={p.id === `${m.partyType}-${m.pIdx}`}
                                >
                                  {p.name} ({p.memberCount}/5)
                                </option>
                              ))}
                            </select>

                            {isTargetFull && (
                              <select
                                value={swapTargetChar[charId] || ''}
                                onChange={(e) =>
                                  setSwapTargetChar((prev) => ({
                                    ...prev,
                                    [charId]: e.target.value,
                                  }))
                                }
                                className="w-full rounded-lg py-2 px-3 outline-none text-[13px]"
                                style={{
                                  background: 'var(--bg-primary)',
                                  color: '#f59e0b',
                                  boxShadow: 'var(--shadow-neumorph-inset)',
                                  border: '1px solid rgba(245, 158, 11, 0.2)',
                                }}
                              >
                                <option value="">-- Pilih Target Swap --</option>
                                {targetParty?.slots.map((s: PartySlot) => {
                                  const char =
                                    typeof s.assigned_character === 'object' && s.assigned_character
                                      ? s.assigned_character
                                      : typeof s.assigned_character === 'string'
                                        ? localMembers.find((m) => m.id === s.assigned_character) ||
                                          null
                                        : null
                                  if (!char) return null
                                  return (
                                    <option key={char.id} value={char.id}>
                                      {char.name}
                                    </option>
                                  )
                                })}
                              </select>
                            )}

                            {selectedTargetId && (
                              <Button
                                variant="amber"
                                size="sm"
                                loading={isDropdownLoading[charId]}
                                onClick={() =>
                                  handleSwapExecute(charId, m.partyType, m.pIdx, m.sIdx)
                                }
                                className="w-full text-xs mt-1"
                              >
                                {isTargetFull ? 'Tukar Formasi' : 'Pindah Formasi'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* BENCH SECTION (Players not present) */}
        {(() => {
          const absentMembers = flattenedMembers.filter((m) => !memberData[m.char.id]?.is_present)
          if (absentMembers.length === 0) return null

          return (
            <section className="mb-10">
              <h2
                className="text-[20px] font-bold mb-4 pb-2 border-b"
                style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}
              >
                Bench (Tidak Hadir)
              </h2>
              <div
                className="rounded-2xl p-5 border transition-colors"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph)',
                }}
              >
                <div className="flex flex-wrap gap-3">
                  {absentMembers.map((m) => (
                    <div
                      key={m.char.id}
                      className="flex items-center gap-2 py-2 px-4 rounded-xl border"
                      style={{
                        background: 'var(--bg-primary)',
                        borderColor: 'var(--border-color)',
                        boxShadow: 'var(--shadow-neumorph-inset)',
                        opacity: 0.6,
                      }}
                    >
                      <Image
                        src={getJobIcon(m.char.job || '')}
                        alt=""
                        width={24}
                        height={24}
                        className="object-cover rounded"
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>{m.char.name}</span>
                      <span className="text-xs text-red-400 font-semibold">(Absen)</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )
        })()}
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      <div id="tour-report-gl" className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>
          Riwayat Report GL
        </h1>
        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          + Buat Report Baru
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
        {/* Daftar Report - 2/3 lebar */}
        <div id="tour-report-list" className="lg:col-span-2 flex flex-col">
          <div
            className="flex-1 rounded-2xl border p-4 flex flex-col"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-neumorph)',
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 content-start">
              {paginatedReports.length === 0 ? (
                <p className="col-span-2 text-center py-10" style={{ color: 'var(--text-muted)' }}>
                  Belum ada riwayat report.
                </p>
              ) : (
                paginatedReports.map((report) => (
                  <div
                    key={report.id}
                    className="rounded-xl p-3 border cursor-pointer transition-all hover:shadow-lg"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-neumorph-sm)',
                    }}
                    onClick={() => handleViewReport(report)}
                  >
                    <h3
                      className="font-semibold text-sm truncate"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {report.report_name}
                    </h3>
                    <div
                      className="flex justify-between items-center text-xs mt-1"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <span className="flex items-center gap-1">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {report.match_date
                          ? new Date(report.match_date).toLocaleDateString('id-ID')
                          : '-'}
                      </span>
                      <span
                        className={`font-semibold py-0.5 px-2 rounded text-[10px] ${
                          report.match_status === 'win'
                            ? 'text-emerald-400 bg-emerald-400/10'
                            : 'text-rose-400 bg-rose-400/10'
                        }`}
                      >
                        {report.match_status === 'win' ? 'WIN' : 'LOSS'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3">
              <Pagination
                currentPage={reportPage}
                totalPages={totalReportPages}
                onPageChange={setReportPage}
              />
            </div>
          </div>
        </div>

        {/* Ranking GL - 1/3 lebar */}
        <div id="tour-report-ranking" className="lg:col-span-1 flex flex-col">
          <div
            className="flex-1 rounded-2xl border p-4 flex flex-col"
            style={{
              background: 'var(--bg-card)',
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-neumorph)',
            }}
          >
            <h3
              className="text-base font-bold mb-3 flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ color: '#fbbf24' }}
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Ranking GL
            </h3>

            <div className="flex-1">
              {paginatedRanking.length === 0 ? (
                <p className="text-center py-6" style={{ color: 'var(--text-muted)' }}>
                  Belum ada data ranking.
                </p>
              ) : (
                <div className="space-y-2 h-[610px] overflow-y-auto pr-1">
                  {paginatedRanking.map((member, idx) => {
                    const globalIdx = (rankingPage - 1) * RANKING_LIMIT + idx + 1
                    const isTop3 = globalIdx <= 3
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer hover:bg-white/5"
                        onClick={() => setViewedMember(member.charObj)}
                        style={{
                          background: 'var(--bg-primary)',
                          borderColor: isTop3
                            ? globalIdx === 1
                              ? 'rgba(251,191,36,0.3)'
                              : globalIdx === 2
                                ? 'rgba(229,231,235,0.3)'
                                : 'rgba(251,146,60,0.3)'
                            : 'var(--border-color)',
                          boxShadow: isTop3 ? 'var(--shadow-neumorph-sm)' : 'none',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="font-bold w-6 text-center"
                            style={{
                              color:
                                globalIdx === 1
                                  ? '#fbbf24'
                                  : globalIdx === 2
                                    ? '#9ca3af'
                                    : globalIdx === 3
                                      ? '#fb923c'
                                      : 'var(--text-muted)',
                              fontSize: globalIdx <= 3 ? '15px' : '13px',
                            }}
                          >
                            {globalIdx}
                          </span>
                          <Image
                            src={getJobIcon(member.job)}
                            alt=""
                            width={20}
                            height={20}
                            className="object-cover rounded"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                          <span
                            className="text-xs truncate max-w-[80px]"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {member.name}
                          </span>
                        </div>
                        <span className="font-semibold text-xs text-amber-400">
                          {Math.round(member.total).toLocaleString('id-ID')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="mt-3">
              <Pagination
                currentPage={rankingPage}
                totalPages={totalRankingPages}
                onPageChange={setRankingPage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Buat Report */}
      <GlobalDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Laporan Baru"
        maxWidth={400}
      >
        <div className="flex flex-col gap-5 mt-2">
          <div>
            <label
              className="text-[13px] font-semibold mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Nama Report
            </label>
            <input
              type="text"
              placeholder="Contoh: Week 1 vs Valhalla"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                border: 'none',
              }}
            />
          </div>

          <div>
            <label
              className="text-[13px] font-semibold mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Skor Total Guild
            </label>
            <input
              type="number"
              value={matchScore || ''}
              onChange={(e) => setMatchScore(Number(e.target.value))}
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                border: 'none',
              }}
            />
          </div>

          <div>
            <label
              className="text-[13px] font-semibold mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Hasil Pertandingan
            </label>
            <div
              className="flex p-1 rounded-xl"
              style={{
                background: 'var(--bg-secondary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
              }}
            >
              <button
                onClick={() => setMatchStatus('win')}
                className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition-all ${
                  matchStatus === 'win'
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-md'
                    : 'text-gray-500 bg-transparent'
                }`}
              >
                Menang
              </button>
              <button
                onClick={() => setMatchStatus('loss')}
                className={`flex-1 py-2.5 rounded-lg text-[14px] font-semibold transition-all ${
                  matchStatus === 'loss'
                    ? 'bg-rose-500/20 text-rose-400 shadow-md'
                    : 'text-gray-500 bg-transparent'
                }`}
              >
                Kalah
              </button>
            </div>
          </div>

          <Button variant="primary" size="lg" className="w-full mt-2" onClick={handleStartReport}>
            Mulai Isi Laporan
          </Button>
        </div>
      </GlobalDialog>

      {/* Modal View Report */}
      <GlobalDialog
        isOpen={!!viewReport}
        onClose={() => setViewReport(null)}
        title={viewReport?.report_name || 'Detail Report'}
        maxWidth={900}
      >
        {viewReport && (
          <div className="max-h-[70vh] overflow-y-auto pr-1">
            <div
              className="flex justify-between items-center mb-5 text-sm border-b pb-3 sticky top-0 bg-[var(--bg-card)] z-10"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <span className="flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {viewReport.match_date
                  ? new Date(viewReport.match_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'}
              </span>
              <span
                className={`flex items-center gap-2 font-semibold px-3 py-1 rounded-full text-xs ${
                  viewReport.match_status === 'win'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}
              >
                {viewReport.match_status === 'win' ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                )}
                {viewReport.match_status === 'win' ? 'WIN' : 'LOSS'} · Score:{' '}
                {viewReport.match_score || 0}
              </span>
            </div>

            {(() => {
              const groups: Record<string, MemberMatchReport[]> = {}
              ;(viewReport.member_reports || []).forEach((mr: MemberMatchReport) => {
                let party = mr.party_assigned
                if (!party) {
                  const charId =
                    typeof mr.character_id === 'string' ? mr.character_id : mr.character_id?.id
                  if (charId && initialSetup) {
                    for (let pIdx = 0; pIdx < (initialSetup.elite_parties || []).length; pIdx++) {
                      const p = initialSetup.elite_parties![pIdx]
                      if (
                        p.slots.some(
                          (s) =>
                            (typeof s.assigned_character === 'string'
                              ? s.assigned_character
                              : s.assigned_character?.id) === charId,
                        )
                      ) {
                        party = p.name || p.party_name || `Elite Party ${pIdx + 1}`
                        break
                      }
                    }
                    if (!party) {
                      for (let pIdx = 0; pIdx < (initialSetup.sub_parties || []).length; pIdx++) {
                        const p = initialSetup.sub_parties![pIdx]
                        if (
                          p.slots.some(
                            (s) =>
                              (typeof s.assigned_character === 'string'
                                ? s.assigned_character
                                : s.assigned_character?.id) === charId,
                          )
                        ) {
                          party = p.name || p.party_name || `Sub Party ${pIdx + 1}`
                          break
                        }
                      }
                    }
                  }
                }
                const finalParty = party || 'Unassigned'
                if (!groups[finalParty]) groups[finalParty] = []
                groups[finalParty].push(mr)
              })

              return Object.entries(groups).map(([partyName, members]) => {
                const sorted = [...members].sort(
                  (a, b) => Number(b.actual_score || 0) - Number(a.actual_score || 0),
                )
                return (
                  <div key={partyName} className="mb-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div
                        className="w-1 h-4 rounded-full"
                        style={{ background: partyName.includes('Elite') ? '#fbbf24' : '#818cf8' }}
                      />
                      <h4
                        className="font-semibold text-sm m-0"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {partyName}
                      </h4>
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-muted)',
                          boxShadow: 'var(--shadow-neumorph-inset)',
                        }}
                      >
                        {sorted.length}/5
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                      {sorted.map((mr: MemberMatchReport, idx: number) => {
                        const char = typeof mr.character_id === 'object' ? mr.character_id : null
                        const charId =
                          typeof mr.character_id === 'string'
                            ? mr.character_id
                            : mr.character_id?.id
                        const resolvedChar =
                          localMembers.find((m: Character) => m.id === charId) || null
                        const isPresent = Boolean(mr.is_present || mr.status === 'present')
                        const score = Math.round(Number(mr.actual_score || mr.score) || 0)
                        return (
                          <div
                            key={idx}
                            className="flex flex-col items-center p-3 rounded-xl border transition-all duration-200 hover:shadow-md cursor-pointer hover:bg-white/5"
                            onClick={() => {
                              if (resolvedChar) setViewedMember(resolvedChar)
                            }}
                            style={{
                              background: isPresent ? 'var(--bg-card)' : 'var(--bg-primary)',
                              borderColor: isPresent
                                ? 'rgba(16,185,129,0.2)'
                                : 'var(--border-color)',
                              boxShadow: isPresent
                                ? 'var(--shadow-neumorph-sm)'
                                : 'var(--shadow-neumorph-inset)',
                              opacity: isPresent ? 1 : 0.6,
                            }}
                          >
                            <div className="relative mb-1.5">
                              <Image
                                src={getJobIcon(resolvedChar?.job || char?.job || '')}
                                alt=""
                                width={40}
                                height={40}
                                className="w-10 h-10 object-cover rounded-lg shadow-sm"
                                style={{ border: '1px solid var(--border-color)' }}
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                              {!isPresent && (
                                <div
                                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold"
                                  style={{
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-muted)',
                                    boxShadow: 'var(--shadow-neumorph-inset)',
                                  }}
                                >
                                  ✕
                                </div>
                              )}
                            </div>

                            <span
                              className="text-xs font-medium truncate w-full text-center flex-1"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {resolvedChar?.name || char?.name || 'Unknown'}
                            </span>
                            <span
                              className="text-sm font-bold mt-0.5"
                              style={{ color: score > 0 ? '#f59e0b' : 'var(--text-muted)' }}
                            >
                              {score.toLocaleString()}
                            </span>
                            {isPresent ? (
                              <span
                                className="text-[10px] font-semibold mt-0.5 flex items-center gap-1"
                                style={{ color: '#10b981' }}
                              >
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Hadir
                              </span>
                            ) : (
                              <span
                                className="text-[10px] font-semibold mt-0.5"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                Absen
                              </span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        )}
      </GlobalDialog>

      <CharacterDetailModal
        member={viewedMember}
        isOpen={!!viewedMember}
        onClose={async (isUpdated) => {
          setViewedMember(null)
          if (isUpdated) {
            const updated = await getCharactersDashboard(guild.id)
            setLocalMembers(updated)
            if (localSetup) {
              const newSetup = clone(localSetup)
              const updateParties = (parties: Party[]) => {
                parties.forEach((p: Party) => {
                  p.slots.forEach((s: PartySlot) => {
                    if (s.assigned_character) {
                      const assignedId =
                        typeof s.assigned_character === 'string'
                          ? s.assigned_character
                          : s.assigned_character.id
                      const newChar = updated.find((m: Character) => m.id === assignedId)
                      if (newChar) {
                        s.assigned_character = {
                          id: newChar.id,
                          name: newChar.name,
                          job: newChar.job,
                          pvp_score: newChar.pvp_score,
                        }
                      }
                    }
                  })
                })
              }
              if (newSetup.elite_parties) updateParties(newSetup.elite_parties)
              if (newSetup.sub_parties) updateParties(newSetup.sub_parties)
              setLocalSetup(newSetup)
            }
            if (viewReport) {
              const newReport = clone(viewReport)
              newReport.member_reports?.forEach((mr: MemberMatchReport) => {
                if (mr.character_id) {
                  const charId =
                    typeof mr.character_id === 'string' ? mr.character_id : mr.character_id.id
                  const newChar = updated.find((m: Character) => m.id === charId)
                  if (newChar) {
                    mr.character_id = {
                      id: newChar.id,
                      name: newChar.name,
                      job: newChar.job,
                      pvp_score: newChar.pvp_score,
                    }
                  }
                }
              })
              setViewReport(newReport)
            }
            router.refresh()
          }
        }}
      />
    </div>
  )
}
