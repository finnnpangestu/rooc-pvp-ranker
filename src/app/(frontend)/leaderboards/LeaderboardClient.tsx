'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import styles from '../stats/stats.module.css'

interface LeaderboardClientProps {
  allGuilds: any[]
  allCharacters: any[]
  selectedGuildId: string
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
}

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
      text: '#fbbf24',
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
      text: '#e5e7eb',
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
      text: '#f97316',
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
    text: '#9ca3af',
  }
}

export function LeaderboardClient({
  allGuilds,
  allCharacters,
  selectedGuildId,
}: LeaderboardClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [localGuildId, setLocalGuildId] = useState(selectedGuildId || '')
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    setLocalGuildId(selectedGuildId || '')
  }, [selectedGuildId])

  const filteredGuilds = selectedGuildId
    ? allGuilds.filter((g) => String(g.id) === String(selectedGuildId))
    : allGuilds

  const filteredCharacters = selectedGuildId
    ? allCharacters.filter((c) => String(c.guild_id) === String(selectedGuildId))
    : allCharacters

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (localGuildId) {
      router.push(`${pathname}?guild=${localGuildId}`)
    } else {
      router.push(pathname)
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

      {/* Tabs */}
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

      {/* Konten: Semua Guild */}
      <div
        className={`${styles.tabContent} ${activeTab === 'all' ? styles.activeContent : ''}`}
        style={{ padding: '16px 0' }}
      >
        <div className={styles.sectionDesc}>
          Peringkat guild berdasarkan total PvP score dari semua karakter terverifikasi.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '15px',
            }}
          >
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
                  <tr
                    key={guild.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
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

      {/* Konten: Per Guild */}
      <div
        className={`${styles.tabContent} ${activeTab === 'guild' ? styles.activeContent : ''}`}
        style={{ padding: '16px 0' }}
      >
        <div className={styles.sectionDesc}>
          Pilih guild untuk melihat peringkat PvP karakter di dalamnya.
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
                  style={{ maxWidth: '100%' }}
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
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)',
                border: 'none',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 10px 25px -5px rgba(79,70,229,0.5)',
                fontFamily: 'inherit',
                fontSize: '15px',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              Tampilkan
            </button>
          </div>
        </form>

        {selectedGuildId ? (
          <div style={{ overflowX: 'auto' }}>
            <div style={{ marginBottom: '12px', color: '#9ca3af', fontSize: '14px' }}>
              Menampilkan karakter untuk guild:{' '}
              <span style={{ color: '#e5e7eb', fontWeight: 600 }}>
                {allGuilds.find((g) => String(g.id) === String(selectedGuildId))?.name ||
                  'Tidak ditemukan'}
              </span>
            </div>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '15px',
              }}
            >
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
                      Belum ada karakter terverifikasi di guild ini.
                    </td>
                  </tr>
                ) : (
                  filteredCharacters.map((char, index) => {
                    const rank = index + 1
                    const rankStyle = getRankStyle(rank)
                    return (
                      <tr
                        key={char.id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')
                        }
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={rankStyle.container}>{rank}</span>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 500 }}>{char.name}</td>
                        <td style={{ padding: '12px 16px', color: '#d1d5db' }}>
                          {JOB_LABELS[char.job] || char.job}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>
                          <span style={{ color: rank === 1 ? '#fbbf24' : '#e5e7eb' }}>
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
    </div>
  )
}
