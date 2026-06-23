'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function getCharactersDashboard(guildId: string) {
  try {
    const payload = await getPayload({ config: configPromise })

    const charsRes = await payload.find({
      collection: 'characters',
      depth: 0,
      limit: 1000,
      where: {
        guild_id: {
          equals: guildId,
        },
      },
      sort: '-pvp_score',
    })

    return charsRes.docs
  } catch (error) {
    console.error('Error fetching characters:', error)
    return []
  }
}
