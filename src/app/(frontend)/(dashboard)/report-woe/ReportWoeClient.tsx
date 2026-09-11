'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { GlobalDialog } from '../../components/GlobalDialog'
import { CharacterDetailModal } from '../../components/CharacterDetailModal'
import { Button } from '../../components/Button'
import { Pagination } from '../../components/Pagination'
import { handleAuthError } from '../../components/SessionExpiredDialog'
import { saveReportWoe } from '@/actions/woe/saveReportWoe'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { useRouter } from 'next/navigation'
import { JOB_LABELS } from '@/const/JobLabels'
import type { Guild, WoeSetup, ReportWoe, WoeRaid, Party, PartySlot, PartySlotCharacter, MemberMatchReport, Character } from '@/types'

interface ReportWoeClientProps {
  guild: Guild
  initialSetup: WoeSetup | null
  historyReports: ReportWoe[]
  members?: Character[]
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`
const clone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj))

const REPORT_LIMIT = 5

export function ReportWoeClient({ guild, initialSetup, historyReports, members = [] }: ReportWoeClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeReport, setActiveReport] = useState<ReportWoe | null>(null)
  const [viewReport, setViewReport] = useState<ReportWoe | null>(null)
  const [localMembers, setLocalMembers] = useState<Character[]>(members)
  const [viewedMember, setViewedMember] = useState<Character | null>(null)
  const router = useRouter()

  const [reportName, setReportName] = useState('')
  const [matchRank, setMatchRank] = useState<number | ''>('')

  const [localSetup, setLocalSetup] = useState<WoeSetup | null>(null)
  const [memberData, setMemberData] = useState<
    Record<string, { is_present: boolean; party_assigned: string }>
  >({})
  const [isSaving, setIsSaving] = useState(false)

  const [swapTargetParty, setSwapTargetParty] = useState<Record<string, string>>({})
  const [swapTargetChar, setSwapTargetChar] = useState<Record<string, string>>({})
  const [isDropdownLoading, setIsDropdownLoading] = useState<Record<string, boolean>>({})

  // Pagination
  const [reportPage, setReportPage] = useState(1)
  const totalReportPages = Math.ceil(historyReports.length / REPORT_LIMIT)
  const paginatedReports = historyReports.slice(
    (reportPage - 1) * REPORT_LIMIT,
    reportPage * REPORT_LIMIT,
  )

  const availableParties = useMemo(() => {
    if (!localSetup || !localSetup.raids) return []
    const parties: {
      id: string
      name: string
      rIdx: number
      pIdx: number
      memberCount: number
      slots: PartySlot[]
    }[] = []

    localSetup.raids.forEach((raid: WoeRaid, rIdx: number) => {
      ;(raid.parties || []).forEach((party: Party, pIdx: number) => {
        parties.push({
          id: `r${rIdx}-p${pIdx}`,
          name: `${raid.name || raid.raid_name} - ${party.name || party.party_name}`,
          rIdx,
          pIdx,
          memberCount: party.slots.filter((s: PartySlot) => s.assigned_character).length,
          slots: party.slots,
        })
      })
    })
    return parties
  }, [localSetup])

  const flattenedMembers = useMemo(() => {
    if (!localSetup || !localSetup.raids) return []
    const members: {
      char: PartySlotCharacter
      partyName: string
      partyId: string
      rIdx: number
      pIdx: number
      sIdx: number
    }[] = []

    localSetup.raids.forEach((raid: WoeRaid, rIdx: number) => {
      ;(raid.parties || []).forEach((party: Party, pIdx: number) => {
        ;(party.slots || []).forEach((slot: PartySlot, sIdx: number) => {
          if (slot.assigned_character && typeof slot.assigned_character === 'object') {
            members.push({
              char: slot.assigned_character,
              partyName: `${raid.name || raid.raid_name} - ${party.name || party.party_name}`,
              partyId: `r${rIdx}-p${pIdx}`,
              rIdx,
              pIdx,
              sIdx,
            })
          }
        })
      })
    })
    return members
  }, [localSetup])

  const handleStartReport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialSetup) {
      alert('Setup WoE belum ada. Buat setup terlebih dahulu di halaman WoE Setup.')
      return
    }
    if (matchRank === '') {
      alert('Harap masukkan rank integer (misal 1, 2, 3)')
      return
    }

    setLocalSetup(clone(initialSetup))

    setActiveReport({
      id: crypto.randomUUID(),
      guild_id: guild.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      match_date: new Date().toISOString(),
      report_name: reportName,
      match_rank: String(matchRank || 0),
      member_reports: [],
    })

    // Init with original flattened array (from initialSetup conceptually, but here we just iterate once)
    const initialData: Record<string, { is_present: boolean; party_assigned: string }> = {}

    ;(initialSetup.raids || []).forEach((raid: WoeRaid) => {
      ;(raid.parties || []).forEach((party: Party) => {
        ;(party.slots || []).forEach((slot: PartySlot) => {
          if (slot.assigned_character) {
            const charId =
              typeof slot.assigned_character === 'string'
                ? slot.assigned_character
                : slot.assigned_character.id
            initialData[charId] = {
              is_present: false,
              party_assigned: `${raid.name || raid.raid_name} - ${party.name || party.party_name}`,
            }
          }
        })
      })
    })

    setMemberData(initialData)
    setIsModalOpen(false)
  }

  const handleSwapExecute = (
    sourceCharId: string,
    sourceRIdx: number,
    sourcePIdx: number,
    sourceSIdx: number,
  ) => {
    const targetPartyId = swapTargetParty[sourceCharId]
    if (!targetPartyId) return

    const targetParty = availableParties.find((p) => p.id === targetPartyId)
    if (!targetParty) return

    setIsDropdownLoading((prev) => ({ ...prev, [sourceCharId]: true }))

    setTimeout(() => {
      if (!localSetup || !localSetup.raids) return
      const newSetup = clone(localSetup)
      const raids = newSetup.raids
      if (!raids) return
      const sourceParty = raids[sourceRIdx].parties[sourcePIdx]
      const tParty = raids[targetParty.rIdx].parties[targetParty.pIdx]

      const sourceChar = sourceParty.slots[sourceSIdx].assigned_character

      if (targetParty.memberCount < 5) {
        const emptySlotIdx = tParty.slots.findIndex((s: PartySlot) => !s.assigned_character)
        tParty.slots[emptySlotIdx].assigned_character = sourceChar
        sourceParty.slots[sourceSIdx].assigned_character = null
      } else {
        const targetCharId = swapTargetChar[sourceCharId]
        if (!targetCharId) {
          setIsDropdownLoading((prev) => ({ ...prev, [sourceCharId]: false }))
          return alert('Pilih karakter yang ingin di-swap')
        }

        const targetSlotIdx = tParty.slots.findIndex((s: PartySlot) => {
          const id =
            typeof s.assigned_character === 'string'
              ? s.assigned_character
              : s.assigned_character?.id
          return id === targetCharId
        })
        const targetChar = tParty.slots[targetSlotIdx].assigned_character

        tParty.slots[targetSlotIdx].assigned_character = sourceChar
        sourceParty.slots[sourceSIdx].assigned_character = targetChar
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
      is_present: memberData[m.char.id]?.is_present || false,
      party_assigned: m.partyName,
    }))

    const reportPayload = {
      report_name: reportName,
      match_rank: matchRank ? String(matchRank) : '0',
      member_reports: memberReports,
    }

    // Clean up relations for Payload to drastically reduce request size and prevent timeouts
    const payloadSetup = localSetup
      ? {
          ...localSetup,
          raids: (localSetup.raids || []).map((raid: WoeRaid) => ({
            ...raid,
            parties: raid.parties.map((party: Party) => ({
              ...party,
              slots: party.slots.map((slot: PartySlot) => ({
                required_job: slot.required_job,
                assigned_character: slot.assigned_character
                  ? typeof slot.assigned_character === 'string'
                    ? slot.assigned_character
                    : slot.assigned_character.id
                  : null,
              })),
            })),
          })),
        }
      : null

    const res = await saveReportWoe(guild.id, initialSetup.id, reportPayload, payloadSetup || {})

    if (res.success) {
      alert('Report WoE berhasil disimpan!')
      router.refresh()
      setActiveReport(null)
      setReportName('')
      setMatchRank('')
      setLocalSetup(null)
    } else {
      if (handleAuthError(res)) return
      alert('Gagal menyimpan: ' + res.message)
    }
    setIsSaving(false)
  }

  if (activeReport && localSetup) {
    return (
      <div className="max-w-[1200px] mx-auto w-full">
        <div
          className="flex justify-between items-center mb-8 border-b pb-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: 'var(--text-primary)' }}>
              Input Laporan: {activeReport.report_name}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Rank: {activeReport.match_rank}
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
            <Button
              variant="ghost"
              onClick={() => {
                setActiveReport(null)
                setLocalSetup(null)
              }}
            >
              Batal
            </Button>
            <Button variant="success" onClick={handleSave} loading={isSaving}>
              Simpan Report & Update Formasi
            </Button>
          </div>
        </div>

        {availableParties.map((party) => {
          const partyMembers = flattenedMembers.filter((m) => m.partyId === party.id)
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
                  const data = memberData[charId] || { is_present: false }
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
                            <div
                              className="text-[12px] font-medium"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              {JOB_LABELS[m.char.job as keyof typeof JOB_LABELS] || m.char.job}
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
                                <option key={p.id} value={p.id} disabled={p.id === m.partyId}>
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
                                  const char = s.assigned_character
                                  if (!char || typeof char === 'string') return null
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
                                onClick={() => handleSwapExecute(charId, m.rIdx, m.pIdx, m.sIdx)}
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
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div className="flex justify-between items-center mb-8" id="tour-woe-report-header">
        <div>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
            Report WoE
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Buat laporan hasil pertempuran WoE guild Anda.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="!px-6 !py-3 !text-[15px]"
        >
          + Buat Report Baru
        </Button>
      </div>

      <div
        id="tour-woe-report-list"
        className="rounded-lg p-6 mb-8 transition-colors"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
      >
        <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Riwayat Laporan WoE
        </h2>
        {historyReports.length === 0 ? (
          <div
            className="p-8 text-center rounded-lg border"
            style={{
              borderColor: 'var(--border-color)',
              background: 'var(--bg-primary)',
              color: 'var(--text-muted)',
              boxShadow: 'var(--shadow-neumorph-inset)',
            }}
          >
            Belum ada report WoE. Klik tombol di atas untuk membuat.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {paginatedReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setViewReport(report)}
                className="p-5 rounded-lg border cursor-pointer transition-all"
                style={{
                  borderColor: 'var(--border-color)',
                  background: 'var(--bg-primary)',
                  boxShadow: 'var(--shadow-neumorph-sm)',
                }}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {report.report_name}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {report.match_date
                        ? new Date(report.match_date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      Rank {report.match_rank}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalReportPages > 1 && (
          <div className="mt-6 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <Pagination
              currentPage={reportPage}
              totalPages={totalReportPages}
              onPageChange={setReportPage}
            />
          </div>
        )}
      </div>

      {/* Modal Buat Report */}
      <GlobalDialog
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Laporan WoE Baru"
        maxWidth={400}
      >
        <form onSubmit={handleStartReport} className="flex flex-col gap-5 pt-2">
          <div>
            <label
              className="text-[13px] font-semibold mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Nama / Judul Report <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Contoh: WoE 12 Agustus 2026"
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
              Rank <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              value={matchRank}
              onChange={(e) => setMatchRank(Number(e.target.value))}
              placeholder="Contoh: 1"
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px]"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                border: 'none',
              }}
            />
          </div>

          <Button variant="primary" size="lg" type="submit" className="w-full mt-2">
            Lanjut Input Data
          </Button>
        </form>
      </GlobalDialog>

      <GlobalDialog
        isOpen={!!viewReport}
        onClose={() => setViewReport(null)}
        title={`Detail: ${viewReport?.report_name}`}
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
                {new Date(viewReport.match_date || new Date()).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-2 font-semibold px-3 py-1 rounded-full text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20">
                Rank: {viewReport.match_rank || 0}
              </span>
            </div>

            {(() => {
              const groups: Record<string, MemberMatchReport[]> = {}
              ;(viewReport.member_reports || []).forEach((mr: MemberMatchReport) => {
                const party = mr.party_assigned || 'Unassigned'
                if (!groups[party]) groups[party] = []
                groups[party].push(mr)
              })

              return Object.entries(groups).map(([partyName, members]) => {
                return (
                  <div key={partyName} className="mb-5">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-1 h-4 rounded-full" style={{ background: '#818cf8' }} />
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
                        {members.length}/5
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                      {members.map((mr: MemberMatchReport, idx: number) => {
                        const charId = typeof mr.character_id === 'string' ? mr.character_id : mr.character_id?.id
                        const isPresent = Boolean(mr.is_present || mr.status === 'present')
                        const resolvedChar = localMembers.find((m: Character) => m.id === charId) || null
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
                              <img
                                src={getJobIcon(resolvedChar?.job || '')}
                                alt=""
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
                              {resolvedChar?.name || 'Unknown'}
                            </span>
                            <span
                              className="text-[10px] font-bold mt-1 uppercase"
                              style={{ color: isPresent ? '#10b981' : 'var(--text-muted)' }}
                            >
                              {isPresent ? 'Hadir' : 'Absen'}
                            </span>
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
              ;(newSetup.raids || []).forEach((r: WoeRaid) => {
                r.parties.forEach((p: Party) => {
                  p.slots.forEach((s: PartySlot) => {
                    if (s.assigned_character) {
                      const charId =
                        typeof s.assigned_character === 'string'
                          ? s.assigned_character
                          : s.assigned_character.id
                      const newChar = updated.find((m: Character) => m.id === charId)
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
              })
              setLocalSetup(newSetup)
            }
            if (viewReport) {
              const newReport = clone(viewReport)
              newReport.member_reports?.forEach((mr: MemberMatchReport) => {
                if (mr.character_id) {
                  const charId =
                    typeof mr.character_id === 'string'
                      ? mr.character_id
                      : mr.character_id.id
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
