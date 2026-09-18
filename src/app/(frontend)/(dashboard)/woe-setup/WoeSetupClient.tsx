'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { GlobalDialog } from '../../components/GlobalDialog'
import { CharacterDetailModal } from '../../components/CharacterDetailModal'
import { CharacterCard } from '../../components/CharacterCard'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { handleAuthError } from '../../components/SessionExpiredDialog'
import { JOB_LABELS } from '@/const/JobLabels'
import { saveWoeSetup } from '@/actions/woe/saveWoeSetup'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { LineupExportModal } from '../../components/LineupExportModal'
import { Icon } from '@iconify/react'
import type { Guild, Character, WoeSetup, WoeRaid, PartySlotCharacter } from '@/types'

interface WoeSetupClientProps {
  guild: Guild
  members: Character[]
  initialSetup: WoeSetup | null
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`
const clone = <T,>(obj: T): T => JSON.parse(JSON.stringify(obj))

const createNewRaid = (name: string): WoeRaid => {
  const parties = []
  for (let i = 0; i < 8; i++) {
    parties.push({
      name: `Party ${i + 1}`,
      party_name: `Party ${i + 1}`,
      slots: Array(5)
        .fill(null)
        .map(() => ({ required_job: 'any', assigned_character: null })),
    })
  }
  return { name, raid_name: name, parties }
}

const hydrateRaids = (rawRaids: WoeRaid[], membersList: Character[]): WoeRaid[] => {
  return (rawRaids || []).map((raid) => ({
    ...raid,
    name: raid.name || raid.raid_name || 'Raid',
    raid_name: raid.raid_name || raid.name || 'Raid',
    parties: (raid.parties || []).map((party, pIdx) => ({
      ...party,
      name: party.name || party.party_name || `Party ${pIdx + 1}`,
      party_name: party.party_name || party.name || `Party ${pIdx + 1}`,
      slots: (party.slots || []).map((slot) => {
        let assignedChar: Character | PartySlotCharacter | null = null
        if (slot.assigned_character) {
          if (typeof slot.assigned_character === 'object') {
            assignedChar = slot.assigned_character
          } else if (typeof slot.assigned_character === 'string') {
            assignedChar = membersList.find((m) => m.id === slot.assigned_character) || null
          }
        }
        return {
          ...slot,
          assigned_character: assignedChar,
        }
      }),
    })),
  }))
}

export function WoeSetupClient({ guild, members, initialSetup }: WoeSetupClientProps) {
  const [localMembers, setLocalMembers] = useState(members)
  const [raids, setRaids] = useState<WoeRaid[]>(() => {
    if (initialSetup?.raids && initialSetup.raids.length > 0) {
      return hydrateRaids(initialSetup.raids, members)
    }
    return [createNewRaid('Raid 1')]
  })
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  // Drag and drop state
  const [draggedMember, setDraggedMember] = useState<{
    member: Character | PartySlotCharacter
    sourceRaidIdx: number | null
    sourcePartyIdx: number | null
    sourceSlotIdx: number | null
  } | null>(null)

  // Modals state
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [selectedRaidIndex, setSelectedRaidIndex] = useState<number | null>(null)
  const [selectedPartyIndex, setSelectedPartyIndex] = useState<number | null>(null)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)

  const [viewedMemberId, setViewedMemberId] = useState<string | null>(null)

  // Helper to resolve character for any slot safely
  const getSlotCharacter = (
    assigned: PartySlotCharacter | string | null | undefined,
  ): Character | PartySlotCharacter | null => {
    if (!assigned) return null
    if (typeof assigned === 'object') return assigned
    return localMembers.find((m) => m.id === assigned) || null
  }

  // Initialize and keep in sync with server revalidation
  useEffect(() => {
    if (initialSetup?.raids && initialSetup.raids.length > 0) {
      setRaids(hydrateRaids(initialSetup.raids, localMembers))
    } else if (!initialSetup?.raids || initialSetup.raids.length === 0) {
      setRaids([createNewRaid('Raid 1')])
    }
  }, [initialSetup, localMembers])

  const handleAddRaid = () => {
    setRaids((prev) => [...prev, createNewRaid(`Raid ${prev.length + 1}`)])
  }

  const handleDeleteRaid = (raidIdx: number) => {
    if (confirm('Are you sure you want to delete this Raid?')) {
      setRaids((prev) => prev.filter((_, i) => i !== raidIdx))
    }
  }

  const generateRaid = (raidIdx: number) => {
    // Collect assigned members from other raids
    const assignedIds = new Set<string>()
    raids.forEach((raid, rIdx) => {
      if (rIdx !== raidIdx) {
        raid.parties.forEach((party) => {
          party.slots.forEach((slot) => {
            if (slot.assigned_character) {
              const charId =
                typeof slot.assigned_character === 'object'
                  ? slot.assigned_character.id
                  : slot.assigned_character
              if (charId) assignedIds.add(charId)
            }
          })
        })
      }
    })

    const availableMembers = localMembers
      .filter((m) => !assignedIds.has(m.id))
      .sort((a, b) => (Number(b.pvp_score) || 0) - (Number(a.pvp_score) || 0))

    const newRaids = clone(raids)
    const targetRaid = newRaids[raidIdx]

    // Clear existing assignments in this raid
    targetRaid.parties.forEach((party) => {
      party.slots.forEach((slot) => {
        slot.assigned_character = null
      })
    })

    // Assign based on required_job
    // Loop through slots 0..4, party 0..7 (round robin)
    for (let slotIdx = 0; slotIdx < 5; slotIdx++) {
      for (let partyIdx = 0; partyIdx < 8; partyIdx++) {
        if (availableMembers.length === 0) break

        const requestedJob = targetRaid.parties[partyIdx].slots[slotIdx].required_job
        let selectedIndex = -1

        if (requestedJob === 'any') {
          selectedIndex = 0
        } else {
          selectedIndex = availableMembers.findIndex((m) => m.job === requestedJob)
        }

        if (selectedIndex !== -1) {
          targetRaid.parties[partyIdx].slots[slotIdx].assigned_character =
            availableMembers[selectedIndex]
          targetRaid.parties[partyIdx].slots[slotIdx].required_job =
            availableMembers[selectedIndex].job
          availableMembers.splice(selectedIndex, 1) // Remove from pool
        }
      }
    }

    setRaids(newRaids)
  }

  const handleSave = () => {
    setSaveStatus(null)
    startTransition(async () => {
      // Clean up relations for Payload
      const payloadRaids = raids.map((raid) => ({
        ...raid,
        parties: raid.parties.map((party) => ({
          ...party,
          slots: party.slots.map((slot) => ({
            required_job: slot.required_job,
            assigned_character:
              typeof slot.assigned_character === 'object' && slot.assigned_character
                ? slot.assigned_character.id
                : (slot.assigned_character ?? null),
          })),
        })),
      }))

      const res = await saveWoeSetup(guild.id, payloadRaids)
      if (res.success) {
        if (res.data?.doc?.raids) {
          setRaids(hydrateRaids(res.data.doc.raids, localMembers))
        }
        setSaveStatus('success')
        setTimeout(() => setSaveStatus(null), 3000)
      } else {
        setSaveStatus('error')
        if (handleAuthError(res)) return
        alert('Failed to save: ' + res.message)
      }
    })
  }

  const clearRaid = (raidIdx: number) => {
    if (!confirm('Clear all members and reset the job blueprint in this Raid?')) return
    const newRaids = clone(raids)
    newRaids[raidIdx].parties.forEach((party) => {
      party.slots.forEach((slot) => {
        slot.assigned_character = null
        slot.required_job = 'any'
      })
    })
    setRaids(newRaids)
  }

  const removeMember = (raidIdx: number, partyIdx: number, slotIdx: number) => {
    const newRaids = clone(raids)
    newRaids[raidIdx].parties[partyIdx].slots[slotIdx].assigned_character = null
    newRaids[raidIdx].parties[partyIdx].slots[slotIdx].required_job = 'any'
    setRaids(newRaids)
  }

  const handleDragStart = (
    member: Character | PartySlotCharacter,
    sourceRaidIdx: number | null,
    sourcePartyIdx: number | null,
    sourceSlotIdx: number | null,
  ) => {
    setDraggedMember({ member, sourceRaidIdx, sourcePartyIdx, sourceSlotIdx })
  }

  const handleDropToSlot = (
    targetRaidIdx: number,
    targetPartyIdx: number,
    targetSlotIdx: number,
  ) => {
    if (!draggedMember) return
    const { member, sourceRaidIdx, sourcePartyIdx, sourceSlotIdx } = draggedMember
    const newRaids = clone(raids)
    const targetSlot = newRaids[targetRaidIdx].parties[targetPartyIdx].slots[targetSlotIdx]
    const targetExistingMember = targetSlot.assigned_character

    if (sourceRaidIdx !== null && sourcePartyIdx !== null && sourceSlotIdx !== null) {
      const sourceSlot = newRaids[sourceRaidIdx].parties[sourcePartyIdx].slots[sourceSlotIdx]
      sourceSlot.assigned_character = targetExistingMember
      sourceSlot.required_job = 'any'
    }

    targetSlot.assigned_character = member
    targetSlot.required_job = 'any'
    setRaids(newRaids)
    setDraggedMember(null)
  }

  const handleDropToBench = () => {
    if (!draggedMember) return
    const { sourceRaidIdx, sourcePartyIdx, sourceSlotIdx } = draggedMember
    if (sourceRaidIdx !== null && sourcePartyIdx !== null && sourceSlotIdx !== null) {
      const newRaids = clone(raids)
      newRaids[sourceRaidIdx].parties[sourcePartyIdx].slots[sourceSlotIdx].assigned_character = null
      newRaids[sourceRaidIdx].parties[sourcePartyIdx].slots[sourceSlotIdx].required_job = 'any'
      setRaids(newRaids)
    }
    setDraggedMember(null)
  }

  const openAddMemberDialog = (raidIdx: number, partyIdx: number, slotIdx: number) => {
    setSelectedRaidIndex(raidIdx)
    setSelectedPartyIndex(partyIdx)
    setSelectedSlotIndex(slotIdx)
    setIsAddMemberDialogOpen(true)
  }

  const addMemberToParty = (memberId: string) => {
    if (selectedRaidIndex === null || selectedPartyIndex === null || selectedSlotIndex === null)
      return
    const member = localMembers.find((m) => m.id === memberId)
    if (!member) return
    const newRaids = clone(raids)
    newRaids[selectedRaidIndex].parties[selectedPartyIndex].slots[
      selectedSlotIndex
    ].assigned_character = member
    newRaids[selectedRaidIndex].parties[selectedPartyIndex].slots[selectedSlotIndex].required_job =
      'any'
    setRaids(newRaids)
    setIsAddMemberDialogOpen(false)
    setSelectedRaidIndex(null)
    setSelectedPartyIndex(null)
    setSelectedSlotIndex(null)
  }

  // Derived state
  const assignedMemberIds = new Set<string>()
  raids.forEach((raid) => {
    raid.parties.forEach((party) => {
      party.slots.forEach((slot) => {
        if (slot.assigned_character) {
          const id =
            typeof slot.assigned_character === 'object'
              ? slot.assigned_character.id
              : slot.assigned_character
          if (id) assignedMemberIds.add(id)
        }
      })
    })
  })

  let requiredJobForSlot = 'any'
  if (selectedRaidIndex !== null && selectedPartyIndex !== null && selectedSlotIndex !== null) {
    requiredJobForSlot =
      raids[selectedRaidIndex]?.parties[selectedPartyIndex]?.slots[selectedSlotIndex]
        ?.required_job || 'any'
  }

  const dialogAvailableMembers = localMembers
    .filter((m) => {
      if (assignedMemberIds.has(m.id)) return false
      if (requiredJobForSlot !== 'any') return m.job === requiredJobForSlot
      return true
    })
    .sort((a, b) => Number(b.pvp_score || 0) - Number(a.pvp_score || 0))

  const benchedMembers = localMembers
    .filter((m) => !assignedMemberIds.has(m.id))
    .sort((a, b) => Number(b.pvp_score || 0) - Number(a.pvp_score || 0))

  const totalVerifiedMembers = localMembers.filter((m) => m.isVerified).length

  return (
    <div className="max-w-[1400px] mx-auto flex gap-6 relative items-start pb-20 w-full">
      {/* LEFT - Raid Setup */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div id="tour-woe-header">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              WoE Setup
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Configure WoE formations per Raid. Total Verified Members:{' '}
              <span className="font-semibold text-emerald-500">{totalVerifiedMembers}</span>
            </p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <Button
              variant="ghost"
              size="md"
              className="border shadow-sm flex items-center gap-2"
              onClick={() => setIsExportModalOpen(true)}
            >
              <Icon icon="fluent:arrow-download-20-filled" className="w-4 h-4 text-indigo-400" />
              <span>Download Lineup</span>
            </Button>
            <Button id="tour-woe-add-castle" variant="amber" size="md" onClick={handleAddRaid}>
              + Add Raid
            </Button>
            <Button
              variant={saveStatus === 'success' ? 'success' : 'primary'}
              size="md"
              loading={isPending}
              onClick={handleSave}
            >
              {saveStatus === 'success' ? 'Saved Successfully!' : 'Save Setup'}
            </Button>
          </div>
        </div>

        <div id="tour-woe-list" className="space-y-8">
          {raids.map((raid, raidIdx) => (
            <div
              key={raidIdx}
              className="p-5 rounded-2xl border"
              style={{ borderColor: 'var(--border-color)', background: 'var(--bg-secondary)' }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  {raid.raid_name || raid.name}
                </h2>
                <div className="flex gap-2">
                  <Button variant="amber" size="sm" onClick={() => clearRaid(raidIdx)}>
                    Clear
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => generateRaid(raidIdx)}>
                    Generate {raid.raid_name || raid.name}
                  </Button>
                  {raidIdx > 0 && (
                    <Button variant="danger" size="sm" onClick={() => handleDeleteRaid(raidIdx)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
                {raid.parties.map((party, partyIdx: number) => {
                  const totalScore = party.slots.reduce((sum: number, slot) => {
                    const char = getSlotCharacter(slot.assigned_character)
                    return sum + (Number(char?.pvp_score) || 0)
                  }, 0)
                  const filledSlots = party.slots.filter((s) =>
                    Boolean(s.assigned_character),
                  ).length

                  return (
                    <div
                      key={partyIdx}
                      className="rounded-3xl p-5 flex flex-col h-full transition-colors apple-glass border border-black/5 dark:border-white/10 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-base font-bold tracking-tight m-0 text-sky-500">
                          {party.name}
                          <span
                            className="text-xs ml-2 font-normal"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            ({filledSlots}/5)
                          </span>
                        </h3>
                        <div className="flex-shrink-0">
                          <div
                            className="text-[11px] text-right mb-0.5 uppercase tracking-wider"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            Total Score
                          </div>
                          <div
                            className="font-bold text-sm text-right tabular-nums"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {Math.round(totalScore).toLocaleString('en-US')}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2.5 flex-1">
                        {party.slots.map((slot, slotIdx: number) => {
                          const char = getSlotCharacter(slot.assigned_character)
                          return (
                            <div
                              key={slotIdx}
                              draggable={!!char}
                              onDragStart={(e) => {
                                if (char) {
                                  e.stopPropagation()
                                  handleDragStart(char, raidIdx, partyIdx, slotIdx)
                                } else {
                                  e.preventDefault()
                                }
                              }}
                              className={`flex items-center p-2.5 rounded-2xl border border-black/5 dark:border-white/10 relative group transition-all ${char ? 'cursor-grab active:cursor-grabbing bg-black/[0.02] dark:bg-white/[0.03] hover:bg-black/[0.04] dark:hover:bg-white/[0.05]' : 'cursor-pointer hover:border-black/20 dark:hover:border-white/20'} ${draggedMember ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
                              onDragOver={(e) => {
                                e.preventDefault()
                              }}
                              onDrop={() => handleDropToSlot(raidIdx, partyIdx, slotIdx)}
                              onClick={() => {
                                if (char) setViewedMemberId(char.id)
                              }}
                            >
                              {char ? (
                                <CharacterCard
                                  character={char}
                                  onRemove={(e) => {
                                    e.stopPropagation()
                                    removeMember(raidIdx, partyIdx, slotIdx)
                                  }}
                                />
                              ) : (
                                <button
                                  onClick={() => openAddMemberDialog(raidIdx, partyIdx, slotIdx)}
                                  className="w-full flex items-center justify-center font-sans text-xs cursor-pointer transition-all duration-200 min-h-[42px] bg-transparent border border-dashed border-black/15 dark:border-white/15 rounded-xl apple-press"
                                  style={{
                                    color: 'var(--text-muted)',
                                  }}
                                >
                                  <span
                                    className="text-xs italic"
                                    style={{ color: 'var(--text-muted)' }}
                                  >
                                    {draggedMember
                                      ? 'Drop character here...'
                                      : slot.required_job && slot.required_job !== 'any'
                                        ? JOB_LABELS[
                                            slot.required_job as keyof typeof JOB_LABELS
                                          ] || slot.required_job
                                        : '+ Add Character'}
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
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT - Bench */}
      <div
        id="tour-woe-benched"
        className="w-[300px] shrink-0 sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col"
      >
        <div
          className="rounded-3xl flex flex-col flex-1 min-h-0 apple-glass border border-black/5 dark:border-white/10 shadow-md"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropToBench}
        >
          <div className="p-4 border-b border-black/5 dark:border-white/10 shrink-0 flex items-center justify-between">
            <div>
              <h2
                className="font-bold text-base tracking-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Benched
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {benchedMembers.length} unassigned member{benchedMembers.length === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {benchedMembers.map((m) => (
              <div
                key={m.id}
                draggable
                onDragStart={() => handleDragStart(m, null, null, null)}
                className="flex items-center p-2.5 rounded-2xl cursor-grab active:cursor-grabbing hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03]"
              >
                <CharacterCard character={m} />
              </div>
            ))}
            {benchedMembers.length === 0 && (
              <div
                className="text-center p-6 text-sm italic"
                style={{ color: 'var(--text-muted)' }}
              >
                All members have been assigned!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SELECT MEMBER DIALOG */}
      <GlobalDialog
        isOpen={isAddMemberDialogOpen}
        onClose={() => setIsAddMemberDialogOpen(false)}
        title="Select Member"
      >
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2 pr-2">
          {dialogAvailableMembers.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 rounded-xl border hover:border-emerald-500/30 cursor-pointer transition-all"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
              }}
              onClick={() => addMemberToParty(m.id)}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 relative mr-3 shrink-0 bg-black/5 dark:bg-white/5 rounded-lg p-1">
                  <Image
                    src={getJobIcon(m.job)}
                    alt={m.job}
                    fill
                    sizes="40px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    {m.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {JOB_LABELS[m.job as keyof typeof JOB_LABELS] || m.job}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-[11px] uppercase tracking-wider font-semibold"
                  style={{ color: 'var(--text-muted)' }}
                >
                  PvP Score
                </div>
                <div className="font-bold text-emerald-500">{m.pvp_score}</div>
              </div>
            </div>
          ))}
          {dialogAvailableMembers.length === 0 && (
            <EmptyState message="All members have been allocated." />
          )}
        </div>
      </GlobalDialog>

      {/* Character Detail Modal */}
      <CharacterDetailModal
        member={localMembers.find((m) => m.id === viewedMemberId) || null}
        isOpen={!!viewedMemberId}
        onClose={async (isUpdated) => {
          setViewedMemberId(null)
          if (isUpdated) {
            const updated = await getCharactersDashboard(guild.id)
            setLocalMembers(updated)

            // Sync characters inside raids
            setRaids((prev) => {
              const newRaids: WoeRaid[] = clone(prev)
              newRaids.forEach((r) => {
                r.parties.forEach((p) => {
                  p.slots.forEach((s) => {
                    if (s.assigned_character) {
                      const assignedId =
                        typeof s.assigned_character === 'object'
                          ? s.assigned_character.id
                          : s.assigned_character
                      const updatedChar = updated.find((m) => m.id === assignedId)
                      if (updatedChar) {
                        s.assigned_character = updatedChar
                        s.required_job = updatedChar.job
                      }
                    }
                  })
                })
              })
              return newRaids
            })
          }
        }}
      />
      <LineupExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="woe"
        guildName={guild.name}
        members={localMembers}
        raids={raids}
        benchedMembers={benchedMembers}
      />
    </div>
  )
}
