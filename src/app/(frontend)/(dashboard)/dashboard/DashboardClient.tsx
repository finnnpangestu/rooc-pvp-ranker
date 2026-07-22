'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { GlobalDialog } from '../../components/GlobalDialog'
import { Badge } from '../../components/Badge'
import { Button } from '../../components/Button'
import { Pagination } from '../../components/Pagination'
import { TabBar, TabButton } from '../../components/TabBar'
import { JobFilterDropdown } from '../../components/JobFilterDropdown'
import { StatCard } from '../../components/StatCard'
import { JOB_LABELS } from '@/const/JobLabels'
import { createGuild } from '@/actions/dashboard/createGuild'
import { toggleVerifyMember } from '@/actions/dashboard/toggleVerifyMember'
import { deleteCharacter } from '@/actions/dashboard/deleteCharacter'
import { useRouter } from 'next/navigation'
import { useTheme } from '../../components/ThemeProvider'
import { LimitDropdown } from '../../components/LimitDropdown'

interface DashboardClientProps {
  guild: any | null
  members: any[]
  partySetup?: any | null
}

const getJobIcon = (job: string) => `/icons/jobs/${job}.png`

export function DashboardClient({ guild, members, partySetup }: DashboardClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [isPending, startTransition] = useTransition()
  const [guildName, setGuildName] = useState('')
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState('general')
  const [error, setError] = useState('')
  const router = useRouter()

  const [memberLimit, setMemberLimit] = useState(5)
  const [leaderboardLimit, setleaderboardLimit] = useState(5)
  const [currentPage, setCurrentPage] = useState(1)
  const [leaderboardPage, setLeaderboardPage] = useState(1)

  const [selectedRosterJob, setSelectedRosterJob] = useState('')
  const [isRosterDropdownOpen, setIsRosterDropdownOpen] = useState(false)

  const [selectedLeaderboardJob, setSelectedLeaderboardJob] = useState('')
  const [isLbdDropdownOpen, setIsLbdDropdownOpen] = useState(false)

  useEffect(() => {
    setCurrentPage(1)
    setLeaderboardPage(1)
  }, [selectedRosterJob, selectedLeaderboardJob, memberLimit, leaderboardLimit])

  useEffect(() => {
    if (selectedMember) {
      setActiveDetailTab('general')
    }
  }, [selectedMember])

  const sortedMembers = [...members].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  if (!guild) {
    const handleCreateGuild = async (e: React.FormEvent) => {
      e.preventDefault()
      if (!guildName.trim()) return
      setError('')

      startTransition(async () => {
        const res = await createGuild(guildName)
        if (!res.success) {
          setError(res.error || 'Gagal mendirikan guild')
        }
      })
    }

    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-160px)] relative">
        <div
          className="rounded-2xl py-12 px-10 max-w-[480px] w-full text-center"
          style={{
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-neumorph)',
          }}
        >
          <div
            className="w-[72px] h-[72px] mx-auto mb-6 rounded-full flex items-center justify-center relative"
            style={{
              background: 'var(--bg-primary)',
              boxShadow: 'var(--shadow-neumorph-inset)',
            }}
          >
            <svg
              className="w-8 h-8"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: 'var(--text-primary)' }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Buat Guild Baru
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
            Anda belum memiliki guild. Daftarkan guild Anda untuk mulai mengelola roster.
          </p>
          {error && (
            <div className="text-red-300 bg-red-500/10 p-3 rounded-lg text-[13px] mb-4 border border-red-500/20">
              {error}
            </div>
          )}
          <form onSubmit={handleCreateGuild} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nama Guild..."
              value={guildName}
              onChange={(e) => setGuildName(e.target.value)}
              className="w-full rounded-lg py-3 px-4 font-sans transition-all duration-200 outline-none"
              style={{
                background: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                color: 'var(--text-primary)',
                border: 'none',
              }}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isPending}
              className="w-full"
            >
              {isPending ? 'Membuat...' : 'Buat Guild'}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  const handleToggleVerify = (char: any) => {
    startTransition(async () => {
      const res = await toggleVerifyMember(char.id, char.isVerified)
      if (res.success) {
        setSelectedMember((prev: any) => (prev ? { ...prev, isVerified: !prev.isVerified } : null))
        router.refresh()
      }
    })
  }

  const filteredMembers = selectedRosterJob
    ? sortedMembers.filter((m) => m.job === selectedRosterJob)
    : sortedMembers
  const totalPages = Math.ceil(filteredMembers.length / memberLimit)
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * memberLimit,
    currentPage * memberLimit,
  )

  const verifiedMembers = members.filter((m) => m.isVerified)
  const sortedLeaderboard = (
    selectedLeaderboardJob
      ? verifiedMembers.filter((m) => m.job === selectedLeaderboardJob)
      : verifiedMembers
  ).sort((a, b) => (b.pvp_score || 0) - (a.pvp_score || 0))
  const totalLeaderboardPages = Math.ceil(sortedLeaderboard.length / leaderboardLimit)
  const paginatedLeaderboard = sortedLeaderboard.slice(
    (leaderboardPage - 1) * leaderboardLimit,
    leaderboardPage * leaderboardLimit,
  )

  const rosterShouldScroll = memberLimit > 5
  const leaderboardShouldScroll = leaderboardLimit > 5
  const rosterMaxHeight = rosterShouldScroll ? 'max-h-[420px]' : 'max-h-[none]'
  const leaderboardMaxHeight = leaderboardShouldScroll ? 'max-h-[420px]' : 'max-h-[none]'

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div
          className="rounded-lg p-6 flex items-center gap-5 transition-colors"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div
            className="p-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-primary)', boxShadow: 'var(--shadow-neumorph-inset)' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-primary)' }}
            >
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              TOTAL MEMBER (VERIFIED)
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {guild.total_characters || 0}
            </div>
          </div>
        </div>

        <div
          className="rounded-lg p-6 flex items-center gap-5 transition-colors"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div
            className="p-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-primary)', boxShadow: 'var(--shadow-neumorph-inset)' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#f59e0b' }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              TOTAL PVP SCORE GUILD
            </div>
            <div className="text-2xl font-bold" style={{ color: '#f59e0b' }}>
              {Math.round(guild.total_pvp_score || 0).toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        <div
          className="rounded-lg p-6 flex items-center gap-5 transition-colors"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div
            className="p-4 rounded-full flex items-center justify-center"
            style={{ background: 'var(--bg-primary)', boxShadow: 'var(--shadow-neumorph-inset)' }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--text-primary)' }}
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4l3 3" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              PENDING VERIFIKASI
            </div>
            <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {members.filter((m) => !m.isVerified).length}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          className="rounded-lg p-6 flex flex-col justify-between transition-colors lg:col-span-1"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div>
            <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Performa Guild League
            </h2>
          </div>

          <div className="flex justify-between items-end mb-2">
            <div className="flex flex-col gap-1">
              <div
                className="text-[36px] font-bold tracking-tight leading-none"
                style={{ color: '#10b981' }}
              >
                {guild.gl_wins || 0}{' '}
                <span className="text-[18px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Wins
                </span>
              </div>
              <div
                className="text-[20px] font-bold tracking-tight leading-none"
                style={{ color: '#ef4444' }}
              >
                {guild.gl_losses || 0}{' '}
                <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
                  Losses
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                5 Match Terakhir
              </span>
              <div className="flex gap-1.5">
                {(guild.gl_trends || '-----')
                  .padEnd(5, '-')
                  .split('')
                  .slice(0, 5)
                  .map((result: string, i: number) => (
                    <div
                      key={i}
                      className="w-7 h-7 flex items-center justify-center rounded-full text-[12px] font-bold"
                      style={{
                        background:
                          result === 'W'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : result === 'L'
                              ? 'rgba(239, 68, 68, 0.15)'
                              : 'var(--bg-primary)',
                        color:
                          result === 'W'
                            ? '#10b981'
                            : result === 'L'
                              ? '#ef4444'
                              : 'var(--text-muted)',
                        boxShadow: result === '-' ? 'var(--shadow-neumorph-inset)' : 'none',
                        border:
                          result === 'W'
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : result === 'L'
                              ? '1px solid rgba(239, 68, 68, 0.3)'
                              : 'none',
                      }}
                    >
                      {result}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-lg p-6 transition-colors lg:col-span-2"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Top 5 Best Performers
              </h2>
            </div>
            <div
              className="p-2 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                color: '#f59e0b',
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {(() => {
              const verifiedMembers = members.filter((m) => m.isVerified)
              if (verifiedMembers.length === 0) {
                return (
                  <div
                    className="col-span-5 rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-2 border"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-neumorph-inset)',
                    }}
                  >
                    <div
                      className="mb-3 p-3 rounded-full flex items-center justify-center"
                      style={{
                        background: 'var(--bg-secondary)',
                        boxShadow: 'var(--shadow-neumorph-inset)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="8.5" cy="7" r="4" />
                        <line x1="18" y1="8" x2="23" y2="13" />
                        <line x1="23" y1="8" x2="18" y2="13" />
                      </svg>
                    </div>
                    <div
                      className="text-[14px] font-semibold mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Belum Ada Member Terverifikasi
                    </div>
                    <div className="text-[12px]" style={{ color: 'var(--text-muted)' }}>
                      Harap verifikasi member di tabel manajemen roster.
                    </div>
                  </div>
                )
              }

              const rankedMembers = verifiedMembers
                .map((m) => {
                  const totalGLScore = m.gl_total_score || 0
                  return { ...m, calculatedGLScore: totalGLScore }
                })
                .sort((a, b) => b.calculatedGLScore - a.calculatedGLScore)

              const top5 = rankedMembers.slice(0, 5)
              const hasData = top5.some((char) => char.calculatedGLScore > 0)

              if (!hasData) {
                return (
                  <div
                    className="col-span-5 rounded-2xl p-8 flex flex-col items-center justify-center text-center mt-2 border"
                    style={{
                      background: 'var(--bg-primary)',
                      borderColor: 'var(--border-color)',
                      boxShadow: 'var(--shadow-neumorph-inset)',
                    }}
                  >
                    <div
                      className="mb-3 p-3 rounded-full flex items-center justify-center"
                      style={{
                        background: 'var(--bg-secondary)',
                        boxShadow: 'var(--shadow-neumorph-inset)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    </div>
                    <div
                      className="text-[14px] font-normal mb-1"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Data Report Masih Kosong
                    </div>
                  </div>
                )
              }

              return top5.map((char, index) => (
                <div
                  key={char.id}
                  className="rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all duration-200 border relative"
                  style={{
                    background: 'var(--bg-primary)',
                    borderColor: index === 0 ? 'rgba(251, 191, 36, 0.3)' : 'var(--border-color)',
                    boxShadow: 'var(--shadow-neumorph-sm)',
                  }}
                >
                  <div className="relative mb-2">
                    <img
                      src={getJobIcon(char.job)}
                      alt=""
                      className="w-10 h-10 object-cover rounded-[20%] shadow-sm"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    {index === 0 && (
                      <div className="absolute -top-2 -right-2 text-[12px] bg-amber-400 text-black w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-md">
                        1
                      </div>
                    )}
                  </div>
                  <div
                    className="font-semibold text-[13px] truncate w-full mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {char.name}
                  </div>
                  <div className="text-[12px] font-bold text-amber-400">
                    {Math.round(char.calculatedGLScore).toLocaleString('id-ID')}
                  </div>
                </div>
              ))
            })()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[3fr_2fr] gap-6">
        <div
          className="rounded-lg flex flex-col h-[600px] overflow-hidden transition-colors"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div
            className="p-5 border-b flex justify-between items-center gap-3 flex-wrap"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <h2 className="text-lg font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
              Manajemen Roster Guild
            </h2>
            <div className="flex items-center gap-3">
              <JobFilterDropdown
                value={selectedRosterJob}
                onChange={(v) => {
                  setSelectedRosterJob(v)
                  setCurrentPage(1)
                }}
                isOpen={isRosterDropdownOpen}
                onToggle={() => {
                  setIsRosterDropdownOpen(!isRosterDropdownOpen)
                  setIsLbdDropdownOpen(false)
                }}
                onClose={() => setIsRosterDropdownOpen(false)}
              />
              <LimitDropdown
                value={memberLimit}
                onChange={(val) => {
                  setMemberLimit(val)
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>
          <div
            className={`flex-1 overflow-y-auto relative ${rosterShouldScroll ? rosterMaxHeight : ''}`}
            style={rosterShouldScroll ? { maxHeight: '420px' } : {}}
          >
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
                  <th
                    className="p-4 text-center font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
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
                      colSpan={4}
                      className="p-8 text-center"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Tidak ada data karakter untuk kriteria job ini.
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
                      <td
                        className="p-4 flex items-center gap-3"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <img
                          src={getJobIcon(char.job)}
                          alt=""
                          className="w-6 h-6 object-cover rounded shadow-sm"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        {JOB_LABELS[char.job] || char.job}
                      </td>
                      <td className="p-4 text-center">
                        <Badge variant={char.isVerified ? 'success' : 'warning'}>
                          {char.isVerified ? 'Verified' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedMember(char)}>
                          Detail
                        </Button>
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

        <div
          className="rounded-lg flex flex-col h-[600px] overflow-hidden transition-colors"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-neumorph)' }}
        >
          <div
            className="p-5 border-b flex justify-between items-center gap-3 flex-wrap"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <h2 className="text-lg font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
              Top Rank Internal
            </h2>
            <div className="flex items-center gap-3">
              <JobFilterDropdown
                value={selectedLeaderboardJob}
                onChange={(v) => {
                  setSelectedLeaderboardJob(v)
                  setLeaderboardPage(1)
                }}
                isOpen={isLbdDropdownOpen}
                onToggle={() => {
                  setIsLbdDropdownOpen(!isLbdDropdownOpen)
                  setIsRosterDropdownOpen(false)
                }}
                onClose={() => setIsLbdDropdownOpen(false)}
              />
              <LimitDropdown
                value={leaderboardLimit}
                onChange={(val) => {
                  setleaderboardLimit(val)
                  setLeaderboardPage(1)
                }}
              />
            </div>
          </div>
          <div
            className={`flex-1 overflow-y-auto relative ${leaderboardShouldScroll ? leaderboardMaxHeight : ''}`}
            style={leaderboardShouldScroll ? { maxHeight: '420px' } : {}}
          >
            <table className="w-full border-collapse text-sm">
              <thead
                className="sticky top-0 shadow-md z-10 border-b"
                style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-color)' }}
              >
                <tr>
                  <th
                    className="p-4 text-center font-medium w-[60px]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    No
                  </th>
                  <th className="p-4 text-left font-medium" style={{ color: 'var(--text-muted)' }}>
                    IGN
                  </th>
                  <th className="p-4 text-right font-medium" style={{ color: 'var(--text-muted)' }}>
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeaderboard.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="p-8 text-center"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      Belum ada member terverifikasi.
                    </td>
                  </tr>
                ) : (
                  paginatedLeaderboard.map((char, idx) => (
                    <tr
                      key={char.id}
                      className="border-b transition-colors hover:bg-white/5"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <td
                        className={`p-4 text-center font-bold ${idx === 0 && leaderboardPage === 1 ? 'text-amber-400' : ''}`}
                        style={{
                          color:
                            idx === 0 && leaderboardPage === 1 ? '#f59e0b' : 'var(--text-muted)',
                        }}
                      >
                        {(leaderboardPage - 1) * leaderboardLimit + idx + 1}
                      </td>
                      <td className="p-4 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {char.name}
                      </td>
                      <td className="p-4 text-right font-semibold text-amber-400">
                        {Math.round(char.pvp_score || 0).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <Pagination
              currentPage={leaderboardPage}
              totalPages={totalLeaderboardPages}
              onPageChange={setLeaderboardPage}
            />
          </div>
        </div>
      </div>

      {selectedMember && (
        <GlobalDialog
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={`Detail: ${selectedMember.name}`}
          maxWidth={800}
        >
          <div>
            <div
              className="flex items-center gap-4 mb-6 p-4 rounded-lg border"
              style={{
                background: 'var(--bg-primary)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-neumorph-inset)',
              }}
            >
              <img
                src={getJobIcon(selectedMember.job)}
                alt=""
                className="w-12 h-12 object-cover rounded-lg shadow-sm border"
                style={{ borderColor: 'var(--border-color)' }}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div>
                <div className="font-semibold text-xl" style={{ color: 'var(--text-primary)' }}>
                  {JOB_LABELS[selectedMember.job] || selectedMember.job}
                </div>
                <div className="text-sm text-amber-400 font-medium mt-1 flex items-center gap-1.5">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  PvP Score: {Math.round(selectedMember.pvp_score || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <TabBar className="mb-6">
              <TabButton
                isActive={activeDetailTab === 'general'}
                onClick={() => setActiveDetailTab('general')}
              >
                General
              </TabButton>
              <TabButton
                isActive={activeDetailTab === 'quasi'}
                onClick={() => setActiveDetailTab('quasi')}
              >
                Quasi
              </TabButton>
              <TabButton
                isActive={activeDetailTab === 'special'}
                onClick={() => setActiveDetailTab('special')}
              >
                Special
              </TabButton>
            </TabBar>

            <div className={activeDetailTab === 'general' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
                <StatCard label="Max HP" value={selectedMember.max_hp} />
                <StatCard label="PATK" value={selectedMember.patk} />
                <StatCard label="MATK" value={selectedMember.matk} />
                <StatCard label="PDEF" value={selectedMember.pdef} />
                <StatCard label="MDEF" value={selectedMember.mdef} />
                <StatCard label="Refine PATK" value={selectedMember.refine_patk} />
                <StatCard label="Refine MATK" value={selectedMember.refine_matk} />
                <StatCard label="Refine PDEF" value={selectedMember.refine_pdef} />
                <StatCard label="Refine MDEF" value={selectedMember.refine_mdef} />
                <StatCard label="HIT" value={selectedMember.hit} />
                <StatCard label="FLEE" value={selectedMember.flee} />
              </div>
            </div>

            <div className={activeDetailTab === 'quasi' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
                <StatCard label="ASPD" value={selectedMember.aspd} isPercent />
                <StatCard label="Movement SPD" value={selectedMember.mspd} isPercent />
                <StatCard label="Variable CT" value={selectedMember.variable_cast} isPercent />
                <StatCard label="Fixed CT" value={selectedMember.fixed_cast} isPercent />
                <StatCard label="Healing Done" value={selectedMember.healing_done} isPercent />
                <StatCard label="Healing Taken" value={selectedMember.healing_taken} isPercent />
                <StatCard label="CRIT" value={selectedMember.critical} />
                <StatCard label="CRIT DMG" value={selectedMember.critical_damage} isPercent />
                <StatCard label="CRIT RES" value={selectedMember.critical_reduction} />
                <StatCard
                  label="CRIT DMG RES"
                  value={selectedMember.critical_damage_reduction}
                  isPercent
                />
                <StatCard label="PDMG" value={selectedMember.pdmg} isPercent />
                <StatCard label="MDMG" value={selectedMember.mdmg} isPercent />
                <StatCard label="PDMG.R" value={selectedMember.pdmg_reduction} isPercent />
                <StatCard label="MDMG.R" value={selectedMember.mdmg_reduction} isPercent />
                <StatCard label="Ignore PDEF" value={selectedMember.ignore_pdef} />
                <StatCard label="Ignore MDEF" value={selectedMember.ignore_mdef} />
                <StatCard label="PDMG Bonus" value={selectedMember.pdmg_bonus} />
                <StatCard label="MDMG Bonus" value={selectedMember.mdmg_bonus} />
                <StatCard label="PvP DMG Bonus" value={selectedMember.pvp_dmg_bonus} />
                <StatCard label="PvP DMG Red" value={selectedMember.pvp_dmg_reduction} />
              </div>
            </div>

            <div className={activeDetailTab === 'special' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
                <StatCard label="Max HP %" value={selectedMember.max_hp_percentage} isPercent />
                <StatCard
                  label="Equip PATK %"
                  value={selectedMember.equipment_patk_percentage}
                  isPercent
                />
                <StatCard
                  label="Equip MATK %"
                  value={selectedMember.equipment_matk_percentage}
                  isPercent
                />
                <StatCard
                  label="Equip PDEF %"
                  value={selectedMember.equipment_pdef_percentage}
                  isPercent
                />
                <StatCard
                  label="Equip MDEF %"
                  value={selectedMember.equipment_mdef_percentage}
                  isPercent
                />
                <StatCard label="DMG vs Demi" value={selectedMember.dmg_vs_demi_human} isPercent />
                <StatCard
                  label="DMG Red vs Demi"
                  value={selectedMember.dmg_reduction_demi_human}
                  isPercent
                />
                <StatCard label="DMG vs Medium" value={selectedMember.dmg_vs_medium} isPercent />
                <StatCard
                  label="DMG Red vs Medium"
                  value={selectedMember.dmg_reduction_medium}
                  isPercent
                />
                <StatCard
                  label="Neutral Bonus"
                  value={selectedMember.neutral_dmg_bonus}
                  isPercent
                />
                <StatCard
                  label="Neutral Red"
                  value={selectedMember.neutral_dmg_reduction}
                  isPercent
                />
                <StatCard label="DMG vs Fire" value={selectedMember.fire_dmg_bonus} isPercent />
                <StatCard
                  label="DMG Red vs Fire"
                  value={selectedMember.fire_dmg_reduction}
                  isPercent
                />
                <StatCard label="DMG vs Water" value={selectedMember.water_dmg_bonus} isPercent />
                <StatCard
                  label="DMG Red vs Water"
                  value={selectedMember.water_dmg_reduction}
                  isPercent
                />
                <StatCard label="DMG vs Wind" value={selectedMember.wind_dmg_bonus} isPercent />
                <StatCard
                  label="DMG Red vs Wind"
                  value={selectedMember.wind_dmg_reduction}
                  isPercent
                />
                <StatCard label="DMG vs Earth" value={selectedMember.earth_dmg_bonus} isPercent />
                <StatCard
                  label="DMG Red vs Earth"
                  value={selectedMember.earth_dmg_reduction}
                  isPercent
                />
                <StatCard label="DMG vs Ghost" value={selectedMember.ghost_dmg_bonus} isPercent />
                <StatCard
                  label="DMG Red vs Ghost"
                  value={selectedMember.ghost_dmg_reduction}
                  isPercent
                />
                <StatCard label="DMG vs Holy" value={selectedMember.holy_dmg_bonus} isPercent />
                <StatCard
                  label="DMG Red vs Holy"
                  value={selectedMember.holy_dmg_reduction}
                  isPercent
                />
                <StatCard label="DMG vs Poison" value={selectedMember.poison_dmg_bonus} isPercent />
                <StatCard
                  label="DMG Red vs Poison"
                  value={selectedMember.poison_dmg_reduction}
                  isPercent
                />
              </div>
            </div>

            {/* Present/Absent GL Stats */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Hadir GL" value={selectedMember.gl_present_count || 0} />
                <StatCard label="Tidak Hadir GL" value={selectedMember.gl_absent_count || 0} />
              </div>
            </div>

            <div
              className="flex justify-end gap-3 mt-4 pt-5 border-t"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Button
                variant="destructive"
                size="md"
                title="Hapus Karakter"
                onClick={() => {
                  if (confirm('Yakin ingin menghapus karakter ini permanen?')) {
                    startTransition(async () => {
                      const res = await deleteCharacter(selectedMember.id)
                      if (res.success) setSelectedMember(null)
                    })
                  }
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </Button>
              <Button
                variant={selectedMember.isVerified ? 'ghost' : 'success'}
                size="md"
                loading={isPending}
                className={`flex-1 sm:flex-none ${selectedMember.isVerified ? '!bg-amber-500/10 !text-amber-500 !border-amber-500/20' : ''}`}
                onClick={() => handleToggleVerify(selectedMember)}
              >
                {selectedMember.isVerified ? 'Batalkan Verifikasi' : 'Approve & Verifikasi'}
              </Button>
              <Button variant="ghost" size="md" onClick={() => setSelectedMember(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </GlobalDialog>
      )}
    </div>
  )
}
