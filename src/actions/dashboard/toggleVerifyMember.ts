'use server'

import { revalidatePath } from 'next/cache'
import { getAuthUser } from '../auth/authUser'
import { db } from '@/db'
import { characters } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { updateGuildTotals } from '@/utils/guildStats'

export async function toggleVerifyMember(characterId: string, currentStatus: boolean) {
  const { user } = await getAuthUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const updatedStatus = !currentStatus
    const [updatedChar] = await db
      .update(characters)
      .set({
        isVerified: updatedStatus,
        updated_at: new Date().toISOString(),
      })
      .where(eq(characters.id, characterId))
      .returning()

    if (updatedChar?.guild_id) {
      await updateGuildTotals(updatedChar.guild_id)
    }

    revalidatePath('/')
    return { success: true }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal mengubah status verifikasi'
    return { success: false, error: errorMsg, message: errorMsg }
  }
}
