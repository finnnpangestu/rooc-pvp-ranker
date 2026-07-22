'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function distributeResource(
  guildId: string,
  data: {
    member_id: string
    items: { resource_id: string; quantity: number }[]
    notes?: string
  },
) {
  try {
    const payload = await getPayload({ config: configPromise })

    for (const item of data.items) {
      const resource = await payload.findByID({
        collection: 'resources',
        id: item.resource_id,
      })
      if ((resource.remaining_quantity ?? 0) < item.quantity) {
        return {
          success: false,
          message: `Stok ${resource.name} tidak mencukupi. Sisa: ${resource.remaining_quantity}`,
        }
      }
    }

    const results = []
    for (const item of data.items) {
      const result = await payload.create({
        collection: 'resource_distributions',
        data: {
          guild_id: guildId,
          resource_id: item.resource_id,
          member_id: data.member_id,
          quantity: item.quantity,
          notes: data.notes,
          status: 'pending',
          bid_date: new Date().toISOString(),
        },
      })
      results.push(result)
    }

    revalidatePath('/resources')
    revalidatePath('/')
    revalidatePath('/dashboard')

    return { success: true, docs: results }
  } catch (error: any) {
    console.error('Distribute resource error:', error)
    return { success: false, message: error.message }
  }
}
