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
  description: 'Character stats input form for PvP score calculation.',
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
        className="min-h-screen py-12 px-4 flex items-center justify-center apple-canvas"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div
          className="max-w-[540px] w-full p-8 sm:p-10 rounded-3xl relative overflow-hidden transition-colors text-center border border-black/5 dark:border-white/10 apple-glass shadow-2xl"
          style={{
            color: 'var(--text-primary)',
          }}
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-[120px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(239,68,68,0.12)_0%,rgba(0,0,0,0)_70%)] z-0 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-red-500/25 bg-red-500/10 text-red-500 shadow-sm">
              <Icon icon="fluent:shield-dismiss-24-filled" className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-block py-1 px-3 text-xs font-semibold uppercase tracking-wider rounded-full mb-3 border border-red-500/20 bg-red-500/10 text-red-500">
                Restricted Access
              </div>
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight mb-3"
                style={{ color: 'var(--text-primary)' }}
              >
                Guild Not Found
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                You do not belong to this guild. Please contact your{' '}
                <strong className="text-[var(--text-primary)]">Guild Master</strong> to obtain the
                recommended official link.
              </p>
            </div>

            <div
              className="w-full p-4 rounded-2xl border border-black/5 dark:border-white/10 text-xs leading-relaxed text-left flex items-start gap-3 bg-black/[0.02] dark:bg-white/[0.04]"
              style={{
                color: 'var(--text-muted)',
              }}
            >
              <Icon
                icon="fluent:info-20-filled"
                className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5"
              />
              <div>
                The stats submission & update page requires a valid Guild ID parameter so character
                data is securely recorded to the corresponding guild.
              </div>
            </div>

            <div className="w-full mt-2">
              <Link
                href="/leaderboards"
                className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm transition-all duration-200 text-center border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/[0.05] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] active:scale-[0.97] cursor-pointer inline-flex items-center justify-center gap-2"
                style={{
                  color: 'var(--text-primary)',
                }}
              >
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main
      className="min-h-screen py-6 px-4 apple-canvas"
      style={{ background: 'var(--bg-primary)' }}
    >
      <StatsForm guild={targetGuild} characters={guildCharacters} />
    </main>
  )
}
