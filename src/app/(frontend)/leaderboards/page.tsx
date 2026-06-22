import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { LeaderboardClient } from './LeaderboardClient'

export const metadata = {
  title: 'Leaderboard | ROOC PvP Ranker',
  description: 'Lihat peringkat PvP antar guild dan karakter.',
}

interface PageProps {
  searchParams: Promise<{ guild?: string }> | { guild?: string }
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const { guild: selectedGuildId } = await searchParams
  const payload = await getPayload({ config: configPromise })

  const guildsRes = await payload.find({
    collection: 'guilds',
    limit: 1000,
    pagination: false,
    sort: '-total_pvp_score',
  })

  const charsRes = await payload.find({
    collection: 'characters',
    limit: 1000,
    pagination: false,
    depth: 0,
    where: {
      isVerified: { equals: true },
    },
    sort: '-pvp_score',
  })

  const guildMap = guildsRes.docs.reduce(
    (acc, g) => {
      acc[String(g.id)] = g.name
      return acc
    },
    {} as Record<string, string>,
  )

  const charactersWithGuild = charsRes.docs.map((char) => {
    const gId = typeof char.guild_id === 'object' ? (char.guild_id as any).id : char.guild_id

    return {
      ...char,
      guild_id: gId,
      guild_name: guildMap[String(gId)] || 'Tanpa Guild',
    }
  })

  return (
    <LeaderboardClient
      allGuilds={guildsRes.docs}
      allCharacters={charactersWithGuild}
      selectedGuildId={selectedGuildId || ''}
    />
  )
}
