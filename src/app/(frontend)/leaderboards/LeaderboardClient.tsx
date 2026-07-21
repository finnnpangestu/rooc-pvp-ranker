'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { JOB_LABELS } from '@/const/JobLabels'
import { TabBar, TabButton } from '../components/TabBar'
import clsx from 'clsx'
import { useTheme } from '../components/ThemeProvider'

interface LeaderboardClientProps {
  allGuilds: any[]
  allCharacters: any[]
  selectedGuildId: string
}

const getJobIcon = (jobValue: string) => `/icons/jobs/${jobValue}.png`

const getRankStyle = (rank: number, isDark: boolean) => {
  const colors = isDark
    ? {
        gold: '#fbbf24',
        goldDark: '#f59e0b',
        silver: '#e5e7eb',
        silverDark: '#9ca3af',
        bronze: '#fca5a5',
        bronzeDark: '#f97316',
      }
    : {
        gold: '#d97706',
        goldDark: '#b45309',
        silver: '#6b7280',
        silverDark: '#4b5563',
        bronze: '#dc2626',
        bronzeDark: '#b91c1c',
      }

  if (rank === 1) {
    return {
      container: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${colors.gold}, ${colors.goldDark})`,
        color: '#000',
        fontWeight: 800,
        fontSize: '18px',
        boxShadow: `0 4px 15px ${colors.gold}66`,
        border: `2px solid ${colors.gold}`,
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
        background: `linear-gradient(135deg, ${colors.silver}, ${colors.silverDark})`,
        color: isDark ? '#000' : '#fff',
        fontWeight: 700,
        fontSize: '16px',
        boxShadow: `0 4px 12px ${colors.silverDark}66`,
        border: `2px solid ${colors.silver}`,
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
        background: `linear-gradient(135deg, ${colors.bronze}, ${colors.bronzeDark})`,
        color: '#000',
        fontWeight: 700,
        fontSize: '14px',
        boxShadow: `0 4px 10px ${colors.bronzeDark}66`,
        border: `2px solid ${colors.bronze}`,
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
      background: 'var(--bg-primary)',
      boxShadow: 'var(--shadow-neumorph-inset)',
      color: 'var(--text-muted)',
      fontWeight: 600,
      fontSize: '14px',
      border: '1px solid var(--border-color)',
    },
  }
}

export function LeaderboardClient({
  allGuilds,
  allCharacters,
  selectedGuildId,
}: LeaderboardClientProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
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
    <div
      className="max-w-[1200px] my-10 mx-auto p-10 rounded-3xl text-white font-sans relative overflow-hidden transition-colors"
      style={{
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-neumorph)',
        color: 'var(--text-primary)',
      }}
    >
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        🏆 Leaderboard
      </h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
        Peringkat PvP antar guild dan karakter terverifikasi.
      </p>

      {/* TAB NAVIGASI */}
      <div
        className="flex gap-2 p-2 rounded-2xl mb-8 border overflow-x-auto scrollbar-none"
        style={{
          background: 'var(--bg-secondary)',
          borderColor: 'var(--border-color)',
          boxShadow: 'var(--shadow-neumorph-inset)',
        }}
      >
        <button
          type="button"
          className={clsx(
            'flex-1 py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap border',
            activeTab === 'all'
              ? 'shadow-neumorph-inset'
              : 'shadow-neumorph-sm hover:shadow-neumorph',
          )}
          style={{
            background: activeTab === 'all' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
            color: activeTab === 'all' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderColor: 'var(--border-color)',
            boxShadow:
              activeTab === 'all' ? 'var(--shadow-neumorph-inset)' : 'var(--shadow-neumorph-sm)',
          }}
          onClick={() => setActiveTab('all')}
        >
          Semua Guild
        </button>
        <button
          type="button"
          className={clsx(
            'flex-1 py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap border',
            activeTab === 'guild'
              ? 'shadow-neumorph-inset'
              : 'shadow-neumorph-sm hover:shadow-neumorph',
          )}
          style={{
            background: activeTab === 'guild' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
            color: activeTab === 'guild' ? 'var(--text-primary)' : 'var(--text-muted)',
            borderColor: 'var(--border-color)',
            boxShadow:
              activeTab === 'guild' ? 'var(--shadow-neumorph-inset)' : 'var(--shadow-neumorph-sm)',
          }}
          onClick={() => setActiveTab('guild')}
        >
          Per Guild
        </button>
      </div>

      {/* PANEL: Semua Guild */}
      <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'all' })}>
        <div
          className="mb-6 text-[15px] font-light p-4 rounded-xl border-l-[3px]"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--text-primary)',
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-neumorph-inset)',
          }}
        >
          Peringkat guild berdasarkan total PvP score dari semua karakter terverifikasi.
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  color: 'var(--text-muted)',
                }}
              >
                <th style={{ padding: '12px 16px', textAlign: 'center', width: '80px' }}>Rank</th>
                <th style={{ padding: '12px 16px', textAlign: 'left' }}>Nama Guild</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Jumlah Karakter</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Total PvP Score</th>
              </tr>
            </thead>
            <tbody>
              {allGuilds.map((guild, index) => {
                const rank = index + 1
                const rankStyle = getRankStyle(rank, isDark)
                return (
                  <tr
                    key={guild.id}
                    className="border-b transition-colors duration-200 hover:bg-white/5"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={rankStyle.container}>{rank}</span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontWeight: 500,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {guild.name}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {guild.total_characters ?? 0}
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        textAlign: 'right',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span style={{ color: rank === 1 ? '#fbbf24' : 'var(--text-primary)' }}>
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

      {/* PANEL: Per Guild */}
      <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'guild' })}>
        <div
          className="mb-6 text-[15px] font-light p-4 rounded-xl border-l-[3px]"
          style={{
            background: 'var(--bg-primary)',
            borderColor: 'var(--text-primary)',
            color: 'var(--text-secondary)',
            boxShadow: 'var(--shadow-neumorph-inset)',
          }}
        >
          Pilih guild dan job untuk melihat peringkat PvP karakter.
        </div>

        <form onSubmit={handleSubmit} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label
                htmlFor="guildSelect"
                style={{
                  color: 'var(--text-secondary)',
                  fontWeight: 500,
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Pilih Guild
              </label>
              <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                <select
                  id="guildSelect"
                  className="w-full appearance-none rounded-xl py-3.5 px-4 text-[15px] font-sans transition-all duration-200 outline-none"
                  style={{
                    background: 'var(--bg-primary)',
                    boxShadow: 'var(--shadow-neumorph-inset)',
                    color: 'var(--text-primary)',
                    border: 'none',
                  }}
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
            <button
              type="submit"
              className="rounded-lg py-3.5 px-6 font-semibold font-sans cursor-pointer transition-all duration-300 border-none"
              style={{
                background: 'var(--bg-primary)',
                boxShadow: 'var(--shadow-neumorph-sm)',
                color: 'var(--text-primary)',
              }}
            >
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
            <span style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 500 }}>
              Filter berdasarkan Job:
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => scroll('left')}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer text-xs border transition-colors"
                style={{
                  background: 'var(--bg-primary)',
                  boxShadow: 'var(--shadow-neumorph-sm)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                ❮
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer text-xs border transition-colors"
                style={{
                  background: 'var(--bg-primary)',
                  boxShadow: 'var(--shadow-neumorph-sm)',
                  color: 'var(--text-secondary)',
                  borderColor: 'var(--border-color)',
                }}
              >
                ❯
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-none">
            <button
              onClick={() => setSelectedJob('')}
              className={clsx(
                'flex-none flex flex-col items-center justify-center w-[100px] h-[90px] rounded-xl cursor-pointer transition-all duration-200 text-[11px] font-medium gap-2 border',
                selectedJob === ''
                  ? 'shadow-neumorph-inset'
                  : 'shadow-neumorph-sm hover:shadow-neumorph',
              )}
              style={{
                background: selectedJob === '' ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                color: selectedJob === '' ? 'var(--text-primary)' : 'var(--text-muted)',
                borderColor: 'var(--border-color)',
                boxShadow:
                  selectedJob === '' ? 'var(--shadow-neumorph-inset)' : 'var(--shadow-neumorph-sm)',
              }}
            >
              <div className="w-8 h-8 flex items-center justify-center font-sans">
                <span style={{ fontSize: '12px' }}>ALL</span>
              </div>
              <span>Semua</span>
            </button>

            {Object.entries(JOB_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setSelectedJob(value)}
                className={clsx(
                  'flex-none flex flex-col items-center justify-center w-[100px] h-[90px] rounded-xl cursor-pointer transition-all duration-200 text-[11px] font-medium gap-2 border',
                  selectedJob === value
                    ? 'shadow-neumorph-inset'
                    : 'shadow-neumorph-sm hover:shadow-neumorph',
                )}
                style={{
                  background: selectedJob === value ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                  color: selectedJob === value ? 'var(--text-primary)' : 'var(--text-muted)',
                  borderColor: 'var(--border-color)',
                  boxShadow:
                    selectedJob === value
                      ? 'var(--shadow-neumorph-inset)'
                      : 'var(--shadow-neumorph-sm)',
                }}
              >
                <div className="w-8 h-8 flex items-center justify-center font-sans">
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
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Guild:{' '}
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
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
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Total: {filteredCharacters.length} karakter
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--border-color)',
                    color: 'var(--text-muted)',
                  }}
                >
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
                      style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}
                    >
                      Tidak ada karakter {selectedJob && JOB_LABELS[selectedJob]} terverifikasi di
                      guild ini.
                    </td>
                  </tr>
                ) : (
                  filteredCharacters.map((char, index) => {
                    const rank = index + 1
                    const rankStyle = getRankStyle(rank, isDark)
                    return (
                      <tr
                        key={char.id}
                        className="border-b transition-colors duration-200 hover:bg-white/5"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={rankStyle.container}>{rank}</span>
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            fontWeight: 500,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {char.name}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            color: 'var(--text-secondary)',
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
                        <td
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                          }}
                        >
                          <span style={{ color: rank <= 3 ? '#fbbf24' : 'var(--text-primary)' }}>
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
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Pilih guild dari dropdown di atas, lalu klik "Tampilkan".
          </div>
        )}
      </div>
    </div>
  )
}
