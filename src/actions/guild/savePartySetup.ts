'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function savePartySetup(setup: {
  id?: string
  guild_id: string
  elite_parties?: any[]
  sub_parties?: any[]
}) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Normalise parties: replace full member objects with just their ID for DB storage
    const normaliseParties = (parties: any[] = []) =>
      parties.map((party) => ({
        ...party,
        slots: party.slots.map((slot: any) => ({
          ...slot,
          assigned_character: slot.assigned_character?.id ?? slot.assigned_character ?? null,
        })),
      }))

    const data: any = {
      guild_id: setup.guild_id,
      elite_parties: normaliseParties(setup.elite_parties),
      sub_parties: normaliseParties(setup.sub_parties),
    }

    let result

    if (setup.id) {
      // Update existing setup
      result = await payload.update({
        collection: 'party_setups',
        id: setup.id,
        data,
        depth: 1,
      })
    } else {
      // Check if setup already exists for this guild
      const existing = await payload.find({
        collection: 'party_setups',
        where: { guild_id: { equals: setup.guild_id } },
      })

      if (existing.docs.length > 0) {
        result = await payload.update({
          collection: 'party_setups',
          id: existing.docs[0].id,
          data,
          depth: 1,
        })
      } else {
        result = await payload.create({
          collection: 'party_setups',
          data,
          depth: 1,
        } as any)
      }
    }

    return { success: true as const, doc: result }
  } catch (error: any) {
    return { success: false as const, message: error.message }
  }
}
