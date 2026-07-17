import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { GuildLeagueClient } from './GuildLeagueClient'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'

export const metadata = {
  title: 'League Management | ROOC PvP Ranker',
}

export default async function GuildLeaguePage() {
  const reqHeaders = await headers()
  const payload = await getPayload({ config: configPromise })

  const { user } = await payload.auth({ headers: reqHeaders })
  if (!user) redirect('/login')

  const guildRes = await payload.find({
    collection: 'guilds',
    where: { guild_master: { equals: user.id } },
    depth: 1,
    limit: 1,
  })
  const currentGuild = guildRes.docs[0] || null
  if (!currentGuild) redirect('/')

  const charsRes = await getCharactersDashboard(currentGuild.id)

  const setupRes = await payload.find({
    collection: 'party_setups',
    where: { guild_id: { equals: currentGuild.id } },
    depth: 1,
    limit: 1,
  })

  return (
    <main className="min-h-screen bg-[#0f0f14] py-10 font-sans">
      <div className="container mx-auto px-4 max-w-[1200px]">
        <GuildLeagueClient
          guild={currentGuild}
          members={charsRes}
          initialSetup={setupRes.docs[0] || null}
        />
      </div>
    </main>
  )
}
