'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function bulkUpdateDistributionStatus(
  distributionIds: string[],
  status: 'pending' | 'approved' | 'claimed',
) {
  try {
    const payload = await getPayload({ config: configPromise })

    // 1. Fetch all selected distributions in one query
    const distributions = await payload.find({
      collection: 'resource_distributions',
      where: {
        id: { in: distributionIds },
      },
      limit: 0,
      pagination: false,
    })

    const resourceDeductions: Record<string, number> = {}
    const memberIdsToUpdate = new Set<string>()

    for (const doc of distributions.docs) {
      const isApproving =
        doc.status === 'pending' && (status === 'approved' || status === 'claimed')

      if (isApproving) {
        const resId = typeof doc.resource_id === 'object' ? doc.resource_id.id : doc.resource_id
        if (resId) {
          resourceDeductions[resId as string] =
            (resourceDeductions[resId as string] || 0) + doc.quantity
        }
      }

      const memId = typeof doc.member_id === 'object' ? doc.member_id.id : doc.member_id
      if (memId) {
        memberIdsToUpdate.add(memId as string)
      }
    }

    // 2. Bulk update distributions status
    await payload.update({
      collection: 'resource_distributions',
      where: {
        id: { in: distributionIds },
      },
      data: { status },
    })

    // 3. Process Resource Deductions (Unique resources only)
    if (Object.keys(resourceDeductions).length > 0) {
      for (const [resId, deduction] of Object.entries(resourceDeductions)) {
        const resource = await payload.findByID({
          collection: 'resources',
          id: resId,
        })
        const newRemaining = (resource.remaining_quantity ?? 0) - deduction
        await payload.update({
          collection: 'resources',
          id: resId,
          data: {
            remaining_quantity: Math.max(0, newRemaining),
          },
        })
      }
    }

    // 4. Recalculate member totals efficiently
    if (memberIdsToUpdate.size > 0) {
      const allMemberDistributions = await payload.find({
        collection: 'resource_distributions',
        where: {
          member_id: { in: Array.from(memberIdsToUpdate) },
          status: { in: ['approved', 'claimed'] },
        },
        limit: 0,
        pagination: false,
      })

      const memberTotals: Record<string, number> = {}
      for (const doc of allMemberDistributions.docs) {
        const memId = typeof doc.member_id === 'object' ? doc.member_id.id : doc.member_id
        if (memId) {
          memberTotals[memId as string] = (memberTotals[memId as string] || 0) + doc.quantity
        }
      }

      for (const memId of Array.from(memberIdsToUpdate)) {
        await payload.update({
          collection: 'characters',
          id: memId,
          data: {
            total_resources: memberTotals[memId] || 0,
          },
        })
      }
    }

    revalidatePath('/resources')
    revalidatePath('/')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: any) {
    console.error('Bulk update distribution status error:', error)
    return { success: false, message: error.message }
  }
}
