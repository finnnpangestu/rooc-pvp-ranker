'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { GlobalDialog } from '../../components/GlobalDialog'
import { CharacterDetailModal } from '../../components/CharacterDetailModal'
import { Button } from '../../components/Button'
import { CustomDropdown } from '../../components/CustomDropdown'
import { Pagination } from '../../components/Pagination'
import { handleAuthError } from '../../components/SessionExpiredDialog'
import { saveReportWoe } from '@/actions/woe/saveReportWoe'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { useRouter } from 'next/navigation'
import { JOB_LABELS } from '@/const/JobLabels'
import type {
  Guild,
  WoeSetup,
  ReportWoe,
  WoeRaid,
  Party,
  PartySlot,
  PartySlotCharacter,
  MemberMatchReport,
  Character,
} from '@/types'

interface ReportWoeClientProps {
  guild: Guild
  initialSetup: WoeSetup | null
  historyReports: ReportWoe[]
  members?: Character[]
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`
const clone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj))

const REPORT_LIMIT = 5

export function ReportWoeClient({
  guild,
  initialSetup,
  historyReports,
  members = [],
}: ReportWoeClientProps) {
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
      const rName = raid.name || raid.raid_name || `Raid ${rIdx + 1}`
      ;(raid.parties || []).forEach((party: Party, pIdx: number) => {
        const pName = party.name || party.party_name || `Party ${pIdx + 1}`
        parties.push({
          id: `r${rIdx}-p${pIdx}`,
          name: `${rName} - ${pName}`,
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
    const flatList: {
      char: PartySlotCharacter | Character
      partyName: string
      partyId: string
      rIdx: number
      pIdx: number
      sIdx: number
    }[] = []

    localSetup.raids.forEach((raid: WoeRaid, rIdx: number) => {
      const rName = raid.name || raid.raid_name || `Raid ${rIdx + 1}`
      ;(raid.parties || []).forEach((party: Party, pIdx: number) => {
        const pName = party.name || party.party_name || `Party ${pIdx + 1}`
        ;(party.slots || []).forEach((slot: PartySlot, sIdx: number) => {
          if (slot.assigned_character) {
            const charObj =
              typeof slot.assigned_character === 'object'
                ? slot.assigned_character
                : localMembers.find((m) => m.id === slot.assigned_character) || null
            if (charObj) {
              flatList.push({
                char: charObj,
                partyName: `${rName} - ${pName}`,
                partyId: `r${rIdx}-p${pIdx}`,
                rIdx,
                pIdx,
                sIdx,
              })
            }
          }
        })
      })
    })
    return flatList
  }, [localSetup, localMembers])

  const handleStartReport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialSetup) {
      alert('WoE Setup not found. Please create a setup first on the WoE Setup page.')
      return
    }
    if (matchRank === '') {
      alert('Please enter an integer rank (e.g. 1, 2, 3)')
      return
    }

    const setupClone: WoeSetup = clone(initialSetup)
    if (setupClone.raids) {
      setupClone.raids = setupClone.raids.map((raid, rIdx) => {
        const rName = raid.name || raid.raid_name || `Raid ${rIdx + 1}`
        return {
          ...raid,
          name: rName,
          raid_name: rName,
          parties: (raid.parties || []).map((party, pIdx) => {
            const pName = party.name || party.party_name || `Party ${pIdx + 1}`
            return {
              ...party,
              name: pName,
              party_name: pName,
              slots: party.slots.map((s) => {
                const charId =
                  typeof s.assigned_character === 'object' && s.assigned_character
                    ? s.assigned_character.id
                    : s.assigned_character
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
          }),
        }
      })
    }

    setLocalSetup(setupClone)

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

    const initialData: Record<string, { is_present: boolean; party_assigned: string }> = {}
    if (setupClone.raids) {
      setupClone.raids.forEach((raid, rIdx) => {
        const rName = raid.name || raid.raid_name || `Raid ${rIdx + 1}`
        ;(raid.parties || []).forEach((party, pIdx) => {
          const pName = party.name || party.party_name || `Party ${pIdx + 1}`
          ;(party.slots || []).forEach((slot) => {
            if (slot.assigned_character) {
              const charId =
                typeof slot.assigned_character === 'object'
                  ? slot.assigned_character.id
                  : slot.assigned_character
              initialData[charId] = {
                is_present: false,
                party_assigned: `${rName} - ${pName}`,
              }
            }
          })
        })
      })
    }

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
          return alert('Please select a character to swap with')
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
      character_name: m.char.name,
      job: m.char.job,
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
      alert('WoE report saved successfully!')
      router.refresh()
      setActiveReport(null)
      setReportName('')
      setMatchRank('')
      setLocalSetup(null)
    } else {
      if (handleAuthError(res)) return
      alert('Failed to save: ' + res.message)
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
              Report Evaluation: {activeReport.report_name}
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
              ✓ Mark All Present
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setActiveReport(null)
                setLocalSetup(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={handleSave} loading={isSaving}>
              {isSaving ? 'Saving...' : 'Save Report & Update Formation'}
            </Button>
          </div>
        </div>

        {availableParties.map((party) => {
          const partyMembers = flattenedMembers.filter((m) => m.partyId === party.id)
          if (partyMembers.length === 0) return null

          return (
            <div key={party.id} className="mb-10">
              <h2
                className="text-[20px] font-bold mb-4 pb-2 border-b border-black/5 dark:border-white/10 flex items-center justify-between tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                <span>{party.name}</span>
                <span
                  className="text-xs px-3 py-1 rounded-full border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 text-[var(--text-muted)] tabular-nums"
                >
                  {party.memberCount}/5 Members
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
                      className="apple-glass rounded-2xl p-5 flex flex-col gap-4 border border-black/5 dark:border-white/10 shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Image
                            src={getJobIcon(m.char.job || '')}
                            alt=""
                            width={32}
                            height={32}
                            className="rounded-lg object-cover"
                          />
                          <div>
                            <div
                              className="font-bold text-[15px] tracking-tight"
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

                        <label className="flex flex-col items-center gap-1 cursor-pointer select-none">
                          <span
                            className={`text-[11px] font-semibold uppercase tracking-wider ${data.is_present ? 'text-[#34c759]' : 'text-neutral-400 dark:text-neutral-500'}`}
                          >
                            Present
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
                              className={`w-11 h-6 rounded-full transition-colors duration-200 relative p-0.5 ${data.is_present ? 'bg-[#34c759]' : 'bg-black/20 dark:bg-white/20'}`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${data.is_present ? 'translate-x-5' : 'translate-x-0'}`}
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
                            Move To
                          </span>
                          <div className="flex-1 flex flex-col gap-2">
                            <CustomDropdown
                              value={selectedTargetId || ''}
                              onChange={(val) => {
                                setSwapTargetParty((prev) => ({
                                  ...prev,
                                  [charId]: val,
                                }))
                                setSwapTargetChar((prev) => ({ ...prev, [charId]: '' }))
                              }}
                              placeholder="-- Keep current position --"
                              size="sm"
                              options={[
                                { value: '', label: '-- Keep current position --' },
                                ...availableParties.map((p) => ({
                                  value: p.id,
                                  label: `${p.name} (${p.memberCount}/5)`,
                                  disabled: p.id === m.partyId,
                                })),
                              ]}
                            />

                            {isTargetFull && (
                              <CustomDropdown
                                value={swapTargetChar[charId] || ''}
                                onChange={(val) =>
                                  setSwapTargetChar((prev) => ({
                                    ...prev,
                                    [charId]: val,
                                  }))
                                }
                                placeholder="-- Select Swap Target --"
                                size="sm"
                                triggerClassName="!border-amber-500/30 text-amber-600 dark:text-amber-400"
                                options={[
                                  { value: '', label: '-- Select Swap Target --' },
                                  ...(targetParty?.slots
                                    .map((s: PartySlot) => {
                                      const char =
                                        typeof s.assigned_character === 'object' && s.assigned_character
                                          ? s.assigned_character
                                          : typeof s.assigned_character === 'string'
                                            ? localMembers.find((mem) => mem.id === s.assigned_character) || null
                                            : null
                                      if (!char) return null
                                      return {
                                        value: char.id,
                                        label: char.name,
                                        icon: getJobIcon(char.job || ''),
                                      }
                                    })
                                    .filter(Boolean) as { value: string; label: string; icon?: string }[]),
                                ]}
                              />
                            )}

                            {selectedTargetId && (
                              <Button
                                variant="amber"
                                size="sm"
                                loading={isDropdownLoading[charId]}
                                onClick={() => handleSwapExecute(charId, m.rIdx, m.pIdx, m.sIdx)}
                                className="w-full text-xs mt-1"
                              >
                                {isTargetFull ? 'Swap Formation' : 'Move Formation'}
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
            WoE Reports
          </h1>
          <p style={{ color: 'var(--text-muted)' }}>
            Record and manage your guild's War of Emperium battle reports.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="!px-6 !py-3 !text-[15px]"
        >
          + Create New Report
        </Button>
      </div>

      <div
        id="tour-woe-report-list"
        className="apple-glass rounded-3xl p-6 sm:p-8 mb-8 border border-black/5 dark:border-white/10 shadow-sm transition-colors"
      >
        <h2 className="text-xl font-bold mb-4 tracking-tight" style={{ color: 'var(--text-primary)' }}>
          WoE Report History
        </h2>
        {historyReports.length === 0 ? (
          <div
            className="p-8 text-center rounded-2xl border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] text-[var(--text-muted)]"
          >
            No WoE reports yet. Click the button above to create one.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {paginatedReports.map((report) => (
              <div
                key={report.id}
                onClick={() => setViewReport(report)}
                className="p-5 rounded-2xl border border-black/5 dark:border-white/10 bg-white/60 dark:bg-white/[0.03] hover:bg-white/80 dark:hover:bg-white/[0.06] shadow-sm hover:shadow-md cursor-pointer transition-all apple-press"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                      {report.report_name}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {report.match_date
                        ? new Date(report.match_date).toLocaleDateString('en-US', {
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
        title="Create New WoE Report"
        maxWidth={400}
      >
        <form onSubmit={handleStartReport} className="flex flex-col gap-5 pt-2">
          <div>
            <label
              className="text-[13px] font-semibold mb-2 block"
              style={{ color: 'var(--text-secondary)' }}
            >
              Report Name / Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g. WoE August 12, 2026"
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)] transition-all"
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
              placeholder="e.g. 1"
              className="w-full rounded-xl py-3 px-4 outline-none text-[14px] bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-[#0071e3] text-[var(--text-primary)] transition-all tabular-nums"
            />
          </div>

          <Button variant="primary" size="lg" type="submit" className="w-full mt-2">
            Proceed to Evaluation
          </Button>
        </form>
      </GlobalDialog>

      <GlobalDialog
        isOpen={!!viewReport}
        onClose={() => setViewReport(null)}
        title={`Details: ${viewReport?.report_name}`}
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
                {new Date(viewReport.match_date || new Date()).toLocaleDateString('en-US', {
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
                let party = mr.party_assigned
                if (!party) {
                  const charId =
                    typeof mr.character_id === 'string' ? mr.character_id : mr.character_id?.id
                  if (charId && initialSetup?.raids) {
                    for (let rIdx = 0; rIdx < initialSetup.raids.length; rIdx++) {
                      const raid = initialSetup.raids[rIdx]
                      const rName = raid.name || raid.raid_name || `Raid ${rIdx + 1}`
                      for (let pIdx = 0; pIdx < (raid.parties || []).length; pIdx++) {
                        const p = raid.parties[pIdx]
                        const pName = p.name || p.party_name || `Party ${pIdx + 1}`
                        if (
                          p.slots.some(
                            (s) =>
                              (typeof s.assigned_character === 'string'
                                ? s.assigned_character
                                : s.assigned_character?.id) === charId,
                          )
                        ) {
                          party = `${rName} - ${pName}`
                          break
                        }
                      }
                      if (party) break
                    }
                  }
                }
                const finalParty = party || 'Unassigned'
                if (!groups[finalParty]) groups[finalParty] = []
                groups[finalParty].push(mr)
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
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-[var(--text-muted)] tabular-nums"
                      >
                        {members.length}/5
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                      {members.map((mr: MemberMatchReport, idx: number) => {
                        const charId =
                          typeof mr.character_id === 'string'
                            ? mr.character_id
                            : mr.character_id?.id
                        const isPresent = Boolean(mr.is_present || mr.status === 'present')
                        const resolvedChar =
                          localMembers.find((m: Character) => m.id === charId) || null
                        return (
                          <div
                            key={idx}
                            className={`flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer apple-press ${
                              isPresent
                                ? 'bg-white/70 dark:bg-white/[0.04] border-emerald-500/20 shadow-sm hover:shadow-md'
                                : 'bg-black/[0.02] dark:bg-white/[0.02] border-black/5 dark:border-white/5 opacity-60'
                            }`}
                            onClick={() => {
                              if (resolvedChar) setViewedMember(resolvedChar)
                            }}
                          >
                            <div className="relative mb-1.5">
                              <Image
                                src={getJobIcon(resolvedChar?.job || '')}
                                alt=""
                                width={40}
                                height={40}
                                className="w-10 h-10 object-cover rounded-xl shadow-sm border border-black/5 dark:border-white/10"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                              />
                              {!isPresent && (
                                <div
                                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20 shadow-sm"
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
                              {isPresent ? 'Present' : 'Absent'}
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
