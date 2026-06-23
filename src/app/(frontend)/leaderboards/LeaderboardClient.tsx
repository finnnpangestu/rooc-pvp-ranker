'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import styles from '../stats/stats.module.css'
import { JOB_LABELS } from '@/const/JobLabels'

interface LeaderboardClientProps {
  allGuilds: any[]
  allCharacters: any[]
  selectedGuildId: string
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`

const getRankStyle = (rank: number) => {
  if (rank === 1) {
    return {
      container: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        color: '#000',
        fontWeight: 800,
        fontSize: '18px',
        boxShadow: '0 4px 15px rgba(251, 191, 36, 0.5)',
        border: '2px solid #fcd34d',
      },
    }
  }
  if (rank === 2) {
    return {
      container: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #e5e7eb, #9ca3af)',
        color: '#000',
        fontWeight: 700,
        fontSize: '16px',
        boxShadow: '0 4px 12px rgba(156, 163, 175, 0.4)',
        border: '2px solid #d1d5db',
      },
    }
  }
  if (rank === 3) {
    return {
      container: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #fca5a5, #f97316)',
        color: '#000',
        fontWeight: 700,
        fontSize: '14px',
        boxShadow: '0 4px 10px rgba(249, 115, 22, 0.4)',
        border: '2px solid #fb923c',
      },
    }
  }
  return {
    container: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.05)',
      color: '#9ca3af',
      fontWeight: 600,
      fontSize: '14px',
      border: '1px solid rgba(255,255,255,0.1)',
    },
  }
}

export function LeaderboardClient({
  allGuilds,
  allCharacters,
  selectedGuildId,
}: LeaderboardClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const scrollRef = useRef<HTMLDivElement>(null)

  const [localGuildId, setLocalGuildId] = useState(selectedGuildId || '')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedJob, setSelectedJob] = useState('')

  useEffect(() => {
    setLocalGuildId(selectedGuildId || '')
  }, [selectedGuildId])

  const filteredCharacters = allCharacters.filter((c) => {
    const matchesGuild = selectedGuildId ? String(c.guild_id) === String(selectedGuildId) : true
    const matchesJob = selectedJob ? c.job === selectedJob : true
    return matchesGuild && matchesJob
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (localGuildId) {
      router.push(`${pathname}?guild=${localGuildId}`)
    } else {
      router.push(pathname)
    }
  }

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current
      const scrollTo = direction === 'left' ? scrollLeft - 200 : scrollLeft + 200
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.glowBg}></div>

      <div className={styles.header}>
        <div className={styles.badge}>ROOC Ranker</div>
        <h1>Leaderboard</h1>
        <p style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <span>🏆 Peringkat guild & karakter</span>
          <Link
            href="/stats"
            style={{
              color: '#818cf8',
              textDecoration: 'none',
              fontWeight: 600,
              borderBottom: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            ← Kembali ke Submit Stats
          </Link>
        </p>
      </div>

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'all' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Semua Guild
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'guild' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('guild')}
        >
          Per Guild
        </button>
      </div>

      {/* Konten: Per Guild */}
      <div
        className={`${styles.tabContent} ${activeTab === 'guild' ? styles.activeContent : ''}`}
        style={{ padding: '16px 0' }}
      >
        <div className={styles.sectionDesc}>
          Pilih guild dan job untuk melihat peringkat PvP karakter.
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label
                htmlFor="guildSelect"
                style={{ color: '#e5e7eb', fontWeight: 500, display: 'block', marginBottom: '8px' }}
              >
                Pilih Guild
              </label>
              <div className={styles.selectWrapper}>
                <select
                  id="guildSelect"
                  className={styles.select}
                  value={localGuildId}
                  onChange={(e) => setLocalGuildId(e.target.value)}
                >
                  <option value="">-- Pilih Guild --</option>
                  {allGuilds.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className={styles.submitBtnLeaderboard}>
              Tampilkan
            </button>
          </div>
        </form>

        {/* Job Filter Carousel */}
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}
          >
            <span style={{ color: '#9ca3af', fontSize: '14px', fontWeight: 500 }}>
              Filter berdasarkan Job:
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => scroll('left')} className={styles.scrollBtn}>
                ❮
              </button>
              <button onClick={() => scroll('right')} className={styles.scrollBtn}>
                ❯
              </button>
            </div>
          </div>

          <div ref={scrollRef} className={styles.jobCarousel}>
            <button
              onClick={() => setSelectedJob('')}
              className={`${styles.jobCard} ${selectedJob === '' ? styles.jobCardActive : ''}`}
            >
              <div className={styles.jobIconWrapper}>
                <span style={{ fontSize: '12px' }}>ALL</span>
              </div>
              <span>Semua</span>
            </button>

            {Object.entries(JOB_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setSelectedJob(value)}
                className={`${styles.jobCard} ${selectedJob === value ? styles.jobCardActive : ''}`}
              >
                <div className={styles.jobIconWrapper}>
                  <img
                    src={getJobIcon(value)}
                    alt=""
                    style={{
                      width: '30px',
                      height: '30px',
                      objectFit: 'cover',
                      borderRadius: '20%',
                    }}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                </div>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedGuildId ? (
          <div style={{ overflowX: 'auto' }}>
            <div
              style={{
                marginBottom: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                Guild:{' '}
                <span style={{ color: '#e5e7eb', fontWeight: 600 }}>
                  {allGuilds.find((g) => String(g.id) === String(selectedGuildId))?.name}
                </span>
                {selectedJob && (
                  <>
                    {' '}
                    | Job:{' '}
                    <span style={{ color: '#818cf8', fontWeight: 600 }}>
                      {JOB_LABELS[selectedJob]}
                    </span>
                  </>
                )}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Total: {filteredCharacters.length} karakter
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'center', width: '80px' }}>Rank</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nama Karakter</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left' }}>Job</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>PvP Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredCharacters.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}
                    >
                      Tidak ada karakter {selectedJob && JOB_LABELS[selectedJob]} terverifikasi di
                      guild ini.
                    </td>
                  </tr>
                ) : (
                  filteredCharacters.map((char, index) => {
                    const rank = index + 1
                    const rankStyle = getRankStyle(rank)
                    return (
                      <tr key={char.id} className={styles.tableRow}>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={rankStyle.container}>{rank}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{char.name}</td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: '#d1d5db',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <img
                            src={getJobIcon(char.job)}
                            alt=""
                            style={{
                              width: '18px',
                              height: '18px',
                              objectFit: 'cover',
                              borderRadius: '20%',
                            }}
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                          {JOB_LABELS[char.job] || char.job}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                          <span style={{ color: rank <= 3 ? '#fbbf24' : '#e5e7eb' }}>
                            {Math.round(char.pvp_score ?? 0).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            Pilih guild dari dropdown di atas, lalu klik "Tampilkan".
          </div>
        )}
      </div>

      {/* Konten: Semua Guild (Tetap Sama) */}
      <div
        className={`${styles.tabContent} ${activeTab === 'all' ? styles.activeContent : ''}`}
        style={{ padding: '16px 0' }}
      >
        {/* ... (Konten Semua Guild Anda Sebelumnya) ... */}
        <div className={styles.sectionDesc}>
          Peringkat guild berdasarkan total PvP score dari semua karakter terverifikasi.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af' }}>
                <th style={{ padding: '12px 16px', textAlign: 'center', width: '80px' }}>Rank</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nama Guild</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Jumlah Karakter</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total PvP Score</th>
              </tr>
            </thead>
            <tbody>
              {allGuilds.map((guild, index) => {
                const rank = index + 1
                const rankStyle = getRankStyle(rank)
                return (
                  <tr key={guild.id} className={styles.tableRow}>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={rankStyle.container}>{rank}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{guild.name}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center', color: '#d1d5db' }}>
                      {guild.total_characters ?? 0}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                      <span style={{ color: rank === 1 ? '#fbbf24' : '#e5e7eb' }}>
                        {Math.round(guild.total_pvp_score ?? 0).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
