'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function getCharactersDashboard(guildId: string) {
  try {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.find({
      collection: 'characters',
      where: {
        guild_id: { equals: guildId },
      },
      depth: 0,
      limit: 1000,
      pagination: false,
    })

    return result.docs
  } catch (error) {
    console.error('Error fetching characters:', error)
    return []
  }
}
