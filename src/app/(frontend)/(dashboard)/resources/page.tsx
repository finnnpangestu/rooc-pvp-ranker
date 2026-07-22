import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getResources, getResourceDistributions } from '@/actions/resources/getResources'
import { ResourceClient } from './ResourceClient'

export const metadata = {
  title: 'Resource Management | ROOC PvP Ranker',
}

export default async function ResourcesPage() {
  const reqHeaders = await headers()
  const payload = await getPayload({ config: configPromise })

  const { user } = await payload.auth({ headers: reqHeaders })
  if (!user) {
    redirect('/login')
  }

  const guildRes = await payload.find({
    collection: 'guilds',
    where: { guild_master: { equals: user.id } },
    limit: 1,
  })

  const currentGuild = guildRes.docs[0] || null
  if (!currentGuild) redirect('/')

  const resources = await getResources(currentGuild.id)
  const distributions = await getResourceDistributions(currentGuild.id)

  // Ambil semua member untuk dropdown
  const membersRes = await payload.find({
    collection: 'characters',
    where: {
      guild_id: { equals: currentGuild.id },
      isVerified: { equals: true },
    },
    limit: 1000,
    pagination: false,
  })

  return (
    <ResourceClient
      guild={currentGuild}
      resources={resources}
      distributions={distributions}
      members={membersRes.docs}
    />
  )
}
