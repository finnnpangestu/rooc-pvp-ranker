'use client'

import React, { useState, useEffect } from 'react'
import { GlobalDialog } from '../components/GlobalDialog'
import { JOBS, JOB_LABELS } from '@/const/JobLabels'
import styles from './guild.module.css'
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

  // dialog flags
  const [isEliteDialogOpen, setIsEliteDialogOpen] = useState(false)
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [selectedPartyIndex, setSelectedPartyIndex] = useState<number | null>(null)
  const [selectedPartyType, setSelectedPartyType] = useState<'elite' | 'sub' | null>(null)

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
    const res = await generateSubParty(subBlueprint, benchMembers)
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

    const payload = {
      ...localSetup,
      guild_id: guild.id,
    }
    const res = await savePartySetup(payload)
    if (res.success) {
      alert('Setup berhasil disimpan!')
    } else {
      alert('Gagal menyimpan: ' + res.message)
    }
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

  // edit: add member
  const addMemberToParty = (memberId: string) => {
    if (selectedPartyIndex === null || !selectedPartyType || !localSetup) return
    const newSetup = clone(localSetup)
    const parties = selectedPartyType === 'elite' ? newSetup.elite_parties : newSetup.sub_parties
    const party = parties[selectedPartyIndex]
    if (!party) return

    const emptySlotIdx = party.slots.findIndex((s: any) => !s.assigned_character)
    if (emptySlotIdx === -1) {
      alert('Party sudah penuh (max 5 member)')
      return
    }
    if (getAssignedMemberIds().includes(memberId)) {
      alert('Member sudah terassign di party lain')
      return
    }
    const member = members.find((m) => m.id === memberId)
    if (!member) return

    party.slots[emptySlotIdx].assigned_character = member
    setLocalSetup(newSetup)
    setIsAddMemberDialogOpen(false)
  }

  const isEliteGenerated = localSetup?.elite_parties && localSetup.elite_parties.length > 0
  const isSubGenerated = localSetup?.sub_parties && localSetup.sub_parties.length > 0

  // available members for adding
  const availableMembers = members.filter((m) => !getAssignedMemberIds().includes(m.id))

  // helper renderer party cards
  const renderPartyCards = (parties: any[], titleColor: string, type: 'elite' | 'sub') => (
    <div className={styles.partyGrid}>
      {parties.map((party: any, idx: number) => {
        const totalScore = party.slots.reduce(
          (sum: number, slot: any) => sum + (slot.assigned_character?.pvp_score || 0),
          0,
        )
        const filledSlots = party.slots.filter((s: any) => s.assigned_character).length

        return (
          <div key={idx} className={styles.partyCard}>
            <div className={styles.partyHeader}>
              <h3 className={styles.partyName} style={{ color: titleColor }}>
                {party.party_name}
                <span
                  style={{
                    fontSize: '13px',
                    color: '#9ca3af',
                    marginLeft: '8px',
                    fontWeight: 'normal',
                  }}
                >
                  ({filledSlots}/5)
                </span>
              </h3>
              <div>
                <div className={styles.partyScoreLabel}>Total Score</div>
                <div className={styles.partyScoreValue}>
                  {Math.round(totalScore).toLocaleString()}
                </div>
              </div>
            </div>

            <div>
              {party.slots.map((slot: any, sIdx: number) => {
                const char = slot.assigned_character
                return (
                  <div key={sIdx} className={styles.partySlot}>
                    {char ? (
                      <>
                        <img src={getJobIcon(char.job)} alt="" className={styles.jobIcon} />
                        <span className={styles.charName}>{char.name}</span>
                        <span className={styles.charScore}>
                          {Math.round(char.pvp_score).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeMemberFromParty(type, idx, sIdx)}
                          className={styles.removeBtn}
                          title="Hapus dari party"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setSelectedPartyIndex(idx)
                            setSelectedPartyType(type)
                            setIsAddMemberDialogOpen(true)
                          }}
                          className={styles.addSlotBtn}
                        >
                          <span className={styles.emptySlotText}>
                            {JOB_LABELS[slot.required_job] || 'Any'}
                          </span>
                        </button>
                      </>
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
    <div className={styles.container} style={{ maxWidth: '1200px' }}>
      <div className={styles.headerContainer}>
        <h1 className={styles.pageTitle}>League Management</h1>
        <p className={styles.pageSubtitle}>
          Atur formasi Guild League (Round-Robin Auto Assign). Total Verified Member:{' '}
          <strong className={styles.highlightText}>{members.length}</strong>
        </p>
      </div>

      {/* ELITE SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.eliteTitle}>Elite Parties (Top 40)</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleClear('elite')}
              className={styles.btnClear}
              disabled={!isEliteGenerated}
            >
              Clear Elite
            </button>
            <button
              onClick={() => setIsEliteDialogOpen(true)}
              className={`${styles.btnBase} ${styles.btnElite}`}
            >
              Generate Elite Party
            </button>
          </div>
        </div>

        {!isEliteGenerated ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              Elite Party belum dibentuk. Klik tombol di atas untuk memulai rancangan.
            </p>
          </div>
        ) : (
          renderPartyCards(localSetup.elite_parties, '#fbbf24', 'elite')
        )}
      </section>

      {/* SUB SECTION */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.subTitle}>Sub Parties</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => handleClear('sub')}
              className={styles.btnClear}
              disabled={!isSubGenerated}
            >
              Clear Sub
            </button>
            <button
              onClick={() => setIsSubDialogOpen(true)}
              disabled={!isEliteGenerated || maxSubParties === 0}
              className={`${styles.btnBase} ${!isEliteGenerated || maxSubParties === 0 ? styles.btnSubDisabled : styles.btnSub}`}
            >
              Generate Sub Party
            </button>
          </div>
        </div>

        {!isEliteGenerated && (
          <p className={styles.warningText}>
            * Anda harus melakukan Generate Elite Party terlebih dahulu.
          </p>
        )}

        {!isSubGenerated
          ? isEliteGenerated && (
              <div className={styles.emptyState} style={{ marginBottom: '24px' }}>
                <p className={styles.emptyText}>Sub Party kosong atau belum di-generate.</p>
              </div>
            )
          : renderPartyCards(localSetup.sub_parties, '#818cf8', 'sub')}

        {/* BENCH PLAYERS */}
        <div className={styles.benchContainer}>
          <h3 className={styles.benchTitle}>
            Bench Players (Unassigned)
            <span className={styles.benchCountBadge}>{benchMembers.length} Orang</span>
          </h3>
          <div className={styles.benchList}>
            {benchMembers.length > 0 ? (
              benchMembers.map((member) => (
                <div key={member.id} className={styles.benchPlayer}>
                  <img src={getJobIcon(member.job)} alt={member.job} className={styles.jobIcon} />
                  <span>{member.name}</span>
                  <span className={styles.charScore}>
                    {Math.round(member.pvp_score).toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div className={styles.emptySlotText}>Semua member sudah masuk ke dalam party.</div>
            )}
          </div>
        </div>
      </section>

      {/* SAVE & CLEAR ALL ACTIONS */}
      <div className={styles.btnActionGroup} style={{ marginBottom: '20px' }}>
        <button
          onClick={() => handleClear('all')}
          className={styles.btnClear}
          style={{ padding: '14px', flex: 1, textAlign: 'center', justifyContent: 'center' }}
          disabled={!localSetup || (!isEliteGenerated && !isSubGenerated)}
        >
          Clear All Formations
        </button>
        <button
          onClick={handleSave}
          className={`${styles.btnBase} ${styles.btnElite}`}
          style={{ padding: '14px', flex: 2, justifyContent: 'center' }}
          disabled={!localSetup || (!isEliteGenerated && !isSubGenerated)}
        >
          Simpan Setup ke Database
        </button>
      </div>

      {/* BLUEPRINT ELITE DIALOG */}
      <GlobalDialog
        isOpen={isEliteDialogOpen}
        onClose={() => setIsEliteDialogOpen(false)}
        title="Blueprint Elite Party"
        maxWidth={1200}
      >
        <div className={styles.dialogDesc}>Tentukan kebutuhan Job untuk 8 Elite Party.</div>
        <div className={styles.blueprintScroll}>
          {eliteBlueprint.map((party, pIdx) => (
            <div key={pIdx} className={styles.blueprintCard}>
              <h3 className={styles.blueprintEliteTitle}>Elite Party {pIdx + 1}</h3>
              <div className={styles.blueprintSlots}>
                {party.map((job, sIdx) => (
                  <select
                    key={sIdx}
                    value={job}
                    onChange={(e) => {
                      const newBp = [...eliteBlueprint]
                      newBp[pIdx][sIdx] = e.target.value
                      setEliteBlueprint(newBp)
                    }}
                    className={styles.selectInput}
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
        <button onClick={handleGenerateElite} className={styles.btnExecuteElite}>
          Generate Elite (Preview)
        </button>
      </GlobalDialog>

      {/* BLUEPRINT SUB DIALOG */}
      <GlobalDialog
        isOpen={isSubDialogOpen}
        onClose={() => setIsSubDialogOpen(false)}
        title="Blueprint Sub Party"
        maxWidth={1200}
      >
        <div className={styles.dialogInfoBox}>
          Sisa Member di Bench: <strong>{benchMembers.length}</strong> orang
          <br />
          Maksimal Sub Party: <strong>{maxSubParties}</strong>
        </div>
        {maxSubParties === 0 ? (
          <p className={styles.dialogError}>
            Tidak ada cukup sisa member di bench (Minimal 5 orang).
          </p>
        ) : (
          <div className={styles.blueprintScroll}>
            {subBlueprint.map((party, pIdx) => (
              <div key={pIdx} className={styles.blueprintCard}>
                <h3 className={styles.blueprintSubTitle}>Sub Party {pIdx + 1}</h3>
                <div className={styles.blueprintSlots}>
                  {party.map((job, sIdx) => (
                    <select
                      key={sIdx}
                      value={job}
                      onChange={(e) => {
                        const newBp = [...subBlueprint]
                        newBp[pIdx][sIdx] = e.target.value
                        setSubBlueprint(newBp)
                      }}
                      className={styles.selectInput}
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
        <button
          onClick={handleGenerateSub}
          disabled={maxSubParties === 0}
          className={styles.btnExecuteSub}
        >
          👥 Generate Sub (Preview)
        </button>
      </GlobalDialog>

      {/* ADD MEMBER PICKER DIALOG */}
      <GlobalDialog
        isOpen={isAddMemberDialogOpen}
        onClose={() => setIsAddMemberDialogOpen(false)}
        title="Tambah Member ke Party"
      >
        <div className={styles.dialogDesc}>Pilih member yang belum terassign.</div>
        {availableMembers.length === 0 ? (
          <p className={styles.dialogError}>Tidak ada member tersisa.</p>
        ) : (
          <div className={styles.memberPickerList}>
            {availableMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => addMemberToParty(member.id)}
                className={styles.memberPickerItem}
              >
                <img src={getJobIcon(member.job)} alt="" className={styles.jobIcon} />
                <span>{member.name}</span>
                <span className={`${styles.charScore} ${styles.memberPickerScore}`}>
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
