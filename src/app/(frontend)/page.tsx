import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard/DashboardClient'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'

export const metadata = {
  title: 'Dashboard Guild Master | ROOC PvP Ranker',
}

export default async function DashboardPage() {
  const reqHeaders = await headers()
  const payload = await getPayload({ config: configPromise })

  const { user } = await payload.auth({ headers: reqHeaders })
  if (!user) {
    redirect('/login')
  }

  const guildRes = await payload.find({
    collection: 'guilds',
    where: {
      guild_master: { equals: user.id },
    },
    depth: 1,
    limit: 1,
  })

  const currentGuild = guildRes.docs[0] || null
  let guildMembers: any[] = []
  let partySetup: any = null

  if (currentGuild) {
    guildMembers = await getCharactersDashboard(currentGuild.id.toString())

    const setupRes = await payload.find({
      collection: 'party_setups',
      where: { guild_id: { equals: currentGuild.id } },
      depth: 1,
      limit: 1,
    })
    partySetup = setupRes.docs[0] || null
  }

  return (
    <>
      <DashboardClient guild={currentGuild} members={guildMembers} partySetup={partySetup} />
      <Analytics />
      <SpeedInsights />
    </>
  )
}
