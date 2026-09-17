'use client'

import React, { useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { GlobalDialog } from '../../components/GlobalDialog'
import { CharacterDetailModal } from '../../components/CharacterDetailModal'
import { CharacterCard } from '../../components/CharacterCard'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { handleAuthError } from '../../components/SessionExpiredDialog'
import { JOB_LABELS } from '@/const/JobLabels'
import { generateEliteParty } from '@/actions/guild/generateEliteParty'
import { generateSubParty } from '@/actions/guild/generateSubParty'
import { savePartySetup } from '@/actions/guild/savePartySetup'
import { clearParties } from '@/actions/guild/clearParties'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { LineupExportModal } from '../../components/LineupExportModal'
import { Icon } from '@iconify/react'
import type { Guild, Character, PartySetup, Party, PartySlotCharacter } from '@/types'

interface GuildLeagueClientProps {
  guild: Guild
  members: Character[]
  initialSetup: PartySetup | null
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`
const clone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj))

export function GuildLeagueClient({ guild, members, initialSetup }: GuildLeagueClientProps) {
  const router = useRouter()
  const [localMembers, setLocalMembers] = useState(members)

  // local setup state
  const [localSetup, setLocalSetup] = useState<PartySetup | null>(() => {
    if (initialSetup) {
      return clone(initialSetup)
    }
    return null
  })

  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [selectedPartyIndex, setSelectedPartyIndex] = useState<number | null>(null)
  const [selectedPartyType, setSelectedPartyType] = useState<'elite' | 'sub' | null>(null)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [isSaveLoading, setIsSaveLoading] = useState(false)
  const [isClearing, startClearTransition] = useTransition()
  const [viewedMember, setViewedMember] = useState<Character | PartySlotCharacter | null>(null)
  const [draggedMember, setDraggedMember] = useState<{
    member: Character | PartySlotCharacter
    sourceType: 'elite' | 'sub' | null
    sourcePartyIdx: number | null
    sourceSlotIdx: number | null
  } | null>(null)

  const getAssignedMemberIds = () => {
    if (!localSetup) return []
    const eliteIds =
      localSetup.elite_parties?.flatMap((p) =>
        p.slots
          .map((s) =>
            typeof s.assigned_character === 'string'
              ? s.assigned_character
              : s.assigned_character?.id,
          )
          .filter((id): id is string => Boolean(id)),
      ) || []
    const subIds =
      localSetup.sub_parties?.flatMap((p) =>
        p.slots
          .map((s) =>
            typeof s.assigned_character === 'string'
              ? s.assigned_character
              : s.assigned_character?.id,
          )
          .filter((id): id is string => Boolean(id)),
      ) || []
    return [...eliteIds, ...subIds]
  }

  const assignedIds = getAssignedMemberIds()
  const benchMembers = localMembers.filter((m) => !assignedIds.includes(m.id))
  // Sub 1 harus full (40) dulu baru bisa bikin sub 2.
  // Dan untuk bikin sub 2 (atau sub berikutnya), minimal sisa 5 orang.
  const calculateMaxSubParties = (total: number) => {
    if (total <= 40) return Math.ceil(total / 5)

    const fullGroups = Math.floor(total / 40)
    const leftover = total % 40

    // Hanya bikin party ekstra di Sub 2/Sub 3 jika sisa member >= 5
    const extraParties = leftover >= 5 ? Math.ceil(leftover / 5) : 0

    return fullGroups * 8 + extraParties
  }

  const maxSubParties = calculateMaxSubParties(benchMembers.length)

  // removed blueprint effects

  const handleGenerateElite = async () => {
    const defaultBlueprint = Array(8)
      .fill(null)
      .map(() => Array(5).fill('any'))
    const res = await generateEliteParty(guild.id, defaultBlueprint, localMembers)
    if (res.success) {
      const newSetup: PartySetup = localSetup
        ? clone(localSetup)
        : {
            id: '',
            guild_id: guild.id,
            elite_parties: [],
            sub_parties: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
      newSetup.elite_parties = res.parties || []
      newSetup.sub_parties = []
      setLocalSetup(newSetup)
    } else {
      alert('Gagal generate: ' + (res.message || res.error))
    }
  }

  const handleGenerateSub = async () => {
    if (!localSetup) return
    const needed = Math.max(1, maxSubParties)
    const defaultBlueprint = Array(needed)
      .fill(null)
      .map(() => Array(5).fill('any'))
    const res = await generateSubParty(guild.id, defaultBlueprint, benchMembers)
    if (res.success) {
      const newSetup = clone(localSetup)
      newSetup.sub_parties = res.parties || []
      setLocalSetup(newSetup)
    } else {
      alert('Gagal generate sub: ' + (res.message || res.error))
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
      if (handleAuthError(res)) return
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
          if (handleAuthError(res)) return
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
    setLocalSetup(newSetup)
  }

  const addMemberToParty = (memberId: string) => {
    if (
      selectedPartyType === null ||
      selectedPartyIndex === null ||
      selectedSlotIndex === null ||
      !localSetup
    )
      return
    const member = members.find((m) => m.id === memberId)
    if (!member) return
    const newSetup = clone(localSetup)
    if (selectedPartyType === 'elite' && newSetup.elite_parties) {
      newSetup.elite_parties[selectedPartyIndex].slots[selectedSlotIndex].assigned_character =
        member
    } else if (newSetup.sub_parties) {
      newSetup.sub_parties[selectedPartyIndex].slots[selectedSlotIndex].assigned_character = member
    }
    setLocalSetup(newSetup)
    setIsAddMemberDialogOpen(false)
    setSelectedPartyIndex(null)
    setSelectedPartyType(null)
    setSelectedSlotIndex(null)
  }

  const handleDragStart = (
    member: Character | PartySlotCharacter,
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
    if (!targetParties) return
    const targetSlot = targetParties[targetPartyIdx].slots[targetSlotIdx]
    const targetExistingMember = targetSlot.assigned_character

    if (sourceType !== null && sourcePartyIdx !== null && sourceSlotIdx !== null) {
      const sourceParties = sourceType === 'elite' ? newSetup.elite_parties : newSetup.sub_parties
      if (sourceParties) {
        const sourceSlot = sourceParties[sourcePartyIdx].slots[sourceSlotIdx]
        sourceSlot.assigned_character = targetExistingMember
        sourceSlot.required_job = 'any'
      }
    }

    targetSlot.assigned_character = member
    targetSlot.required_job = 'any'
    setLocalSetup(newSetup)
    setDraggedMember(null)
  }

  const handleDropToBench = () => {
    if (!draggedMember || !localSetup) return
    const { sourceType, sourcePartyIdx, sourceSlotIdx } = draggedMember
    if (sourceType !== null && sourcePartyIdx !== null && sourceSlotIdx !== null) {
      const newSetup = clone(localSetup)
      const sourceParties = sourceType === 'elite' ? newSetup.elite_parties : newSetup.sub_parties
      if (sourceParties) {
        const sourceSlot = sourceParties[sourcePartyIdx].slots[sourceSlotIdx]
        sourceSlot.assigned_character = null
        setLocalSetup(newSetup)
      }
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
        localSetup.elite_parties[selectedPartyIndex].slots[selectedSlotIndex]?.required_job || 'any'
    } else if (selectedPartyType === 'sub' && localSetup.sub_parties?.[selectedPartyIndex]) {
      requiredJobForSlot =
        localSetup.sub_parties[selectedPartyIndex].slots[selectedSlotIndex]?.required_job || 'any'
    }
  }

  const availableMembers = members
    .filter((m) => {
      const isAssignedToElite = localSetup?.elite_parties?.some((p) =>
        p.slots.some((s) => {
          const id =
            typeof s.assigned_character === 'string'
              ? s.assigned_character
              : s.assigned_character?.id
          return id === m.id
        }),
      )
      const isAssignedToSub = localSetup?.sub_parties?.some((p) =>
        p.slots.some((s) => {
          const id =
            typeof s.assigned_character === 'string'
              ? s.assigned_character
              : s.assigned_character?.id
          return id === m.id
        }),
      )
      if (isAssignedToElite || isAssignedToSub) return false
      if (requiredJobForSlot !== 'any') return m.job === requiredJobForSlot
      return true
    })
    .sort((a, b) => Number(b.pvp_score || 0) - Number(a.pvp_score || 0))

  const renderPartyCards = (
    parties: Party[],
    titleColor: string,
    type: 'elite' | 'sub',
    startIndexOffset: number = 0,
  ) => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 mb-6 auto-rows-fr">
      {parties.map((party, localIdx: number) => {
        const idx = startIndexOffset + localIdx
        const totalScore = party.slots.reduce((sum: number, slot) => {
          const char = typeof slot.assigned_character === 'object' ? slot.assigned_character : null
          return sum + Number(char?.pvp_score || 0)
        }, 0)
        const filledSlots = party.slots.filter((s) => s.assigned_character).length

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
              {party.slots.map((slot, sIdx: number) => {
                const char = slot.assigned_character
                const charObj =
                  typeof char === 'object' && char !== null
                    ? char
                    : char
                      ? members.find((m) => m.id === char) || null
                      : null
                return (
                  <div
                    key={sIdx}
                    draggable={!!charObj}
                    onDragStart={(e) => {
                      if (charObj) {
                        e.stopPropagation()
                        handleDragStart(charObj, type, idx, sIdx)
                      } else {
                        e.preventDefault()
                      }
                    }}
                    className={`flex items-center p-2.5 rounded-xl border relative group transition-colors ${charObj ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} hover:opacity-80 ${
                      draggedMember ? 'border-emerald-500/50 bg-emerald-500/5' : ''
                    }`}
                    onClick={() => {
                      if (charObj) setViewedMember(charObj)
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropToSlot(type, idx, sIdx)}
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-neumorph-sm)',
                    }}
                  >
                    {charObj ? (
                      <CharacterCard
                        character={charObj}
                        onRemove={(e) => {
                          e.stopPropagation()
                          removeMemberFromParty(type, idx, sIdx)
                        }}
                      />
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedPartyType(type)
                          setSelectedPartyIndex(idx)
                          setSelectedSlotIndex(sIdx)
                          setIsAddMemberDialogOpen(true)
                        }}
                        className="w-full flex items-center justify-center font-sans text-[13px] cursor-pointer transition-all duration-200 min-h-[42px] bg-transparent border border-dashed rounded-lg"
                        style={{
                          color: 'var(--text-muted)',
                          borderColor: 'var(--border-color)',
                        }}
                      >
                        <span className="text-[13px] italic" style={{ color: 'var(--text-muted)' }}>
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
        <div id="tour-gl-header" className="mb-6 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              League Management
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Atur formasi Guild League (Round-Robin Auto Assign). Total Verified Member:{' '}
              <span className="font-semibold text-emerald-500">
                {localMembers.filter((m) => m.isVerified).length}
              </span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="md"
            className="border shadow-sm flex items-center gap-2"
            disabled={!isEliteGenerated && !isSubGenerated}
            onClick={() => setIsExportModalOpen(true)}
          >
            <Icon icon="fluent:arrow-download-20-filled" className="w-4 h-4 text-indigo-400" />
            <span>Download Lineup</span>
          </Button>
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
                <Button variant="danger" size="sm" onClick={() => handleGenerateElite()}>
                  Generate Elite
                </Button>
              </div>
            </div>

            {!isEliteGenerated ? (
              <EmptyState message="Elite Party belum dibentuk. Klik tombol di atas untuk memulai rancangan." />
            ) : (
              renderPartyCards(localSetup.elite_parties || [], '#fbbf24', 'elite')
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
                <Button variant="danger" size="sm" onClick={() => handleGenerateSub()}>
                  Generate Sub
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
                {Array.from({ length: Math.ceil((localSetup.sub_parties || []).length / 8) }).map(
                  (_, groupIdx) => {
                    const groupParties = (localSetup.sub_parties || []).slice(
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
            className="flex gap-3 mt-5 border-t pt-5 mb-5 flex-wrap"
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
              variant="ghost"
              size="lg"
              className="flex-1 !justify-center border"
              disabled={!localSetup || (!isEliteGenerated && !isSubGenerated)}
              onClick={() => setIsExportModalOpen(true)}
            >
              <Icon
                icon="fluent:arrow-download-20-filled"
                className="w-5 h-5 text-indigo-400 mr-1.5"
              />
              Download Lineup
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
                <CharacterCard character={m} />
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
                  {Math.round(Number(member.pvp_score) || 0).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        )}
      </GlobalDialog>

      <CharacterDetailModal
        member={localMembers.find((m) => m.id === viewedMember?.id) || null}
        isOpen={!!viewedMember}
        onClose={async (isUpdated) => {
          setViewedMember(null)
          if (isUpdated) {
            const updated = await getCharactersDashboard(guild.id)
            setLocalMembers(updated)

            if (localSetup) {
              const newSetup = clone(localSetup)
              const updateParties = (parties: Party[]) => {
                parties.forEach((p) => {
                  p.slots.forEach((s) => {
                    if (s.assigned_character) {
                      const assignedId =
                        typeof s.assigned_character === 'string'
                          ? s.assigned_character
                          : s.assigned_character.id
                      const updatedChar = updated.find((m) => m.id === assignedId)
                      if (updatedChar) {
                        s.assigned_character = updatedChar
                        s.required_job = 'any'
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
      <LineupExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="gl"
        guildName={guild.name}
        members={localMembers}
        eliteParties={localSetup?.elite_parties || []}
        subParties={localSetup?.sub_parties || []}
        benchedMembers={benchMembers}
      />
    </div>
  )
}
