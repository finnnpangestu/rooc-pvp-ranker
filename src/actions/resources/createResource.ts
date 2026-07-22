'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function createResource(
  guildId: string,
  data: { name: string; total_quantity: number },
) {
  try {
    const payload = await getPayload({ config: configPromise })

    const result = await payload.create({
      collection: 'resources',
      data: {
        guild_id: guildId,
        name: data.name,
        total_quantity: data.total_quantity,
      },
    })

    revalidatePath('/resources')
    revalidatePath('/')

    return { success: true, doc: result }
  } catch (error: any) {
    return { success: false, message: error.message }
  }
}
