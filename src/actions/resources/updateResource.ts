'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function updateResource(
  resourceId: string,
  data: {
    name?: string
    total_quantity?: number
    add_quantity?: number
  },
) {
  try {
    const payload = await getPayload({ config: configPromise })

    const existing = await payload.findByID({
      collection: 'resources',
      id: resourceId,
    })

    let updateData: any = {}

    if (data.name) {
      updateData.name = data.name
    }

    if (data.add_quantity && data.add_quantity > 0) {
      const newTotal = existing.total_quantity + data.add_quantity
      updateData.total_quantity = newTotal

      updateData.remaining_quantity = (existing.remaining_quantity ?? 0) + data.add_quantity
    } else if (data.total_quantity !== undefined && data.total_quantity > 0) {
      updateData.total_quantity = data.total_quantity
    }

    if (Object.keys(updateData).length === 0) {
      return { success: false, message: 'Tidak ada perubahan' }
    }

    const result = await payload.update({
      collection: 'resources',
      id: resourceId,
      data: updateData,
    })

    revalidatePath('/resources')
    revalidatePath('/')

    return { success: true, doc: result }
  } catch (error: any) {
    console.error('Update resource error:', error)
    return { success: false, message: error.message }
  }
}
