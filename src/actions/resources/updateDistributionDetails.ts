'use server'

import { db } from '@/db'
import { characters, resources, resourceDistributions } from '@/db/schema'
import { eq, inArray, and } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function updateDistributionDetails(
  distributionId: string,
  data: { member_id?: string; quantity?: number },
) {
  try {
    const existing = await db.query.resourceDistributions.findFirst({
      where: eq(resourceDistributions.id, distributionId),
    })

    if (!existing) {
      return { success: false, message: 'Distribusi tidak ditemukan' }
    }

    if (existing.status === 'pending' && data.member_id) {
      await db
        .update(resourceDistributions)
        .set({
          member_id: data.member_id,
          updated_at: new Date().toISOString(),
        })
        .where(eq(resourceDistributions.id, distributionId))
    } else if (existing.status === 'approved' && data.quantity !== undefined) {
      const oldQuantity = Number(existing.quantity) || 0
      const newQuantity = data.quantity
      const diff = newQuantity - oldQuantity

      const resource = await db.query.resources.findFirst({
        where: eq(resources.id, existing.resource_id),
      })

      if (!resource) {
        return { success: false, message: 'Resource tidak ditemukan' }
      }

      if (diff > 0 && (Number(resource.remaining_quantity) || 0) < diff) {
        return { success: false, message: 'Stok resource tidak mencukupi untuk penambahan ini.' }
      }

      await db
        .update(resourceDistributions)
        .set({
          quantity: String(newQuantity),
          updated_at: new Date().toISOString(),
        })
        .where(eq(resourceDistributions.id, distributionId))

      await db
        .update(resources)
        .set({
          remaining_quantity: String((Number(resource.remaining_quantity) || 0) - diff),
          updated_at: new Date().toISOString(),
        })
        .where(eq(resources.id, existing.resource_id))

      const memberId = existing.member_id
      const distributions = await db.query.resourceDistributions.findMany({
        where: and(
          eq(resourceDistributions.member_id, memberId),
          inArray(resourceDistributions.status, ['approved', 'claimed']),
        ),
      })

      const total = distributions.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0)

      await db
        .update(characters)
        .set({
          total_resources: String(total),
          updated_at: new Date().toISOString(),
        })
        .where(eq(characters.id, memberId))
    }

    revalidatePath('/resources')
    revalidatePath('/')
    revalidatePath('/dashboard')

    return { success: true }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal memperbarui rincian distribusi'
    return { success: false, message: errorMsg, error: errorMsg }
  }
}
