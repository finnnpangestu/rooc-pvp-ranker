'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Pagination } from '../../components/Pagination'
import { LimitDropdown } from '../../components/LimitDropdown'
import { JobFilterDropdown } from '../../components/JobFilterDropdown'
import { JOB_LABELS } from '@/const/JobLabels'
import { CharacterDetailModal } from '../../components/CharacterDetailModal'
import { MemberUpdateDialog } from '../../components/MemberUpdateDialog'
import { toggleVerifyMember } from '@/actions/dashboard/toggleVerifyMember'
import { deleteCharacter } from '@/actions/dashboard/deleteCharacter'
import { useRouter } from 'next/navigation'

interface MemberClientProps {
  guild: any | null
  members: any[]
}

const getJobIcon = (job: string) => `/icons/jobs/${job}.png`

export function MemberClient({ guild, members }: MemberClientProps) {
  const [memberLimit, setMemberLimit] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedJob, setSelectedJob] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()
  
  const [selectedDetailMember, setSelectedDetailMember] = useState<any | null>(null)
  const [selectedUpdateMember, setSelectedUpdateMember] = useState<any | null>(null)

  const handleToggleVerify = (char: any) => {
    startTransition(async () => {
      const res = await toggleVerifyMember(char.id, char.isVerified)
      if (res.success) {
        setSelectedDetailMember((prev: any) => (prev ? { ...prev, isVerified: !prev.isVerified } : null))
        router.refresh()
      }
    })
  }

  const handleDeleteMember = (charId: string) => {
    if (!confirm('Yakin ingin menghapus karakter ini permanen?')) return
    startTransition(async () => {
      const res = await deleteCharacter(charId)
      if (res.success) {
        alert('Karakter berhasil dihapus!')
        setSelectedDetailMember(null)
        router.refresh()
      } else {
        alert('Gagal menghapus: ' + String(res.error))
      }
    })
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedJob, memberLimit])

  if (!guild) {
    return (
      <div className="flex justify-center items-center h-full">
        <p style={{ color: 'var(--text-muted)' }}>Anda belum memiliki guild.</p>
      </div>
    )
  }

  const { sortedMembers, filteredMembers, paginatedMembers, totalPages } = React.useMemo(() => {
    const sorted = [...members].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const filtered = selectedJob
      ? sorted.filter((m) => m.job === selectedJob)
      : sorted
    
    const pages = Math.ceil(filtered.length / memberLimit)
    const paginated = filtered.slice(
      (currentPage - 1) * memberLimit,
      currentPage * memberLimit
    )
    
    return {
      sortedMembers: sorted,
      filteredMembers: filtered,
      paginatedMembers: paginated,
      totalPages: pages
    }
  }, [members, selectedJob, currentPage, memberLimit])

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div
        id="tour-member-list"
        className="rounded-lg flex flex-col h-[700px] overflow-hidden transition-colors"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
      >
        <div
          className="p-5 border-b flex justify-between items-center gap-3 flex-wrap"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <h2 className="text-lg font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
            Daftar Member Guild
          </h2>
          <div className="flex items-center gap-3">
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
                  <td colSpan={5} className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    Tidak ada member yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedMembers.map((char) => (
                  <tr
                    key={char.id}
                    className="border-b transition-colors hover:bg-white/5"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <td className="p-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {char.name}
                    </td>
                    <td className="p-4 flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
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
                      {Math.round(char.pvp_score || 0).toLocaleString('id-ID')}
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
                        <Button variant="ghost" size="sm" onClick={() => setSelectedDetailMember(char)}>
                          Detail
                        </Button>
                        <Button variant="amber" size="sm" onClick={() => setSelectedUpdateMember(char)}>
                          Edit
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
        onClose={() => setSelectedDetailMember(null)}
        footerActions={
          selectedDetailMember ? (
            <>
              <Button
                variant={selectedDetailMember.isVerified ? 'ghost' : 'success'}
                size="md"
                loading={isPending}
                className={`flex-1 sm:flex-none ${selectedDetailMember.isVerified ? '!bg-amber-500/10 !text-amber-500 !border-amber-500/20' : ''}`}
                onClick={() => handleToggleVerify(selectedDetailMember)}
              >
                {selectedDetailMember.isVerified ? 'Batalkan Verifikasi' : 'Approve & Verifikasi'}
              </Button>
              <Button
                variant="ghost"
                size="md"
                loading={isPending}
                className="flex-1 sm:flex-none !bg-red-500/10 !text-red-500 !border-red-500/20"
                onClick={() => handleDeleteMember(selectedDetailMember.id)}
              >
                Hapus Member
              </Button>
              <Button variant="ghost" size="md" onClick={() => setSelectedDetailMember(null)}>
                Tutup
              </Button>
            </>
          ) : null
        }
      />

      <MemberUpdateDialog
        character={selectedUpdateMember}
        isOpen={!!selectedUpdateMember}
        onClose={() => setSelectedUpdateMember(null)}
      />
    </div>
  )
}
