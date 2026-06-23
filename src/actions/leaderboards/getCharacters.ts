'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function getCharacters() {
  try {
    const payload = await getPayload({ config: configPromise })

    const charsRes = await payload.find({
      collection: 'characters',
      limit: 1000,
      pagination: false,
      depth: 0,
      where: {
        isVerified: { equals: true },
      },
      sort: '-pvp_score',
    })

    return charsRes.docs
  } catch (error) {
    console.error('Error fetching characters:', error)
    return []
  }
}
