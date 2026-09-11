import React from 'react'
import { StatsForm } from './StatsForm'
import { db } from '@/db'

export const metadata = {
  title: 'Submit Character Stats | ROOC PvP Ranker',
  description: 'Form input stats karakter untuk kalkulasi score PvP.',
}

export const dynamic = 'force-dynamic'

export default async function StatsPage() {
  const [guildsRes, charsRes] = await Promise.all([
    db.query.guilds.findMany({
      columns: {
        id: true,
        name: true,
      },
    }),
    db.query.characters.findMany(),
  ])

  const formattedGuilds = guildsRes.map((g) => ({
    id: String(g.id),
    name: g.name,
  }))

  return (
    <main className="min-h-screen py-4 px-4" style={{ background: 'var(--bg-primary)' }}>
      <StatsForm guilds={formattedGuilds} characters={charsRes} />
    </main>
  )
}
