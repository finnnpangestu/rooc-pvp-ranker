'use server'

import { db } from '@/db'
import { characters, resources, resourceDistributions } from '@/db/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function updateDistributionStatus(
  distributionId: string,
  status: 'pending' | 'approved' | 'claimed',
) {
  try {
    const existing = await db.query.resourceDistributions.findFirst({
      where: eq(resourceDistributions.id, distributionId),
    })

    if (!existing) {
      return { success: false, message: 'Distribusi tidak ditemukan' }
    }

    const isApproving =
      existing.status === 'pending' && (status === 'approved' || status === 'claimed')

    await db
      .update(resourceDistributions)
      .set({
        status,
        updated_at: new Date().toISOString(),
      })
      .where(eq(resourceDistributions.id, distributionId))

    if (isApproving) {
      const resource = await db.query.resources.findFirst({
        where: eq(resources.id, existing.resource_id),
      })

      if (resource) {
        const newRemaining = (Number(resource.remaining_quantity) || 0) - Number(existing.quantity)
        await db
          .update(resources)
          .set({
            remaining_quantity: String(Math.max(0, newRemaining)),
            updated_at: new Date().toISOString(),
          })
          .where(eq(resources.id, existing.resource_id))
      }
    }

    const memberId = existing.member_id
    const memberDistributions = await db.query.resourceDistributions.findMany({
      where: and(
        eq(resourceDistributions.member_id, memberId),
        inArray(resourceDistributions.status, ['approved', 'claimed']),
      ),
    })

    const total = memberDistributions.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0)

    await db
      .update(characters)
      .set({
        total_resources: String(total),
        updated_at: new Date().toISOString(),
      })
      .where(eq(characters.id, memberId))

    revalidatePath('/resources')
    revalidatePath('/')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: unknown) {
    console.error('Update distribution status error:', error)
    const errorMsg = error instanceof Error ? error.message : 'Gagal memperbarui status distribusi'
    return { success: false, message: errorMsg, error: errorMsg }
  }
}
