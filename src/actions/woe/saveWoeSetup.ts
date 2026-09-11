'use server'

import { db } from '@/db'
import { woeSetups } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { WoeRaid, ActionResult } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export async function saveWoeSetup(
  guildId: string,
  raids: WoeRaid[]
): Promise<ActionResult> {
  try {
    const existing = await db.query.woeSetups.findFirst({
      where: eq(woeSetups.guild_id, guildId),
    })

    if (existing) {
      await db
        .update(woeSetups)
        .set({
          raids,
          updated_at: new Date().toISOString(),
        })
        .where(eq(woeSetups.id, existing.id))
    } else {
      await db.insert(woeSetups).values({
        id: crypto.randomUUID(),
        guild_id: guildId,
        raids,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }

    revalidatePath('/woe-setup')
    return actionSuccess(undefined, 'Pengaturan WoE berhasil disimpan')
  } catch (error: unknown) {
    console.error('Error saving woe setup:', error)
    return actionError(formatErrorMessage(error))
  }
}
