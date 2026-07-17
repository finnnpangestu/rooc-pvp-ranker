'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

import { JOB_LABELS } from '@/const/JobLabels'
import { TabBar, TabButton } from '../components/TabBar' // Sesuaikan path ini
import clsx from 'clsx'

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
    <div className="max-w-[1200px] my-10 mx-auto p-10 bg-[#0f0f14]/70 backdrop-blur-md border border-white/5 rounded-[32px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.1)] text-white font-sans relative overflow-hidden">
      {/* ... dekorasi dan header (sama) */}

      {/* TAB NAVIGASI - disamakan dengan StatsForm */}
      <div className="flex gap-2 bg-black/30 p-2 rounded-2xl mb-8 relative z-10 border border-white/5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          className={clsx(
            'flex-1 bg-transparent border-none text-gray-400 py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap hover:text-gray-200 hover:bg-white/5',
            {
              'bg-indigo-500/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-indigo-500/30 hover:bg-indigo-500/25':
                activeTab === 'all',
            },
          )}
          onClick={() => setActiveTab('all')}
        >
          Semua Guild
        </button>
        <button
          type="button"
          className={clsx(
            'flex-1 bg-transparent border-none text-gray-400 py-3 px-5 text-[15px] font-semibold font-sans rounded-[10px] cursor-pointer transition-all duration-300 whitespace-nowrap hover:text-gray-200 hover:bg-white/5',
            {
              'bg-indigo-500/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] border border-indigo-500/30 hover:bg-indigo-500/25':
                activeTab === 'guild',
            },
          )}
          onClick={() => setActiveTab('guild')}
        >
          Per Guild
        </button>
      </div>

      {/* PANEL: Semua Guild */}
      <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'all' })}>
        <div className="text-gray-400 mb-6 text-[15px] font-light p-4 bg-white/5 rounded-xl border-l-[3px] border-indigo-500">
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
                  <tr
                    key={guild.id}
                    className="border-b border-white/5 transition-colors duration-200 hover:bg-white/5"
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

      {/* PANEL: Per Guild */}
      <div className={clsx('hidden animate-fadeUp', { '!block': activeTab === 'guild' })}>
        <div className="text-gray-400 mb-6 text-[15px] font-light p-4 bg-white/5 rounded-xl border-l-[3px] border-indigo-500">
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
              <div className="relative after:content-[''] after:absolute after:right-4 after:top-1/2 after:-translate-y-1/2 after:w-[10px] after:h-[6px] after:bg-[url('data:image/svg+xml;utf8,<svg_fill=%22%239ca3af%22_viewBox=%220_0_24_24%22_xmlns=%22http://www.w3.org/2000/svg%22><path_d=%22M7_10l5_5_5-5z%22/></svg>')] after:bg-no-repeat after:bg-center after:pointer-events-none">
                <select
                  id="guildSelect"
                  className="w-full appearance-none bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-white text-[15px] font-sans transition-all duration-200 outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] hover:bg-black/60 hover:border-white/15 focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.25),inset_0_2px_4px_rgba(0,0,0,0.2)] focus:bg-black/70 focus:-translate-y-[1px]"
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
              className="bg-gradient-to-br from-indigo-600 to-indigo-800 border-none text-white py-3.5 px-6 rounded-lg font-semibold font-sans cursor-pointer transition-all duration-300 shadow-[0_10px_25px_-5px_rgba(79,70,229,0.5)] text-[15px] whitespace-nowrap"
            >
              Tampilkan
            </button>
          </div>
        </form>

        {/* Job Filter Carousel (sama seperti sebelumnya) */}
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
              <button
                onClick={() => scroll('left')}
                className="bg-white/5 border border-white/10 text-white w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer text-xs hover:bg-white/10"
              >
                ❮
              </button>
              <button
                onClick={() => scroll('right')}
                className="bg-white/5 border border-white/10 text-white w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer text-xs hover:bg-white/10"
              >
                ❯
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex gap-3 overflow-x-auto py-2 px-1 scrollbar-none">
            <button
              onClick={() => setSelectedJob('')}
              className={clsx(
                'flex-none flex flex-col items-center justify-center w-[100px] h-[90px] bg-white/5 border border-white/10 rounded-xl cursor-pointer transition-all duration-200 text-gray-400 text-[11px] font-medium gap-2 hover:bg-white/10 hover:border-indigo-400/40 hover:-translate-y-[2px]',
                {
                  '!bg-indigo-600/15 !border-indigo-600 !text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]':
                    selectedJob === '',
                },
              )}
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
                  'flex-none flex flex-col items-center justify-center w-[100px] h-[90px] bg-white/5 border border-white/10 rounded-xl cursor-pointer transition-all duration-200 text-gray-400 text-[11px] font-medium gap-2 hover:bg-white/10 hover:border-indigo-400/40 hover:-translate-y-[2px]',
                  {
                    '!bg-indigo-600/15 !border-indigo-600 !text-indigo-400 shadow-[0_0_15px_rgba(79,70,229,0.2)]':
                      selectedJob === value,
                  },
                )}
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
                      <tr
                        key={char.id}
                        className="border-b border-white/5 transition-colors duration-200 hover:bg-white/5"
                      >
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
    </div>
  )
}
