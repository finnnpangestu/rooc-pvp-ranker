import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { StatsForm } from './StatsForm'

export const metadata = {
  title: 'Submit Character Stats | ROOC PvP Ranker',
  description: 'Form input stats karakter untuk kalkulasi score PvP.',
}

export default async function StatsPage() {
  const payload = await getPayload({ config: configPromise })

  const guildsRes = await payload.find({
    collection: 'guilds',
    limit: 1000,
    pagination: false,
    select: {
      name: true,
    },
  })

  // Format data
  const guilds = guildsRes.docs.map((g) => ({
    id: String(g.id),
    name: g.name,
  }))

  return (
    <main style={{ minHeight: '100vh', background: '#09090b', padding: '1px 0' }}>
      <StatsForm guilds={guilds} />
    </main>
  )
}
