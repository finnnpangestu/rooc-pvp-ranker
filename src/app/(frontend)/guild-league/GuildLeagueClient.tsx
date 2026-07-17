'use client'

import React, { useState, useEffect } from 'react'
import { GlobalDialog } from '../components/GlobalDialog'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { JOBS, JOB_LABELS } from '@/const/JobLabels'
import { generateEliteParty } from '@/actions/guild/generateEliteParty'
import { generateSubParty } from '@/actions/guild/generateSubParty'
import { savePartySetup } from '@/actions/guild/savePartySetup'

interface GuildLeagueClientProps {
  guild: any
  members: any[]
  initialSetup: any | null
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`
const clone = (obj: any) => JSON.parse(JSON.stringify(obj))

export function GuildLeagueClient({ guild, members, initialSetup }: GuildLeagueClientProps) {
  // local setup state
  const [localSetup, setLocalSetup] = useState<any | null>(() => {
    if (initialSetup) {
      return clone(initialSetup)
    }
    return null
  })

  // state
  const [isEliteDialogOpen, setIsEliteDialogOpen] = useState(false)
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [selectedPartyIndex, setSelectedPartyIndex] = useState<number | null>(null)
  const [selectedPartyType, setSelectedPartyType] = useState<'elite' | 'sub' | null>(null)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [isSaveLoading, setIsSaveLoading] = useState(false)

  // blueprint generate
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

  // assigned member ids
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

  // update blueprint sub if bench count changes
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

  // generate preview (local state only)
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

  // save to db
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

  // clear local
  const handleClear = (mode: 'all' | 'elite' | 'sub') => {
    if (!localSetup) return
    if (!confirm(`Hapus formasi ${mode}?`)) return
    const newSetup = clone(localSetup)
    if (mode === 'all' || mode === 'elite') newSetup.elite_parties = []
    if (mode === 'all' || mode === 'sub') newSetup.sub_parties = []
    setLocalSetup(newSetup)
  }

  // edit: remove member
  const removeMemberFromParty = (partyType: 'elite' | 'sub', partyIdx: number, slotIdx: number) => {
    if (!localSetup) return
    const newSetup = clone(localSetup)
    const parties = partyType === 'elite' ? newSetup.elite_parties : newSetup.sub_parties
    if (!parties || !parties[partyIdx]) return
    parties[partyIdx].slots[slotIdx].assigned_character = null
    setLocalSetup(newSetup)
  }

  // edit: position member
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

  // available members for adding
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

  // helper renderer party cards
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
            className="bg-[#141419]/60 backdrop-blur-[20px] border border-white/5 rounded-2xl p-4 flex flex-col h-full"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-[18px] font-semibold m-0" style={{ color: titleColor }}>
                {party.party_name}
                <span className="text-[13px] text-gray-400 ml-2 font-normal">
                  ({filledSlots}/5)
                </span>
              </h3>
              <div className="flex-shrink-0">
                <div className="text-[11px] text-gray-400 text-right mb-0.5">Total Score</div>
                <div className="text-white font-bold text-[14px] text-right">
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
                    className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-transparent transition-all duration-200 hover:bg-white/10 hover:border-white/10 min-h-[48px]"
                  >
                    {char ? (
                      <>
                        <img
                          src={getJobIcon(char.job)}
                          alt=""
                          className="w-6 h-6 object-cover rounded-[20%] flex-shrink-0"
                        />
                        <span className="text-[15px] font-semibold text-white flex-1 min-w-0 truncate">
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
                        className="w-full flex items-center justify-center text-gray-400 font-sans text-[13px] cursor-pointer transition-all duration-200 hover:bg-white/5 hover:text-white hover:border-white/40 min-h-[48px] bg-transparent border border-dashed border-white/20 rounded-lg"
                      >
                        <span className="text-gray-500 text-[14px] italic truncate">
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
      className="max-w-[800px] my-10 mx-auto p-10 bg-[#0f0f14]/70 backdrop-blur-md border border-white/5 rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] text-white font-sans relative overflow-hidden"
      style={{ maxWidth: '1200px' }}
    >
      <div className="mb-10 border-b border-white/10 pb-5">
        <h1 className="text-[28px] mb-2 font-bold text-white">League Management</h1>
        <p className="text-gray-400 text-[15px]">
          Atur formasi Guild League (Round-Robin Auto Assign). Total Verified Member:{' '}
          <strong className="text-white font-semibold">{members.length}</strong>
        </p>
      </div>

      {/* ELITE SECTION */}
      <section className="mb-[60px]">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h2 className="text-amber-400 text-2xl font-bold m-0">Elite Parties (Top 40)</h2>
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
          <h2 className="text-indigo-400 text-2xl font-bold m-0">Sub Parties</h2>
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
          <p className="text-red-500 text-[13px] -mt-4 mb-6">
            * Anda harus melakukan Generate Elite Party terlebih dahulu.
          </p>
        )}

        {!isSubGenerated
          ? isEliteGenerated && <EmptyState message="Sub Party kosong atau belum di-generate." />
          : renderPartyCards(localSetup.sub_parties, '#818cf8', 'sub')}

        {/* BENCH PLAYERS */}
        <div className="bg-[#141419]/60 backdrop-blur-[20px] rounded-2xl p-6 border border-white/5">
          <h3 className="text-gray-400 text-[16px] m-0 mb-4 flex items-center gap-2 font-semibold">
            Bench Players (Unassigned)
            <span className="bg-white/10 py-0.5 px-2 rounded-xl text-[12px] text-white">
              {benchMembers.length} Orang
            </span>
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {benchMembers.length > 0 ? (
              benchMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white/5 py-2.5 px-4 rounded-xl border border-white/10 text-[14px] flex items-center gap-2.5 text-gray-200 transition-all duration-200 hover:bg-indigo-500/10 hover:border-indigo-500/40"
                >
                  <img
                    src={getJobIcon(member.job)}
                    alt={member.job}
                    className="w-6 h-6 object-cover rounded-[20%] flex-shrink-0"
                  />
                  <span className="truncate max-w-[120px]">{member.name}</span>
                  <span className="text-[14px] text-amber-400 font-bold flex-shrink-0">
                    {Math.round(member.pvp_score).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-gray-500 text-[14px] italic">
                Semua member sudah masuk ke dalam party.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SAVE & CLEAR ALL ACTIONS */}
      <div className="flex gap-3 mt-5 border-t border-white/5 pt-5 mb-5">
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
        <div className="text-gray-300 text-[14px] mb-5">
          Tentukan kebutuhan Job untuk 8 Elite Party.
        </div>
        <div className="flex flex-col gap-5 max-h-[50vh] overflow-y-auto pr-2">
          {eliteBlueprint.map((party, pIdx) => (
            <div key={pIdx} className="bg-black/30 p-4 rounded-xl border border-white/5">
              <h3 className="text-amber-400 text-[16px] m-0 mb-3 font-semibold">
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
                    className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-[15px] font-sans transition-all duration-200 outline-none hover:bg-black/60 hover:border-white/15 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
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
        <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-lg mb-5 text-indigo-200 text-[14px] leading-relaxed">
          Sisa Member di Bench: <strong>{benchMembers.length}</strong> orang
          <br />
          Maksimal Sub Party: <strong>{maxSubParties}</strong>
        </div>
        {maxSubParties === 0 ? (
          <p className="text-red-500 text-center py-5 text-[14px]">
            Tidak ada cukup sisa member di bench (Minimal 5 orang).
          </p>
        ) : (
          <div className="flex flex-col gap-5 max-h-[50vh] overflow-y-auto pr-2">
            {subBlueprint.map((party, pIdx) => (
              <div key={pIdx} className="bg-black/30 p-4 rounded-xl border border-white/5">
                <h3 className="text-indigo-400 text-[16px] m-0 mb-3 font-semibold">
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
                      className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-[15px] font-sans transition-all duration-200 outline-none hover:bg-black/60 hover:border-white/15 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/25"
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
        <div className="text-gray-300 text-[14px] mb-5">Pilih member yang belum terassign.</div>
        {availableMembers.length === 0 ? (
          <p className="text-red-500 text-center py-5 text-[14px]">Tidak ada member tersisa.</p>
        ) : (
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
            {availableMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => addMemberToParty(member.id)}
                className="flex items-center gap-3 p-3 bg-white/5 border border-white/5 rounded-xl text-white cursor-pointer w-full text-left transition-all duration-200 font-sans text-[14px] hover:bg-indigo-500/10 hover:border-indigo-500/40"
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
