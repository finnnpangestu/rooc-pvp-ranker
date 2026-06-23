import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard/DashboardClient'
import { Analytics } from '@vercel/analytics/next'

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

  if (currentGuild) {
    const charsRes = await payload.find({
      collection: 'characters',
      where: {
        guild_id: { equals: currentGuild.id },
      },
      depth: 0,
      limit: 1000,
      sort: 'createdAt',
    })
    guildMembers = charsRes.docs
  }

  return (
    <>
      <DashboardClient guild={currentGuild} members={guildMembers} />
      <Analytics />
    </>
  )
}
