'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function updateDistributionDetails(
  distributionId: string,
  data: { member_id?: string; quantity?: number },
) {
  try {
    const payload = await getPayload({ config: configPromise })
    const existing = await payload.findByID({
      collection: 'resource_distributions',
      id: distributionId,
    })

    if (existing.status === 'pending' && data.member_id) {
      await payload.update({
        collection: 'resource_distributions',
        id: distributionId,
        data: { member_id: data.member_id },
      })
    } else if (existing.status === 'approved' && data.quantity !== undefined) {
      const oldQuantity = existing.quantity
      const newQuantity = data.quantity
      const diff = newQuantity - oldQuantity

      const resourceId =
        typeof existing.resource_id === 'object' ? existing.resource_id.id : existing.resource_id
      const resource = await payload.findByID({
        collection: 'resources',
        id: resourceId,
      })

      if (diff > 0 && (resource.remaining_quantity ?? 0) < diff) {
        return { success: false, message: 'Stok resource tidak mencukupi untuk penambahan ini.' }
      }

      await payload.update({
        collection: 'resource_distributions',
        id: distributionId,
        data: { quantity: newQuantity },
      })

      await payload.update({
        collection: 'resources',
        id: resourceId,
        data: { remaining_quantity: (resource.remaining_quantity ?? 0) - diff },
      })

      const memberId =
        typeof existing.member_id === 'object' ? existing.member_id.id : existing.member_id
      const distributions = await payload.find({
        collection: 'resource_distributions',
        where: { member_id: { equals: memberId }, status: { in: ['approved', 'claimed'] } },
        limit: 0,
        pagination: false,
      })
      const total = distributions.docs.reduce((sum, d) => sum + d.quantity, 0)

      await payload.update({
        collection: 'characters',
        id: memberId,
        data: { total_resources: total },
      })
    }

    revalidatePath('/resources')
    revalidatePath('/')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}
