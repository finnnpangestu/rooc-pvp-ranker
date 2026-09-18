import { redirect } from 'next/navigation'
import { getCharactersDashboard } from '@/actions/dashboard/getCharactersDashboard'
import { getResources } from '@/actions/resources/getResources'
import { DashboardClient } from './dashboard/DashboardClient'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/db'
import { guilds, partySetups, reportsWoe, woeSetups } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

import type { Character, PartySetup, PopulatedResource, ReportWoe, WoeSetup } from '@/types'

export const metadata = {
  title: 'Guild Master Dashboard',
}

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const currentGuild =
    (await db.query.guilds.findFirst({
      where: eq(guilds.guild_master_id, user.id),
    })) || null

  let guildMembers: Character[] = []
  let partySetup: PartySetup | null = null
  let woeSetup: WoeSetup | null = null
  let resources: PopulatedResource[] = []
  let woeReports: ReportWoe[] = []

  if (currentGuild) {
    const guildIdStr = currentGuild.id

    const [guildMembersRes, setupRes, woeSetupRes, resourcesRes, woeReportsRes] = await Promise.all([
      getCharactersDashboard(guildIdStr),
      db.query.partySetups.findFirst({
        where: eq(partySetups.guild_id, currentGuild.id),
      }),
      db.query.woeSetups.findFirst({
        where: eq(woeSetups.guild_id, currentGuild.id),
      }),
      getResources(guildIdStr),
      db.query.reportsWoe.findMany({
        where: eq(reportsWoe.guild_id, currentGuild.id),
        orderBy: [desc(reportsWoe.match_date)],
        limit: 5,
      }),
    ])

    guildMembers = guildMembersRes
    partySetup = setupRes || null
    woeSetup = woeSetupRes || null
    resources = resourcesRes
    woeReports = [...woeReportsRes].reverse() // reverse to show oldest first in graph
  }

  return (
    <DashboardClient
      guild={currentGuild}
      members={guildMembers}
      partySetup={partySetup}
      woeSetup={woeSetup}
      resources={resources}
      woeReports={woeReports}
    />
  )
}
