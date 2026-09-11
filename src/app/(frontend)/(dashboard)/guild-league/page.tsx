import { redirect } from 'next/navigation'
import { GuildLeagueClient } from './GuildLeagueClient'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/db'
import { guilds, partySetups } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const metadata = {
  title: 'League Management | ROOC PvP Ranker',
}

export default async function GuildLeaguePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const currentGuild =
    (await db.query.guilds.findFirst({
      where: eq(guilds.guild_master_id, user.id),
    })) || null

  if (!currentGuild) redirect('/')

  const charsRes = await getCharactersDashboard(currentGuild.id)

  const initialSetup =
    (await db.query.partySetups.findFirst({
      where: eq(partySetups.guild_id, currentGuild.id),
    })) || null

  return (
    <GuildLeagueClient
      guild={currentGuild}
      members={charsRes}
      initialSetup={initialSetup}
    />
  )
}
