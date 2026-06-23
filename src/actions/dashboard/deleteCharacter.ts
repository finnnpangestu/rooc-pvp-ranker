'use server'

import { revalidatePath } from 'next/cache'
import { getAuthUser } from '../auth/authUser'

export async function deleteCharacter(characterId: string) {
  const { user, payload } = await getAuthUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    await payload.delete({
      collection: 'characters',
      id: characterId,
      overrideAccess: true,
    })
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menghapus karakter' }
  }
}
