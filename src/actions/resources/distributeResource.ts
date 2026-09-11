'use server'

import { db } from '@/db'
import { resources, resourceDistributions } from '@/db/schema'
import { eq } from 'drizzle-orm'
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
    for (const item of data.items) {
      const resource = await db.query.resources.findFirst({
        where: eq(resources.id, item.resource_id),
      })
      if (!resource || (Number(resource.remaining_quantity) || 0) < item.quantity) {
        return {
          success: false,
          message: `Stok ${resource?.name || 'resource'} tidak mencukupi. Sisa: ${resource?.remaining_quantity || 0}`,
        }
      }
    }

    const results = []
    for (const item of data.items) {
      const [result] = await db
        .insert(resourceDistributions)
        .values({
          id: crypto.randomUUID(),
          guild_id: guildId,
          resource_id: item.resource_id,
          member_id: data.member_id,
          quantity: String(item.quantity),
          notes: data.notes || null,
          status: 'pending',
          bid_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .returning()
      results.push(result)
    }

    revalidatePath('/resources')
    revalidatePath('/')
    revalidatePath('/dashboard')

    return { success: true, docs: results }
  } catch (error: unknown) {
    console.error('Distribute resource error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Gagal mendistribusikan resource'
    return { success: false, message: errorMsg, error: errorMsg }
  }
}
