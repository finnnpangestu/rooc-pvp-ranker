'use server'

import { db } from '@/db'
import { partySetups } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { PartySetup, ActionResult } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export async function clearParties(
  setupId: string,
  mode: 'all' | 'elite' | 'sub',
): Promise<ActionResult<{ doc: PartySetup }>> {
  try {
    const updateData: Partial<typeof partySetups.$inferInsert> = {
      updated_at: new Date().toISOString(),
    }
    if (mode === 'all') {
      updateData.elite_parties = []
      updateData.sub_parties = []
    } else if (mode === 'elite') {
      updateData.elite_parties = []
    } else if (mode === 'sub') {
      updateData.sub_parties = []
    }

    const [updatedDoc] = await db
      .update(partySetups)
      .set(updateData)
      .where(eq(partySetups.id, setupId))
      .returning()

    revalidatePath('/guild-league')
    revalidatePath('/')

    return actionSuccess({ doc: updatedDoc }, 'Parties berhasil di-reset')
  } catch (error: unknown) {
    return actionError(formatErrorMessage(error))
  }
}
