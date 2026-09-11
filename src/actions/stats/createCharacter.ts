'use server'

import { db } from '@/db'
import { characters } from '@/db/schema'
import { calculatePvPScore } from '@/utils/calculatePvPScore'
import { updateGuildTotals } from '@/utils/guildStats'
import type { Character, CharacterStatsInput, ActionResult } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export async function createCharacter(
  payloadData: CharacterStatsInput
): Promise<ActionResult<{ doc: Character }>> {
  try {
    if (!payloadData.name || !payloadData.job || !payloadData.guild_id) {
      return actionError('Nama, Job, dan Guild wajib diisi')
    }

    const computedScore = calculatePvPScore(payloadData)
    const newId = crypto.randomUUID()

    const insertValues: Record<string, unknown> = {
      ...payloadData,
      id: newId,
      name: payloadData.name as string,
      job: payloadData.job as any,
      guild_id: payloadData.guild_id as string,
      pvp_score: String(computedScore),
      isVerified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    for (const key of Object.keys(insertValues)) {
      if (typeof insertValues[key] === 'number') {
        insertValues[key] = String(insertValues[key])
      }
    }

    const [createdDoc] = await db
      .insert(characters)
      .values(insertValues as typeof characters.$inferInsert)
      .returning()

    if (createdDoc.guild_id) {
      await updateGuildTotals(createdDoc.guild_id)
    }

    return actionSuccess({ doc: createdDoc }, 'Berhasil menambahkan karakter')
  } catch (error: unknown) {
    return actionError(formatErrorMessage(error))
  }
}
