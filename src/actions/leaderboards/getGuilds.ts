'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function getGuilds() {
  try {
    const payload = await getPayload({ config: configPromise })

    const guildsRes = await payload.find({
      collection: 'guilds',
      limit: 1000,
      pagination: false,
      sort: '-total_pvp_score',
    })

    return guildsRes.docs
  } catch (error) {
    console.error('Error fetching guilds:', error)
    return []
  }
}
