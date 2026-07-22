import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ReportGLClient } from './ReportGLClient'

export const metadata = {
  title: 'Report GL | ROOC PvP Ranker',
}

export default async function ReportGLPage() {
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

  const setupRes = await payload.find({
    collection: 'party_setups',
    where: { guild_id: { equals: currentGuild.id } },
    limit: 1,
  })
  const currentSetup = setupRes.docs[0] || null

  const reportsRes = await payload.find({
    collection: 'reports_gl',
    where: { guild_id: { equals: currentGuild.id } },
    sort: '-match_date',
    limit: 10,
  })

  return (
    <ReportGLClient
      guild={currentGuild}
      initialSetup={currentSetup}
      historyReports={reportsRes.docs}
    />
  )
}
