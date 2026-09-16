'use server'

import { db } from '@/db'
import { woeSetups } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { WoeRaid, WoeSetup, ActionResult } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export async function saveWoeSetup(
  guildId: string,
  raids: WoeRaid[],
): Promise<ActionResult<{ doc: WoeSetup }>> {
  try {
    const existing = await db.query.woeSetups.findFirst({
      where: eq(woeSetups.guild_id, guildId),
    })

    let result: WoeSetup

    if (existing) {
      const [updated] = await db
        .update(woeSetups)
        .set({
          raids,
          updated_at: new Date().toISOString(),
        })
        .where(eq(woeSetups.id, existing.id))
        .returning()
      result = updated
    } else {
      const [created] = await db
        .insert(woeSetups)
        .values({
          id: crypto.randomUUID(),
          guild_id: guildId,
          raids,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .returning()
      result = created
    }

    revalidatePath('/woe-setup')
    return actionSuccess({ doc: result }, 'Pengaturan WoE berhasil disimpan')
  } catch (error: unknown) {
    console.error('Error saving woe setup:', error)
    return actionError(formatErrorMessage(error))
  }
}
