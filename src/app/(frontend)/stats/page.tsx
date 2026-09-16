import React from 'react'
import { StatsForm } from './StatsForm'
import { db } from '@/db'
import { guilds, characters } from '@/db/schema'
import { eq } from 'drizzle-orm'
import Link from 'next/link'
import { Icon } from '@iconify/react'
import type { Character } from '@/types'

export const metadata = {
  title: 'Submit Character Stats | ROOC PvP Ranker',
  description: 'Form input stats karakter untuk kalkulasi score PvP.',
}

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function StatsPage({ searchParams }: PageProps) {
  const params = await searchParams
  let rawGuildId: string | undefined

  if (typeof params?.guildId === 'string') {
    rawGuildId = params.guildId
  } else if (typeof params?.guild === 'string') {
    rawGuildId = params.guild
  } else if (params && typeof params === 'object') {
    // Handling cases parameter
    const keys = Object.keys(params)

    const bareKey = keys.find((k) => k && (params[k] === '' || params[k] === undefined))
    if (bareKey) {
      rawGuildId = bareKey
    }
  }

  const cleanGuildId = rawGuildId ? rawGuildId.trim() : null

  let targetGuild: { id: string; name: string } | null = null
  let guildCharacters: Character[] = []

  if (cleanGuildId) {
    const found = await db.query.guilds.findFirst({
      where: eq(guilds.id, cleanGuildId),
      columns: {
        id: true,
        name: true,
      },
    })
    if (found) {
      targetGuild = { id: String(found.id), name: found.name }
      guildCharacters = await db.query.characters.findMany({
        where: eq(characters.guild_id, targetGuild.id),
      })
    }
  }

  if (!targetGuild) {
    return (
      <main
        className="min-h-screen py-12 px-4 flex items-center justify-center"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div
          className="max-w-[540px] w-full p-8 sm:p-10 rounded-3xl relative overflow-hidden transition-colors text-center border"
          style={{
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-neumorph)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-primary)',
          }}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(239,68,68,0.12)_0%,rgba(0,0,0,0)_70%)] z-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center border"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                borderColor: 'rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                boxShadow: 'var(--shadow-neumorph-sm)',
              }}
            >
              <Icon icon="fluent:shield-dismiss-24-filled" className="w-8 h-8" />
            </div>

            <div>
              <div
                className="inline-block py-1 px-3 text-xs font-semibold uppercase tracking-wider rounded-full mb-3 border text-red-400"
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderColor: 'rgba(239, 68, 68, 0.2)',
                }}
              >
                Akses Terbatas
              </div>
              <h1
                className="text-2xl sm:text-3xl font-bold mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                Guild Tidak Ditemukan
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Anda tidak termasuk ke dalam member guild. Silakan hubungi{' '}
                <strong className="text-white">Guild Master</strong> Anda untuk mendapatkan link
                resmi yang direkomendasikan.
              </p>
            </div>

            <div
              className="w-full p-4 rounded-2xl border text-xs leading-relaxed text-left flex items-start gap-3"
              style={{
                background: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)',
                boxShadow: 'var(--shadow-neumorph-inset)',
                color: 'var(--text-muted)',
              }}
            >
              <Icon
                icon="fluent:info-20-filled"
                className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5"
              />
              <div>
                Halaman input & update stats sekarang membutuhkan parameter Guild ID yang valid agar
                data karakter tersimpan aman di guild yang sesuai.
              </div>
            </div>

            <div className="w-full mt-2">
              <Link
                href="/leaderboards"
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-200 text-center border cursor-pointer inline-flex items-center justify-center gap-2 hover:shadow-neumorph"
                style={{
                  background: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  boxShadow: 'var(--shadow-neumorph-sm)',
                  color: 'var(--text-primary)',
                }}
              >
                Lihat Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen py-4 px-4" style={{ background: 'var(--bg-primary)' }}>
      <StatsForm guild={targetGuild} characters={guildCharacters} />
    </main>
  )
}
