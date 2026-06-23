'use server'

import { revalidatePath } from 'next/cache'
import { getAuthUser } from '../auth/authUser'

export async function createGuild(name: string) {
  const { user, payload } = await getAuthUser()
  if (!user || user.role !== 'guild_master') {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await payload.create({
      collection: 'guilds',
      data: {
        name,
        guild_master: user.id,
      },
      overrideAccess: true,
    })
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal membuat guild' }
  }
}
