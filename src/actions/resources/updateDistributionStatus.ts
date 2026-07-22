'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function updateDistributionStatus(
  distributionId: string,
  status: 'pending' | 'approved' | 'claimed',
) {
  try {
    const payload = await getPayload({ config: configPromise })

    const existing = await payload.findByID({
      collection: 'resource_distributions',
      id: distributionId,
    })

    const isApproving =
      existing.status === 'pending' && (status === 'approved' || status === 'claimed')

    await payload.update({
      collection: 'resource_distributions',
      id: distributionId,
      data: { status },
    })

    if (isApproving) {
      const resourceId =
        typeof existing.resource_id === 'object' ? existing.resource_id.id : existing.resource_id
      const resource = await payload.findByID({
        collection: 'resources',
        id: resourceId,
      })

      const newRemaining = (resource.remaining_quantity ?? 0) - existing.quantity
      await payload.update({
        collection: 'resources',
        id: resourceId,
        data: {
          remaining_quantity: Math.max(0, newRemaining),
        },
      })
    }

    const memberId =
      typeof existing.member_id === 'object' ? existing.member_id.id : existing.member_id
    const distributions = await payload.find({
      collection: 'resource_distributions',
      where: {
        member_id: { equals: memberId },
        status: { in: ['approved', 'claimed'] },
      },
      limit: 0,
      pagination: false,
    })

    const total = distributions.docs.reduce((sum, d) => sum + d.quantity, 0)

    await payload.update({
      collection: 'characters',
      id: memberId,
      data: {
        total_resources: total,
      },
    })

    revalidatePath('/resources')
    revalidatePath('/')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: any) {
    console.error('Update distribution status error:', error)
    return { success: false, message: error.message }
  }
}
