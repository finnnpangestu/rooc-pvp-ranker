'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function getResources(guildId: string) {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'resources',
    where: {
      guild_id: { equals: guildId },
    },
    sort: '-created_at',
    limit: 100,
    pagination: false,
  })

  return result.docs
}

export async function getResourceDistributions(guildId: string) {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'resource_distributions',
    where: {
      guild_id: { equals: guildId },
    },
    sort: '-bid_date',
    depth: 1,
    limit: 200,
    pagination: false,
  })

  return result.docs
}
