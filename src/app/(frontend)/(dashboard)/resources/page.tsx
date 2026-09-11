import { redirect } from 'next/navigation'
import { getResources, getResourceDistributions } from '@/actions/resources/getResources'
import { ResourceClient } from './ResourceClient'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/db'
import { guilds, characters } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export const metadata = {
  title: 'Resource Management | ROOC PvP Ranker',
}

export default async function ResourcesPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const currentGuild =
    (await db.query.guilds.findFirst({
      where: eq(guilds.guild_master_id, user.id),
    })) || null

  if (!currentGuild) redirect('/')

  const resources = await getResources(currentGuild.id)
  const distributions = await getResourceDistributions(currentGuild.id)

  const members = await db.query.characters.findMany({
    where: and(
      eq(characters.guild_id, currentGuild.id),
      eq(characters.isVerified, true),
    ),
  })

  return (
    <ResourceClient
      guild={currentGuild}
      resources={resources}
      distributions={distributions}
      members={members}
    />
  )
}
