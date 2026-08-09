import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ReportWoeClient } from './ReportWoeClient'

export const metadata = {
  title: 'Report WoE | ROOC PvP Ranker',
}

export default async function ReportWoePage() {
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

  const [setupRes, reportsRes] = await Promise.all([
    payload.find({
      collection: 'woe_setups',
      where: { guild_id: { equals: currentGuild.id } },
      limit: 1,
    }),
    payload.find({
      collection: 'reports_woe',
      where: { guild_id: { equals: currentGuild.id } },
      sort: '-match_date',
      limit: 50,
    })
  ])

  const currentSetup = setupRes.docs[0] || null

  return (
    <ReportWoeClient
      guild={currentGuild}
      initialSetup={currentSetup}
      historyReports={reportsRes.docs}
    />
  )
}
