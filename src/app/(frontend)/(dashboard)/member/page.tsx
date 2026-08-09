import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { MemberClient } from './MemberClient'

export const metadata = {
  title: 'Daftar Member Guild',
}

export default async function MemberPage() {
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
    const guildIdStr = currentGuild.id.toString()
    guildMembers = await getCharactersDashboard(guildIdStr)
  }

  return <MemberClient guild={currentGuild} members={guildMembers} />
}
