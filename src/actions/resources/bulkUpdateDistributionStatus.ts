'use server'

import { db } from '@/db'
import { characters, resources, resourceDistributions } from '@/db/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function bulkUpdateDistributionStatus(
  distributionIds: string[],
  status: 'pending' | 'approved' | 'claimed',
) {
  try {
    if (distributionIds.length === 0) return { success: true }

    // 1. Fetch all selected distributions in one query
    const distributions = await db.query.resourceDistributions.findMany({
      where: inArray(resourceDistributions.id, distributionIds),
    })

    const resourceDeductions: Record<string, number> = {}
    const memberIdsToUpdate = new Set<string>()

    for (const doc of distributions) {
      const isApproving =
        doc.status === 'pending' && (status === 'approved' || status === 'claimed')

      if (isApproving && doc.resource_id) {
        resourceDeductions[doc.resource_id] =
          (resourceDeductions[doc.resource_id] || 0) + (Number(doc.quantity) || 0)
      }

      if (doc.member_id) {
        memberIdsToUpdate.add(doc.member_id)
      }
    }

    // 2. Bulk update distributions status
    await db
      .update(resourceDistributions)
      .set({
        status,
        updated_at: new Date().toISOString(),
      })
      .where(inArray(resourceDistributions.id, distributionIds))

    // 3. Process Resource Deductions
    for (const [resId, deduction] of Object.entries(resourceDeductions)) {
      const resource = await db.query.resources.findFirst({
        where: eq(resources.id, resId),
      })
      if (resource) {
        const newRemaining = (Number(resource.remaining_quantity) || 0) - deduction
        await db
          .update(resources)
          .set({
            remaining_quantity: String(Math.max(0, newRemaining)),
            updated_at: new Date().toISOString(),
          })
          .where(eq(resources.id, resId))
      }
    }

    // 4. Recalculate member totals
    if (memberIdsToUpdate.size > 0) {
      const memberList = Array.from(memberIdsToUpdate)
      const allMemberDistributions = await db.query.resourceDistributions.findMany({
        where: and(
          inArray(resourceDistributions.member_id, memberList),
          inArray(resourceDistributions.status, ['approved', 'claimed']),
        ),
      })

      const memberTotals: Record<string, number> = {}
      for (const doc of allMemberDistributions) {
        if (doc.member_id) {
          memberTotals[doc.member_id] = (memberTotals[doc.member_id] || 0) + (Number(doc.quantity) || 0)
        }
      }

      for (const memId of memberList) {
        await db
          .update(characters)
          .set({
            total_resources: String(memberTotals[memId] || 0),
            updated_at: new Date().toISOString(),
          })
          .where(eq(characters.id, memId))
      }
    }

    revalidatePath('/resources')
    revalidatePath('/')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: unknown) {
    console.error('Bulk update distribution status error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Gagal memperbarui status distribusi massal'
    return { success: false, message: errorMsg, error: errorMsg }
  }
}
