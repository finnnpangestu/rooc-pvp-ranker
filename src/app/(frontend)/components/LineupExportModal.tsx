'use client'

import React, { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
import { Icon } from '@iconify/react'
import { JOB_LABELS } from '@/const/JobLabels'
import type { Character, Party, PartySlotCharacter, WoeRaid } from '@/types'
import Image from 'next/image'

export type LineupExportType = 'gl' | 'woe'

interface LineupExportModalProps {
  isOpen: boolean
  onClose: () => void
  type: LineupExportType
  guildName: string
  members: Character[]
  eliteParties?: Party[]
  subParties?: Party[]
  raids?: WoeRaid[]
  benchedMembers: Character[]
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`

export function LineupExportModal({
  isOpen,
  onClose,
  type,
  guildName,
  members,
  eliteParties = [],
  subParties = [],
  raids = [],
  benchedMembers = [],
}: LineupExportModalProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  if (!isOpen) return null

  const resolveChar = (
    assigned: PartySlotCharacter | string | null | undefined,
  ): Character | PartySlotCharacter | null => {
    if (!assigned) return null
    if (typeof assigned === 'object') return assigned
    return members.find((m) => m.id === assigned) || null
  }

  const handleDownload = async () => {
    if (!exportRef.current) return
    setIsDownloading(true)
    try {
      if (typeof document !== 'undefined' && document.fonts) {
        await document.fonts.ready
      }
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0d0e15',
        logging: false,
        windowWidth: 1540,
      })
      const dataUrl = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      const category = type === 'gl' ? 'Guild-League' : 'WoE'
      const cleanGuild = guildName.replace(/[^a-zA-Z0-9_-]/g, '_')
      const today = new Date().toISOString().slice(0, 10)
      link.download = `Lineup-${category}-${cleanGuild}-${today}.png`
      link.href = dataUrl
      link.click()
    } catch (err: unknown) {
      console.error('Export PNG failed:', err)
      alert('Terjadi kesalahan saat mengunduh gambar.')
    } finally {
      setIsDownloading(false)
    }
  }

  // Statistics calculation
  const calculateTotalScore = (parties: Party[]) => {
    return parties.reduce((sum, party) => {
      const partyScore = party.slots.reduce((pSum, slot) => {
        const char = resolveChar(slot.assigned_character)
        return pSum + (Number(char?.pvp_score) || 0)
      }, 0)
      return sum + partyScore
    }, 0)
  }

  const calculateFilledSlots = (parties: Party[]) => {
    return parties.reduce((sum, party) => {
      return sum + party.slots.filter((s) => s.assigned_character).length
    }, 0)
  }

  const allPartiesForStats =
    type === 'gl' ? [...eliteParties, ...subParties] : raids.flatMap((r) => r.parties as Party[])

  const totalAssignedScore = calculateTotalScore(allPartiesForStats)
  const totalAssignedCount = calculateFilledSlots(allPartiesForStats)

  const renderPartyCard = (party: Party, partyIdx: number, accentColor: string) => {
    const filled = party.slots.filter((s) => s.assigned_character).length
    const score = party.slots.reduce((sum, slot) => {
      const char = resolveChar(slot.assigned_character)
      return sum + (Number(char?.pvp_score) || 0)
    }, 0)

    return (
      <div
        key={partyIdx}
        className="rounded-xl p-3 flex flex-col justify-between border"
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Party Card Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: accentColor }} />
            <span className="font-bold text-sm truncate" style={{ color: accentColor }}>
              {party.party_name || party.name || `Party ${partyIdx + 1}`}
            </span>
            <span className="text-[11px] text-gray-400 font-mono">({filled}/5)</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs font-bold text-amber-400 font-mono">
              {Math.round(score).toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* 5 Slots */}
        <div className="flex flex-col gap-1.5">
          {party.slots.map((slot, slotIdx) => {
            const char = resolveChar(slot.assigned_character)
            if (char) {
              const charJob = char.job || 'paladin'
              return (
                <div
                  key={slotIdx}
                  className="flex items-center justify-between p-1.5 rounded-lg border"
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderColor: 'rgba(255, 255, 255, 0.04)',
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Image
                      width={20}
                      height={20}
                      src={getJobIcon(charJob)}
                      alt=""
                      unoptimized
                      className="w-5 h-5 object-cover rounded shrink-0 shadow-sm"
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white truncate max-w-[130px]">
                        {char.name}
                      </span>
                      <span className="text-[10px] text-gray-400 truncate">
                        {JOB_LABELS[charJob] || charJob}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-400 font-mono shrink-0 ml-1">
                    {Math.round(Number(char.pvp_score) || 0).toLocaleString('id-ID')}
                  </span>
                </div>
              )
            }
            return (
              <div
                key={slotIdx}
                className="flex items-center justify-between p-1.5 rounded-lg border border-dashed text-gray-500 text-[11px]"
                style={{
                  background: 'rgba(255, 255, 255, 0.01)',
                  borderColor: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  <span className="italic">
                    {slot.required_job && slot.required_job !== 'any'
                      ? JOB_LABELS[slot.required_job as keyof typeof JOB_LABELS] ||
                        slot.required_job
                      : 'Slot Kosong'}
                  </span>
                </div>
                <span className="opacity-40">-</span>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="w-full max-w-6xl rounded-2xl flex flex-col border max-h-[90vh] overflow-hidden"
        style={{
          background: 'var(--bg-card)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-neumorph-lg)',
        }}
      >
        {/* Modal Controls Header */}
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between gap-3 flex-wrap"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2">
            <Icon icon="fluent:image-24-filled" className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Download Lineup Gambar PNG (4 Kolom)
            </h2>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all shadow-md disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              }}
            >
              <Icon
                icon={
                  isDownloading
                    ? 'fluent:spinner-ios-20-regular'
                    : 'fluent:arrow-download-20-filled'
                }
                className={`w-4 h-4 ${isDownloading ? 'animate-spin' : ''}`}
              />
              <span>{isDownloading ? 'Memproses Gambar...' : 'Download PNG'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-sm font-medium border hover:bg-white/5 transition-colors cursor-pointer"
              style={{
                color: 'var(--text-secondary)',
                borderColor: 'var(--border-color)',
              }}
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Scrollable Preview Wrapper */}
        <div className="flex-1 overflow-auto p-4 bg-black/40 flex justify-center items-start">
          {/* THE ACTUAL CANVAS ELEMENT (Width 1480px fixed for optimal 4-column layout & High-Res PNG) */}
          <div
            ref={exportRef}
            id="lineup-export-canvas"
            className="w-[1480px] p-8 rounded-3xl flex flex-col gap-6"
            style={{
              background: '#0d0f18',
              color: '#f3f4f6',
              fontFamily: "var(--font-poppins), 'Poppins', sans-serif",
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            {/* Top Banner Header: [Nama Guild] > [Setup Title] */}
            <div
              className="flex items-center justify-between pb-6 border-b border-white/10"
              style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3 text-2xl font-black tracking-wide">
                  <span className="text-indigo-400 drop-shadow-sm">{guildName}</span>
                  <span className="text-gray-500 font-normal text-xl">&gt;</span>
                  <span className="text-white drop-shadow-sm">
                    {type === 'gl' ? 'Guild League Lineup' : 'War of Emperium Setup'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>ROOC PvP Ranker Official Lineup</span>
                  <span className="opacity-40">•</span>
                  <span>
                    Dibuat:{' '}
                    {new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Roster & Score Badges */}
              <div className="flex items-center gap-3">
                <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Member In-Party
                  </span>
                  <span className="text-base font-extrabold text-indigo-300">
                    {totalAssignedCount}
                  </span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-amber-400/80 tracking-wider">
                    Total Lineup Score
                  </span>
                  <span className="text-base font-extrabold text-amber-400">
                    {Math.round(totalAssignedScore).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 flex flex-col items-center">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                    Benched / Cadangan
                  </span>
                  <span className="text-base font-extrabold text-gray-300">
                    {benchedMembers.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Content: Guild League Sections */}
            {type === 'gl' && (
              <>
                {/* 1. ELITE PARTIES */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-amber-400 tracking-wide m-0">
                      Elite Parties (Top 40)
                    </h3>
                    <div className="flex-1 h-px bg-gradient-to-r from-amber-400/30 to-transparent" />
                  </div>
                  {eliteParties.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-gray-500">
                      Belum ada Elite Party yang dibentuk
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-3">
                      {eliteParties.map((party, idx) => renderPartyCard(party, idx, '#fbbf24'))}
                    </div>
                  )}
                </div>

                {/* 2. SUB PARTIES */}
                {subParties.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <Icon icon="fluent:shield-20-filled" className="w-5 h-5 text-indigo-400" />
                      <h3 className="text-lg font-bold text-indigo-400 tracking-wide m-0">
                        Sub Parties
                      </h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-indigo-400/30 to-transparent" />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {subParties.map((party, idx) =>
                        renderPartyCard(party, eliteParties.length + idx, '#818cf8'),
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Content: War of Emperium Sections */}
            {type === 'woe' && (
              <div className="flex flex-col gap-6">
                {raids.map((raid, raidIdx) => (
                  <div key={raidIdx}>
                    <div className="flex items-center gap-3 mb-3">
                      <Icon icon="fluent:flag-20-filled" className="w-5 h-5 text-rose-400" />
                      <h3 className="text-lg font-bold text-rose-400 tracking-wide m-0">
                        {raid.raid_name || raid.name || `Raid ${raidIdx + 1}`}
                      </h3>
                      <div className="flex-1 h-px bg-gradient-to-r from-rose-400/30 to-transparent" />
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                      {(raid.parties as Party[]).map((party, pIdx) =>
                        renderPartyCard(party, pIdx, '#fb7185'),
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* BOTTOM SECTION: BENCHED MEMBERS */}
            <div
              className="mt-2 pt-4 border-t"
              style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon
                    icon="fluent:people-community-20-regular"
                    className="w-4 h-4 text-gray-400"
                  />
                  <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider m-0">
                    Benched / Cadangan ({benchedMembers.length})
                  </h4>
                </div>
                <span className="text-[11px] text-gray-500 italic">
                  * Member yang tidak masuk dalam party utama
                </span>
              </div>

              {benchedMembers.length === 0 ? (
                <div className="p-3 rounded-xl border border-dashed border-white/5 text-center text-xs text-gray-500">
                  Tidak ada member di bench (Semua member telah masuk formasi)
                </div>
              ) : (
                <div className="grid grid-cols-6 gap-2">
                  {benchedMembers.map((bm) => (
                    <div
                      key={bm.id}
                      className="flex items-center justify-between p-2 rounded-lg border text-xs"
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderColor: 'rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Image
                          width={20}
                          height={20}
                          src={getJobIcon(bm.job)}
                          alt=""
                          unoptimized
                          className="w-4 h-4 object-cover rounded shrink-0 opacity-80"
                        />
                        <span className="text-gray-300 font-medium truncate max-w-[100px]">
                          {bm.name}
                        </span>
                      </div>
                      <span className="text-amber-400/90 font-mono font-bold text-[11px] shrink-0 ml-1">
                        {Math.round(Number(bm.pvp_score) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Watermark */}
            <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-gray-500">
              <span>ROOC PvP Ranker &amp; Guild War Lineup Generator</span>
              <span>Keep Fighting &amp; Dominating!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
