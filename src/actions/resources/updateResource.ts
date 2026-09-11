'use server'

import { db } from '@/db'
import { resources } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { Resource, ActionResult } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export async function updateResource(
  resourceId: string,
  data: {
    name?: string
    total_quantity?: number
    add_quantity?: number
  },
): Promise<ActionResult<{ doc: Resource }>> {
  try {
    const existing = await db.query.resources.findFirst({
      where: eq(resources.id, resourceId),
    })

    if (!existing) {
      return actionError('Resource tidak ditemukan')
    }

    const updateData: Partial<typeof resources.$inferInsert> = {
      updated_at: new Date().toISOString(),
    }

    if (data.name) {
      updateData.name = data.name
    }

    if (data.add_quantity && data.add_quantity > 0) {
      const newTotal = (Number(existing.total_quantity) || 0) + data.add_quantity
      updateData.total_quantity = String(newTotal)
      updateData.remaining_quantity = String((Number(existing.remaining_quantity) || 0) + data.add_quantity)
    } else if (data.total_quantity !== undefined && data.total_quantity > 0) {
      updateData.total_quantity = String(data.total_quantity)
    }

    if (Object.keys(updateData).length <= 1) {
      return actionError('Tidak ada perubahan')
    }

    const [result] = await db
      .update(resources)
      .set(updateData)
      .where(eq(resources.id, resourceId))
      .returning()

    revalidatePath('/resources')
    revalidatePath('/')

    return actionSuccess({ doc: result }, 'Resource berhasil diperbarui')
  } catch (error: unknown) {
    console.error('Update resource error:', error)
    return actionError(formatErrorMessage(error))
  }
}
