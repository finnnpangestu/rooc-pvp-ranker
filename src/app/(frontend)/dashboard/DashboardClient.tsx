'use client'

import React, { useState, useTransition, useEffect } from 'react'
import styles from '../stats/stats.module.css'
import dStyles from './dashboard.module.css'
import { GlobalDialog } from '../components/GlobalDialog'
import { Badge } from '../components/Badge'
import { createGuild, deleteCharacter, deleteGuild, toggleVerifyMember } from './actions'

interface DashboardClientProps {
  guild: any | null
  members: any[]
}

const JOB_LABELS: Record<string, string> = {
  lord_knight: 'Lord Knight',
  paladin: 'Paladin',
  high_priest: 'High Priest',
  champion: 'Champion',
  assassin_cross: 'Assassin Cross',
  stalker: 'Stalker',
  high_wizard: 'High Wizard',
  professor: 'Professor',
  sniper: 'Sniper',
  minstrell: 'Minstrell',
  gypsy: 'Gypsy',
  mastersmith: 'Mastersmith',
  biochemist: 'Biochemist',
  summoner: 'Summoner',
  adept_novice: 'Adept Novice',
  rebellion: 'Rebellion',
}

const getJobIcon = (job: string) => `/icons/jobs/${job}.png`

const renderStat = (label: string, value: any, isPercent: boolean = false) => (
  <div className={dStyles.detailItem}>
    <span>{label}</span>
    <strong>
      {value
        ? isPercent
          ? `${value}%`
          : Number(value).toLocaleString('id-ID')
        : isPercent
          ? '0%'
          : '0'}
    </strong>
  </div>
)

const ITEMS_LIMIT = 10
const LEADERBOARD_LIMIT = 10

export function DashboardClient({ guild, members }: DashboardClientProps) {
  const [isPending, startTransition] = useTransition()
  const [guildName, setGuildName] = useState('')
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [activeDetailTab, setActiveDetailTab] = useState('general')
  const [error, setError] = useState('')

  const [isLeaderboardMinimized, setIsLeaderboardMinimized] = useState(false)
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

  const handleLogout = async () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      try {
        await fetch('/api/users/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        window.location.href = '/login'
      } catch (err) {
        console.error('Gagal logout:', err)
      }
    }
  }

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
      <div className={dStyles.setupWrapper}>
        <div
          className={styles.glowBg}
          style={{ width: '500px', height: '500px', opacity: 0.25 }}
        ></div>

        <div className={dStyles.setupCard}>
          <div className={dStyles.emblemContainer}>
            <div className={dStyles.emblemGlow}></div>
            <svg
              className={dStyles.emblemSvg}
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

          <div className={dStyles.setupHeader}>
            <span className={dStyles.setupBadge}>FOUNDATION PHASE</span>
            <h1 className={dStyles.setupTitle}>Dirikan Guild Anda</h1>
            <p className={dStyles.setupSubtitle}>
              Langkah awal untuk membangun armada tempur. Nama yang Anda pilih akan tercatat secara
              permanen di seluruh sistem sistem peringkat PvP.
            </p>
          </div>

          {error && (
            <div className={styles.error} style={{ marginBottom: '20px', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleCreateGuild} className={dStyles.setupForm}>
            <div className={styles.formGroup}>
              <label className={dStyles.setupLabel}>NAMA GUILD RESMI</label>
              <input
                type="text"
                className={dStyles.setupInput}
                placeholder="Contoh: Valhalla, Celestial, Mythic..."
                value={guildName}
                onChange={(e) => setGuildName(e.target.value)}
                required
                maxLength={24}
                disabled={isPending}
              />
            </div>

            <button type="submit" className={dStyles.setupSubmitBtn} disabled={isPending}>
              <span>{isPending ? 'MENGINISIALISASI...' : 'DIRIKAN GUILD SEKARANG'}</span>
              <div className={dStyles.setupBtnGlow}></div>
            </button>
          </form>
        </div>
      </div>
    )
  }

  const handleDeleteGuild = () => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus Guild "${guild.name}"? Semua karakter member di dalamnya akan otomatis dikeluarkan.`,
      )
    ) {
      startTransition(async () => {
        await deleteGuild(guild.id)
      })
    }
  }

  const handleToggleVerify = (char: any) => {
    startTransition(async () => {
      const res = await toggleVerifyMember(char.id, char.isVerified)
      if (res.success && selectedMember?.id === char.id) {
        setSelectedMember({ ...selectedMember, isVerified: !char.isVerified })
      }
    })
  }

  // Pengkondisian Filter Roster Komponen Kiri
  const filteredMembers = members.filter((m) =>
    selectedRosterJob ? m.job === selectedRosterJob : true,
  )

  // Pengkondisian Filter Leaderboard Komponen Kanan
  const sortedLeaderboard = [...members]
    .filter((m) => m.isVerified)
    .filter((m) => (selectedLeaderboardJob ? m.job === selectedLeaderboardJob : true))
    .sort((a, b) => (b.pvp_score || 0) - (a.pvp_score || 0))

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_LIMIT)
  const paginatedMembers = filteredMembers.slice(
    (currentPage - 1) * ITEMS_LIMIT,
    currentPage * ITEMS_LIMIT,
  )

  const totalLeaderboardPages = Math.ceil(sortedLeaderboard.length / LEADERBOARD_LIMIT)
  const paginatedLeaderboard = sortedLeaderboard.slice(
    (leaderboardPage - 1) * LEADERBOARD_LIMIT,
    leaderboardPage * LEADERBOARD_LIMIT,
  )

  return (
    <>
      <div className={styles.container} style={{ maxWidth: '1200px' }}>
        <div className={styles.glowBg}></div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            paddingBottom: '24px',
          }}
        >
          <div>
            <Badge variant="info">Guild Master Panel</Badge>
            <h1 style={{ margin: '8px 0 4px 0', fontSize: '36px' }}>{guild.name}</h1>
            <p style={{ margin: 0, color: '#9ca3af' }}>
              Kelola aplikasi masuk, verifikasi status, dan pantau peringkat internal.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {/* <button onClick={handleDeleteGuild} className={dStyles.dangerBtn} disabled={isPending}>
              Hapus Guild
            </button> */}

            <button onClick={handleLogout} className={dStyles.logoutBtn}>
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
            </button>
          </div>
        </div>

        <div className={dStyles.statsGrid}>
          <div className={dStyles.statBox}>
            <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
              TOTAL MEMBER (VERIFIED)
            </div>
            <div className={dStyles.statValue}>{guild.total_characters || 0}</div>
          </div>
          <div className={dStyles.statBox}>
            <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
              TOTAL PVP SCORE GUILD
            </div>
            <div className={`${dStyles.statValue} ${dStyles.statValueGlow}`}>
              {Math.round(guild.total_pvp_score || 0).toLocaleString('id-ID')}
            </div>
          </div>
          <div className={dStyles.statBox}>
            <div style={{ fontSize: '12px', color: '#9ca3af', fontWeight: 500 }}>
              PENDING VERIFIKASI
            </div>
            <div className={dStyles.statValue} style={{ color: '#f59e0b' }}>
              {members.filter((m) => !m.isVerified).length}
            </div>
          </div>
        </div>

        <div
          className={`${dStyles.dashboardGrid} ${isLeaderboardMinimized ? dStyles.gridWithMinimizedLeaderboard : ''}`}
        >
          {/* Kolom Kiri: Roster Management */}
          <div className={dStyles.card}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: 0 }}>
                Manajemen Roster Guild
              </h2>

              {/* ✨ Custom Dropdown untuk Roster (Kiri) */}
              <div className={dStyles.customSelectWrapper}>
                <button
                  type="button"
                  className={dStyles.customSelectTrigger}
                  onClick={() => {
                    setIsRosterDropdownOpen(!isRosterDropdownOpen)
                    setIsLbdDropdownOpen(false)
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {selectedRosterJob ? (
                      <>
                        <img
                          src={getJobIcon(selectedRosterJob)}
                          alt=""
                          style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                        />
                        <span>{JOB_LABELS[selectedRosterJob]}</span>
                      </>
                    ) : (
                      <span>Semua Job</span>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>
                    {isRosterDropdownOpen ? '▲' : '▼'}
                  </span>
                </button>

                {isRosterDropdownOpen && (
                  <div className={dStyles.customSelectOptions}>
                    <div
                      className={`${dStyles.customSelectOption} ${selectedRosterJob === '' ? dStyles.customSelectOptionActive : ''}`}
                      onClick={() => {
                        setSelectedRosterJob('')
                        setIsRosterDropdownOpen(false)
                      }}
                    >
                      Semua Job
                    </div>
                    {Object.entries(JOB_LABELS).map(([value, label]) => (
                      <div
                        key={value}
                        className={`${dStyles.customSelectOption} ${selectedRosterJob === value ? dStyles.customSelectOptionActive : ''}`}
                        onClick={() => {
                          setSelectedRosterJob(value)
                          setIsRosterDropdownOpen(false)
                        }}
                      >
                        <img
                          src={getJobIcon(value)}
                          alt=""
                          style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                        />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                overflowX: 'auto',
                minHeight: '400px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.1)',
                      color: '#9ca3af',
                      fontSize: '14px',
                    }}
                  >
                    <th style={{ padding: '12px', textAlign: 'left' }}>Karakter</th>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Job</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}
                      >
                        Tidak ada data karakter untuk kriteria job ini.
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((char) => (
                      <tr
                        key={char.id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                      >
                        <td style={{ padding: '12px', fontWeight: 500, color: '#fff' }}>
                          {char.name}
                        </td>
                        <td
                          style={{
                            padding: '12px',
                            color: '#d1d5db',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <img
                            src={getJobIcon(char.job)}
                            alt=""
                            style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                          {JOB_LABELS[char.job] || char.job}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <Badge variant={char.isVerified ? 'success' : 'warning'}>
                            {char.isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedMember(char)}
                            className={dStyles.actionBtn}
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className={dStyles.paginationWrapper}>
                  <button
                    className={dStyles.pageBtn}
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    ❮ Prev
                  </button>
                  <span className={dStyles.pageInfo}>
                    Page <strong style={{ color: '#fff' }}>{currentPage}</strong> of {totalPages}
                  </span>
                  <button
                    className={dStyles.pageBtn}
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next ❯
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Kolom Kanan: Top Rank Internal */}
          <div
            className={`${dStyles.card} ${dStyles.leaderboardCard} ${isLeaderboardMinimized ? dStyles.leaderboardMinimized : ''}`}
          >
            <button
              onClick={() => setIsLeaderboardMinimized(!isLeaderboardMinimized)}
              className={dStyles.collapseToggleBtn}
              title={isLeaderboardMinimized ? 'Expand Leaderboard' : 'Minimize Leaderboard'}
            >
              {isLeaderboardMinimized ? '❮' : '❯'}
            </button>

            <div className={dStyles.leaderboardContentWrapper}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#fff', margin: 0 }}>
                  Top Rank Internal
                </h2>

                {/* ✨ Custom Dropdown untuk Leaderboard (Kanan) */}
                <div className={dStyles.customSelectWrapper}>
                  <button
                    type="button"
                    className={dStyles.customSelectTrigger}
                    onClick={() => {
                      setIsLbdDropdownOpen(!isLbdDropdownOpen)
                      setIsRosterDropdownOpen(false)
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {selectedLeaderboardJob ? (
                        <>
                          <img
                            src={getJobIcon(selectedLeaderboardJob)}
                            alt=""
                            style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                          />
                          <span>{JOB_LABELS[selectedLeaderboardJob]}</span>
                        </>
                      ) : (
                        <span>Semua Job</span>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', opacity: 0.6 }}>
                      {isLbdDropdownOpen ? '▲' : '▼'}
                    </span>
                  </button>

                  {isLbdDropdownOpen && (
                    <div className={dStyles.customSelectOptions}>
                      <div
                        className={`${dStyles.customSelectOption} ${selectedLeaderboardJob === '' ? dStyles.customSelectOptionActive : ''}`}
                        onClick={() => {
                          setSelectedLeaderboardJob('')
                          setIsLbdDropdownOpen(false)
                        }}
                      >
                        Semua Job
                      </div>
                      {Object.entries(JOB_LABELS).map(([value, label]) => (
                        <div
                          key={value}
                          className={`${dStyles.customSelectOption} ${selectedLeaderboardJob === value ? dStyles.customSelectOptionActive : ''}`}
                          onClick={() => {
                            setSelectedLeaderboardJob(value)
                            setIsLbdDropdownOpen(false)
                          }}
                        >
                          <img
                            src={getJobIcon(value)}
                            alt=""
                            style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                          />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                        color: '#9ca3af',
                        fontSize: '14px',
                      }}
                    >
                      <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>No</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>IGN</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLeaderboard.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}
                        >
                          Belum ada member terverifikasi.
                        </td>
                      </tr>
                    ) : (
                      sortedLeaderboard.map((char, idx) => (
                        <tr
                          key={char.id}
                          style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        >
                          <td
                            style={{
                              padding: '12px',
                              textAlign: 'center',
                              color: idx === 0 ? '#fbbf24' : '#9ca3af',
                              fontWeight: 'bold',
                            }}
                          >
                            {idx + 1}
                          </td>
                          <td style={{ padding: '12px', color: '#fff', fontWeight: 500 }}>
                            {char.name}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              textAlign: 'right',
                              fontWeight: 600,
                              color: '#fbbf24',
                            }}
                          >
                            {Math.round(char.pvp_score || 0).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
                {sortedLeaderboard.length > LEADERBOARD_LIMIT && (
                  <div className={dStyles.pagination}>
                    <button
                      onClick={() => setLeaderboardPage(leaderboardPage - 1)}
                      disabled={leaderboardPage === 1}
                    >
                      ❮ Prev
                    </button>
                    <span>
                      Page {leaderboardPage} of {totalLeaderboardPages}
                    </span>
                    <button
                      onClick={() => setLeaderboardPage(leaderboardPage + 1)}
                      disabled={leaderboardPage === totalLeaderboardPages}
                    >
                      Next ❯
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={dStyles.verticalLeaderboardLabel}>
              <div className={dStyles.verticalIcon}>🏆</div>
              <div className={dStyles.verticalText}>LEADERBOARD</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Detail Karakter */}
      {selectedMember && (
        <GlobalDialog
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          title={`Detail: ${selectedMember.name}`}
        >
          <div style={{ color: '#d1d5db' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                background: 'rgba(255,255,255,0.02)',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <img
                src={getJobIcon(selectedMember.job)}
                alt=""
                style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <div>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '18px' }}>
                  {JOB_LABELS[selectedMember.job] || selectedMember.job}
                </div>
                <div style={{ fontSize: '14px', color: '#fbbf24', fontWeight: 600 }}>
                  🛡️ PvP Score: {Math.round(selectedMember.pvp_score || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            <div className={styles.tabs} style={{ marginBottom: '16px' }}>
              <button
                className={`${styles.tabBtn} ${activeDetailTab === 'general' ? styles.activeTab : ''}`}
                onClick={() => setActiveDetailTab('general')}
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                General
              </button>
              <button
                className={`${styles.tabBtn} ${activeDetailTab === 'quasi' ? styles.activeTab : ''}`}
                onClick={() => setActiveDetailTab('quasi')}
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                Quasi
              </button>
              <button
                className={`${styles.tabBtn} ${activeDetailTab === 'special' ? styles.activeTab : ''}`}
                onClick={() => setActiveDetailTab('special')}
                style={{ padding: '8px 12px', fontSize: '13px' }}
              >
                Special
              </button>
            </div>

            <div style={{ display: activeDetailTab === 'general' ? 'block' : 'none' }}>
              <div className={`${dStyles.detailGrid} ${dStyles.customScroll}`}>
                {renderStat('Max HP', selectedMember.max_hp)}
                {renderStat('PATK', selectedMember.patk)}
                {renderStat('MATK', selectedMember.matk)}
                {renderStat('PDEF', selectedMember.pdef)}
                {renderStat('MDEF', selectedMember.mdef)}
                {renderStat('Refine PATK', selectedMember.refine_patk)}
                {renderStat('Refine MATK', selectedMember.refine_matk)}
                {renderStat('Refine PDEF', selectedMember.refine_pdef)}
                {renderStat('Refine MDEF', selectedMember.refine_mdef)}
                {renderStat('HIT', selectedMember.hit)}
                {renderStat('FLEE', selectedMember.flee)}
              </div>
            </div>

            <div style={{ display: activeDetailTab === 'quasi' ? 'block' : 'none' }}>
              <div className={`${dStyles.detailGrid} ${dStyles.customScroll}`}>
                {renderStat('ASPD', selectedMember.aspd, true)}
                {renderStat('Movement SPD', selectedMember.mspd, true)}
                {renderStat('Variable CT', selectedMember.variable_cast, true)}
                {renderStat('Fixed CT', selectedMember.fixed_cast, true)}
                {renderStat('Healing Done', selectedMember.healing_done, true)}
                {renderStat('Healing Taken', selectedMember.healing_taken, true)}
                {renderStat('CRIT', selectedMember.critical)}
                {renderStat('CRIT DMG', selectedMember.critical_damage, true)}
                {renderStat('CRIT RES', selectedMember.critical_reduction)}
                {renderStat('CRIT DMG RES', selectedMember.critical_damage_reduction, true)}
                {renderStat('PDMG', selectedMember.pdmg, true)}
                {renderStat('MDMG', selectedMember.mdmg, true)}
                {renderStat('PDMG.R', selectedMember.pdmg_reduction, true)}
                {renderStat('MDMG.R', selectedMember.mdmg_reduction, true)}
                {renderStat('Ignore PDEF', selectedMember.ignore_pdef)}
                {renderStat('Ignore MDEF', selectedMember.ignore_mdef)}
                {renderStat('PDMG Bonus', selectedMember.pdmg_bonus)}
                {renderStat('MDMG Bonus', selectedMember.mdmg_bonus)}
                {renderStat('PvP DMG Bonus', selectedMember.pvp_dmg_bonus)}
                {renderStat('PvP DMG Red', selectedMember.pvp_dmg_reduction)}
              </div>
            </div>

            <div style={{ display: activeDetailTab === 'special' ? 'block' : 'none' }}>
              <div className={`${dStyles.detailGrid} ${dStyles.customScroll}`}>
                {renderStat('Max HP %', selectedMember.max_hp_percentage, true)}
                {renderStat('Equip PATK %', selectedMember.equipment_patk_percentage, true)}
                {renderStat('Equip MATK %', selectedMember.equipment_matk_percentage, true)}
                {renderStat('Equip PDEF %', selectedMember.equipment_pdef_percentage, true)}
                {renderStat('Equip MDEF %', selectedMember.equipment_mdef_percentage, true)}
                {renderStat('DMG vs Demi', selectedMember.dmg_vs_demi_human, true)}
                {renderStat('DMG Red vs Demi', selectedMember.dmg_reduction_demi_human, true)}
                {renderStat('DMG vs Medium', selectedMember.dmg_vs_medium, true)}
                {renderStat('DMG Red vs Medium', selectedMember.dmg_reduction_medium, true)}
                {renderStat('Neutral Bonus', selectedMember.neutral_dmg_bonus, true)}
                {renderStat('Neutral Red', selectedMember.neutral_dmg_reduction, true)}
                {renderStat('DMG vs Fire', selectedMember.fire_dmg_bonus, true)}
                {renderStat('DMG Red vs Fire', selectedMember.fire_dmg_reduction, true)}
                {renderStat('DMG vs Water', selectedMember.water_dmg_bonus, true)}
                {renderStat('DMG Red vs Water', selectedMember.water_dmg_reduction, true)}
                {renderStat('DMG vs Wind', selectedMember.wind_dmg_bonus, true)}
                {renderStat('DMG Red vs Wind', selectedMember.wind_dmg_reduction, true)}
                {renderStat('DMG vs Earth', selectedMember.earth_dmg_bonus, true)}
                {renderStat('DMG Red vs Earth', selectedMember.earth_dmg_reduction, true)}
                {renderStat('DMG vs Ghost', selectedMember.ghost_dmg_bonus, true)}
                {renderStat('DMG Red vs Ghost', selectedMember.ghost_dmg_reduction, true)}
                {renderStat('DMG vs Holy', selectedMember.holy_dmg_bonus, true)}
                {renderStat('DMG Red vs Holy', selectedMember.holy_dmg_reduction, true)}
                {renderStat('DMG vs Poison', selectedMember.poison_dmg_bonus, true)}
                {renderStat('DMG Red vs Poison', selectedMember.poison_dmg_reduction, true)}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '16px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <button
                onClick={() => {
                  if (confirm('Yakin ingin menghapus karakter ini permanen?')) {
                    startTransition(async () => {
                      const res = await deleteCharacter(selectedMember.id)
                      if (res.success) setSelectedMember(null)
                    })
                  }
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  padding: '12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
              </button>

              <button
                onClick={() => handleToggleVerify(selectedMember)}
                disabled={isPending}
                style={{
                  flex: 1,
                  background: selectedMember.isVerified
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: selectedMember.isVerified ? '#f59e0b' : 'white',
                  border: selectedMember.isVerified ? '1px solid rgba(245, 158, 11, 0.3)' : 'none',
                  padding: '12px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                }}
              >
                {selectedMember.isVerified ? 'Batalkan Verifikasi' : 'Approve & Verifikasi'}
              </button>

              <button
                onClick={() => setSelectedMember(null)}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  padding: '12px 20px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </GlobalDialog>
      )}
    </>
  )
}
