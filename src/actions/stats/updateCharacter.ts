'use server'

import { db } from '@/db'
import { characters } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { calculatePvPScore } from '@/utils/calculatePvPScore'
import { updateGuildTotals } from '@/utils/guildStats'
import type { Character, CharacterStatsInput, ActionResult, CharacterStatHistory } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export async function updateCharacterStats(
  id: string,
  payloadData: CharacterStatsInput,
  autoVerify: boolean = false
): Promise<ActionResult<{ doc: Character }>> {
  try {
    const computedScore = calculatePvPScore(payloadData)

    const existing = await db
      .select({
        id: characters.id,
        job: characters.job,
        pvp_score: characters.pvp_score,
        stat_history: characters.stat_history,
      })
      .from(characters)
      .where(eq(characters.id, id))
      .limit(1)

    const existingChar = existing[0]
    let history: CharacterStatHistory[] = []
    if (existingChar && Array.isArray(existingChar.stat_history)) {
      history = [...existingChar.stat_history]
    }

    const newEntry: CharacterStatHistory = {
      date: new Date().toISOString(),
      pvp_score: computedScore,
      job: String(payloadData.job || existingChar?.job || ''),
      note: 'Stats update',
      hp: Number(payloadData.max_hp || 0),
      patk: Number(payloadData.patk || 0),
      matk: Number(payloadData.matk || 0),
      pdef: Number(payloadData.pdef || 0),
      mdef: Number(payloadData.mdef || 0),
    }
    history.push(newEntry)
    if (history.length > 30) {
      history = history.slice(-30)
    }

    const updateValues: Record<string, unknown> = {
      ...payloadData,
      pvp_score: String(computedScore),
      stat_history: history,
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
      return actionError('Character not found')
    }

    if (updatedDoc.guild_id) {
      await updateGuildTotals(updatedDoc.guild_id)
    }

    return actionSuccess({ doc: updatedDoc }, 'Character updated successfully')
  } catch (error: unknown) {
    return actionError(formatErrorMessage(error))
  }
}
