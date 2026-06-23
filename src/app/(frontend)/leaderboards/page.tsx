import { LeaderboardClient } from './LeaderboardClient'
import { getGuilds } from '@/actions/leaderboards/getGuilds'
import { getCharacters } from '@/actions/leaderboards/getCharacters'

export const metadata = {
  title: 'Leaderboard | ROOC PvP Ranker',
  description: 'Lihat peringkat PvP antar guild dan karakter.',
}

interface PageProps {
  searchParams: Promise<{ guild?: string }> | { guild?: string }
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const { guild: selectedGuildId } = await searchParams
  const guildsRes = await getGuilds()
  const charactersRes = await getCharacters()

  const guildMap = guildsRes.reduce(
    (acc, g) => {
      acc[String(g.id)] = g.name
      return acc
    },
    {} as Record<string, string>,
  )

  const charactersWithGuild = charactersRes.map((char) => {
    const gId = typeof char.guild_id === 'object' ? (char.guild_id as any).id : char.guild_id

    return {
      ...char,
      guild_id: gId,
      guild_name: guildMap[String(gId)] || 'Tanpa Guild',
    }
  })

  return (
    <LeaderboardClient
      allGuilds={guildsRes}
      allCharacters={charactersWithGuild}
      selectedGuildId={selectedGuildId || ''}
    />
  )
}
