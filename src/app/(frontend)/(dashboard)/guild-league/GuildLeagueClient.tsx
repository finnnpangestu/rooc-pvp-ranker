'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { GlobalDialog } from '../../components/GlobalDialog'
import { CharacterDetailModal } from '../../components/CharacterDetailModal'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { JOBS, JOB_LABELS } from '@/const/JobLabels'
import { generateEliteParty } from '@/actions/guild/generateEliteParty'
import { generateSubParty } from '@/actions/guild/generateSubParty'
import { savePartySetup } from '@/actions/guild/savePartySetup'
import { clearParties } from '@/actions/guild/clearParties'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { useTheme } from '../../components/ThemeProvider'

interface GuildLeagueClientProps {
  guild: any
  members: any[]
  initialSetup: any | null
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`
const clone = (obj: any) => JSON.parse(JSON.stringify(obj))

export function GuildLeagueClient({ guild, members, initialSetup }: GuildLeagueClientProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [localMembers, setLocalMembers] = useState(members)

  // local setup state
  const [localSetup, setLocalSetup] = useState<any | null>(() => {
    if (initialSetup) {
      return clone(initialSetup)
    }
    return null
  })

  const [isEliteDialogOpen, setIsEliteDialogOpen] = useState(false)
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [selectedPartyIndex, setSelectedPartyIndex] = useState<number | null>(null)
  const [selectedPartyType, setSelectedPartyType] = useState<'elite' | 'sub' | null>(null)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [isSaveLoading, setIsSaveLoading] = useState(false)
  const [isClearing, startClearTransition] = useTransition()
  const [viewedMember, setViewedMember] = useState<any | null>(null)
  const [draggedMember, setDraggedMember] = useState<{
    member: any
    sourceType: 'elite' | 'sub' | null
    sourcePartyIdx: number | null
    sourceSlotIdx: number | null
  } | null>(null)

  const [eliteBlueprint, setEliteBlueprint] = useState<string[][]>(
    Array(8)
      .fill(null)
      .map(() => Array(5).fill('any')),
  )
  const [subBlueprint, setSubBlueprint] = useState<string[][]>(
    Array(1)
      .fill(null)
      .map(() => Array(5).fill('any')),
  )

  const getAssignedMemberIds = () => {
    if (!localSetup) return []
    const eliteIds =
      localSetup.elite_parties?.flatMap((p: any) =>
        p.slots.map((s: any) => s.assigned_character?.id || s.assigned_character).filter(Boolean),
      ) || []
    const subIds =
      localSetup.sub_parties?.flatMap((p: any) =>
        p.slots.map((s: any) => s.assigned_character?.id || s.assigned_character).filter(Boolean),
      ) || []
    return [...eliteIds, ...subIds]
  }

  const assignedIds = getAssignedMemberIds()
  const benchMembers = localMembers.filter((m) => !assignedIds.includes(m.id))
  const maxSubParties = Math.ceil(benchMembers.length / 5)

  useEffect(() => {
    const needed = Math.max(1, maxSubParties)
    if (subBlueprint.length !== needed) {
      setSubBlueprint(
        Array(needed)
          .fill(null)
          .map(() => Array(5).fill('any')),
      )
    }
  }, [maxSubParties])

  const handleGenerateElite = async () => {
    const res = await generateEliteParty(guild.id, eliteBlueprint, localMembers)
    if (res.success) {
      const newSetup = localSetup
        ? clone(localSetup)
        : { guild_id: guild.id, elite_parties: [], sub_parties: [] }
      newSetup.elite_parties = res.parties
      newSetup.sub_parties = []
      setLocalSetup(newSetup)
      setIsEliteDialogOpen(false)
    } else {
      alert('Gagal generate: ' + (res as any).message)
    }
  }

  const handleGenerateSub = async () => {
    if (!localSetup) return
    const res = await generateSubParty(guild.id, subBlueprint, benchMembers)
    if (res.success) {
      const newSetup = clone(localSetup)
      newSetup.sub_parties = res.parties
      setLocalSetup(newSetup)
      setIsSubDialogOpen(false)
    } else {
      alert('Gagal generate sub: ' + (res as any).message)
    }
  }

  const handleSave = async () => {
    if (!localSetup) return
    setIsSaveLoading(true)
    const payload = { ...localSetup, guild_id: guild.id }
    const res = await savePartySetup(payload)
    if (res.success) {
      alert('Setup berhasil disimpan!')
    } else {
      alert('Gagal menyimpan: ' + res.message)
    }
    setIsSaveLoading(false)
  }

  // HANDLE CLEAR - SAVE KE DATABASE
  const handleClear = (mode: 'all' | 'elite' | 'sub') => {
    if (!localSetup) return
    if (!confirm(`Hapus formasi ${mode}?`)) return

    startClearTransition(async () => {
      if (initialSetup?.id) {
        const res = await clearParties(initialSetup.id, mode)
        if (!res.success) {
          alert('Gagal clear: ' + res.message)
          return
        }
      }

      const newSetup = clone(localSetup)
      if (mode === 'all' || mode === 'elite') newSetup.elite_parties = []
      if (mode === 'all' || mode === 'sub') newSetup.sub_parties = []
      setLocalSetup(newSetup)
      router.refresh()
    })
  }

  const removeMemberFromParty = (partyType: 'elite' | 'sub', partyIdx: number, slotIdx: number) => {
    if (!localSetup) return
    const newSetup = clone(localSetup)
    const parties = partyType === 'elite' ? newSetup.elite_parties : newSetup.sub_parties
    if (!parties || !parties[partyIdx]) return
    parties[partyIdx].slots[slotIdx].assigned_character = null
    parties[partyIdx].slots[slotIdx].required_job = 'any'
    setLocalSetup(newSetup)
  }

  const addMemberToParty = (memberId: string) => {
    if (selectedPartyType === null || selectedPartyIndex === null || selectedSlotIndex === null)
      return
    const member = members.find((m) => m.id === memberId)
    if (!member) return
    const newSetup = clone(localSetup)
    if (selectedPartyType === 'elite') {
      newSetup.elite_parties[selectedPartyIndex].slots[selectedSlotIndex].assigned_character =
        member
      newSetup.elite_parties[selectedPartyIndex].slots[selectedSlotIndex].required_job = member.job
    } else {
      newSetup.sub_parties[selectedPartyIndex].slots[selectedSlotIndex].assigned_character = member
      newSetup.sub_parties[selectedPartyIndex].slots[selectedSlotIndex].required_job = member.job
    }
    setLocalSetup(newSetup)
    setIsAddMemberDialogOpen(false)
    setSelectedPartyIndex(null)
    setSelectedPartyType(null)
    setSelectedSlotIndex(null)
  }

  const handleDragStart = (
    member: any,
    sourceType: 'elite' | 'sub' | null,
    sourcePartyIdx: number | null,
    sourceSlotIdx: number | null,
  ) => {
    setDraggedMember({ member, sourceType, sourcePartyIdx, sourceSlotIdx })
  }

  const handleDropToSlot = (
    targetType: 'elite' | 'sub',
    targetPartyIdx: number,
    targetSlotIdx: number,
  ) => {
    if (!draggedMember || !localSetup) return
    const { member, sourceType, sourcePartyIdx, sourceSlotIdx } = draggedMember
    const newSetup = clone(localSetup)

    const targetParties = targetType === 'elite' ? newSetup.elite_parties : newSetup.sub_parties
    const targetSlot = targetParties[targetPartyIdx].slots[targetSlotIdx]
    const targetRequiredJob = targetSlot.required_job

    if (targetRequiredJob !== 'any' && member.job !== targetRequiredJob) {
      alert(`Slot ini khusus untuk job ${JOB_LABELS[targetRequiredJob as keyof typeof JOB_LABELS]}`)
      setDraggedMember(null)
      return
    }

    const targetExistingMember = targetSlot.assigned_character

    if (sourceType !== null && sourcePartyIdx !== null && sourceSlotIdx !== null) {
      const sourceParties = sourceType === 'elite' ? newSetup.elite_parties : newSetup.sub_parties
      const sourceSlot = sourceParties[sourcePartyIdx].slots[sourceSlotIdx]
      if (targetExistingMember) {
        if (
          sourceSlot.required_job !== 'any' &&
          targetExistingMember.job !== sourceSlot.required_job
        ) {
          alert('Member yang digantikan tidak sesuai dengan required job di slot asal.')
          setDraggedMember(null)
          return
        }
      }
      sourceSlot.assigned_character = targetExistingMember
      if (targetExistingMember) {
        sourceSlot.required_job = targetExistingMember.job
      } else {
        sourceSlot.required_job = 'any'
      }
    }

    targetSlot.assigned_character = member
    targetSlot.required_job = member.job
    setLocalSetup(newSetup)
    setDraggedMember(null)
  }

  const handleDropToBench = () => {
    if (!draggedMember || !localSetup) return
    const { sourceType, sourcePartyIdx, sourceSlotIdx } = draggedMember
    if (sourceType !== null && sourcePartyIdx !== null && sourceSlotIdx !== null) {
      const newSetup = clone(localSetup)
      const sourceParties = sourceType === 'elite' ? newSetup.elite_parties : newSetup.sub_parties
      const sourceSlot = sourceParties[sourcePartyIdx].slots[sourceSlotIdx]
      sourceSlot.assigned_character = null
      sourceSlot.required_job = 'any'
      setLocalSetup(newSetup)
    }
    setDraggedMember(null)
  }

  const isEliteGenerated = localSetup?.elite_parties && localSetup.elite_parties.length > 0
  const isSubGenerated = localSetup?.sub_parties && localSetup.sub_parties.length > 0

  let requiredJobForSlot = 'any'
  if (
    localSetup &&
    selectedPartyType &&
    selectedPartyIndex !== null &&
    selectedSlotIndex !== null
  ) {
    if (selectedPartyType === 'elite' && localSetup.elite_parties?.[selectedPartyIndex]) {
      requiredJobForSlot =
        localSetup.elite_parties[selectedPartyIndex].slots[selectedSlotIndex].required_job
    } else if (selectedPartyType === 'sub' && localSetup.sub_parties?.[selectedPartyIndex]) {
      requiredJobForSlot =
        localSetup.sub_parties[selectedPartyIndex].slots[selectedSlotIndex].required_job
    }
  }

  const availableMembers = members
    .filter((m) => {
      const isAssignedToElite = localSetup?.elite_parties?.some((p: any) =>
        p.slots.some((s: any) => s.assigned_character?.id === m.id),
      )
      const isAssignedToSub = localSetup?.sub_parties?.some((p: any) =>
        p.slots.some((s: any) => s.assigned_character?.id === m.id),
      )
      if (isAssignedToElite || isAssignedToSub) return false
      if (requiredJobForSlot !== 'any') return m.job === requiredJobForSlot
      return true
    })
    .sort((a, b) => (b.pvp_score || 0) - (a.pvp_score || 0))

  const renderPartyCards = (
    parties: any[],
    titleColor: string,
    type: 'elite' | 'sub',
    startIndexOffset: number = 0,
  ) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 auto-rows-fr">
      {parties.map((party: any, localIdx: number) => {
        const idx = startIndexOffset + localIdx
        const totalScore = party.slots.reduce(
          (sum: number, slot: any) => sum + (slot.assigned_character?.pvp_score || 0),
          0,
        )
        const filledSlots = party.slots.filter((s: any) => s.assigned_character).length

        return (
          <div
            key={idx}
            className="rounded-2xl p-4 flex flex-col h-full transition-colors"
            style={{
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-neumorph)',
            }}
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-[18px] font-semibold m-0" style={{ color: titleColor }}>
                {party.party_name}
                <span
                  className="text-[13px] ml-2 font-normal"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ({filledSlots}/5)
                </span>
              </h3>
              <div className="flex-shrink-0">
                <div
                  className="text-[11px] text-right mb-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Total Score
                </div>
                <div
                  className="font-bold text-[14px] text-right"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {Math.round(totalScore).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-2">
              {party.slots.map((slot: any, sIdx: number) => {
                const char = slot.assigned_character
                return (
                  <div
                    key={sIdx}
                    draggable={!!char}
                    onDragStart={(e) => {
                      if (char) {
                        e.stopPropagation()
                        handleDragStart(char, type, idx, sIdx)
                      } else {
                        e.preventDefault()
                      }
                    }}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 min-h-[48px] ${char ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} hover:bg-white/5 relative ${
                      draggedMember &&
                      (slot.required_job === 'any' ||
                        slot.required_job === draggedMember.member.job)
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : ''
                    }`}
                    onClick={() => {
                      if (char) setViewedMember(char)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropToSlot(type, idx, sIdx)}
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-neumorph-inset)',
                    }}
                  >
                    {char ? (
                      <>
                        <Image
                          src={getJobIcon(char.job)}
                          alt=""
                          width={24}
                          height={24}
                          className="object-cover rounded-[20%] flex-shrink-0 pointer-events-none"
                        />
                        <span
                          className="text-[15px] font-semibold flex-1 min-w-0 truncate pointer-events-none"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {char.name}
                        </span>
                        <span className="text-[14px] text-amber-400 font-bold flex-shrink-0 mr-2 pointer-events-none">
                          {Math.round(char.pvp_score).toLocaleString()}
                        </span>
                        <Button
                          variant="danger"
                          size="sm"
                          className="!w-7 !h-7 !p-0 flex-shrink-0 relative z-10"
                          title="Hapus dari party"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeMemberFromParty(type, idx, sIdx)
                          }}
                        >
                          ✕
                        </Button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedPartyType(type)
                          setSelectedPartyIndex(idx)
                          setSelectedSlotIndex(sIdx)
                          setIsAddMemberDialogOpen(true)
                        }}
                        className="w-full flex items-center justify-center font-sans text-[13px] cursor-pointer transition-all duration-200 min-h-[48px] bg-transparent border border-dashed rounded-lg"
                        style={{
                          color: 'var(--text-muted)',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        <span className="text-[14px] italic" style={{ color: 'var(--text-muted)' }}>
                          {draggedMember
                            ? 'Drop karakter di sini...'
                            : JOB_LABELS[slot.required_job as keyof typeof JOB_LABELS] || 'Any'}
                        </span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="max-w-[1400px] mx-auto flex gap-6 relative items-start pb-20 w-full">
      {/* KIRI - Setup Guild League */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div id="tour-gl-header" className="mb-6">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            League Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Atur formasi Guild League (Round-Robin Auto Assign). Total Verified Member:{' '}
            <span className="font-semibold text-emerald-500">{localMembers.filter((m: any) => m.isVerified).length}</span>
          </p>
        </div>

        {/* ELITE SECTION */}
        <div
          className="rounded-3xl p-8 mb-10 transition-colors"
          style={{
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-neumorph)',
          }}
        >
          <section>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold m-0" style={{ color: '#fbbf24' }}>
                Elite Parties (Top 40)
              </h2>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  size="md"
                  disabled={!isEliteGenerated || isClearing}
                  loading={isClearing}
                  onClick={() => handleClear('elite')}
                >
                  Clear Elite
                </Button>
                <Button
                  id="tour-gl-generate-elite"
                  variant="amber"
                  size="md"
                  onClick={() => setIsEliteDialogOpen(true)}
                >
                  Generate Elite Party
                </Button>
              </div>
            </div>

            {!isEliteGenerated ? (
              <EmptyState message="Elite Party belum dibentuk. Klik tombol di atas untuk memulai rancangan." />
            ) : (
              renderPartyCards(localSetup.elite_parties, '#fbbf24', 'elite')
            )}
          </section>
        </div>

        {/* SUB SECTION */}
        <div
          className="rounded-3xl p-8 mb-10 transition-colors"
          style={{
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-neumorph)',
          }}
        >
          <section>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold m-0" style={{ color: '#818cf8' }}>
                Sub Parties
              </h2>
              <div className="flex gap-3">
                <Button
                  variant="danger"
                  size="md"
                  disabled={!isSubGenerated || isClearing}
                  loading={isClearing}
                  onClick={() => handleClear('sub')}
                >
                  Clear Sub
                </Button>
                <Button
                  id="tour-gl-generate-sub"
                  variant={!isEliteGenerated || maxSubParties === 0 ? 'ghost' : 'primary'}
                  size="md"
                  disabled={!isEliteGenerated || maxSubParties === 0}
                  onClick={() => setIsSubDialogOpen(true)}
                >
                  Generate Sub Party
                </Button>
              </div>
            </div>

            {!isEliteGenerated && (
              <p className="text-[13px] -mt-4 mb-6" style={{ color: '#ef4444' }}>
                * Anda harus melakukan Generate Elite Party terlebih dahulu.
              </p>
            )}

            {!isSubGenerated ? (
              isEliteGenerated && <EmptyState message="Sub Party kosong atau belum di-generate." />
            ) : (
              <div className="flex flex-col gap-4">
                {Array.from({ length: Math.ceil(localSetup.sub_parties.length / 8) }).map(
                  (_, groupIdx) => {
                    const groupParties = localSetup.sub_parties.slice(
                      groupIdx * 8,
                      (groupIdx + 1) * 8,
                    )
                    return (
                      <div key={groupIdx}>
                        <div className="flex items-center gap-4 mb-4">
                          <h3 className="text-[18px] font-bold m-0" style={{ color: '#818cf8' }}>
                            Sub Party {groupIdx + 1}
                          </h3>
                          <div
                            className="flex-1 h-px bg-current opacity-20"
                            style={{ color: '#818cf8' }}
                          />
                        </div>
                        {renderPartyCards(groupParties, '#818cf8', 'sub', groupIdx * 8)}
                      </div>
                    )
                  },
                )}
              </div>
            )}
          </section>

          {/* SAVE & CLEAR ALL ACTIONS */}
          <div
            className="flex gap-3 mt-5 border-t pt-5 mb-5"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <Button
              variant="danger"
              size="lg"
              className="flex-1 !justify-center"
              disabled={!localSetup || (!isEliteGenerated && !isSubGenerated) || isClearing}
              loading={isClearing}
              onClick={() => handleClear('all')}
            >
              Clear Formations
            </Button>
            <Button
              id="tour-gl-save"
              variant="amber"
              size="lg"
              loading={isSaveLoading}
              className="flex-[2] !justify-center"
              disabled={!localSetup || isSaveLoading || (!isEliteGenerated && !isSubGenerated)}
              onClick={handleSave}
            >
              {isSaveLoading ? 'Menyimpan...' : 'Simpan Setup'}
            </Button>
          </div>
        </div>
      </div>

      {/* KANAN - Bench */}
      <div
        id="tour-gl-bench"
        className="w-[300px] shrink-0 sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col"
      >
        <div
          className="rounded-2xl flex flex-col flex-1 min-h-0"
          style={{
            background: 'var(--bg-secondary)',
            boxShadow: 'var(--shadow-neumorph-lg)',
            border: '1px solid var(--border-color)',
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropToBench}
        >
          <div
            className="p-4 border-b shrink-0 flex items-center justify-between"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div>
              <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                Benched
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {benchMembers.length} member belum masuk
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {benchMembers.map((m) => (
              <div
                key={m.id}
                draggable
                onDragStart={(e) => {
                  e.stopPropagation()
                  handleDragStart(m, null, null, null)
                }}
                className="flex items-center p-2.5 rounded-xl cursor-grab active:cursor-grabbing hover:opacity-80 transition-all border"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-sm)',
                }}
              >
                <div className="w-8 h-8 relative mr-3 shrink-0">
                  <Image
                    src={getJobIcon(m.job)}
                    alt={m.job}
                    fill
                    sizes="32px"
                    className="object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1" onClick={() => setViewedMember(m)}>
                  <div
                    className="font-semibold text-sm truncate hover:underline cursor-pointer"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {m.name}
                  </div>
                  <div
                    className="text-xs flex justify-between pr-2"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <span className="truncate max-w-[80px]">
                      {JOB_LABELS[m.job as keyof typeof JOB_LABELS]}
                    </span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {m.pvp_score}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {benchMembers.length === 0 && (
              <div
                className="text-center p-6 text-sm italic"
                style={{ color: 'var(--text-muted)' }}
              >
                Semua member sudah teralokasi!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* BLUEPRINT ELITE DIALOG */}
      <GlobalDialog
        isOpen={isEliteDialogOpen}
        onClose={() => setIsEliteDialogOpen(false)}
        title="Blueprint Elite Party"
        maxWidth={1200}
      >
        <div className="text-[14px] mb-5" style={{ color: 'var(--text-secondary)' }}>
          Tentukan kebutuhan Job untuk 8 Elite Party.
        </div>
        <div className="flex flex-col gap-5 max-h-[50vh] overflow-y-auto pr-2">
          {eliteBlueprint.map((party, pIdx) => (
            <div
              key={pIdx}
              className="p-4 rounded-xl border"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-neumorph-inset)',
              }}
            >
              <h3 className="text-[16px] m-0 mb-3 font-semibold" style={{ color: '#fbbf24' }}>
                Elite Party {pIdx + 1}
              </h3>
              <div className="grid grid-cols-5 gap-2.5">
                {party.map((job, sIdx) => (
                  <select
                    key={sIdx}
                    value={job}
                    onChange={(e) => {
                      const newBp = [...eliteBlueprint]
                      newBp[pIdx][sIdx] = e.target.value
                      setEliteBlueprint(newBp)
                    }}
                    className="w-full appearance-none rounded-xl py-3.5 px-4 text-[15px] font-sans transition-all duration-200 outline-none"
                    style={{
                      background: 'var(--bg-secondary)',
                      boxShadow: 'var(--shadow-neumorph-inset)',
                      color: 'var(--text-primary)',
                      border: 'none',
                    }}
                  >
                    <option value="any">Any (Bebas)</option>
                    {JOBS.map((j) => (
                      <option key={j.value} value={j.value}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>
          ))}
        </div>
        <Button variant="amber" size="lg" className="w-full mt-6" onClick={handleGenerateElite}>
          Generate Elite (Preview)
        </Button>
      </GlobalDialog>

      {/* BLUEPRINT SUB DIALOG */}
      <GlobalDialog
        isOpen={isSubDialogOpen}
        onClose={() => setIsSubDialogOpen(false)}
        title="Blueprint Sub Party"
        maxWidth={1200}
      >
        <div
          className="p-3 rounded-lg mb-5 text-[14px] leading-relaxed"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-neumorph-inset)',
            color: 'var(--text-secondary)',
          }}
        >
          Sisa Member di Bench:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{benchMembers.length}</strong> orang
          <br />
          Maksimal Sub Party:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{maxSubParties}</strong>
        </div>
        {maxSubParties === 0 ? (
          <p className="text-center py-5 text-[14px]" style={{ color: '#ef4444' }}>
            Tidak ada cukup sisa member di bench (Minimal 5 orang).
          </p>
        ) : (
          <div className="flex flex-col gap-5 max-h-[50vh] overflow-y-auto pr-2">
            {subBlueprint.map((party, pIdx) => {
              const isFirstOfGroup = pIdx % 8 === 0
              const groupNum = Math.floor(pIdx / 8) + 1
              return (
                <React.Fragment key={pIdx}>
                  {isFirstOfGroup && (
                    <div className="flex items-center gap-4 mt-2">
                      <h3 className="text-[16px] font-bold m-0" style={{ color: '#818cf8' }}>
                        Group Sub Party {groupNum}
                      </h3>
                      <div
                        className="flex-1 h-px bg-current opacity-20"
                        style={{ color: '#818cf8' }}
                      />
                    </div>
                  )}
                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-neumorph-inset)',
                    }}
                  >
                    <h3 className="text-[16px] m-0 mb-3 font-semibold" style={{ color: '#818cf8' }}>
                      Sub Party {groupNum} - P{(pIdx % 8) + 1}
                    </h3>
                    <div className="grid grid-cols-5 gap-2.5">
                      {party.map((job, sIdx) => (
                        <select
                          key={sIdx}
                          value={job}
                          onChange={(e) => {
                            const newBp = [...subBlueprint]
                            newBp[pIdx][sIdx] = e.target.value
                            setSubBlueprint(newBp)
                          }}
                          className="w-full appearance-none rounded-xl py-3.5 px-4 text-[15px] font-sans transition-all duration-200 outline-none"
                          style={{
                            background: 'var(--bg-secondary)',
                            boxShadow: 'var(--shadow-neumorph-inset)',
                            color: 'var(--text-primary)',
                            border: 'none',
                          }}
                        >
                          <option value="any">Any (Bebas)</option>
                          {JOBS.map((j) => (
                            <option key={j.value} value={j.value}>
                              {j.label}
                            </option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        )}
        <Button
          variant="primary"
          size="lg"
          className="w-full mt-6"
          disabled={maxSubParties === 0}
          onClick={handleGenerateSub}
        >
          👥 Generate Sub (Preview)
        </Button>
      </GlobalDialog>

      {/* ADD MEMBER PICKER DIALOG */}
      <GlobalDialog
        isOpen={isAddMemberDialogOpen}
        onClose={() => setIsAddMemberDialogOpen(false)}
        title="Tambah Member ke Party"
      >
        <div className="text-[14px] mb-5" style={{ color: 'var(--text-secondary)' }}>
          Pilih member yang belum terassign.
        </div>
        {availableMembers.length === 0 ? (
          <p className="text-center py-5 text-[14px]" style={{ color: '#ef4444' }}>
            Tidak ada member tersisa.
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
            {availableMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => addMemberToParty(member.id)}
                className="flex items-center gap-3 p-3 rounded-xl border w-full text-left transition-all duration-200 font-sans text-[14px]"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-sm)',
                  color: 'var(--text-primary)',
                }}
              >
                <Image
                  src={getJobIcon(member.job)}
                  alt=""
                  width={24}
                  height={24}
                  className="object-cover rounded-[20%] flex-shrink-0"
                />
                <span className="truncate">{member.name}</span>
                <span className="text-[14px] text-amber-400 font-bold ml-auto flex-shrink-0">
                  {Math.round(member.pvp_score).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        )}
      </GlobalDialog>

      <CharacterDetailModal
        member={localMembers.find((m: any) => m.id === viewedMember?.id) || viewedMember}
        isOpen={!!viewedMember}
        onClose={async (isUpdated) => {
          setViewedMember(null)
          if (isUpdated) {
            const updated = await getCharactersDashboard(guild.id)
            setLocalMembers(updated)

            if (localSetup) {
              const newSetup = clone(localSetup)
              const updateParties = (parties: any[]) => {
                parties.forEach((p: any) => {
                  p.slots.forEach((s: any) => {
                    if (s.assigned_character) {
                      const updatedChar = updated.find((m: any) => m.id === s.assigned_character.id || m.id === s.assigned_character)
                      if (updatedChar) {
                        s.assigned_character = updatedChar
                        s.required_job = updatedChar.job
                      }
                    }
                  })
                })
              }
              if (newSetup.elite_parties) updateParties(newSetup.elite_parties)
              if (newSetup.sub_parties) updateParties(newSetup.sub_parties)
              setLocalSetup(newSetup)
            }
          }
        }}
      />
    </div>
  )
}
