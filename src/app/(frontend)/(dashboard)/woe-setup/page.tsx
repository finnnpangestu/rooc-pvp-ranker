import { redirect } from 'next/navigation'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { WoeSetupClient } from './WoeSetupClient'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/db'
import { guilds, woeSetups } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const metadata = {
  title: 'WoE Setup | ROOC PvP Ranker',
}

export default async function WoeSetupPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const currentGuild =
    (await db.query.guilds.findFirst({
      where: eq(guilds.guild_master_id, user.id),
    })) || null

  if (!currentGuild) redirect('/')

  const charsRes = await getCharactersDashboard(currentGuild.id)

  const setupRes =
    (await db.query.woeSetups.findFirst({
      where: eq(woeSetups.guild_id, currentGuild.id),
    })) || null

  return (
    <WoeSetupClient
      guild={currentGuild}
      members={charsRes}
      initialSetup={setupRes}
    />
  )
}
