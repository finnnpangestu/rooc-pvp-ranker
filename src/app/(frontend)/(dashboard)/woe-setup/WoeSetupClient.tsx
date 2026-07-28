'use client'

import React, { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { GlobalDialog } from '../../components/GlobalDialog'
import { CharacterDetailModal } from '../../components/CharacterDetailModal'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { JOBS, JOB_LABELS, JOBS_OPTIONS } from '@/const/JobLabels'
import { saveWoeSetup } from '@/actions/woe/saveWoeSetup'
import { useTheme } from '../../components/ThemeProvider'

interface WoeSetupClientProps {
  guild: any
  members: any[]
  initialSetup: any | null
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`
const clone = (obj: any) => JSON.parse(JSON.stringify(obj))

export function WoeSetupClient({ guild, members, initialSetup }: WoeSetupClientProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [raids, setRaids] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()
  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  // Drag and drop state
  const [draggedMember, setDraggedMember] = useState<{
    member: any
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
  const [openDropdown, setOpenDropdown] = useState<{
    raidIdx: number
    partyIdx: number
    slotIdx: number
  } | null>(null)

  useEffect(() => {
    const handleOutsideClick = () => setOpenDropdown(null)
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Initialize
  useEffect(() => {
    if (initialSetup?.raids && initialSetup.raids.length > 0) {
      setRaids(initialSetup.raids)
    } else {
      // Default: create 1 Raid
      setRaids([createNewRaid('Raid 1')])
    }
  }, [initialSetup])

  const createNewRaid = (name: string) => {
    const parties = []
    for (let i = 0; i < 8; i++) {
      parties.push({
        party_name: `Party ${i + 1}`,
        slots: Array(5)
          .fill(null)
          .map(() => ({ required_job: 'any', assigned_character: null })),
      })
    }
    return { raid_name: name, parties }
  }

  const handleAddRaid = () => {
    setRaids((prev) => [...prev, createNewRaid(`Raid ${prev.length + 1}`)])
  }

  const handleDeleteRaid = (raidIdx: number) => {
    if (confirm('Yakin ingin menghapus Raid ini?')) {
      setRaids((prev) => prev.filter((_, i) => i !== raidIdx))
    }
  }

  const generateRaid = (raidIdx: number) => {
    // Collect assigned members from other raids
    const assignedIds = new Set<string>()
    raids.forEach((raid, rIdx) => {
      if (rIdx !== raidIdx) {
        raid.parties.forEach((party: any) => {
          party.slots.forEach((slot: any) => {
            if (slot.assigned_character) {
              assignedIds.add(slot.assigned_character.id)
            }
          })
        })
      }
    })

    const availableMembers = members
      .filter((m) => !assignedIds.has(m.id))
      .sort((a, b) => (b.pvp_score || 0) - (a.pvp_score || 0))

    const newRaids = clone(raids)
    const targetRaid = newRaids[raidIdx]

    // Clear existing assignments in this raid
    targetRaid.parties.forEach((party: any) => {
      party.slots.forEach((slot: any) => {
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
        parties: raid.parties.map((party: any) => ({
          ...party,
          slots: party.slots.map((slot: any) => ({
            required_job: slot.required_job,
            assigned_character: slot.assigned_character ? slot.assigned_character.id : null,
          })),
        })),
      }))

      const res = await saveWoeSetup(guild.id, payloadRaids)
      if (res.success) {
        setSaveStatus('success')
        setTimeout(() => setSaveStatus(null), 3000)
      } else {
        setSaveStatus('error')
        alert('Gagal menyimpan: ' + res.message)
      }
    })
  }

  const updateRequiredJob = (raidIdx: number, partyIdx: number, slotIdx: number, val: string) => {
    const newRaids = clone(raids)
    newRaids[raidIdx].parties[partyIdx].slots[slotIdx].required_job = val
    if (
      newRaids[raidIdx].parties[partyIdx].slots[slotIdx].assigned_character &&
      val !== 'any' &&
      newRaids[raidIdx].parties[partyIdx].slots[slotIdx].assigned_character.job !== val
    ) {
      newRaids[raidIdx].parties[partyIdx].slots[slotIdx].assigned_character = null
    }
    setRaids(newRaids)
  }

  const clearRaid = (raidIdx: number) => {
    if (!confirm('Kosongkan semua anggota dan reset job blueprint di Raid ini?')) return
    const newRaids = clone(raids)
    newRaids[raidIdx].parties.forEach((party: any) => {
      party.slots.forEach((slot: any) => {
        slot.assigned_character = null
        slot.required_job = 'any'
      })
    })
    setRaids(newRaids)
  }

  const removeMember = (raidIdx: number, partyIdx: number, slotIdx: number) => {
    const newRaids = clone(raids)
    newRaids[raidIdx].parties[partyIdx].slots[slotIdx].assigned_character = null
    setRaids(newRaids)
  }

  const handleDragStart = (
    member: any,
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
    const targetRequiredJob = targetSlot.required_job

    if (targetRequiredJob !== 'any' && member.job !== targetRequiredJob) {
      alert(`Slot ini khusus untuk job ${JOB_LABELS[targetRequiredJob as keyof typeof JOB_LABELS]}`)
      setDraggedMember(null)
      return
    }

    const targetExistingMember = targetSlot.assigned_character

    if (sourceRaidIdx !== null && sourcePartyIdx !== null && sourceSlotIdx !== null) {
      const sourceSlot = newRaids[sourceRaidIdx].parties[sourcePartyIdx].slots[sourceSlotIdx]
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
      }
    }

    targetSlot.assigned_character = member
    targetSlot.required_job = member.job
    setRaids(newRaids)
    setDraggedMember(null)
  }

  const handleDropToBench = () => {
    if (!draggedMember) return
    const { sourceRaidIdx, sourcePartyIdx, sourceSlotIdx } = draggedMember
    if (sourceRaidIdx !== null && sourcePartyIdx !== null && sourceSlotIdx !== null) {
      const newRaids = clone(raids)
      newRaids[sourceRaidIdx].parties[sourcePartyIdx].slots[sourceSlotIdx].assigned_character = null
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
    const member = members.find((m) => m.id === memberId)
    if (!member) return
    const newRaids = clone(raids)
    newRaids[selectedRaidIndex].parties[selectedPartyIndex].slots[
      selectedSlotIndex
    ].assigned_character = member
    newRaids[selectedRaidIndex].parties[selectedPartyIndex].slots[selectedSlotIndex].required_job =
      member.job
    setRaids(newRaids)
    setIsAddMemberDialogOpen(false)
    setSelectedRaidIndex(null)
    setSelectedPartyIndex(null)
    setSelectedSlotIndex(null)
  }

  // Derived state
  const assignedMemberIds = new Set<string>()
  raids.forEach((raid) => {
    raid.parties.forEach((party: any) => {
      party.slots.forEach((slot: any) => {
        if (slot.assigned_character) {
          assignedMemberIds.add(slot.assigned_character.id)
        }
      })
    })
  })

  let requiredJobForSlot = 'any'
  if (selectedRaidIndex !== null && selectedPartyIndex !== null && selectedSlotIndex !== null) {
    requiredJobForSlot =
      raids[selectedRaidIndex].parties[selectedPartyIndex].slots[selectedSlotIndex].required_job
  }

  const dialogAvailableMembers = members
    .filter((m) => {
      if (assignedMemberIds.has(m.id)) return false
      if (requiredJobForSlot !== 'any') return m.job === requiredJobForSlot
      return true
    })
    .sort((a, b) => (b.pvp_score || 0) - (a.pvp_score || 0))

  const benchedMembers = members
    .filter((m) => !assignedMemberIds.has(m.id))
    .sort((a, b) => (b.pvp_score || 0) - (a.pvp_score || 0))

  const totalVerifiedMembers = members.filter((m) => m.isVerified).length

  return (
    <div className="max-w-7xl mx-auto flex gap-6 relative items-start pb-20">
      {/* KIRI - Setup Raid */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div id="tour-woe-header">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              WoE Setup
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Atur formasi WoE per Raid. Total Verified Member:{' '}
              <span className="font-semibold text-emerald-500">{totalVerifiedMembers}</span>
            </p>
          </div>
          <div className="flex gap-3">
            <Button id="tour-woe-add-castle" variant="amber" size="md" onClick={handleAddRaid}>
              + Add Raid
            </Button>
            <Button
              variant={saveStatus === 'success' ? 'success' : 'primary'}
              size="md"
              loading={isPending}
              onClick={handleSave}
            >
              {saveStatus === 'success' ? 'Berhasil Disimpan!' : 'Simpan Formasi'}
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
                  {raid.raid_name}
                </h2>
                <div className="flex gap-2">
                  <Button variant="amber" size="sm" onClick={() => clearRaid(raidIdx)}>
                    Clear
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => generateRaid(raidIdx)}>
                    Generate {raid.raid_name}
                  </Button>
                  {raidIdx > 0 && (
                    <Button variant="danger" size="sm" onClick={() => handleDeleteRaid(raidIdx)}>
                      Hapus
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4 auto-rows-fr">
                {raid.parties.map((party: any, partyIdx: number) => {
                  const totalScore = party.slots.reduce(
                    (sum: number, slot: any) => sum + (slot.assigned_character?.pvp_score || 0),
                    0,
                  )
                  const filledSlots = party.slots.filter((s: any) => s.assigned_character).length

                  return (
                    <div
                      key={partyIdx}
                      className="rounded-2xl p-4 flex flex-col h-full transition-colors"
                      style={{
                        background: 'var(--bg-card)',
                        boxShadow: 'var(--shadow-neumorph)',
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-[18px] font-semibold m-0" style={{ color: '#0ea5e9' }}>
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

                      <div className="flex flex-col gap-2.5 flex-1">
                        {party.slots.map((slot: any, slotIdx: number) => {
                          const char = slot.assigned_character
                          const reqJob = slot.required_job
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
                              className={`flex items-center p-2 rounded-xl border relative group transition-colors ${char ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                                ${
                                  draggedMember &&
                                  (reqJob === 'any' || reqJob === draggedMember.member.job)
                                    ? 'border-emerald-500/50 bg-emerald-500/5'
                                    : ''
                                }`}
                              style={{
                                borderColor: 'var(--border-color)',
                                background: 'var(--bg-panel)',
                              }}
                              onDragOver={(e) => {
                                e.preventDefault()
                              }}
                              onDrop={() => handleDropToSlot(raidIdx, partyIdx, slotIdx)}
                              onClick={() => {
                                if (char) setViewedMemberId(char.id)
                              }}
                            >
                              <div className="mr-3 pl-1 relative">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (
                                      openDropdown?.raidIdx === raidIdx &&
                                      openDropdown?.partyIdx === partyIdx &&
                                      openDropdown?.slotIdx === slotIdx
                                    ) {
                                      setOpenDropdown(null)
                                    } else {
                                      setOpenDropdown({ raidIdx, partyIdx, slotIdx })
                                    }
                                  }}
                                  className="w-10 h-10 rounded-xl cursor-pointer outline-none flex items-center justify-center transition-all"
                                  style={{
                                    background: 'var(--bg-secondary)',
                                    boxShadow: 'var(--shadow-neumorph-inset)',
                                    border: 'none',
                                  }}
                                  title="Pilih Required Job"
                                >
                                  {reqJob !== 'any' ? (
                                    <div className="relative w-9 h-9 rounded-lg overflow-hidden shrink-0">
                                      <Image
                                        src={getJobIcon(reqJob)}
                                        alt={reqJob}
                                        fill
                                        sizes="36px"
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <span
                                      className="text-[11px] font-bold opacity-60 uppercase"
                                      style={{ color: 'var(--text-muted)' }}
                                    >
                                      All
                                    </span>
                                  )}
                                </button>

                                {openDropdown?.raidIdx === raidIdx &&
                                  openDropdown?.partyIdx === partyIdx &&
                                  openDropdown?.slotIdx === slotIdx && (
                                    <div
                                      className="absolute left-0 top-12 z-50 w-32 max-h-48 overflow-y-auto rounded-xl py-2 flex flex-col shadow-lg custom-scrollbar"
                                      style={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-color)',
                                      }}
                                    >
                                      {JOBS_OPTIONS.map((opt) => (
                                        <button
                                          key={opt.value}
                                          className="text-left px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                          style={{ color: 'var(--text-primary)' }}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            updateRequiredJob(raidIdx, partyIdx, slotIdx, opt.value)
                                            setOpenDropdown(null)
                                          }}
                                        >
                                          {opt.value === 'any' ? 'Any' : opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                              </div>

                              <div className="flex-1 min-w-0">
                                {char ? (
                                  <div className="flex items-center p-1 -ml-1 rounded transition-colors pointer-events-none">
                                    <div className="min-w-0">
                                      <div
                                        className="font-medium text-sm truncate hover:underline"
                                        style={{ color: 'var(--text-primary)' }}
                                      >
                                        {char.name}
                                      </div>
                                      <div
                                        className="text-[11px] truncate"
                                        style={{ color: 'var(--text-muted)' }}
                                      >
                                        PvP • {char.pvp_score} Score
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className="text-sm italic cursor-pointer p-1 -ml-1 hover:text-emerald-500 transition-colors"
                                    style={{ color: 'var(--text-muted)' }}
                                    onClick={() => openAddMemberDialog(raidIdx, partyIdx, slotIdx)}
                                  >
                                    {draggedMember
                                      ? 'Drop karakter di sini...'
                                      : '+ Tambah Karakter'}
                                  </div>
                                )}
                              </div>

                              {char && (
                                <button
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 text-red-500/70 hover:text-red-500"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeMember(raidIdx, partyIdx, slotIdx)
                                  }}
                                  title="Keluarkan dari party"
                                >
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                  </svg>
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

      {/* KANAN - Bench */}
      <div id="tour-woe-benched" className="w-[300px] shrink-0 sticky top-4 max-h-[calc(100vh-2rem)] flex flex-col">
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
                {benchedMembers.length} member belum masuk
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {benchedMembers.map((m) => (
              <div
                key={m.id}
                draggable
                onDragStart={() => handleDragStart(m, null, null, null)}
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
                <div className="min-w-0 flex-1" onClick={() => setViewedMemberId(m.id)}>
                  <div
                    className="font-semibold text-sm truncate hover:underline"
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
            {benchedMembers.length === 0 && (
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

      {/* MODAL PILIH MEMBER */}
      <GlobalDialog
        isOpen={isAddMemberDialogOpen}
        onClose={() => setIsAddMemberDialogOpen(false)}
        title="Pilih Member"
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
                    {JOB_LABELS[m.job as keyof typeof JOB_LABELS]} • Lv {m.base_level}
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
            <EmptyState message="Semua member sudah dialokasikan." />
          )}
        </div>
      </GlobalDialog>

      {/* Modal Detail Karakter */}
      <CharacterDetailModal
        member={members.find((m) => m.id === viewedMemberId) || null}
        isOpen={!!viewedMemberId}
        onClose={() => setViewedMemberId(null)}
      />
    </div>
  )
}
