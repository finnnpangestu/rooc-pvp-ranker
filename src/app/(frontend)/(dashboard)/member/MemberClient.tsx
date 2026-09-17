/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Icon } from '@iconify/react'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Pagination } from '../../components/Pagination'
import { LimitDropdown } from '../../components/LimitDropdown'
import { JobFilterDropdown } from '../../components/JobFilterDropdown'
import {
  StatusFilterDropdown,
  type MemberStatusFilter,
} from '../../components/StatusFilterDropdown'
import { JOB_LABELS } from '@/const/JobLabels'
import { CharacterDetailModal } from '../../components/CharacterDetailModal'
import { PvpSimulatorModal } from '../../components/PvpSimulatorModal'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { useRouter } from 'next/navigation'
import type { Guild, Character } from '@/types'

interface MemberClientProps {
  guild: Guild | null
  members: Character[]
}

const getJobIcon = (job: string) => `/icons/jobs/${job}.png`

export function MemberClient({ guild, members }: MemberClientProps) {
  const [localMembers, setLocalMembers] = useState(members)
  const [memberLimit, setMemberLimit] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedJob, setSelectedJob] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<MemberStatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()

  const [selectedDetailMember, setSelectedDetailMember] = useState<Character | null>(null)
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false)
  const [simulatorTargetMember, setSimulatorTargetMember] = useState<Character | null>(null)

  const { pendingCount, verifiedCount } = React.useMemo(() => {
    let pending = 0
    let verified = 0
    for (const m of localMembers) {
      if (m.isVerified) {
        verified++
      } else {
        pending++
      }
    }
    return { pendingCount: pending, verifiedCount: verified }
  }, [localMembers])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedJob, selectedStatus, memberLimit, searchQuery])

  if (!guild) {
    return (
      <div className="flex justify-center items-center h-full">
        <p style={{ color: 'var(--text-muted)' }}>Anda belum memiliki guild.</p>
      </div>
    )
  }

  const { sortedMembers, filteredMembers, paginatedMembers, totalPages } = React.useMemo(() => {
    const sorted = [...localMembers].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    let filtered = sorted

    if (selectedJob) {
      filtered = filtered.filter((m) => m.job === selectedJob)
    }

    if (selectedStatus === 'pending') {
      filtered = filtered.filter((m) => !m.isVerified)
    } else if (selectedStatus === 'verified') {
      filtered = filtered.filter((m) => Boolean(m.isVerified))
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      filtered = filtered.filter((m) => m.name.toLowerCase().includes(q))
    }

    const pages = Math.ceil(filtered.length / memberLimit)
    const paginated = filtered.slice((currentPage - 1) * memberLimit, currentPage * memberLimit)

    return {
      sortedMembers: sorted,
      filteredMembers: filtered,
      paginatedMembers: paginated,
      totalPages: pages,
    }
  }, [localMembers, selectedJob, selectedStatus, searchQuery, currentPage, memberLimit])

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div
        id="tour-member-list"
        className="rounded-lg flex flex-col h-[955px] overflow-hidden transition-colors"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
      >
        <div
          className="p-5 border-b flex justify-between items-center gap-3 flex-wrap"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
              Daftar Member Guild
            </h2>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-medium"
              style={{
                background: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
              }}
            >
              {filteredMembers.length} member
            </span>

            <button
              type="button"
              onClick={() => {
                setSimulatorTargetMember(null)
                setIsSimulatorOpen(true)
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.15))',
                borderColor: 'rgba(129, 140, 248, 0.4)',
                color: '#a5b4fc',
              }}
            >
              <span>Simulasi & Compare</span>
            </button>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input Nama Character */}
            <div className="relative flex items-center">
              <Icon
                icon="fluent:search-24-regular"
                className="w-4 h-4 absolute left-3 pointer-events-none"
                style={{ color: 'var(--text-secondary)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama character..."
                className="pl-9 pr-8 py-2 text-sm rounded-xl outline-none border transition-all w-48 sm:w-56 focus:w-64"
                style={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  borderColor: searchQuery ? 'rgba(129, 140, 248, 0.4)' : 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-inset)',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  title="Hapus pencarian"
                >
                  <Icon icon="fluent:dismiss-16-filled" className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Status Member */}
            <StatusFilterDropdown
              value={selectedStatus}
              onChange={(val) => {
                setSelectedStatus(val)
                setCurrentPage(1)
              }}
              pendingCount={pendingCount}
              verifiedCount={verifiedCount}
              totalCount={localMembers.length}
            />

            <JobFilterDropdown
              value={selectedJob}
              onChange={(v) => {
                setSelectedJob(v)
                setCurrentPage(1)
              }}
              isOpen={isDropdownOpen}
              onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
              onClose={() => setIsDropdownOpen(false)}
            />
            <div id="tour-member-pagination">
              <LimitDropdown
                value={memberLimit}
                onChange={(val) => {
                  setMemberLimit(val)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto relative">
          <table className="w-full border-collapse text-sm">
            <thead
              className="sticky top-0 shadow-md z-10 border-b"
              style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
            >
              <tr>
                <th className="p-4 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                  Karakter
                </th>
                <th className="p-4 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                  Job
                </th>
                <th className="p-4 text-center font-medium" style={{ color: 'var(--text-muted)' }}>
                  PvP Score
                </th>
                <th className="p-4 text-center font-medium" style={{ color: 'var(--text-muted)' }}>
                  Kehadiran GL
                </th>
                <th className="p-4 text-center font-medium" style={{ color: 'var(--text-muted)' }}>
                  Kehadiran WoE
                </th>
                <th className="p-4 text-center font-medium" style={{ color: 'var(--text-muted)' }}>
                  Status
                </th>
                <th className="p-4 text-right font-medium" style={{ color: 'var(--text-muted)' }}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>Tidak ada member yang ditemukan.</p>
                      {(searchQuery || selectedJob || selectedStatus !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery('')
                            setSelectedJob('')
                            setSelectedStatus('all')
                          }}
                          className="text-xs text-indigo-400 hover:underline cursor-pointer"
                        >
                          Reset Pencarian & Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((char) => (
                  <tr
                    key={char.id}
                    className="border-b transition-colors hover:bg-black/[0.03] dark:hover:bg-white/5"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <td className="p-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {char.name}
                    </td>
                    <td
                      className="p-4 flex items-center gap-3"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      <Image
                        src={getJobIcon(char.job)}
                        alt=""
                        width={24}
                        height={24}
                        className="object-cover rounded shadow-sm"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      {JOB_LABELS[char.job] || char.job}
                    </td>
                    <td className="p-4 text-center font-semibold text-amber-400">
                      {Math.round(Number(char.pvp_score) || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                        <span className="text-emerald-400">{char.gl_present_count || 0}</span>
                        <span style={{ color: 'var(--text-muted)' }}>/</span>
                        <span className="text-red-400">{char.gl_absent_count || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold">
                        <span className="text-emerald-400">{char.woe_present_count || 0}</span>
                        <span style={{ color: 'var(--text-muted)' }}>/</span>
                        <span className="text-red-400">{char.woe_absent_count || 0}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <Badge variant={char.isVerified ? 'success' : 'warning'}>
                        {char.isVerified ? 'Verified' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2" id="tour-member-action">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedDetailMember(char)}
                        >
                          Detail & Aksi
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      <CharacterDetailModal
        member={selectedDetailMember}
        isOpen={!!selectedDetailMember}
        onOpenSimulator={(target) => {
          setSelectedDetailMember(null)
          setSimulatorTargetMember(target as Character)
          setIsSimulatorOpen(true)
        }}
        onClose={async (isUpdated) => {
          setSelectedDetailMember(null)
          if (isUpdated) {
            const updated = await getCharactersDashboard(guild.id)
            setLocalMembers(updated)
          }
        }}
      />

      <PvpSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => {
          setIsSimulatorOpen(false)
          setSimulatorTargetMember(null)
        }}
        initialCharacter={simulatorTargetMember}
        allMembers={localMembers}
        guildName={guild.name}
      />
    </div>
  )
}
