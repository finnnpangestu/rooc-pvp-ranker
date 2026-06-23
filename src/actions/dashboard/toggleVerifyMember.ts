'use server'

import { revalidatePath } from 'next/cache'
import { getAuthUser } from '../auth/authUser'

export async function toggleVerifyMember(characterId: string, currentStatus: boolean) {
  const { user, payload } = await getAuthUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    await payload.update({
      collection: 'characters',
      id: characterId,
      data: {
        isVerified: !currentStatus,
      },
      overrideAccess: true,
    })
    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal mengubah status verifikasi' }
  }
}
