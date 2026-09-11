'use server'

import { db } from '@/db'
import { resources, resourceDistributions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function deleteResource(resourceId: string) {
  try {
    await db.delete(resourceDistributions).where(eq(resourceDistributions.resource_id, resourceId))
    await db.delete(resources).where(eq(resources.id, resourceId))

    revalidatePath('/resources')
    revalidatePath('/')

    return { success: true }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal menghapus resource'
    return { success: false, message: errorMsg, error: errorMsg }
  }
}
