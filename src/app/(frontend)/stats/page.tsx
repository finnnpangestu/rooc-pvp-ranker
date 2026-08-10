import React from 'react'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { StatsForm } from './StatsForm'

export const metadata = {
  title: 'Submit Character Stats | ROOC PvP Ranker',
  description: 'Form input stats karakter untuk kalkulasi score PvP.',
}

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const payload = await getPayload({ config: configPromise })

  const [guildsRes, charsRes] = await Promise.all([
    payload.find({
      collection: 'guilds',
      limit: 1000,
      pagination: false,
      select: {
        name: true,
      },
    }),
    payload.find({
      collection: 'characters',
      limit: 5000,
      pagination: false,
      depth: 0,
    })
  ])

  const guilds = guildsRes.docs.map((g) => ({
    id: String(g.id),
    name: g.name,
  }))

  return (
    <main className="min-h-screen py-4 px-4" style={{ background: 'var(--bg-primary)' }}>
      <StatsForm guilds={guilds} characters={charsRes.docs} />
    </main>
  )
}
