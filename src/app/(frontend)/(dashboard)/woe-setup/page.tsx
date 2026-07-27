import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { WoeSetupClient } from './WoeSetupClient'

export const metadata = {
  title: 'WoE Setup | ROOC PvP Ranker',
}

export default async function WoeSetupPage() {
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
    collection: 'woe_setups',
    where: { guild_id: { equals: currentGuild.id } },
    depth: 1,
    limit: 1,
  })

  return (
    <WoeSetupClient
      guild={currentGuild}
      members={charsRes}
      initialSetup={setupRes.docs[0] || null}
    />
  )
}
