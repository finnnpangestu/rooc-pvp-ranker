'use client'

import React, { useState } from 'react'
import { Icon } from '@iconify/react'
import { useTheme } from '../components/ThemeProvider'
import type { Guild } from '@/types'

interface LeaderboardClientProps {
  allGuilds: Guild[]
}

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
      background: 'rgba(0, 0, 0, 0.03)',
      color: 'var(--text-muted)',
      fontWeight: 600,
      fontSize: '13px',
      border: '1px solid var(--border-color)',
    },
  }
}

export function LeaderboardClient({ allGuilds }: LeaderboardClientProps) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  const [guildSearch, setGuildSearch] = useState('')

  const filteredGuilds = allGuilds.filter((g) =>
    g.name.toLowerCase().includes(guildSearch.trim().toLowerCase()),
  )

  return (
    <div
      className="max-w-[1200px] my-6 sm:my-10 mx-auto p-6 sm:p-10 rounded-3xl font-sans relative overflow-hidden transition-colors border border-black/5 dark:border-white/10 apple-glass shadow-xl"
      style={{
        color: 'var(--text-primary)',
      }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1
            className="text-2xl sm:text-3xl font-bold tracking-tight mb-1"
            style={{ color: 'var(--text-primary)' }}
          >
            Guild Leaderboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Peringkat guild berdasarkan total PvP score dari semua karakter terverifikasi.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Guild */}
          <div className="relative flex items-center w-full sm:w-64">
            <Icon
              icon="fluent:search-24-regular"
              className="w-4 h-4 absolute left-3 pointer-events-none"
              style={{ color: 'var(--text-secondary)' }}
            >
              <title>Cari</title>
            </Icon>
            <input
              type="text"
              value={guildSearch}
              onChange={(e) => setGuildSearch(e.target.value)}
              placeholder="Cari nama guild..."
              className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl outline-none border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] focus:bg-white dark:focus:bg-black/40 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              style={{
                color: 'var(--text-primary)',
              }}
            />
            {guildSearch && (
              <button
                type="button"
                onClick={() => setGuildSearch('')}
                className="absolute right-2.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                title="Hapus pencarian"
              >
                <Icon icon="fluent:dismiss-16-filled" className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] apple-press transition-all cursor-pointer flex items-center justify-center shrink-0"
            style={{
              color: 'var(--text-secondary)',
            }}
            title={isDark ? 'Beralih ke Light Mode' : 'Beralih ke Dark Mode'}
          >
            {isDark ? (
              <Icon icon="fluent:weather-sunny-24-regular" className="w-4 h-4 text-amber-500" />
            ) : (
              <Icon icon="fluent:weather-moon-24-regular" className="w-4 h-4 text-indigo-500" />
            )}
          </button>
        </div>
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
            {filteredGuilds.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '40px 16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                  }}
                >
                  <p>Tidak ada guild yang ditemukan.</p>
                  {guildSearch && (
                    <button
                      type="button"
                      onClick={() => setGuildSearch('')}
                      className="text-xs text-indigo-400 hover:underline cursor-pointer mt-2"
                    >
                      Reset Pencarian
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              filteredGuilds.map((guild, index) => {
                const rank = index + 1
                const rankStyle = getRankStyle(rank, isDark)
                return (
                  <tr
                    key={guild.id}
                    className="border-b transition-colors duration-200 hover:bg-black/[0.03] dark:hover:bg-white/5"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={rankStyle.container}>{rank}</span>
                    </td>
                    <td
                      style={{
                        padding: '12px 16px',
                        fontWeight: 600,
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
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                      }}
                    >
                      <span style={{ color: rank === 1 ? '#fbbf24' : 'var(--text-primary)' }}>
                        {Math.round(Number(guild.total_pvp_score) || 0).toLocaleString('id-ID')}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
