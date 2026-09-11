'use server'

import { db } from '@/db'
import { resources } from '@/db/schema'
import { revalidatePath } from 'next/cache'

export async function createResource(
  guildId: string,
  data: { name: string; total_quantity: number },
) {
  try {
    const [result] = await db
      .insert(resources)
      .values({
        id: crypto.randomUUID(),
        guild_id: guildId,
        name: data.name,
        total_quantity: String(data.total_quantity),
        remaining_quantity: String(data.total_quantity),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .returning()

    revalidatePath('/resources')
    revalidatePath('/')

    return {
      success: true,
      doc: {
        ...result,
        total_quantity: Number(result.total_quantity),
        remaining_quantity: Number(result.remaining_quantity),
      },
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Gagal membuat resource'
    return { success: false, message: errorMsg, error: errorMsg }
  }
}
