'use server'

import { revalidatePath } from 'next/cache'
import { getAuthUser } from '../auth/authUser'
import { db } from '@/db'
import { guilds } from '@/db/schema'

export async function createGuild(name: string) {
  const { user } = await getAuthUser()
  if (!user || user.role !== 'guild_master') {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    await db.insert(guilds).values({
      id: crypto.randomUUID(),
      name,
      guild_master_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    revalidatePath('/')
    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal membuat guild'
    return { success: false, error: errorMsg, message: errorMsg }
  }
}
