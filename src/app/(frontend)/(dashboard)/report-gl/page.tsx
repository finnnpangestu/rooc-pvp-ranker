import React from 'react'
import { redirect } from 'next/navigation'
import { ReportGLClient } from './ReportGLClient'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/db'
import { characters, guilds, partySetups, reportsGl } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export const metadata = {
  title: 'Report GL | ROOC PvP Ranker',
}

export default async function ReportGLPage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const currentGuild =
    (await db.query.guilds.findFirst({
      where: eq(guilds.guild_master_id, user.id),
    })) || null

  if (!currentGuild) redirect('/')

  const [currentSetup, historyReports, guildMembers] = await Promise.all([
    db.query.partySetups.findFirst({
      where: eq(partySetups.guild_id, currentGuild.id),
    }),
    db.query.reportsGl.findMany({
      where: eq(reportsGl.guild_id, currentGuild.id),
      orderBy: [desc(reportsGl.match_date)],
      limit: 10,
    }),
    db.query.characters.findMany({
      where: eq(characters.guild_id, currentGuild.id),
    }),
  ])

  return (
    <ReportGLClient
      guild={currentGuild}
      initialSetup={currentSetup || null}
      historyReports={historyReports}
      members={guildMembers}
    />
  )
}
