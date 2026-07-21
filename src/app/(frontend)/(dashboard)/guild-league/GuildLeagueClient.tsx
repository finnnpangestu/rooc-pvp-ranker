'use client'

import React, { useState, useEffect } from 'react'
import { GlobalDialog } from '../../components/GlobalDialog'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { JOBS, JOB_LABELS } from '@/const/JobLabels'
import { generateEliteParty } from '@/actions/guild/generateEliteParty'
import { generateSubParty } from '@/actions/guild/generateSubParty'
import { savePartySetup } from '@/actions/guild/savePartySetup'
import { useTheme } from '../../components/ThemeProvider'

interface GuildLeagueClientProps {
  guild: any
  members: any[]
  initialSetup: any | null
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`
const clone = (obj: any) => JSON.parse(JSON.stringify(obj))

export function GuildLeagueClient({ guild, members, initialSetup }: GuildLeagueClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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
  const benchMembers = members.filter((m) => !assignedIds.includes(m.id))
  const maxSubParties = Math.floor(benchMembers.length / 5)

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
    const res = await generateEliteParty(guild.id, eliteBlueprint, members)
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

  const handleClear = (mode: 'all' | 'elite' | 'sub') => {
    if (!localSetup) return
    if (!confirm(`Hapus formasi ${mode}?`)) return
    const newSetup = clone(localSetup)
    if (mode === 'all' || mode === 'elite') newSetup.elite_parties = []
    if (mode === 'all' || mode === 'sub') newSetup.sub_parties = []
    setLocalSetup(newSetup)
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
    if (selectedPartyType === null || selectedPartyIndex === null || selectedSlotIndex === null)
      return
    const member = members.find((m) => m.id === memberId)
    if (!member) return
    const newSetup = clone(localSetup)
    if (selectedPartyType === 'elite') {
      newSetup.elite_parties[selectedPartyIndex].slots[selectedSlotIndex].assigned_character =
        member
    } else {
      newSetup.sub_parties[selectedPartyIndex].slots[selectedSlotIndex].assigned_character = member
    }
    setLocalSetup(newSetup)
    setIsAddMemberDialogOpen(false)
    setSelectedPartyIndex(null)
    setSelectedPartyType(null)
    setSelectedSlotIndex(null)
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
    if (selectedPartyType === 'elite') {
      requiredJobForSlot =
        localSetup.elite_parties[selectedPartyIndex].slots[selectedSlotIndex].required_job
    } else {
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

  const renderPartyCards = (parties: any[], titleColor: string, type: 'elite' | 'sub') => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4 mb-6 auto-rows-fr">
      {parties.map((party: any, idx: number) => {
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
                    className="flex items-center gap-2 p-2 rounded-lg border transition-all duration-200 min-h-[48px]"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-neumorph-inset)',
                    }}
                  >
                    {char ? (
                      <>
                        <img
                          src={getJobIcon(char.job)}
                          alt=""
                          className="w-6 h-6 object-cover rounded-[20%] flex-shrink-0"
                        />
                        <span
                          className="text-[15px] font-semibold flex-1 min-w-0 truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {char.name}
                        </span>
                        <span className="text-[14px] text-amber-400 font-bold flex-shrink-0">
                          {Math.round(char.pvp_score).toLocaleString()}
                        </span>
                        <Button
                          variant="danger"
                          size="sm"
                          className="!w-7 !h-7 !p-0 flex-shrink-0"
                          title="Hapus dari party"
                          onClick={() => removeMemberFromParty(type, idx, sIdx)}
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
                          {JOB_LABELS[slot.required_job] || 'Any'}
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
    <div
      className="rounded-3xl p-10 w-full transition-colors"
      style={{
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-neumorph)',
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <div className="mb-10 border-b pb-5" style={{ borderColor: 'var(--border-color)' }}>
        <h1 className="text-[28px] mb-2 font-bold" style={{ color: 'var(--text-primary)' }}>
          League Management
        </h1>
        <p className="text-[15px]" style={{ color: 'var(--text-secondary)' }}>
          Atur formasi Guild League (Round-Robin Auto Assign). Total Verified Member:{' '}
          <strong className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {members.length}
          </strong>
        </p>
      </div>

      {/* ELITE SECTION */}
      <section className="mb-[60px]">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-bold m-0" style={{ color: '#fbbf24' }}>
            Elite Parties (Top 40)
          </h2>
          <div className="flex gap-3">
            <Button
              variant="danger"
              size="md"
              disabled={!isEliteGenerated}
              onClick={() => handleClear('elite')}
            >
              Clear Elite
            </Button>
            <Button variant="amber" size="md" onClick={() => setIsEliteDialogOpen(true)}>
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

      {/* SUB SECTION */}
      <section className="mb-[60px]">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-2xl font-bold m-0" style={{ color: '#818cf8' }}>
            Sub Parties
          </h2>
          <div className="flex gap-3">
            <Button
              variant="danger"
              size="md"
              disabled={!isSubGenerated}
              onClick={() => handleClear('sub')}
            >
              Clear Sub
            </Button>
            <Button
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

        {!isSubGenerated
          ? isEliteGenerated && <EmptyState message="Sub Party kosong atau belum di-generate." />
          : renderPartyCards(localSetup.sub_parties, '#818cf8', 'sub')}

        {/* BENCH PLAYERS */}
        <div
          className="rounded-2xl p-6 border transition-colors"
          style={{
            background: 'var(--bg-card)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-neumorph)',
          }}
        >
          <h3
            className="text-[16px] m-0 mb-4 flex items-center gap-2 font-semibold"
            style={{ color: 'var(--text-muted)' }}
          >
            Bench Players (Unassigned)
            <span
              className="py-0.5 px-2 rounded-xl text-[12px]"
              style={{
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
              }}
            >
              {benchMembers.length} Orang
            </span>
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {benchMembers.length > 0 ? (
              benchMembers.map((member) => (
                <div
                  key={member.id}
                  className="py-2.5 px-4 rounded-xl border text-[14px] flex items-center gap-2.5 transition-all duration-200"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: 'var(--border-color)',
                    color: 'var(--text-secondary)',
                    boxShadow: 'var(--shadow-neumorph-sm)',
                  }}
                >
                  <img
                    src={getJobIcon(member.job)}
                    alt={member.job}
                    className="w-6 h-6 object-cover rounded-[20%] flex-shrink-0"
                  />
                  <span className="truncate max-w-[120px]" style={{ color: 'var(--text-primary)' }}>
                    {member.name}
                  </span>
                  <span className="text-[14px] text-amber-400 font-bold flex-shrink-0">
                    {Math.round(member.pvp_score).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[14px] italic" style={{ color: 'var(--text-muted)' }}>
                Semua member sudah masuk ke dalam party.
              </div>
            )}
          </div>
        </div>
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
          disabled={!localSetup || (!isEliteGenerated && !isSubGenerated)}
          onClick={() => handleClear('all')}
        >
          Clear Formations
        </Button>
        <Button
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
            {subBlueprint.map((party, pIdx) => (
              <div
                key={pIdx}
                className="p-4 rounded-xl border"
                style={{
                  background: 'var(--bg-primary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                }}
              >
                <h3 className="text-[16px] m-0 mb-3 font-semibold" style={{ color: '#818cf8' }}>
                  Sub Party {pIdx + 1}
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
            ))}
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
                <img
                  src={getJobIcon(member.job)}
                  alt=""
                  className="w-6 h-6 object-cover rounded-[20%] flex-shrink-0"
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
    </div>
  )
}
