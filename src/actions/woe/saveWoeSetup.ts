'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function saveWoeSetup(guildId: string, raids: any[]) {
  try {
    const payload = await getPayload({ config: configPromise })

    // Find existing Woe Setup for this guild
    const existing = await payload.find({
      collection: 'woe_setups',
      where: { guild_id: { equals: guildId } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      // Update
      await payload.update({
        collection: 'woe_setups',
        id: existing.docs[0].id,
        data: {
          raids,
        },
      })
    } else {
      // Create
      await payload.create({
        collection: 'woe_setups',
        data: {
          guild_id: guildId as any,
          raids,
        },
      })
    }

    revalidatePath('/woe-setup')
    return { success: true }
  } catch (error: any) {
    console.error('Error saving woe setup:', error)
    return { success: false, message: error.message }
  }
}
