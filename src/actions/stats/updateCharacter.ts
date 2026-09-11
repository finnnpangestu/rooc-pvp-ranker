'use server'

import { db } from '@/db'
import { characters } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { calculatePvPScore } from '@/utils/calculatePvPScore'
import { updateGuildTotals } from '@/utils/guildStats'
import type { Character, CharacterStatsInput, ActionResult } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export async function updateCharacterStats(
  id: string,
  payloadData: CharacterStatsInput,
  autoVerify: boolean = false
): Promise<ActionResult<{ doc: Character }>> {
  try {
    const computedScore = calculatePvPScore(payloadData)

    const updateValues: Record<string, unknown> = {
      ...payloadData,
      pvp_score: String(computedScore),
      isVerified: autoVerify,
      updated_at: new Date().toISOString(),
    }

    // Pastikan nilai numeric bertipe string untuk column numeric Drizzle
    for (const key of Object.keys(updateValues)) {
      if (typeof updateValues[key] === 'number') {
        updateValues[key] = String(updateValues[key])
      }
    }

    const [updatedDoc] = await db
      .update(characters)
      .set(updateValues as Partial<typeof characters.$inferInsert>)
      .where(eq(characters.id, id))
      .returning()

    if (!updatedDoc) {
      return actionError('Karakter tidak ditemukan')
    }

    if (updatedDoc.guild_id) {
      await updateGuildTotals(updatedDoc.guild_id)
    }

    return actionSuccess({ doc: updatedDoc }, 'Berhasil memperbarui karakter')
  } catch (error: unknown) {
    return actionError(formatErrorMessage(error))
  }
}
