'use server'

import { db } from '@/db'
import { partySetups } from '@/db/schema'
import { eq } from 'drizzle-orm'
import type { Party, PartySetup, ActionResult } from '@/types'
import { actionError, actionSuccess, formatErrorMessage } from '@/types'

export async function savePartySetup(setup: {
  id?: string
  guild_id: string
  elite_parties?: Party[] | null
  sub_parties?: Party[] | null
}): Promise<ActionResult<{ doc: PartySetup }>> {
  try {
    const normaliseParties = (parties: Party[] | null = []): Party[] =>
      (parties || []).map((party) => ({
        ...party,
        slots: (party.slots || []).map((slot) => ({
          ...slot,
          assigned_character:
            typeof slot.assigned_character === 'object' && slot.assigned_character
              ? (slot.assigned_character.id ?? null)
              : (slot.assigned_character ?? null),
        })),
      }))

    const elitePartiesData = normaliseParties(setup.elite_parties)
    const subPartiesData = normaliseParties(setup.sub_parties)

    let result: PartySetup

    if (setup.id) {
      const [updated] = await db
        .update(partySetups)
        .set({
          elite_parties: elitePartiesData,
          sub_parties: subPartiesData,
          updated_at: new Date().toISOString(),
        })
        .where(eq(partySetups.id, setup.id))
        .returning()
      result = updated
    } else {
      const existing = await db.query.partySetups.findFirst({
        where: eq(partySetups.guild_id, setup.guild_id),
      })

      if (existing) {
        const [updated] = await db
          .update(partySetups)
          .set({
            elite_parties: elitePartiesData,
            sub_parties: subPartiesData,
            updated_at: new Date().toISOString(),
          })
          .where(eq(partySetups.id, existing.id))
          .returning()
        result = updated
      } else {
        const [created] = await db
          .insert(partySetups)
          .values({
            id: crypto.randomUUID(),
            guild_id: setup.guild_id,
            elite_parties: elitePartiesData,
            sub_parties: subPartiesData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .returning()
        result = created
      }
    }

    return actionSuccess({ doc: result })
  } catch (error: unknown) {
    return actionError(formatErrorMessage(error))
  }
}
