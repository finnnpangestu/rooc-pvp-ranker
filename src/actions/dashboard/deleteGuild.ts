'use server'

import { revalidatePath } from 'next/cache'
import { getAuthUser } from '../auth/authUser'
import { db } from '@/db'
import { characters, guilds, partySetups, reportsGl, reportsWoe, resources, resourceDistributions, woeSetups } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function deleteGuild(guildId: string) {
  const { user } = await getAuthUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    await db.delete(resourceDistributions).where(eq(resourceDistributions.guild_id, guildId))
    await db.delete(resources).where(eq(resources.guild_id, guildId))
    await db.delete(reportsGl).where(eq(reportsGl.guild_id, guildId))
    await db.delete(reportsWoe).where(eq(reportsWoe.guild_id, guildId))
    await db.delete(partySetups).where(eq(partySetups.guild_id, guildId))
    await db.delete(woeSetups).where(eq(woeSetups.guild_id, guildId))
    await db.delete(characters).where(eq(characters.guild_id, guildId))
    await db.delete(guilds).where(eq(guilds.id, guildId))

    revalidatePath('/')
    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus guild'
    return { success: false, error: errorMsg, message: errorMsg }
  }
}
