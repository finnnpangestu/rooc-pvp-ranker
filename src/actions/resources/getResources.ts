'use server'

import { db } from '@/db'
import { resources, resourceDistributions } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function getResources(guildId: string) {
  try {
    const result = await db.query.resources.findMany({
      where: eq(resources.guild_id, guildId),
      orderBy: [desc(resources.created_at)],
    })

    return result.map((r) => ({
      ...r,
      total_quantity: Number(r.total_quantity),
      remaining_quantity: Number(r.remaining_quantity),
    }))
  } catch (error) {
    console.error('Error fetching resources:', error)
    return []
  }
}

export async function getResourceDistributions(guildId: string) {
  try {
    const result = await db.query.resourceDistributions.findMany({
      where: eq(resourceDistributions.guild_id, guildId),
      with: {
        resource: true,
        member: true,
      },
      orderBy: [desc(resourceDistributions.bid_date), desc(resourceDistributions.created_at)],
    })

    return result.map((d) => ({
      ...d,
      quantity: Number(d.quantity),
      resource_id: d.resource
        ? {
            ...d.resource,
            total_quantity: Number(d.resource.total_quantity),
            remaining_quantity: Number(d.resource.remaining_quantity),
          }
        : null,
      member_id: d.member
        ? {
            ...d.member,
            pvp_score: Number(d.member.pvp_score),
          }
        : null,
    }))
  } catch (error) {
    console.error('Error fetching distributions:', error)
    return []
  }
}
