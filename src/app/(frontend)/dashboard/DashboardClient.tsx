'use client'

import React, { useState, useTransition, useEffect } from 'react'
import { GlobalDialog } from '../components/GlobalDialog'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { Pagination } from '../components/Pagination'
import { TabBar, TabButton } from '../components/TabBar'
import { JobFilterDropdown } from '../components/JobFilterDropdown'
import { StatCard } from '../components/StatCard'
import { JOB_LABELS } from '@/const/JobLabels'
import { createGuild } from '@/actions/dashboard/createGuild'
import { deleteGuild } from '@/actions/dashboard/deleteGuild'
import { toggleVerifyMember } from '@/actions/dashboard/toggleVerifyMember'
import { deleteCharacter } from '@/actions/dashboard/deleteCharacter'
import { logoutUser } from '@/actions/auth/logoutUser'
import { useRouter } from 'next/navigation'

interface DashboardClientProps {
  guild: any | null
  members: any[]
  partySetup?: any | null
}

const getJobIcon = (job: string) => `/icons/jobs/${job}.png`

const ITEMS_LIMIT = 10
const LEADERBOARD_LIMIT = 10

export function DashboardClient({ guild, members, partySetup }: DashboardClientProps) {
  const [isPending, startTransition] = useTransition()
  const [guildName, setGuildName] = useState('')
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState('general')
  const [error, setError] = useState('')
  const router = useRouter()

  const [currentPage, setCurrentPage] = useState(1)
  const [leaderboardPage, setLeaderboardPage] = useState(1)

  const [selectedRosterJob, setSelectedRosterJob] = useState('')
  const [isRosterDropdownOpen, setIsRosterDropdownOpen] = useState(false)

  const [selectedLeaderboardJob, setSelectedLeaderboardJob] = useState('')
  const [isLbdDropdownOpen, setIsLbdDropdownOpen] = useState(false)

  useEffect(() => {
    setCurrentPage(1)
    setLeaderboardPage(1)
  }, [selectedRosterJob, selectedLeaderboardJob])

  useEffect(() => {
    if (selectedMember) {
      setActiveDetailTab('general')
    }
  }, [selectedMember])

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
      <div className="flex justify-center items-center min-h-[calc(100vh-160px)] p-5 relative">
        <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(0,0,0,0)_70%)] z-0 pointer-events-none"></div>

        <div className="bg-[#0a0a0e]/80 backdrop-blur-[24px] border border-white/10 rounded-2xl py-12 px-10 max-w-[480px] w-full text-center shadow-[0_30px_60px_-15px_rgba(0,0,0,0.9)] relative z-10">
          <div className="w-[72px] h-[72px] mx-auto mb-6 bg-indigo-500/5 border border-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 relative">
            <div className="absolute inset-0 bg-indigo-600 blur-[20px] opacity-20 -z-10"></div>
            <svg
              className="w-8 h-8 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              <path d="M12 8v8"></path>
              <path d="M8 12h8"></path>
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-white mb-2">Buat Guild Baru</h1>
          <p className="text-gray-400 text-sm mb-8">
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
              className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white font-sans transition-all duration-200 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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

  // === Handlers ===
  const handleLogout = () => {
    startTransition(async () => {
      await logoutUser()
      router.refresh()
    })
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

  // === Data ===
  const filteredMembers = selectedRosterJob
    ? members.filter((m) => m.job === selectedRosterJob)
    : members
  const totalPages = Math.ceil(filteredMembers.length / ITEMS_LIMIT)
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_LIMIT,
    currentPage * ITEMS_LIMIT,
  )

  const verifiedMembers = members.filter((m) => m.isVerified)
  const sortedLeaderboard = (
    selectedLeaderboardJob
      ? verifiedMembers.filter((m) => m.job === selectedLeaderboardJob)
      : verifiedMembers
  ).sort((a, b) => (b.pvp_score || 0) - (a.pvp_score || 0))
  const totalLeaderboardPages = Math.ceil(sortedLeaderboard.length / LEADERBOARD_LIMIT)
  const paginatedLeaderboard = sortedLeaderboard.slice(
    (leaderboardPage - 1) * LEADERBOARD_LIMIT,
    leaderboardPage * LEADERBOARD_LIMIT,
  )

  return (
    <>
      <div className="max-w-[1200px] my-10 mx-auto p-10 bg-[#0f0f14]/70 backdrop-blur-md border border-white/5 rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] text-white font-sans relative overflow-hidden">
        <div className="absolute -top-[100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,rgba(0,0,0,0)_70%)] z-0 pointer-events-none"></div>

        {/* === HEADER === */}
        <div className="flex justify-between items-start flex-wrap gap-4 mb-8 border-b border-white/5 pb-6">
          <div>
            <Badge variant="info">Guild Master Panel</Badge>
            <h1 className="mt-2 mb-1 text-4xl">{guild.name}</h1>
            <p className="m-0 text-gray-400">
              Kelola aplikasi masuk, verifikasi status, dan pantau peringkat internal.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/stats')}
              className="hover:!bg-indigo-700 hover:!border-indigo-700 hover:!text-white"
            >
              Add Stats Member
            </Button>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="hover:!bg-red-700 hover:!border-red-700 hover:!text-white"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </Button>
          </div>
        </div>

        {/* === QUICK LINKS === */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-4 mb-8">
          <div
            onClick={() => router.push('/guild-league')}
            className="flex items-center bg-gradient-to-br from-indigo-500/10 to-black/40 border border-indigo-500/30 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-indigo-400"
          >
            <div>
              <h3 className="m-0 text-white text-lg font-semibold">Guild League Setup</h3>
              <p className="mt-1 text-gray-400 text-[13px]">
                Generate otomatis formasi Elite &amp; Sub Party.
              </p>
            </div>
          </div>

          <div
            onClick={() => router.push('/report-gl')}
            className="flex items-center bg-gradient-to-br from-emerald-500/10 to-black/40 border border-emerald-500/30 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:border-emerald-400"
          >
            <div>
              <h3 className="m-0 text-white text-lg font-semibold">Report GL</h3>
              <p className="mt-1 text-gray-400 text-[13px]">
                Evaluasi skor &amp; performa GvG (Coming Soon).
              </p>
            </div>
          </div>
        </div>

        {/* === STATS SUMMARY === */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4 mb-8">
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
            <div className="text-xs text-gray-400 font-medium">TOTAL MEMBER (VERIFIED)</div>
            <div className="text-[24px] font-bold text-white mt-1">
              {guild.total_characters || 0}
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
            <div className="text-xs text-gray-400 font-medium">TOTAL PVP SCORE GUILD</div>
            <div className="text-[24px] font-bold text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.3)] mt-1">
              {Math.round(guild.total_pvp_score || 0).toLocaleString('id-ID')}
            </div>
          </div>
          <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
            <div className="text-xs text-gray-400 font-medium">PENDING VERIFIKASI</div>
            <div className="text-[24px] font-bold text-white mt-1">
              {members.filter((m) => !m.isVerified).length}
            </div>
          </div>
        </div>

        {/* === MAIN GRID === */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-8 mt-6">
          {/* Kolom Kiri: Roster */}
          <div className="bg-[#141419]/60 backdrop-blur-[20px] border border-white/5 rounded-[24px] p-8 relative">
            <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-white m-0">Manajemen Roster Guild</h2>
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
            </div>

            <div className="overflow-x-auto min-h-[400px] flex flex-col justify-between">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm">
                    <th className="p-3 text-left">Karakter</th>
                    <th className="p-3 text-left">Job</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500">
                        Tidak ada data karakter untuk kriteria job ini.
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((char) => (
                      <tr key={char.id} className="border-b border-white/5">
                        <td className="p-3 font-medium text-white overflow-hidden text-ellipsis whitespace-nowrap max-w-40">
                          {char.name}
                        </td>
                        <td className="p-3 text-gray-300 flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap max-w-40">
                          <img
                            src={getJobIcon(char.job)}
                            alt=""
                            className="w-[18px] h-[18px] object-cover rounded-[20%]"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                          {JOB_LABELS[char.job] || char.job}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={char.isVerified ? 'success' : 'warning'}>
                            {char.isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedMember(char)}
                            className="hover:!bg-indigo-500/15 hover:!border-indigo-500"
                          >
                            Detail
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>

          {/* Kolom Kanan: Top Rank Internal */}
          <div className="bg-[#141419]/60 backdrop-blur-[20px] border border-white/5 rounded-[24px] p-8 relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 gap-3 flex-wrap">
              <h2 className="text-xl font-semibold text-white m-0">Top Rank Internal</h2>
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
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm">
                    <th className="p-3 text-center w-[50px]">No</th>
                    <th className="p-3 text-left">IGN</th>
                    <th className="p-3 text-right">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLeaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-gray-500">
                        Belum ada member terverifikasi.
                      </td>
                    </tr>
                  ) : (
                    paginatedLeaderboard.map((char, idx) => (
                      <tr key={char.id} className="border-b border-white/5">
                        <td
                          className={`p-3 text-center font-bold ${idx === 0 && leaderboardPage === 1 ? 'text-amber-400' : 'text-gray-400'}`}
                        >
                          {(leaderboardPage - 1) * LEADERBOARD_LIMIT + idx + 1}
                        </td>
                        <td className="p-3 text-white font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-40">
                          {char.name}
                        </td>
                        <td className="p-3 text-right font-semibold text-amber-400">
                          {Math.round(char.pvp_score || 0).toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              <Pagination
                currentPage={leaderboardPage}
                totalPages={totalLeaderboardPages}
                onPageChange={setLeaderboardPage}
              />
            </div>
          </div>
        </div>
      </div>

      {/* === DIALOG DETAIL KARAKTER === */}
      {selectedMember && (
        <GlobalDialog
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={`Detail: ${selectedMember.name}`}
          maxWidth={800}
        >
          <div className="text-gray-300">
            {/* Member header */}
            <div className="flex items-center gap-3 mb-4 bg-white/5 p-3 rounded-lg border border-white/5">
              <img
                src={getJobIcon(selectedMember.job)}
                alt=""
                className="w-10 h-10 object-cover rounded-[20%]"
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div>
                <div className="font-semibold text-white text-lg">
                  {JOB_LABELS[selectedMember.job] || selectedMember.job}
                </div>
                <div className="text-sm text-amber-400 font-semibold">
                  🛡️ PvP Score: {Math.round(selectedMember.pvp_score || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* Tabs */}
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

            {/* Tab Content: General */}
            <div className={activeDetailTab === 'general' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
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

            {/* Tab Content: Quasi */}
            <div className={activeDetailTab === 'quasi' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
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

            {/* Tab Content: Special */}
            <div className={activeDetailTab === 'special' ? 'block' : 'hidden'}>
              <div className="grid grid-cols-3 gap-3 text-sm mb-6 max-h-[400px] overflow-y-auto pr-2">
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

            {/* Dialog Actions */}
            <div className="flex gap-3 mt-4 pt-4 border-t border-white/5">
              {/* Delete */}
              <Button
                variant="destructive"
                size="md"
                className="!p-3"
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
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </Button>

              {/* Toggle Verify */}
              <Button
                variant={selectedMember.isVerified ? 'ghost' : 'success'}
                size="md"
                loading={isPending}
                className={`flex-1 !p-3 ${selectedMember.isVerified ? '!bg-amber-500/20 !text-amber-500 !border-amber-500/30' : ''}`}
                onClick={() => handleToggleVerify(selectedMember)}
              >
                {selectedMember.isVerified ? 'Batalkan Verifikasi' : 'Approve & Verifikasi'}
              </Button>

              {/* Close */}
              <Button
                variant="ghost"
                size="md"
                className="!px-5 !py-3"
                onClick={() => setSelectedMember(null)}
              >
                Tutup
              </Button>
            </div>
          </div>
        </GlobalDialog>
      )}
    </>
  )
}
