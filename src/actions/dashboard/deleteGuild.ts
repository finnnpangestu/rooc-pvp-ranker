'use server'

import { revalidatePath } from 'next/cache'
import { getAuthUser } from '../auth/authUser'

export async function deleteGuild(guildId: string) {
  const { user, payload } = await getAuthUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  try {
    const members = await payload.find({
      collection: 'characters',
      where: { guild_id: { equals: guildId } },
      limit: 1000,
      overrideAccess: true,
    })

    for (const member of members.docs) {
      await payload.update({
        collection: 'characters',
        id: member.id,
        data: {
          guild_id: null as any,
          isVerified: false,
        },
        overrideAccess: true,
      })
    }

    await payload.delete({
      collection: 'guilds',
      id: guildId,
      overrideAccess: true,
    })

    revalidatePath('/')
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Gagal menghapus guild' }
  }
}
