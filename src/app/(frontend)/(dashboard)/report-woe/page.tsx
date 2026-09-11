import React from 'react'
import { redirect } from 'next/navigation'
import { ReportWoeClient } from './ReportWoeClient'
import { getSessionUser } from '@/lib/auth'
import { db } from '@/db'
import { characters, guilds, woeSetups, reportsWoe } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export const metadata = {
  title: 'Report WoE | ROOC PvP Ranker',
}

export default async function ReportWoePage() {
  const user = await getSessionUser()
  if (!user) {
    redirect('/login')
  }

  const currentGuild =
    (await db.query.guilds.findFirst({
      where: eq(guilds.guild_master_id, user.id),
    })) || null

  if (!currentGuild) redirect('/')

  const [setupRes, reportsRes, membersRes] = await Promise.all([
    db.query.woeSetups.findFirst({
      where: eq(woeSetups.guild_id, currentGuild.id),
    }),
    db.query.reportsWoe.findMany({
      where: eq(reportsWoe.guild_id, currentGuild.id),
      orderBy: [desc(reportsWoe.match_date)],
      limit: 50,
    }),
    db.query.characters.findMany({
      where: eq(characters.guild_id, currentGuild.id),
    }),
  ])

  const currentSetup = setupRes || null

  return (
    <ReportWoeClient
      guild={currentGuild}
      initialSetup={currentSetup}
      historyReports={reportsRes}
      members={membersRes}
    />
  )
}
