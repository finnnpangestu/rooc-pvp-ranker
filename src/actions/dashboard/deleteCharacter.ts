'use server'

import { revalidatePath } from 'next/cache'
import { getAuthUser } from '../auth/authUser'
import { db } from '@/db'
import { characters, resourceDistributions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { updateGuildTotals } from '@/utils/guildStats'

export async function deleteCharacter(characterId: string) {
  const { user } = await getAuthUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const char = await db.query.characters.findFirst({
      where: eq(characters.id, characterId),
    })

    await db.delete(resourceDistributions).where(eq(resourceDistributions.member_id, characterId))
    await db.delete(characters).where(eq(characters.id, characterId))

    if (char?.guild_id) {
      await updateGuildTotals(char.guild_id)
    }

    revalidatePath('/')
    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal menghapus karakter'
    return { success: false, error: errorMsg, message: errorMsg }
  }
}
